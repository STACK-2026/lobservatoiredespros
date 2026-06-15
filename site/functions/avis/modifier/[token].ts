/**
 * CF Pages Function : GET /avis/modifier/<token>/
 *
 * Magic-link page letting a visitor edit their own already-submitted review.
 * The token (type "edition", signed HMAC-SHA256) carries the avis_id. We fetch
 * the current values and render the shared avis form, prefilled, posting to
 * /api/avis/modifier with the token in a hidden field.
 *
 * Token is the authentication : no email field, no Turnstile, no RGPD checkbox
 * (consent was already given on the original submission).
 */

import { verifyToken } from "../../_lib/token";
import { renderAvisForm } from "../../_lib/avisForm";

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXllYWtneGpnZGNmc3NydGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEwNTcsImV4cCI6MjA5MjUxNzA1N30.C7cw3T5Yj8W3LaYlLgWULlJlsP6iijxRKQvueA6WKOY";

interface Env {
  AVIS_TOKEN_SECRET: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  PUBLIC_SUPABASE_URL?: string;
}

const EDITABLE_STATUSES = [
  "publie",
  "en_attente_moderation",
  "en_attente_preavis_artisan",
];

function htmlShell(title: string, body: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - L'Observatoire des Pros</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:#F7F3EC;color:#1A1614;text-align:center;padding:5rem 1.75rem;max-width:44rem;margin:0 auto;line-height:1.6;-webkit-font-smoothing:antialiased}
@media(max-width:380px){body{padding:4rem 1.5rem}}
h1{font-family:Fraunces,serif;font-style:italic;font-size:2rem;margin:0 0 1rem;font-weight:500}
p{color:#403832;max-width:38rem;margin:.6rem auto}
a{color:#1E3A52}
.btn{display:inline-block;margin-top:1.25rem;padding:.8rem 1.4rem;background:#1A1614;color:#F7F3EC;border-radius:.5rem;text-decoration:none;font-size:.95rem;font-weight:500}
.btn:hover{background:#1E3A52}
</style>
</head>
<body>${body}</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const onRequestGet: PagesFunction<Env, "token"> = async (context) => {
  const token = String(context.params.token || "");
  if (!token || !context.env.AVIS_TOKEN_SECRET) {
    return htmlShell(
      "Lien invalide",
      `<h1>Lien invalide.</h1><p>Ce lien de modification n'est pas reconnu. Si vous souhaitez modifier votre avis, ecrivez-nous via <a href="/contact/">/contact/</a>.</p><p><a class="btn" href="/">Retour a l'accueil</a></p>`,
      400
    );
  }

  const payload = await verifyToken(token, context.env.AVIS_TOKEN_SECRET);
  if (!payload || payload.type !== "edition") {
    return htmlShell(
      "Lien invalide ou expire",
      `<h1>Lien invalide ou expire.</h1><p>Ce lien de modification n'est plus valable (validite 90 jours). Vous pouvez nous ecrire via <a href="/contact/">/contact/</a> pour en obtenir un nouveau.</p><p><a class="btn" href="/">Retour a l'accueil</a></p>`,
      400
    );
  }

  const supabaseUrl = context.env.SUPABASE_URL || context.env.PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const sbKey = context.env.SUPABASE_SERVICE_KEY || ANON;
  const sbHeaders = { apikey: sbKey, Authorization: `Bearer ${sbKey}` };

  const avisRes = await fetch(
    `${supabaseUrl}/rest/v1/pro_avis?id=eq.${encodeURIComponent(payload.avis_id)}&select=id,pseudo,verdict,texte,status,pros(slug,nom_entreprise,ville,code_postal)&limit=1`,
    { headers: sbHeaders }
  );

  if (!avisRes.ok) {
    return htmlShell(
      "Erreur technique",
      `<h1>Erreur technique.</h1><p>Impossible de charger votre avis pour le moment. Reessayez plus tard ou ecrivez-nous via <a href="/contact/">/contact/</a>.</p><p><a class="btn" href="/">Retour a l'accueil</a></p>`,
      502
    );
  }

  const rows = (await avisRes.json()) as Array<{
    id: string;
    pseudo: string;
    verdict: string;
    texte: string;
    status: string;
    pros: { slug: string; nom_entreprise: string; ville: string | null; code_postal: string | null } | null;
  }>;

  if (rows.length === 0) {
    return htmlShell(
      "Avis introuvable",
      `<h1>Avis introuvable.</h1><p>Cet avis n'existe plus dans nos systemes.</p><p><a class="btn" href="/">Retour a l'accueil</a></p>`,
      404
    );
  }

  const avis = rows[0];

  if (!EDITABLE_STATUSES.includes(avis.status)) {
    return htmlShell(
      "Avis non modifiable",
      `<h1>Avis non modifiable.</h1><p>Cet avis ne peut plus etre modifie (il a ete retire ou supprime). Pour toute demande, ecrivez-nous via <a href="/contact/">/contact/</a>.</p><p><a class="btn" href="/">Retour a l'accueil</a></p>`,
      409
    );
  }

  const nom = avis.pros?.nom_entreprise || "cette entreprise";
  const slug = avis.pros?.slug || "";

  const html = renderAvisForm({
    mode: "edit",
    slug,
    nom,
    ville: avis.pros?.ville || "",
    cp: avis.pros?.code_postal || "",
    actionUrl: "/api/avis/modifier",
    hiddenFields: { token },
    turnstileSiteKey: "",
    showEmail: false,
    showRgpd: false,
    eyebrow: "Modifier mon avis",
    heading: `Modifiez votre avis sur ${nom}.`,
    pageTitle: `Modifier mon avis sur ${nom}`,
    submitLabel: "Enregistrer mes modifications",
    introNote:
      "<p>Vous modifiez un avis deja enregistre. Apres enregistrement, votre texte repasse par notre charte avant d'etre remis en ligne. Votre pseudo et votre adresse email ne changent pas.</p>",
    values: { pseudo: avis.pseudo, verdict: avis.verdict, texte: avis.texte },
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
