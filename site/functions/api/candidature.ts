/**
 * Cloudflare Pages Function : POST /api/candidature
 * Recoit le formulaire candidater, valide, ecrit en DB Supabase et notifie
 * via Resend a candidature@lobservatoiredespros.com.
 *
 * Variables d'env requises (definies en prod CF Pages dashboard) :
 *   RESEND_API_KEY (secret)
 *
 * RLS Supabase : policy "Anonymous insert candidatures" autorise INSERT
 * pour role anon. Pas besoin de service_role.
 */

interface Env {
  RESEND_API_KEY?: string;
}

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXllYWtneGpnZGNmc3NydGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEwNTcsImV4cCI6MjA5MjUxNzA1N30.C7cw3T5Yj8W3LaYlLgWULlJlsP6iijxRKQvueA6WKOY";

interface CandidatureFields {
  nom_entreprise: string;
  siret: string;
  code_naf: string | null;
  dirigeant: string;
  email: string;
  metier_slug: string;
  departement_code: string;
  specialites: string | null;
  annee_creation: number;
  formule: string;
  motivation: string | null;
  rgpd_consent: boolean;
  statut: string;
  ip_hash: string;
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

const ALLOWED_FORMULES = new Set(["recommandé", "vérifié", "lauréat"]);
const ALLOWED_STATUTS = new Set(["nouvelle", "examen", "acceptee", "refusee", "archivee"]);

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmail(c: CandidatureFields): { subject: string; html: string } {
  const subject = `Nouvelle candidature : ${c.nom_entreprise} (${c.formule})`;
  const html = `
    <h2>Nouvelle candidature L'Observatoire des Pros</h2>
    <p><strong>${htmlEscape(c.nom_entreprise)}</strong> a soumis une candidature.</p>
    <table cellpadding="6" style="border-collapse:collapse;border:1px solid #ddd;">
      <tr><td><strong>Formule demandee</strong></td><td>${htmlEscape(c.formule)}</td></tr>
      <tr><td><strong>SIRET</strong></td><td>${htmlEscape(c.siret)}</td></tr>
      <tr><td><strong>Dirigeant</strong></td><td>${htmlEscape(c.dirigeant)}</td></tr>
      <tr><td><strong>Email</strong></td><td><a href="mailto:${htmlEscape(c.email)}">${htmlEscape(c.email)}</a></td></tr>
      <tr><td><strong>Metier</strong></td><td>${htmlEscape(c.metier_slug)}</td></tr>
      <tr><td><strong>Departement</strong></td><td>${htmlEscape(c.departement_code)}</td></tr>
      <tr><td><strong>Annee de creation</strong></td><td>${c.annee_creation}</td></tr>
      <tr><td><strong>Specialites</strong></td><td>${htmlEscape(c.specialites || "")}</td></tr>
    </table>
    ${c.motivation ? `<h3>Motivation</h3><p>${htmlEscape(c.motivation)}</p>` : ""}
    <p style="color:#666;font-size:0.9em;">Submit via cloudflare pages function. Examiner sous 15 jours ouvres.</p>
  `;
  return { subject, html };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const ct = context.request.headers.get("content-type") || "";
  let formData: FormData;
  try {
    if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
      formData = await context.request.formData();
    } else {
      return new Response("Content-Type must be form-data or x-www-form-urlencoded", { status: 400 });
    }
  } catch (e) {
    return new Response("Invalid form data", { status: 400 });
  }

  const get = (k: string) => (formData.get(k) || "").toString().trim();

  // Honeypot : si rempli, succès silencieux (bot)
  if (get("company")) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/candidater/merci/" },
    });
  }

  const ip = context.request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const ipHash = await sha256Hex(`${ip}|lobservatoire-candidature`);

  const fields: CandidatureFields = {
    nom_entreprise: cap(get("nom"), 200),
    siret: get("siret").replace(/\s+/g, ""),
    code_naf: cap(get("naf"), 10) || null,
    dirigeant: cap(get("dirigeant"), 200),
    email: cap(get("email").toLowerCase(), 254),
    metier_slug: cap(get("metier"), 50),
    departement_code: cap(get("departement"), 5),
    specialites: cap(get("specialites"), 1000) || null,
    annee_creation: parseInt(get("anciennete"), 10) || 0,
    formule: cap(get("formule"), 50),
    motivation: cap(get("motivation"), 5000) || null,
    rgpd_consent: get("rgpd") === "on" || get("rgpd") === "true",
    statut: "nouvelle",
    ip_hash: ipHash,
  };

  const errors: string[] = [];
  if (!fields.nom_entreprise) errors.push("nom_entreprise");
  if (!/^\d{14}$/.test(fields.siret)) errors.push("siret (14 chiffres)");
  if (!fields.dirigeant) errors.push("dirigeant");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) errors.push("email");
  if (!fields.metier_slug) errors.push("metier");
  if (!fields.departement_code) errors.push("departement");
  if (fields.annee_creation < 1900 || fields.annee_creation > 2026) errors.push("annee_creation");
  if (!ALLOWED_FORMULES.has(fields.formule)) errors.push("formule");
  if (!fields.rgpd_consent) errors.push("rgpd");

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ ok: false, error: "Champs invalides", fields: errors }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const supRes = await fetch(`${SUPABASE_URL}/rest/v1/candidatures`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(fields),
  });

  if (!supRes.ok) {
    // Log scrubbed: pas d'email/siret/dirigeant en clair
    console.error("candidature insert failed:", supRes.status, "email=", maskEmail(fields.email), "ip_hash=", ipHash.slice(0, 8));
    return new Response(
      JSON.stringify({ ok: false, error: "Enregistrement DB impossible. Reessayez plus tard." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  if (context.env.RESEND_API_KEY) {
    const { subject, html } = buildEmail(fields);
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "L'Observatoire <noreply@send.lobservatoiredespros.com>",
          to: "candidature@lobservatoiredespros.com",
          reply_to: fields.email,
          subject,
          html,
        }),
      });
    } catch (e) {
      console.error("Resend notify failed:", e);
    }
  }

  return new Response(null, {
    status: 303,
    headers: { Location: "/candidater/merci/" },
  });
};

export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
};
