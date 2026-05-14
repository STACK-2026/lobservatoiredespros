import { signToken, hashToken } from "../../../_lib/token";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  RESEND_API_KEY?: string;
  AVIS_TOKEN_SECRET: string;
}

function b64urlDecode(str: string): Uint8Array {
  const padded =
    str.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function b64urlEncode(input: Uint8Array): string {
  let str = "";
  for (let i = 0; i < input.length; i++) str += String.fromCharCode(input[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return new Uint8Array(sig);
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const onRequestPost: PagesFunction<Env, "token"> = async (context) => {
  const tokenStr = String(context.params.token || "");
  const [payloadB64, sigB64] = tokenStr.split(".");
  if (!payloadB64 || !sigB64) {
    return new Response("token_malformed", { status: 400 });
  }

  // Verify signature WITHOUT exp check (allows renewing expired tokens)
  const expectedSig = await hmac(context.env.AVIS_TOKEN_SECRET, payloadB64);
  if (b64urlEncode(expectedSig) !== sigB64) {
    return new Response("token_signature_invalid", { status: 403 });
  }

  let payload: {
    avis_id: string;
    pro_id: string;
    exp: number;
    type: "preavis" | "reponse";
    nonce: string;
  };
  try {
    payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payloadB64))
    );
    if (
      !payload.avis_id ||
      !payload.pro_id ||
      !payload.type ||
      !["preavis", "reponse"].includes(payload.type)
    ) {
      return new Response("token_payload_invalid", { status: 400 });
    }
  } catch {
    return new Response("token_payload_parse_failed", { status: 400 });
  }

  const supabaseUrl =
    context.env.SUPABASE_URL || context.env.PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey =
    context.env.SUPABASE_SERVICE_KEY ||
    context.env.SUPABASE_ANON_KEY ||
    context.env.PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response("supabase_not_configured", { status: 500 });
  }
  const sbHeaders = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  };

  // Fetch artisan email via pros join
  const avisRes = await fetch(
    `${supabaseUrl}/rest/v1/pro_avis?id=eq.${payload.avis_id}&select=pros(slug,nom_entreprise,email)`,
    { headers: sbHeaders }
  );
  const rows = (await avisRes.json()) as Array<{
    pros: { slug: string; nom_entreprise: string; email: string } | null;
  }>;
  if (rows.length === 0 || !rows[0].pros?.email) {
    return new Response("artisan_email_unknown", { status: 404 });
  }
  const artisanEmail = rows[0].pros.email;
  const proNom = rows[0].pros.nom_entreprise || "votre fiche";

  // Generate new token (90 days)
  const newExpSec = Math.floor(Date.now() / 1000) + 90 * 86400;
  const newToken = await signToken(
    {
      avis_id: payload.avis_id,
      pro_id: payload.pro_id,
      exp: newExpSec,
      type: payload.type,
      nonce: crypto.randomUUID(),
    },
    context.env.AVIS_TOKEN_SECRET
  );

  // Audit INSERT in pro_response_tokens
  await fetch(`${supabaseUrl}/rest/v1/pro_response_tokens`, {
    method: "POST",
    headers: {
      ...sbHeaders,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      avis_id: payload.avis_id,
      pro_id: payload.pro_id,
      token_hash: await hashToken(newToken),
      type: payload.type,
      expires_at: new Date(newExpSec * 1000).toISOString(),
    }),
  });

  // Email artisan with new magic link
  if (context.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "L'Observatoire des Pros <noreply@send.lobservatoiredespros.com>",
          to: artisanEmail,
          reply_to: "contact@lobservatoiredespros.com",
          subject: `Nouveau lien d'acces a votre droit de reponse sur ${htmlEscape(proNom)}`,
          html: `<p>Bonjour,</p>
<p>Voici un nouveau lien d'acces (valable 90 jours) pour gerer votre droit de reponse sur la fiche <strong>${htmlEscape(proNom)}</strong> :</p>
<p><a href="https://lobservatoiredespros.com/r/${newToken}/">Acceder a l'interface</a></p>
<p>L'ancien lien est desormais utilise. Si vous avez besoin d'un autre renouvellement plus tard, vous pourrez le redemander depuis cette page.</p>
<p>La redaction de L'Observatoire des Pros</p>`,
        }),
      });
    } catch (e) {
      console.error("Resend renew failed:", e);
    }
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `https://lobservatoiredespros.com/r/${newToken}/?success=renouvele`,
    },
  });
};
