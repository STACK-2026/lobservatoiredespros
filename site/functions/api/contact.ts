/**
 * Cloudflare Pages Function : POST /api/contact
 * Recoit le formulaire /contact/, valide, ecrit en DB Supabase et notifie
 * via Resend a contact@lobservatoiredespros.com.
 *
 * Variables d'env :
 *   RESEND_API_KEY (optionnel, sinon insert DB seul)
 *
 * RLS : policy "Anonymous insert contact with consent" exige rgpd_consent=true.
 */

interface Env {
  RESEND_API_KEY?: string;
}

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXllYWtneGpnZGNmc3NydGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEwNTcsImV4cCI6MjA5MjUxNzA1N30.C7cw3T5Yj8W3LaYlLgWULlJlsP6iijxRKQvueA6WKOY";

const ALLOWED_OBJETS = new Set([
  "piste", "signalement", "correction", "candidature", "presse", "autre",
]);

interface ContactFields {
  nom: string;
  email: string;
  objet: string;
  message: string;
  pro_concerne: string;
  rgpd_consent: boolean;
  ip_hash: string;
  user_agent: string;
}

// Tente de deduire un slug de fiche depuis le champ "pro concerne".
// Accepte une URL /pro/<slug>/ collee, ou un slug nu (a-z0-9-, pas d'espace).
// Renvoie null si la valeur ressemble a un nom libre (ex : "Ayoub Renovation").
function extractProSlug(raw: string): string | null {
  if (!raw) return null;
  const urlMatch = raw.match(/\/pro\/([a-z0-9][a-z0-9-]{1,})\/?/i);
  if (urlMatch) return urlMatch[1].toLowerCase();
  const bare = raw.trim().toLowerCase();
  if (/^[a-z0-9][a-z0-9-]{2,}$/.test(bare) && bare.includes("-")) return bare;
  return null;
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

const OBJET_LABELS: Record<string, string> = {
  piste: "Une piste a partager",
  signalement: "Signalement d'un pro classe",
  correction: "Demande de correction",
  candidature: "Question sur une candidature",
  presse: "Presse / interview",
  autre: "Autre",
};

// Reponse type "inviter a deposer un avis" : ouvre un brouillon pre-rempli
// vers l'expediteur. On ne connait pas la fiche visee (le form /contact/ ne
// capture pas de pro), d'ou le placeholder a coller a la main.
function buildAvisMailto(c: ContactFields, proSlug: string | null): string {
  const subject = "Re : votre message a L'Observatoire des Pros";
  // Si on connait la fiche -> lien exact ; sinon placeholder a coller a la main.
  const ficheLine = proSlug
    ? `https://lobservatoiredespros.com/pro/${proSlug}/donner-mon-avis/`
    : "[COLLEZ ICI LE LIEN DE LA FICHE, ex : https://lobservatoiredespros.com/pro/SLUG/donner-mon-avis/]";
  const body = [
    "Bonjour,",
    "",
    "Merci de votre message. L'Observatoire des Pros publie des avis verifies portant sur l'experience directe de chacun.",
    "",
    "Si vous avez fait appel a cette entreprise, vous pouvez deposer votre temoignage directement sur sa fiche, en decrivant factuellement votre propre experience (devis, delais, travaux realises, malfacons constatees) :",
    ficheLine,
    "",
    "Votre avis sera relu par notre moderation avant publication.",
    "",
    "Les aspects strictement penaux (titre, escroquerie) relevent des autorites competentes : Ordre des architectes, SignalConso / DGCCRF (signal.conso.gouv.fr), et la procedure en cours le cas echeant.",
    "",
    "Bien a vous,",
    "L'Observatoire des Pros",
  ].join("\n");
  return `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildEmail(c: ContactFields): { subject: string; html: string } {
  const objetLabel = OBJET_LABELS[c.objet] || c.objet;
  const subject = `[Contact] ${objetLabel} - ${c.nom}`;
  const proSlug = extractProSlug(c.pro_concerne);
  const avisMailto = buildAvisMailto(c, proSlug);

  // Ligne "Pro concerne" : lien clicable vers la fiche si on a un slug.
  const proRow = c.pro_concerne
    ? `<tr><td><strong>Pro concerne</strong></td><td>${
        proSlug
          ? `<a href="https://lobservatoiredespros.com/pro/${proSlug}/">${htmlEscape(c.pro_concerne)}</a>`
          : htmlEscape(c.pro_concerne)
      }</td></tr>`
    : "";

  const hint = proSlug
    ? `Ce bouton ouvre un brouillon pre-rempli vers l'expediteur, deja deep-linke vers la fiche <strong>${htmlEscape(proSlug)}</strong>. A reserver a un retour d'experience client (pas presse / candidatures).`
    : `Ce bouton ouvre un brouillon pre-rempli vers l'expediteur. Pensez a remplacer <strong>[COLLEZ ICI LE LIEN DE LA FICHE]</strong> par la fiche concernee avant d'envoyer. A reserver a un retour d'experience client (pas presse / candidatures).`;

  const html = `
    <h2>Nouveau message via /contact/</h2>
    <table cellpadding="6" style="border-collapse:collapse;border:1px solid #ddd;">
      <tr><td><strong>Objet</strong></td><td>${htmlEscape(objetLabel)}</td></tr>
      <tr><td><strong>Nom</strong></td><td>${htmlEscape(c.nom)}</td></tr>
      <tr><td><strong>Email</strong></td><td><a href="mailto:${htmlEscape(c.email)}">${htmlEscape(c.email)}</a></td></tr>
      ${proRow}
    </table>
    <h3>Message</h3>
    <p style="white-space:pre-wrap;">${htmlEscape(c.message)}</p>
    <p style="margin:20px 0;">
      <a href="${avisMailto}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600;font-family:Arial,sans-serif;">Reponse type &mdash; inviter a deposer un avis</a>
    </p>
    <p style="color:#666;font-size:0.85em;">${hint}</p>
    <p style="color:#666;font-size:0.9em;">Vous pouvez aussi repondre directement par reply (reply_to set sur ${maskEmail(c.email)}).</p>
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

  // Honeypot (champ "company" cache)
  if (get("company")) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/contact/merci/" },
    });
  }

  const ip = context.request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const ipHash = await sha256Hex(`${ip}|lobservatoire-contact`);
  const ua = context.request.headers.get("user-agent") || "";

  const fields: ContactFields = {
    nom: cap(get("nom"), 200),
    email: cap(get("email").toLowerCase(), 254),
    objet: cap(get("objet"), 30),
    message: cap(get("message"), 5000),
    pro_concerne: cap(get("pro_concerne"), 300),
    rgpd_consent: get("rgpd") === "on" || get("rgpd") === "true",
    ip_hash: ipHash,
    user_agent: cap(ua, 300),
  };

  const errors: string[] = [];
  if (!fields.nom || fields.nom.length < 2) errors.push("nom");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) errors.push("email");
  if (!ALLOWED_OBJETS.has(fields.objet)) errors.push("objet");
  if (!fields.message || fields.message.length < 10) errors.push("message");
  if (!fields.rgpd_consent) errors.push("rgpd");

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ ok: false, error: "Champs invalides", fields: errors }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const supRes = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
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
    console.error("contact insert failed:", supRes.status, "email=", maskEmail(fields.email), "ip_hash=", ipHash.slice(0, 8));
    return new Response(
      JSON.stringify({ ok: false, error: "Enregistrement impossible. Reessayez plus tard." }),
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
          to: "contact@lobservatoiredespros.com",
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
    headers: { Location: "/contact/merci/" },
  });
};

export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
};
