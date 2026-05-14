import { signToken, hashToken } from "../../../_lib/token";

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

async function sendResend(
  apiKey: string,
  opts: { to: string; subject: string; html: string; reply_to?: string }
) {
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
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

export const onRequestGet: PagesFunction<Env, "token"> = async (context) => {
  const token = String(context.params.token || "");
  if (!token) {
    return Response.redirect(
      "https://lobservatoiredespros.com/avis/verifier/invalide/",
      302
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
    return Response.redirect(
      "https://lobservatoiredespros.com/avis/verifier/erreur/",
      302
    );
  }

  const sbHeaders = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  };

  // 1. Fetch l'avis + le pro
  const avisRes = await fetch(
    `${supabaseUrl}/rest/v1/pro_avis?email_verification_token=eq.${encodeURIComponent(token)}&select=id,pro_id,pseudo,email,verdict,texte,status,moderation_reason,email_verification_expires_at,pros(slug,nom_entreprise,email,ville)`,
    { headers: sbHeaders }
  );

  if (!avisRes.ok) {
    return Response.redirect(
      "https://lobservatoiredespros.com/avis/verifier/erreur/",
      302
    );
  }

  const rows = (await avisRes.json()) as Array<Record<string, unknown>>;

  if (rows.length === 0) {
    return Response.redirect(
      "https://lobservatoiredespros.com/avis/verifier/invalide/",
      302
    );
  }

  const avis = rows[0] as {
    id: string;
    pro_id: string;
    pseudo: string;
    email: string;
    verdict: "oui" | "non" | "mitige";
    texte: string;
    status: string;
    moderation_reason: string | null;
    email_verification_expires_at: string;
    pros: {
      slug: string;
      nom_entreprise: string;
      email: string | null;
      ville: string;
    } | null;
  };

  // 2. Token expire ?
  if (new Date(avis.email_verification_expires_at) < new Date()) {
    return Response.redirect(
      "https://lobservatoiredespros.com/avis/verifier/expire/",
      302
    );
  }

  // 3. Deja verifie ? (idempotent redirect vers result)
  if (avis.status !== "en_attente_verif_email") {
    return Response.redirect(
      `https://lobservatoiredespros.com/avis/verifier/${encodeURIComponent(token)}/`,
      302
    );
  }

  // 4. Decider prochain status
  type NextStatus =
    | "publie"
    | "en_attente_preavis_artisan"
    | "en_attente_moderation";

  let nextStatus: NextStatus;
  let preavisToken: string | undefined;
  const artisanEmail: string | null = avis.pros?.email || null;

  if (
    avis.moderation_reason &&
    avis.moderation_reason !== "verdict_non_long"
  ) {
    // Flag moderation (mots_flags, url_detected) -> file admin
    nextStatus = "en_attente_moderation";
  } else if (
    avis.moderation_reason === "verdict_non_long" &&
    artisanEmail
  ) {
    // Flag preavis + artisan email connu -> preavis 48h
    nextStatus = "en_attente_preavis_artisan";
    const expSec = Math.floor(Date.now() / 1000) + 90 * 86400;
    preavisToken = await signToken(
      {
        avis_id: avis.id,
        pro_id: avis.pro_id,
        exp: expSec,
        type: "preavis",
        nonce: crypto.randomUUID(),
      },
      context.env.AVIS_TOKEN_SECRET
    );
    // Audit DB
    await fetch(`${supabaseUrl}/rest/v1/pro_response_tokens`, {
      method: "POST",
      headers: {
        ...sbHeaders,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        avis_id: avis.id,
        pro_id: avis.pro_id,
        token_hash: await hashToken(preavisToken),
        type: "preavis",
        expires_at: new Date(expSec * 1000).toISOString(),
      }),
    });
  } else {
    // Pas de flag OU verdict_non_long sans email artisan -> publication immediate
    nextStatus = "publie";
  }

  // 5. UPDATE pro_avis
  const updateBody: Record<string, unknown> = {
    email_verified: true,
    status: nextStatus,
  };
  if (nextStatus === "publie") {
    updateBody.published_at = new Date().toISOString();
  }
  if (nextStatus === "en_attente_preavis_artisan") {
    updateBody.preavis_envoye_at = new Date().toISOString();
  }

  await fetch(`${supabaseUrl}/rest/v1/pro_avis?id=eq.${avis.id}`, {
    method: "PATCH",
    headers: {
      ...sbHeaders,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(updateBody),
  });

  // 6. Envoi emails Resend selon outcome
  if (context.env.RESEND_API_KEY) {
    const proSlug = avis.pros?.slug || "";
    const proNom = avis.pros?.nom_entreprise || "l'entreprise";
    const proVille = avis.pros?.ville || "";
    const verdictLabel =
      avis.verdict === "oui"
        ? "recommande"
        : avis.verdict === "non"
          ? "deconseille"
          : "mitige";

    if (nextStatus === "publie") {
      // Visiteur : votre avis est publie
      await sendResend(context.env.RESEND_API_KEY, {
        to: avis.email,
        subject: `Votre avis sur ${proNom} est en ligne`,
        html: `<p>Bonjour ${htmlEscape(avis.pseudo)},</p>
<p>Votre avis sur <strong>${htmlEscape(proNom)}</strong> (${htmlEscape(proVille)}) est desormais publie sur L'Observatoire des Pros.</p>
<p><a href="https://lobservatoiredespros.com/pro/${encodeURIComponent(proSlug)}/#avis-${avis.id}">Voir mon avis publie</a></p>
<p>Merci pour votre contribution.</p>
<p>La redaction de L'Observatoire des Pros</p>`,
      });

      // Artisan (si email connu) : nouvel avis publie sur votre fiche + magic link reponse
      if (artisanEmail) {
        const reponseExp = Math.floor(Date.now() / 1000) + 90 * 86400;
        const reponseToken = await signToken(
          {
            avis_id: avis.id,
            pro_id: avis.pro_id,
            exp: reponseExp,
            type: "reponse",
            nonce: crypto.randomUUID(),
          },
          context.env.AVIS_TOKEN_SECRET
        );

        // Audit DB
        await fetch(`${supabaseUrl}/rest/v1/pro_response_tokens`, {
          method: "POST",
          headers: {
            ...sbHeaders,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
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
          subject: `Nouvel avis publie sur votre fiche ${proNom}`,
          html: `<p>Bonjour,</p>
<p>Un visiteur de L'Observatoire des Pros vient de publier un avis sur la fiche de votre entreprise <strong>${htmlEscape(proNom)}</strong>.</p>
<p><strong>Verdict : ${verdictLabel}</strong></p>
<p>Vous pouvez consulter l'avis et y repondre publiquement via ce lien (valable 90 jours) :</p>
<p><a href="https://lobservatoiredespros.com/r/${reponseToken}/">Voir l'avis et repondre</a></p>
<p>La redaction de L'Observatoire des Pros</p>`,
        });
      }
    } else if (
      nextStatus === "en_attente_preavis_artisan" &&
      preavisToken &&
      artisanEmail
    ) {
      // Artisan : preavis 48h avant publication
      await sendResend(context.env.RESEND_API_KEY, {
        to: artisanEmail,
        subject: `Un avis sur votre fiche ${proNom} sera publie dans 48 heures`,
        html: `<p>Bonjour,</p>
<p>Un visiteur de L'Observatoire des Pros a soumis un avis sur la fiche de votre entreprise <strong>${htmlEscape(proNom)}</strong>.</p>
<p><strong>Verdict : ${verdictLabel}</strong></p>
<p>Cet avis sera publie automatiquement dans 48 heures. Vous pouvez le consulter et preparer votre droit de reponse public des maintenant via ce lien (valable 90 jours) :</p>
<p><a href="https://lobservatoiredespros.com/r/${preavisToken}/">Consulter l'avis et preparer ma reponse</a></p>
<p>Si vous souhaitez signaler une erreur factuelle dans l'avis, vous pouvez le faire via la meme page.</p>
<p>La redaction de L'Observatoire des Pros</p>`,
      });
    } else if (
      nextStatus === "en_attente_moderation" &&
      context.env.ADMIN_MODERATION_TOKEN
    ) {
      // Admin : avis a moderer avec boutons publier/rejeter
      const adminBaseUrl = `https://lobservatoiredespros.com/api/admin/avis/moderer?id=${avis.id}&admin_token=${encodeURIComponent(context.env.ADMIN_MODERATION_TOKEN)}`;
      await sendResend(context.env.RESEND_API_KEY, {
        to: "contact@lobservatoiredespros.com",
        subject: `[Moderation] Avis flag: ${avis.moderation_reason} sur ${proNom}`,
        html: `<p>Un avis vient d'etre soumis et flag pour moderation.</p>
<p><strong>Pro :</strong> ${htmlEscape(proNom)} (${htmlEscape(proVille)})<br>
<strong>Pseudo :</strong> ${htmlEscape(avis.pseudo)}<br>
<strong>Verdict :</strong> ${verdictLabel}<br>
<strong>Raison flag :</strong> ${htmlEscape(avis.moderation_reason || "inconnue")}</p>
<p><strong>Texte de l'avis :</strong></p>
<p style="white-space:pre-wrap;border-left:3px solid #999;padding-left:12px;">${htmlEscape(avis.texte)}</p>
<p>Decision :</p>
<p>
  <a href="${adminBaseUrl}&action=publier" style="background:#1a7a3c;color:#fff;padding:10px 16px;border-radius:4px;text-decoration:none;">Publier</a>
  &nbsp;&nbsp;
  <a href="${adminBaseUrl}&action=rejeter" style="background:#a82a2a;color:#fff;padding:10px 16px;border-radius:4px;text-decoration:none;">Rejeter</a>
</p>`,
      });
    }
  }

  // 7. Redirige vers page result
  return Response.redirect(
    `https://lobservatoiredespros.com/avis/verifier/${encodeURIComponent(token)}/`,
    302
  );
};
