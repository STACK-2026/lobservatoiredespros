/**
 * CF Pages Function : GET /api/admin/avis/lien-edition
 *
 * Admin-only. Generates an "edition" magic-link for a given avis and (by
 * default) emails it to the review's author with a courteous message. Used to
 * answer visitors who write to contact@ asking to modify their review, and to
 * reissue an edit link on demand.
 *
 *   ?id=<avisId>&admin_token=<ADMIN_MODERATION_TOKEN>[&send=0]
 *
 * send=0 only returns the link (no email). Default sends the email.
 */

import { signToken, hashToken } from "../../../_lib/token";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  RESEND_API_KEY?: string;
  AVIS_TOKEN_SECRET: string;
  /** Dedicated admin gate for this endpoint (distinct from ADMIN_MODERATION_TOKEN). */
  EDIT_LINK_ADMIN_TOKEN?: string;
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlPage(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>${title} - L'Observatoire des Pros</title><meta name="robots" content="noindex"><style>body{font-family:Inter,system-ui,sans-serif;background:#F7F3EC;color:#1A1614;padding:3rem 1.5rem;line-height:1.6;max-width:44rem;margin:0 auto}h1{font-family:Fraunces,serif;font-size:1.6rem;font-style:italic;font-weight:500}a{color:#1E3A52;word-break:break-all}code{background:#EEE6DC;padding:.2rem .4rem;border-radius:.3rem}</style></head><body>${body}</body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  const adminToken = url.searchParams.get("admin_token");
  const send = url.searchParams.get("send") !== "0";

  if (!context.env.EDIT_LINK_ADMIN_TOKEN || !context.env.AVIS_TOKEN_SECRET) {
    return htmlPage("Configuration manquante", "<h1>Configuration manquante</h1><p>Tokens serveur absents.</p>", 500);
  }
  if (adminToken !== context.env.EDIT_LINK_ADMIN_TOKEN) {
    return htmlPage("Acces refuse", "<h1>Acces refuse</h1><p>Token administrateur invalide.</p>", 403);
  }
  if (!id) {
    return htmlPage("Parametre manquant", "<h1>Parametre manquant</h1><p>Parametre <code>id</code> (avis) requis.</p>", 400);
  }

  const supabaseUrl = context.env.SUPABASE_URL || context.env.PUBLIC_SUPABASE_URL || "";
  const sbKey =
    context.env.SUPABASE_SERVICE_KEY ||
    context.env.SUPABASE_ANON_KEY ||
    context.env.PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!supabaseUrl || !sbKey) {
    return htmlPage("Configuration manquante", "<h1>Configuration manquante</h1><p>Supabase non configure.</p>", 500);
  }
  const sbHeaders = { apikey: sbKey, Authorization: `Bearer ${sbKey}` };

  const avisRes = await fetch(
    `${supabaseUrl}/rest/v1/pro_avis?id=eq.${encodeURIComponent(id)}&select=id,pro_id,email,pseudo,status,pros(nom_entreprise,ville)&limit=1`,
    { headers: sbHeaders }
  );
  if (!avisRes.ok) {
    return htmlPage("Erreur DB", `<h1>Erreur DB</h1><p>HTTP ${avisRes.status}.</p>`, 502);
  }
  const rows = (await avisRes.json()) as Array<{
    id: string;
    pro_id: string;
    email: string;
    pseudo: string;
    status: string;
    pros: { nom_entreprise: string; ville: string | null } | null;
  }>;
  if (rows.length === 0) {
    return htmlPage("Avis introuvable", `<h1>Avis introuvable</h1><p>Aucun avis avec l'id <code>${htmlEscape(id)}</code>.</p>`, 404);
  }
  const avis = rows[0];
  const proNom = avis.pros?.nom_entreprise || "l'entreprise";
  const proVille = avis.pros?.ville || "";

  if (!["publie", "en_attente_moderation", "en_attente_preavis_artisan"].includes(avis.status)) {
    return htmlPage("Avis non modifiable", `<h1>Avis non modifiable</h1><p>Statut actuel : <code>${htmlEscape(avis.status)}</code>. Aucun lien d'edition genere.</p>`, 409);
  }

  // Generate edition token (90 days) + audit
  const exp = Math.floor(Date.now() / 1000) + 90 * 86400;
  const token = await signToken(
    { avis_id: avis.id, pro_id: avis.pro_id, exp, type: "edition", nonce: crypto.randomUUID() },
    context.env.AVIS_TOKEN_SECRET
  );
  await fetch(`${supabaseUrl}/rest/v1/pro_response_tokens`, {
    method: "POST",
    headers: { ...sbHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      avis_id: avis.id,
      pro_id: avis.pro_id,
      token_hash: await hashToken(token),
      type: "edition",
      expires_at: new Date(exp * 1000).toISOString(),
    }),
  });

  const editUrl = `https://lobservatoiredespros.com/avis/modifier/${token}/`;

  let sendStatus = "non envoye (send=0)";
  if (send) {
    if (!context.env.RESEND_API_KEY) {
      sendStatus = "ECHEC : RESEND_API_KEY absent";
    } else {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${context.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "L'Observatoire des Pros <noreply@send.lobservatoiredespros.com>",
            to: avis.email,
            reply_to: "contact@lobservatoiredespros.com",
            subject: "Modifier votre avis sur L'Observatoire des Pros",
            html: `<p>Bonjour ${htmlEscape(avis.pseudo)},</p>
<p>Suite a votre demande, voici le lien qui vous permet de modifier votre avis sur <strong>${htmlEscape(proNom)}</strong>${proVille ? ` (${htmlEscape(proVille)})` : ""} sur L'Observatoire des Pros.</p>
<p style="margin:1.5rem 0;">
  <a href="${editUrl}" style="display:inline-block;background:#1A1614;color:#F7F3EC;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;">Modifier mon avis</a>
</p>
<p>Ce lien est personnel et valable 90 jours. Une fois vos modifications enregistrees, votre avis repasse par notre charte editoriale avant d'etre remis en ligne.</p>
<p>Si vous souhaitez plutot retirer completement votre avis, repondez simplement a ce message.</p>
<p>Bien cordialement,<br>La redaction de L'Observatoire des Pros</p>`,
          }),
        });
        sendStatus = r.ok ? `envoye a ${avis.email}` : `ECHEC Resend HTTP ${r.status} : ${htmlEscape((await r.text()).slice(0, 300))}`;
      } catch (e) {
        sendStatus = `ECHEC exception : ${htmlEscape(String(e))}`;
      }
    }
  }

  return htmlPage(
    "Lien d'edition genere",
    `<h1>Lien d'edition genere</h1>
<p><strong>Avis :</strong> ${htmlEscape(avis.pseudo)} sur ${htmlEscape(proNom)} (${htmlEscape(avis.status)})<br>
<strong>Destinataire :</strong> ${htmlEscape(avis.email)}<br>
<strong>Email :</strong> ${htmlEscape(sendStatus)}</p>
<p><strong>Lien :</strong><br><a href="${editUrl}">${editUrl}</a></p>`
  );
};
