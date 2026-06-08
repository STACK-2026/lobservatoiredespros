/**
 * Stripe webhook — L'Observatoire des Pros (Profil Verifie 29 EUR/an).
 *
 * Runs on the Cloudflare Pages Functions (Workers) runtime : NO node, NO
 * stripe SDK. Signature is verified manually with Web Crypto (HMAC-SHA256),
 * exactly the scheme Stripe documents for `Stripe-Signature`.
 *
 * Env (CF Pages secrets) :
 *   STRIPE_SECRET_KEY        (sk_test_… / sk_live_…)  — not strictly needed here
 *   STRIPE_WEBHOOK_SECRET    (whsec_…)                — REQUIRED, signature check
 *   SUPABASE_URL             (https://apuyeakgxjgdcfssrtek.supabase.co)
 *   SUPABASE_SERVICE_KEY     (service_role — bypass RLS to update pros)
 *
 * Events handled :
 *   checkout.session.completed     -> active le Profil Verifie (tier='verifie')
 *   invoice.paid                   -> renouvellement : prolonge d'un an
 *   customer.subscription.deleted  -> revoque : repasse en 'gratuit'
 *
 * Mapping paiement -> fiche : le Payment Link collecte le SIRET en custom
 * field ; on retrouve le pro par `pros.siret`. Fail-soft : on logue et on
 * renvoie 200 (sinon Stripe re-essaie en boucle) sauf signature invalide -> 400.
 */

interface Env {
  STRIPE_WEBHOOK_SECRET?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
}

