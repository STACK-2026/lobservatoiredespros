import { verifyToken } from "../../../_lib/token";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  RESEND_API_KEY?: string;
  AVIS_TOKEN_SECRET: string;
  ADMIN_MODERATION_TOKEN?: string;
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
  const payload = await verifyToken(tokenStr, context.env.AVIS_TOKEN_SECRET);
  if (!payload) {
    return new Response("token_invalid", { status: 403 });
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

  // Flag avis for moderation
  await fetch(`${supabaseUrl}/rest/v1/pro_avis?id=eq.${payload.avis_id}`, {
    method: "PATCH",
    headers: {
      ...sbHeaders,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      status: "en_attente_moderation",
      moderation_reason: "signale_par_artisan",
    }),
  });

  // Fetch context for admin email
  const avisRes = await fetch(
    `${supabaseUrl}/rest/v1/pro_avis?id=eq.${payload.avis_id}&select=pseudo,verdict,texte,pros(slug,nom_entreprise,ville)`,
    { headers: sbHeaders }
  );
  const rows = (await avisRes.json()) as Array<{
    pseudo: string;
    verdict: string;
    texte: string;
    pros: { slug: string; nom_entreprise: string; ville: string } | null;
  }>;
  const avis = rows[0];

  if (context.env.RESEND_API_KEY && context.env.ADMIN_MODERATION_TOKEN && avis) {
    const adminBaseUrl = `https://lobservatoiredespros.com/api/admin/avis/moderer?id=${payload.avis_id}&admin_token=${encodeURIComponent(context.env.ADMIN_MODERATION_TOKEN)}`;
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "L'Observatoire des Pros <noreply@send.lobservatoiredespros.com>",
          to: "contact@lobservatoiredespros.com",
          reply_to: "contact@lobservatoiredespros.com",
          subject: `[Signalement artisan] Avis sur ${avis.pros?.nom_entreprise || "fiche pro"}`,
          html: `<p>L'artisan a signale un avis sur sa fiche.</p>
<p><strong>Pro :</strong> ${htmlEscape(avis.pros?.nom_entreprise || "")} (${htmlEscape(avis.pros?.ville || "")})<br>
<strong>Pseudo client :</strong> ${htmlEscape(avis.pseudo)}<br>
<strong>Verdict :</strong> ${htmlEscape(avis.verdict)}</p>
<p><strong>Texte de l'avis :</strong></p>
<p style="white-space:pre-wrap;border-left:3px solid #999;padding-left:12px;">${htmlEscape(avis.texte)}</p>
<p>Decision :</p>
<p><a href="${adminBaseUrl}&action=publier">Republier</a>
&nbsp;|&nbsp;
<a href="${adminBaseUrl}&action=rejeter">Rejeter</a></p>`,
        }),
      });
    } catch (e) {
      console.error("Resend admin signal failed:", e);
    }
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/r/${encodeURIComponent(tokenStr)}/?success=signale`,
    },
  });
};
