import { verifyToken } from "../../../_lib/token";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  RESEND_API_KEY?: string;
  AVIS_TOKEN_SECRET: string;
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const onRequestPost: PagesFunction<Env, "token"> = async (context) => {
  const tokenStr = String(context.params.token || "");
  const payload = await verifyToken(tokenStr, context.env.AVIS_TOKEN_SECRET);
  if (!payload) {
    return new Response(
      JSON.stringify({ ok: false, error: "token_invalid" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
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

  // Parse form
  let formData: FormData;
  try {
    formData = await context.request.formData();
  } catch {
    return new Response("invalid_form", { status: 400 });
  }
  const texte = ((formData.get("texte") || "").toString()).trim();
  if (texte.length < 50 || texte.length > 2000) {
    return new Response("texte_length_invalid", { status: 400 });
  }

  // Fetch avis + response existante
  const avisRes = await fetch(
    `${supabaseUrl}/rest/v1/pro_avis?id=eq.${payload.avis_id}&select=id,email,pseudo,pros(slug,nom_entreprise),pro_avis_responses(id,texte,version)`,
    { headers: sbHeaders }
  );
  const rows = (await avisRes.json()) as Array<{
    id: string;
    email: string;
    pseudo: string;
    pros: { slug: string; nom_entreprise: string } | null;
    pro_avis_responses: Array<{ id: string; texte: string; version: number }>;
  }>;
  if (rows.length === 0) {
    return new Response("avis_not_found", { status: 404 });
  }
  const avis = rows[0];
  const existingResponse = (avis.pro_avis_responses || [])[0];

  const ip =
    context.request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const ipHash = await sha256Hex(`${ip}|lobservatoire-r`);

  if (existingResponse) {
    // Insert history entry
    await fetch(`${supabaseUrl}/rest/v1/pro_avis_response_history`, {
      method: "POST",
      headers: {
        ...sbHeaders,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        response_id: existingResponse.id,
        texte_old: existingResponse.texte,
        texte_new: texte,
        changed_by_ip_hash: ipHash,
      }),
    });
    // Update response
    await fetch(
      `${supabaseUrl}/rest/v1/pro_avis_responses?id=eq.${existingResponse.id}`,
      {
        method: "PATCH",
        headers: {
          ...sbHeaders,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          texte,
          version: existingResponse.version + 1,
          updated_at: new Date().toISOString(),
        }),
      }
    );
  } else {
    // Insert new response
    await fetch(`${supabaseUrl}/rest/v1/pro_avis_responses`, {
      method: "POST",
      headers: {
        ...sbHeaders,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        avis_id: payload.avis_id,
        pro_id: payload.pro_id,
        texte,
        version: 1,
        status: "publie",
      }),
    });
  }

  // Email visiteur (best effort)
  if (context.env.RESEND_API_KEY && avis.email) {
    const proSlug = avis.pros?.slug || "";
    const proNom = avis.pros?.nom_entreprise || "l'entreprise";
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "L'Observatoire des Pros <noreply@send.lobservatoiredespros.com>",
          to: avis.email,
          reply_to: "contact@lobservatoiredespros.com",
          subject: `${proNom} a repondu a votre avis`,
          html: `<p>Bonjour ${htmlEscape(avis.pseudo)},</p>
<p>L'entreprise <strong>${htmlEscape(proNom)}</strong> vient de repondre a votre avis sur L'Observatoire des Pros.</p>
<p><a href="https://lobservatoiredespros.com/pro/${encodeURIComponent(proSlug)}/#avis-${payload.avis_id}">Lire la reponse</a></p>
<p>La redaction de L'Observatoire des Pros</p>`,
        }),
      });
    } catch (e) {
      console.error("Resend response notify failed:", e);
    }
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/r/${encodeURIComponent(tokenStr)}/?success=repondu`,
    },
  });
};
