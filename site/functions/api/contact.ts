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
  rgpd_consent: boolean;
  ip_hash: string;
  user_agent: string;
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

function buildEmail(c: ContactFields): { subject: string; html: string } {
  const objetLabel = OBJET_LABELS[c.objet] || c.objet;
  const subject = `[Contact] ${objetLabel} - ${c.nom}`;
  const html = `
    <h2>Nouveau message via /contact/</h2>
    <table cellpadding="6" style="border-collapse:collapse;border:1px solid #ddd;">
      <tr><td><strong>Objet</strong></td><td>${htmlEscape(objetLabel)}</td></tr>
      <tr><td><strong>Nom</strong></td><td>${htmlEscape(c.nom)}</td></tr>
      <tr><td><strong>Email</strong></td><td><a href="mailto:${htmlEscape(c.email)}">${htmlEscape(c.email)}</a></td></tr>
    </table>
    <h3>Message</h3>
    <p style="white-space:pre-wrap;">${htmlEscape(c.message)}</p>
    <p style="color:#666;font-size:0.9em;">Repondre directement par reply (reply_to set sur ${maskEmail(c.email)}).</p>
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
