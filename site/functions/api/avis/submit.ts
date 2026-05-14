import { runFilter } from "../../_lib/filter";
import { verifyTurnstile } from "../../_lib/turnstile";

interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  AVIS_MOTS_FLAGS_CSV?: string;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Recuperer config Supabase (CF Pages expose PUBLIC_ et non-PUBLIC_ selon setup)
  const supabaseUrl = context.env.SUPABASE_URL || context.env.PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = context.env.SUPABASE_ANON_KEY || context.env.PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return jsonError("supabase_not_configured", 500);

  // 1. Parse form
  const ct = context.request.headers.get("content-type") || "";
  let formData: FormData;
  try {
    if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
      formData = await context.request.formData();
    } else {
      return jsonError("content_type_invalid", 400);
    }
  } catch {
    return jsonError("form_parse_failed", 400);
  }
  const get = (k: string) => (formData.get(k) || "").toString().trim();

  const fields = {
    pro_slug: get("pro_slug"),
    pseudo: get("pseudo").slice(0, 30),
    email: get("email").toLowerCase().slice(0, 254),
    verdict: get("verdict") as "oui" | "non" | "mitige",
    texte: get("texte").slice(0, 5500),
    honeypot: get("company"),
    turnstile: get("cf-turnstile-response"),
    rgpd: get("rgpd"),
  };

  // 2. Validation basique
  if (!["oui", "non", "mitige"].includes(fields.verdict)) return jsonError("verdict_invalide", 400);
  if (fields.rgpd !== "on") return jsonError("rgpd_requis", 400);
  if (fields.pseudo.length < 2) return jsonError("pseudo_trop_court", 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) return jsonError("email_invalide", 400);

  // 3. Turnstile verify (OPTIONNEL : si env secret absent, on skip)
  if (context.env.TURNSTILE_SECRET_KEY && !fields.honeypot) {
    const ts = await verifyTurnstile(
      fields.turnstile,
      context.env.TURNSTILE_SECRET_KEY,
      context.request.headers.get("cf-connecting-ip") || ""
    );
    if (!ts.success) return jsonError("turnstile_failed", 403);
  }

  // 4. Filtre auto
  const filterResult = runFilter({
    pseudo: fields.pseudo,
    email: fields.email,
    texte: fields.texte,
    verdict: fields.verdict,
    honeypot: fields.honeypot,
    mots_flags_csv: context.env.AVIS_MOTS_FLAGS_CSV || "",
  });

  if (filterResult.action === "reject") {
    return jsonError(filterResult.reason || "rejected", 400);
  }
  if (filterResult.action === "silent_accept") {
    return new Response(null, { status: 303, headers: { Location: "/avis/merci/" } });
  }

  // 5. Recuperer pro_id depuis slug
  const sbHeaders = { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` };
  const proRes = await fetch(
    `${supabaseUrl}/rest/v1/pros?slug=eq.${encodeURIComponent(fields.pro_slug)}&select=id,email&active=eq.true`,
    { headers: sbHeaders }
  );
  if (!proRes.ok) return jsonError("pro_fetch_failed", 502);
  const pros = await proRes.json() as Array<{ id: string; email: string | null }>;
  if (pros.length === 0) return jsonError("pro_not_found", 404);
  const pro = pros[0];

  // 6. Cooldown check : 1 avis / (pro, email) tous les 30 jours
  const cooldownStart = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const cooldownRes = await fetch(
    `${supabaseUrl}/rest/v1/pro_avis?pro_id=eq.${pro.id}&email=eq.${encodeURIComponent(fields.email)}&created_at=gte.${cooldownStart}&select=id`,
    { headers: sbHeaders }
  );
  if (cooldownRes.ok) {
    const cooldown = await cooldownRes.json() as Array<{ id: string }>;
    if (cooldown.length > 0) return jsonError("cooldown_30j", 429);
  }

  // 7. Preparer INSERT
  const verificationToken = crypto.randomUUID();
  const verificationExpiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  let moderation_reason: string | null = null;
  if (filterResult.action === "flag_moderation") moderation_reason = filterResult.moderation_reason || null;
  if (filterResult.action === "flag_preavis") moderation_reason = "verdict_non_long";

  const ip = context.request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const ipHash = await sha256Hex(`${ip}|lobservatoire-avis`);
  const userAgent = (context.request.headers.get("user-agent") || "").slice(0, 300);

  const insertBody = {
    pro_id: pro.id,
    pseudo: fields.pseudo,
    email: fields.email,
    email_verification_token: verificationToken,
    email_verification_expires_at: verificationExpiresAt,
    verdict: fields.verdict,
    texte: fields.texte,
    status: "en_attente_verif_email",
    moderation_reason,
    ip_hash: ipHash,
    user_agent: userAgent,
    rgpd_consent: true,
  };

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/pro_avis`, {
    method: "POST",
    headers: {
      ...sbHeaders,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(insertBody),
  });

  if (!insertRes.ok) {
    console.error("avis insert failed:", insertRes.status, await insertRes.text());
    return jsonError("db_insert_failed", 502);
  }

  // 8. Envoyer email confirmation visiteur via Resend
  if (context.env.RESEND_API_KEY) {
    const verifyUrl = `https://lobservatoiredespros.com/api/avis/verifier/${verificationToken}`;
    const html = `
<p>Bonjour ${fields.pseudo},</p>
<p>Merci pour votre avis sur L'Observatoire des Pros.</p>
<p>Pour le publier, confirmez votre adresse email en cliquant sur le lien ci-dessous (valable 48 heures) :</p>
<p><a href="${verifyUrl}">Confirmer mon avis</a></p>
<p>Si vous n'avez pas soumis cet avis, ignorez ce message.</p>
<p>La redaction de L'Observatoire des Pros<br>
<a href="https://lobservatoiredespros.com">https://lobservatoiredespros.com</a></p>
`;
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "L'Observatoire des Pros <noreply@send.lobservatoiredespros.com>",
          to: fields.email,
          reply_to: "contact@lobservatoiredespros.com",
          subject: "Confirmez votre avis sur L'Observatoire des Pros",
          html,
        }),
      });
    } catch (e) {
      console.error("Resend confirm email failed:", e);
      // L'INSERT a reussi. On continue sans bloquer.
    }
  }

  return new Response(null, {
    status: 303,
    headers: { Location: `/pro/${fields.pro_slug}/avis-soumis/` },
  });
};
