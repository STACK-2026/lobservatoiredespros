/**
 * Cloudflare Pages Function : POST /api/devis
 * Recoit le formulaire "Demander un devis" affiche uniquement sur les fiches
 * pros PAYANTS (verified=true, Option B). Valide, verifie en profondeur que
 * le pro est bien verifie (defense en profondeur : le front ne doit deja
 * afficher ce formulaire que sur les fiches verifiees), ecrit en DB Supabase
 * et notifie le pro par email via Resend.
 *
 * Variables d'env :
 *   RESEND_API_KEY (optionnel, sinon insert DB seul)
 *
 * RLS : policy "Anonymous insert demandes with consent" exige rgpd_consent=true.
 */

interface Env {
  RESEND_API_KEY?: string;
}

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXllYWtneGpnZGNmc3NydGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEwNTcsImV4cCI6MjA5MjUxNzA1N30.C7cw3T5Yj8W3LaYlLgWULlJlsP6iijxRKQvueA6WKOY";

interface DevisFields {
  pro_slug: string;
  nom: string;
  email: string;
  telephone: string;
  message: string;
  rgpd_consent: boolean;
  ip_hash: string;
}

interface ProLookup {
  id: string;
  email: string | null;
  nom_entreprise: string;
  verified: boolean | null;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function cap(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

function maskEmail(e: string): string {
  const at = e.indexOf("@");
  if (at < 1) return "***";
  return e.slice(0, 1) + "***" + e.slice(at);
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildEmail(c: DevisFields, proNom: string): { subject: string; html: string } {
  const subject = "Nouvelle demande de devis via L'Observatoire des Pros";
  const html = `
    <h2>Nouvelle demande de devis</h2>
    <p>Un particulier a rempli le formulaire de devis sur ta fiche <strong>${htmlEscape(proNom)}</strong> sur L'Observatoire des Pros.</p>
    <table cellpadding="6" style="border-collapse:collapse;border:1px solid #ddd;">
      <tr><td><strong>Nom</strong></td><td>${htmlEscape(c.nom)}</td></tr>
      ${c.email ? `<tr><td><strong>Email</strong></td><td><a href="mailto:${htmlEscape(c.email)}">${htmlEscape(c.email)}</a></td></tr>` : ""}
      ${c.telephone ? `<tr><td><strong>Telephone</strong></td><td><a href="tel:${htmlEscape(c.telephone.replace(/\s/g, ""))}">${htmlEscape(c.telephone)}</a></td></tr>` : ""}
    </table>
    ${c.message ? `<h3>Message</h3><p style="white-space:pre-wrap;">${htmlEscape(c.message)}</p>` : ""}
    <p style="color:#666;font-size:0.9em;">Tu peux répondre directement à ce particulier${c.email ? " par reply (reply_to configuré sur son adresse)" : " par téléphone"}.</p>
  `;
  return { subject, html };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const ct = context.request.headers.get("content-type") || "";
  let body: Record<string, unknown>;
  try {
    if (!ct.includes("application/json")) {
      return jsonResponse(400, { ok: false, error: "Content-Type doit etre application/json" });
    }
    body = (await context.request.json()) as Record<string, unknown>;
  } catch (e) {
    return jsonResponse(400, { ok: false, error: "JSON invalide" });
  }

  const get = (k: string): string => (typeof body[k] === "string" ? (body[k] as string).trim() : "");

  // Honeypot : si rempli, succes silencieux (bot)
  if (get("hp")) {
    return jsonResponse(200, { ok: true });
  }

  const ip = context.request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const ipHash = await sha256Hex(`${ip}|lobservatoire-devis`);

  const consentRaw = body["consent"];
  const fields: DevisFields = {
    pro_slug: cap(get("slug"), 200),
    nom: cap(get("nom"), 200),
    email: cap(get("email").toLowerCase(), 254),
    telephone: cap(get("telephone"), 40),
    message: cap(get("message"), 3000),
    rgpd_consent: consentRaw === true || consentRaw === "true" || consentRaw === "on",
    ip_hash: ipHash,
  };

  const errors: string[] = [];
  if (!fields.pro_slug) errors.push("slug");
  if (!fields.nom || fields.nom.length < 2) errors.push("nom");
  if (!fields.email && !fields.telephone) errors.push("email_ou_telephone");
  if (fields.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) errors.push("email");
  if (!fields.rgpd_consent) errors.push("rgpd");

  if (errors.length > 0) {
    return jsonResponse(400, { ok: false, error: "Champs invalides", fields: errors });
  }

  // Recuperation du pro par slug + gate de securite. Defense en profondeur :
  // le formulaire ne s'affiche deja que sur les fiches verified=true, mais on
  // ne fait jamais confiance au seul rendu front pour une action ecrite en DB
  // + envoi email.
  const proRes = await fetch(
    `${SUPABASE_URL}/rest/v1/pros?slug=eq.${encodeURIComponent(fields.pro_slug)}&active=eq.true&select=id,email,nom_entreprise,verified&limit=1`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
  );

  if (!proRes.ok) {
    console.error("devis pro lookup failed:", proRes.status, "slug=", fields.pro_slug);
    return jsonResponse(502, { ok: false, error: "Recherche du professionnel impossible. Réessayez plus tard." });
  }

  const pros = (await proRes.json()) as ProLookup[];
  const pro = pros[0];

  if (!pro || pro.verified !== true) {
    return jsonResponse(403, { ok: false, error: "non_disponible" });
  }

  const insertBody = {
    pro_id: pro.id,
    pro_slug: fields.pro_slug,
    nom: fields.nom,
    email: fields.email || null,
    telephone: fields.telephone || null,
    message: fields.message || null,
    ip_hash: fields.ip_hash,
    rgpd_consent: fields.rgpd_consent,
    source: "fiche_devis",
  };

  const supRes = await fetch(`${SUPABASE_URL}/rest/v1/demandes`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(insertBody),
  });

  if (!supRes.ok) {
    console.error(
      "devis insert failed:",
      supRes.status,
      "email=",
      fields.email ? maskEmail(fields.email) : "(non fourni)",
      "ip_hash=",
      ipHash.slice(0, 8),
    );
    return jsonResponse(502, { ok: false, error: "Enregistrement impossible. Réessayez plus tard." });
  }

  if (context.env.RESEND_API_KEY && pro.email) {
    const { subject, html } = buildEmail(fields, pro.nom_entreprise);
    try {
      const emailPayload: Record<string, unknown> = {
        from: "L'Observatoire <noreply@send.lobservatoiredespros.com>",
        to: pro.email,
        subject,
        html,
      };
      if (fields.email) emailPayload.reply_to = fields.email;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });
    } catch (e) {
      console.error("Resend notify failed:", e);
    }
  }

  return jsonResponse(200, { ok: true });
};

export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
};
