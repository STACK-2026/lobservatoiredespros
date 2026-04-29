/**
 * Cloudflare Pages Function : POST /api/newsletter
 * Inscrit un email à la newsletter mensuelle après consentement RGPD.
 *
 * Sécurité :
 *   - rgpd_consent obligatoire (case cochée), policy DB `Anonymous insert
 *     newsletter with consent` rejette sans rgpd_consent=true.
 *   - validation email server-side
 *   - ip hash SHA-256 stocké pour rate-limiter manuellement si besoin
 *   - honeypot field "company" (si rempli, drop silencieux)
 */

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXllYWtneGpnZGNmc3NydGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEwNTcsImV4cCI6MjA5MjUxNzA1N30.C7cw3T5Yj8W3LaYlLgWULlJlsP6iijxRKQvueA6WKOY";

interface Env {}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isValidEmail(email: string): boolean {
  return (
    email.length >= 5 &&
    email.length <= 254 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  );
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
  } catch {
    return new Response("Invalid form data", { status: 400 });
  }

  const get = (k: string) => (formData.get(k) || "").toString().trim();

  // Honeypot : si rempli, on simule un succès silencieux (anti-bot)
  if (get("company")) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/newsletter/merci/" },
    });
  }

  const email = get("email").toLowerCase();
  const rgpdConsent = get("rgpd") === "on" || get("rgpd") === "true";
  const source = get("source") || "site";

  if (!isValidEmail(email)) {
    return new Response(
      JSON.stringify({ ok: false, error: "Email invalide" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (!rgpdConsent) {
    return new Response(
      JSON.stringify({ ok: false, error: "Consentement RGPD requis" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const ip = context.request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const ipHash = await sha256Hex(`${ip}|lobservatoire-newsletter`);

  const supRes = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      email,
      source,
      actif: true,
      rgpd_consent: true,
      ip_hash: ipHash,
    }),
  });

  // Idempotent : si email existe déjà (UNIQUE constraint), on traite comme succès silencieux
  if (!supRes.ok && supRes.status !== 409) {
    const body = await supRes.text();
    console.error("Newsletter insert failed:", supRes.status, body);
    return new Response(
      JSON.stringify({ ok: false, error: "Inscription impossible. Réessayez plus tard." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(null, {
    status: 303,
    headers: { Location: "/newsletter/merci/" },
  });
};

export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response("Method not allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
};