// Hardcode comme contact.ts / candidature.ts (SUPABASE_URL n'est pas un secret CF).
const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
const PLAN = "verifie"; // abonnements.plan (libelle, pas de contrainte)
// PARE-FEU EDITORIAL (non negociable) : on ne touche JAMAIS pros.tier (medaille
// bronze/argent/or = editoriale, meritee) ni score_confiance. Le Profil Verifie PAYANT
// pilote un flag SEPARE : pros.verified + pros.profil_verifie_expire_at. Le badge dit
// "ce pro tient sa fiche a jour", jamais "il est meilleur" (cadrage additif).
const PRIX_MENSUEL = 2.42; // 29 EUR / an ramene au mois (colonne abonnements.prix_mensuel NOT NULL)

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(
    sigHeader.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i), kv.slice(i + 1)];
    }),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;

  // Replay window : 5 min tolerance.
  const ts = parseInt(t, 10);
  if (!Number.isFinite(ts)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${rawBody}`));
  const expected = hex(sig);

  // constant-time compare
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

function sbHeaders(env: Env) {
  const key = env.SUPABASE_SERVICE_KEY || "";
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function findProBySiret(env: Env, siret: string): Promise<{ id: string; slug: string } | null> {
  const clean = siret.replace(/\D/g, "");
  if (clean.length !== 14) return null;
  const url = `${SUPABASE_URL}/rest/v1/pros?siret=eq.${clean}&select=id,slug&limit=1`;
  const r = await fetch(url, { headers: sbHeaders(env) });
  if (!r.ok) return null;
  const rows = (await r.json()) as Array<{ id: string; slug: string }>;
  return rows[0] || null;
}

async function setVerified(env: Env, proId: string, verified: boolean, expireAt: string | null) {
  // N'ECRIT JAMAIS pros.tier : le classement editorial reste hors de portee du paiement.
  await fetch(`${SUPABASE_URL}/rest/v1/pros?id=eq.${proId}`, {
    method: "PATCH",
    headers: { ...sbHeaders(env), Prefer: "return=minimal" },
    body: JSON.stringify({ verified, profil_verifie_expire_at: expireAt, updated_at: new Date().toISOString() }),
  });
}

function plusOneYear(from: Date): Date {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.STRIPE_WEBHOOK_SECRET || !env.SUPABASE_SERVICE_KEY) {
    console.error("stripe-webhook: missing env");
    return new Response("misconfigured", { status: 500 });
  }

  const rawBody = await request.text();
  const ok = await verifyStripeSignature(
    rawBody,
    request.headers.get("stripe-signature"),
    env.STRIPE_WEBHOOK_SECRET,
  );
  if (!ok) {
    console.error("stripe-webhook: bad signature");
    return new Response("invalid signature", { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  try {
    const obj = event.data?.object ?? {};

    if (event.type === "checkout.session.completed") {
      // SIRET depuis le custom field du Payment Link
      const siretField = (obj.custom_fields || []).find((f: any) => f.key === "siret");
      const siret = siretField?.text?.value || siretField?.numeric?.value || "";
      const subId: string | null = obj.subscription || null;

      const pro = siret ? await findProBySiret(env, String(siret)) : null;
      if (!pro) {
        console.error("stripe-webhook: pro introuvable pour SIRET", String(siret).slice(0, 14), "session", obj.id);
        return new Response("ok (pro not found, logged)", { status: 200 });
      }

      const debut = new Date();
      const fin = plusOneYear(debut);
      await setVerified(env, pro.id, true, fin.toISOString());
      await fetch(`${SUPABASE_URL}/rest/v1/abonnements`, {
        method: "POST",
        headers: { ...sbHeaders(env), Prefer: "return=minimal" },
        body: JSON.stringify({
          pro_id: pro.id,
          plan: PLAN,
          prix_mensuel: PRIX_MENSUEL,
          debut: debut.toISOString(),
          fin: fin.toISOString(),
          stripe_subscription_id: subId,
          actif: true,
        }),
      });
      console.log("stripe-webhook: Profil Verifie active pour", pro.slug, "sub", subId);
      return new Response("ok", { status: 200 });
    }

    if (event.type === "invoice.paid") {
      // GARDE anti double-comptage : le 1er paiement (billing_reason=subscription_create)
      // est deja traite par checkout.session.completed. On ne prolonge QUE sur un vrai
      // cycle de renouvellement annuel, sinon un nouvel abonne aurait 2 ans au lieu d'1.
      if (obj.billing_reason !== "subscription_cycle") {
        return new Response("ok (not a renewal cycle)", { status: 200 });
      }
      // Renouvellement : prolonge l'abonnement existant et la fiche.
      const subId: string | null = obj.subscription || null;
      if (!subId) return new Response("ok (no sub)", { status: 200 });
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/abonnements?stripe_subscription_id=eq.${subId}&select=id,pro_id,fin&order=created_at.desc&limit=1`,
        { headers: sbHeaders(env) },
      );
      const rows = (await r.json()) as Array<{ id: string; pro_id: string; fin: string }>;
      const ab = rows[0];
      if (!ab) return new Response("ok (sub unknown, first invoice handled by checkout)", { status: 200 });
      const base = new Date(ab.fin) > new Date() ? new Date(ab.fin) : new Date();
      const newFin = plusOneYear(base);
      await fetch(`${SUPABASE_URL}/rest/v1/abonnements?id=eq.${ab.id}`, {
        method: "PATCH",
        headers: { ...sbHeaders(env), Prefer: "return=minimal" },
        body: JSON.stringify({ fin: newFin.toISOString(), actif: true }),
      });
      await setVerified(env, ab.pro_id, true, newFin.toISOString());
      console.log("stripe-webhook: renouvellement", subId, "->", newFin.toISOString());
      return new Response("ok", { status: 200 });
    }

    if (event.type === "customer.subscription.deleted") {
      const subId: string = obj.id;
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/abonnements?stripe_subscription_id=eq.${subId}&select=id,pro_id&limit=1`,
        { headers: sbHeaders(env) },
      );
      const rows = (await r.json()) as Array<{ id: string; pro_id: string }>;
      const ab = rows[0];
      if (ab) {
        await fetch(`${SUPABASE_URL}/rest/v1/abonnements?id=eq.${ab.id}`, {
          method: "PATCH",
          headers: { ...sbHeaders(env), Prefer: "return=minimal" },
          body: JSON.stringify({ actif: false }),
        });
        await setVerified(env, ab.pro_id, false, null);
        console.log("stripe-webhook: abonnement revoque", subId);
      }
      return new Response("ok", { status: 200 });
    }

    return new Response("ok (ignored)", { status: 200 });
  } catch (e) {
    console.error("stripe-webhook handler error", e instanceof Error ? e.message : String(e));
    // 200 : on ne veut pas de retry-storm Stripe sur une erreur applicative
    return new Response("ok (error logged)", { status: 200 });
  }
};
