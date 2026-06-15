/**
 * CF Pages Function : POST /api/avis/modifier
 *
 * Processes an edit submitted from /avis/modifier/<token>/. The edition token
 * (hidden field) authenticates the visitor and carries the avis_id. The new
 * content re-runs the existing auto filter :
 *   - reject        -> error page, nothing changes
 *   - flag_moderation -> UPDATE + status en_attente_moderation + admin email
 *   - pass / flag_preavis -> UPDATE + republish (status publie)
 * If the verdict changed and the artisan has a known email, the artisan is
 * re-notified (fresh response magic-link). The visitor always gets a
 * confirmation email. No new 48h preavis is triggered on an edit.
 */

import { verifyToken, signToken, hashToken } from "../../_lib/token";
import { runFilter } from "../../_lib/filter";

interface Env {
  RESEND_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  AVIS_TOKEN_SECRET: string;
  ADMIN_MODERATION_TOKEN?: string;
  AVIS_MOTS_FLAGS_CSV?: string;
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
  const html = `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title} - L'Observatoire des Pros</title><meta name="robots" content="noindex"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><style>body{font-family:Inter,system-ui,sans-serif;background:#F7F3EC;color:#1A1614;text-align:center;padding:5rem 1.5rem;line-height:1.6;max-width:40rem;margin:0 auto}h1{font-family:Fraunces,serif;font-size:2rem;margin:0 0 1rem;font-style:italic;font-weight:500}p{color:#403832;margin:.6rem auto;max-width:34rem}a{color:#1E3A52}.btn{display:inline-block;margin-top:1.25rem;padding:.8rem 1.4rem;background:#1A1614;color:#F7F3EC;border-radius:.5rem;text-decoration:none;font-weight:500}.btn:hover{background:#1E3A52}</style></head><body>${body}</body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function sendResend(
  apiKey: string,
  opts: { to: string; subject: string; html: string; reply_to?: string }
) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "L'Observatoire des Pros <noreply@send.lobservatoiredespros.com>",
        to: opts.to,
        reply_to: opts.reply_to || "contact@lobservatoiredespros.com",
        subject: opts.subject,
        html: opts.html,
      }),
    });
  } catch (e) {
    console.error("Resend send failed:", e);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const supabaseUrl = context.env.SUPABASE_URL || context.env.PUBLIC_SUPABASE_URL || "";
  const sbKey =
    context.env.SUPABASE_SERVICE_KEY ||
    context.env.SUPABASE_ANON_KEY ||
    context.env.PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!supabaseUrl || !sbKey || !context.env.AVIS_TOKEN_SECRET) {
    return htmlPage("Configuration manquante", "<h1>Erreur technique.</h1><p>Le service de modification n'est pas disponible. Reessayez plus tard.</p>", 500);
  }
  const sbHeaders = { apikey: sbKey, Authorization: `Bearer ${sbKey}` };

  // 1. Parse form
  const ct = context.request.headers.get("content-type") || "";
  let formData: FormData;
  try {
    if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
      formData = await context.request.formData();
    } else {
      return htmlPage("Requete invalide", "<h1>Requete invalide.</h1><p>Format non supporte.</p>", 400);
    }
  } catch {
    return htmlPage("Requete invalide", "<h1>Requete invalide.</h1><p>Impossible de lire le formulaire.</p>", 400);
  }
  const get = (k: string) => (formData.get(k) || "").toString().trim();

  const token = get("token");
  const pseudo = get("pseudo").slice(0, 30);
  const verdict = get("verdict") as "oui" | "non" | "mitige";
  const texte = get("texte").slice(0, 5500);
  const honeypot = get("company");

  // 2. Verify token
  const payload = await verifyToken(token, context.env.AVIS_TOKEN_SECRET);
  if (!payload || payload.type !== "edition") {
    return htmlPage("Lien invalide ou expire", `<h1>Lien invalide ou expire.</h1><p>Ce lien de modification n'est plus valable. Ecrivez-nous via <a href="/contact/">/contact/</a> pour en obtenir un nouveau.</p><p><a class="btn" href="/">Retour a l'accueil</a></p>`, 400);
  }

  // 3. Fetch current avis + pro
  const avisRes = await fetch(
    `${supabaseUrl}/rest/v1/pro_avis?id=eq.${encodeURIComponent(payload.avis_id)}&select=id,pro_id,email,pseudo,verdict,texte,status,pros(slug,nom_entreprise,ville,email)&limit=1`,
    { headers: sbHeaders }
  );
  if (!avisRes.ok) {
    return htmlPage("Erreur technique", "<h1>Erreur technique.</h1><p>Impossible de charger votre avis. Reessayez plus tard.</p>", 502);
  }
  const rows = (await avisRes.json()) as Array<{
    id: string;
    pro_id: string;
    email: string;
    pseudo: string;
    verdict: "oui" | "non" | "mitige";
    texte: string;
    status: string;
    pros: { slug: string; nom_entreprise: string; ville: string | null; email: string | null } | null;
  }>;
  if (rows.length === 0) {
    return htmlPage("Avis introuvable", "<h1>Avis introuvable.</h1><p>Cet avis n'existe plus.</p>", 404);
  }
  const avis = rows[0];
  const proSlug = avis.pros?.slug || "";
  const proNom = avis.pros?.nom_entreprise || "l'entreprise";
  const proVille = avis.pros?.ville || "";
  const artisanEmail = avis.pros?.email || null;
  const proUrl = proSlug ? `/pro/${encodeURIComponent(proSlug)}/` : "/";

  if (!["publie", "en_attente_moderation", "en_attente_preavis_artisan"].includes(avis.status)) {
    return htmlPage("Avis non modifiable", `<h1>Avis non modifiable.</h1><p>Cet avis ne peut plus etre modifie. Pour toute demande, ecrivez-nous via <a href="/contact/">/contact/</a>.</p>`, 409);
  }

  // 4. Basic validation
  if (!["oui", "non", "mitige"].includes(verdict)) {
    return htmlPage("Verdict manquant", `<h1>Modification incomplete.</h1><p>Merci d'indiquer si vous recommandez l'entreprise. <a href="/avis/modifier/${encodeURIComponent(token)}/">Revenir au formulaire</a>.</p>`, 400);
  }
  if (pseudo.length < 2) {
    return htmlPage("Pseudo trop court", `<h1>Modification incomplete.</h1><p>Votre pseudo doit faire au moins 2 caracteres. <a href="/avis/modifier/${encodeURIComponent(token)}/">Revenir au formulaire</a>.</p>`, 400);
  }

  // 5. Re-run the auto filter on the new content
  const filterResult = runFilter({
    pseudo,
    email: avis.email,
    texte,
    verdict,
    honeypot,
    mots_flags_csv: context.env.AVIS_MOTS_FLAGS_CSV || "",
  });

  if (filterResult.action === "reject") {
    const reasonMsg =
      filterResult.reason === "texte_too_short"
        ? "Votre recit doit faire au moins 100 caracteres."
        : filterResult.reason === "texte_too_long"
          ? "Votre recit depasse la longueur maximale (5000 caracteres)."
          : "Votre avis n'a pas pu etre enregistre.";
    return htmlPage("Modification refusee", `<h1>Modification refusee.</h1><p>${reasonMsg} <a href="/avis/modifier/${encodeURIComponent(token)}/">Revenir au formulaire</a>.</p>`, 400);
  }

  if (filterResult.action === "silent_accept") {
    // Honeypot triggered : pretend success, change nothing.
    return htmlPage("Modification enregistree", `<h1>Modification enregistree.</h1><p>Merci. <a class="btn" href="${htmlEscape(proUrl)}">Retour a la fiche</a></p>`);
  }

  // 6. Decide outcome : moderation queue vs republish
  const goesToModeration = filterResult.action === "flag_moderation";
  const verdictChanged = verdict !== avis.verdict;
  const now = new Date().toISOString();

  const updateBody: Record<string, unknown> = {
    pseudo,
    verdict,
    texte,
    edited_at: now,
  };
  if (goesToModeration) {
    updateBody.status = "en_attente_moderation";
    updateBody.moderation_reason = filterResult.moderation_reason || "edition_flag";
  } else {
    updateBody.status = "publie";
    updateBody.published_at = now;
    updateBody.moderation_reason = null;
  }

  const patchRes = await fetch(`${supabaseUrl}/rest/v1/pro_avis?id=eq.${encodeURIComponent(avis.id)}`, {
    method: "PATCH",
    headers: { ...sbHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(updateBody),
  });
  if (!patchRes.ok) {
    console.error("avis edit patch failed:", patchRes.status, await patchRes.text());
    return htmlPage("Erreur technique", "<h1>Erreur technique.</h1><p>Votre modification n'a pas pu etre enregistree. Reessayez plus tard.</p>", 502);
  }

  // 7. Emails
  const verdictLabel = verdict === "oui" ? "recommande" : verdict === "non" ? "deconseille" : "mitige";

  if (context.env.RESEND_API_KEY) {
    if (goesToModeration) {
      // Visitor : under review
      await sendResend(context.env.RESEND_API_KEY, {
        to: avis.email,
        subject: `Votre avis modifie sur ${proNom} est en cours de relecture`,
        html: `<p>Bonjour ${htmlEscape(pseudo)},</p>
<p>Votre avis modifie sur <strong>${htmlEscape(proNom)}</strong>${proVille ? ` (${htmlEscape(proVille)})` : ""} a bien ete enregistre. Conformement a notre charte, il est transmis a notre redaction pour une courte relecture avant remise en ligne.</p>
<p>Vous serez informe par email une fois la relecture terminee.</p>
<p>La redaction de L'Observatoire des Pros</p>`,
      });

      // Admin : moderation with publier/rejeter buttons
      if (context.env.ADMIN_MODERATION_TOKEN) {
        const adminBaseUrl = `https://lobservatoiredespros.com/api/admin/avis/moderer?id=${avis.id}&admin_token=${encodeURIComponent(context.env.ADMIN_MODERATION_TOKEN)}`;
        await sendResend(context.env.RESEND_API_KEY, {
          to: "contact@lobservatoiredespros.com",
          subject: `[Moderation] Avis MODIFIE flag: ${updateBody.moderation_reason} sur ${proNom}`,
          html: `<p>Un avis a ete <strong>modifie</strong> par son auteur et flag pour moderation.</p>
<p><strong>Pro :</strong> ${htmlEscape(proNom)} (${htmlEscape(proVille)})<br>
<strong>Pseudo :</strong> ${htmlEscape(pseudo)}<br>
<strong>Verdict :</strong> ${verdictLabel}<br>
<strong>Raison flag :</strong> ${htmlEscape(String(updateBody.moderation_reason))}</p>
<p><strong>Nouveau texte :</strong></p>
<p style="white-space:pre-wrap;border-left:3px solid #999;padding-left:12px;">${htmlEscape(texte)}</p>
<p>Decision :</p>
<p>
  <a href="${adminBaseUrl}&action=publier" style="background:#1a7a3c;color:#fff;padding:10px 16px;border-radius:4px;text-decoration:none;">Publier</a>
  &nbsp;&nbsp;
  <a href="${adminBaseUrl}&action=rejeter" style="background:#a82a2a;color:#fff;padding:10px 16px;border-radius:4px;text-decoration:none;">Rejeter</a>
</p>`,
        });
      }
    } else {
      // Republished. Visitor : confirmation with a fresh edit link.
      const editExp = Math.floor(Date.now() / 1000) + 90 * 86400;
      const newEditToken = await signToken(
        { avis_id: avis.id, pro_id: avis.pro_id, exp: editExp, type: "edition", nonce: crypto.randomUUID() },
        context.env.AVIS_TOKEN_SECRET
      );
      const editUrl = `https://lobservatoiredespros.com/avis/modifier/${newEditToken}/`;
      await sendResend(context.env.RESEND_API_KEY, {
        to: avis.email,
        subject: `Votre avis modifie sur ${proNom} est en ligne`,
        html: `<p>Bonjour ${htmlEscape(pseudo)},</p>
<p>Votre avis modifie sur <strong>${htmlEscape(proNom)}</strong>${proVille ? ` (${htmlEscape(proVille)})` : ""} est desormais en ligne.</p>
<p><a href="https://lobservatoiredespros.com/pro/${encodeURIComponent(proSlug)}/#avis-${avis.id}">Voir mon avis publie</a></p>
<p>Vous pouvez encore le modifier a tout moment via ce lien (valable 90 jours) :</p>
<p><a href="${editUrl}">Modifier mon avis</a></p>
<p>La redaction de L'Observatoire des Pros</p>`,
      });

      // Artisan re-notified only if the verdict changed and email is known.
      if (verdictChanged && artisanEmail) {
        const reponseExp = Math.floor(Date.now() / 1000) + 90 * 86400;
        const reponseToken = await signToken(
          { avis_id: avis.id, pro_id: avis.pro_id, exp: reponseExp, type: "reponse", nonce: crypto.randomUUID() },
          context.env.AVIS_TOKEN_SECRET
        );
        await fetch(`${supabaseUrl}/rest/v1/pro_response_tokens`, {
          method: "POST",
          headers: { ...sbHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            avis_id: avis.id,
            pro_id: avis.pro_id,
            token_hash: await hashToken(reponseToken),
            type: "reponse",
            expires_at: new Date(reponseExp * 1000).toISOString(),
          }),
        });
        await sendResend(context.env.RESEND_API_KEY, {
          to: artisanEmail,
          subject: `Un avis modifie sur votre fiche ${proNom}`,
          html: `<p>Bonjour,</p>
<p>Un visiteur de L'Observatoire des Pros a modifie son avis sur la fiche de votre entreprise <strong>${htmlEscape(proNom)}</strong>.</p>
<p><strong>Nouveau verdict : ${verdictLabel}</strong></p>
<p>Vous pouvez consulter l'avis et y repondre publiquement via ce lien (valable 90 jours) :</p>
<p><a href="https://lobservatoiredespros.com/r/${reponseToken}/">Voir l'avis et repondre</a></p>
<p>La redaction de L'Observatoire des Pros</p>`,
        });
      }
    }
  }

  // 8. Confirmation page
  if (goesToModeration) {
    return htmlPage(
      "Modification transmise",
      `<h1>Modification transmise a la redaction.</h1><p>Votre avis modifie sur <strong>${htmlEscape(proNom)}</strong> a bien ete enregistre et sera remis en ligne apres une courte relecture (sous 48 heures). Nous vous tiendrons informe par email.</p><p><a class="btn" href="${htmlEscape(proUrl)}">Retour a la fiche</a></p>`
    );
  }
  return htmlPage(
    "Avis modifie",
    `<h1>Votre avis a ete modifie.</h1><p>Votre avis sur <strong>${htmlEscape(proNom)}</strong> est mis a jour et de nouveau en ligne. Merci.</p><p><a class="btn" href="${htmlEscape(proUrl)}">Voir ma fiche</a></p>`
  );
};
