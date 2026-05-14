/**
 * CF Pages Function : GET /pro/<slug>/avis-soumis/
 *
 * Post-submit landing page shown after a successful form submission.
 * The /api/avis/submit handler redirects here (303) after inserting the
 * avis row and sending the confirmation email.
 *
 * Explains the 48h email verification window to the user.
 * noindex : transient page, no SEO value.
 */

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  // pathname: /pro/<slug>/avis-soumis  (trailing slash stripped by CF)
  const pathParts = url.pathname.replace(/\/$/, "").split("/");
  // ["", "pro", "<slug>", "avis-soumis"]
  const slug = pathParts[2] || "";

  const backHref = slug
    ? `/pro/${encodeURIComponent(slug)}/`
    : "/";

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Avis soumis - L'Observatoire des Pros</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:#F7F3EC;color:#1A1614;text-align:center;padding:5rem 1.75rem;max-width:44rem;margin:0 auto;line-height:1.6;-webkit-font-smoothing:antialiased}
@media(max-width:380px){body{padding:4rem 1.5rem}}
h1{font-family:Fraunces,serif;font-style:italic;font-size:2rem;margin:0 0 1rem;font-weight:500}
p{color:#403832;max-width:38rem;margin:.6rem auto}
a{color:#1E3A52}
.btn{display:inline-block;margin-top:1.25rem;padding:.8rem 1.4rem;background:#1A1614;color:#F7F3EC;border-radius:.5rem;text-decoration:none;font-size:.95rem;font-weight:500;transition:background .15s}
.btn:hover{background:#1E3A52}
.steps{text-align:left;background:#fff;border:1px solid rgba(26,22,20,.1);border-radius:.75rem;padding:1.25rem 1.5rem;max-width:30rem;margin:1.75rem auto 0;font-size:.9rem;color:#403832}
.steps ol{margin:.5rem 0;padding-left:1.3rem}
.steps li{margin:.4rem 0}
.steps li strong{color:#1A1614}
</style>
</head>
<body>
<h1>Verifiez votre email.</h1>
<p>Nous venons de vous envoyer un lien de confirmation. Cliquez dessus dans les <strong>48 heures</strong> pour publier votre avis.</p>
<p>Si vous ne recevez rien dans 5 minutes, verifiez votre dossier spam.</p>

<div class="steps">
  <ol>
    <li><strong>Email recu</strong> - Verifiez votre boite de reception</li>
    <li><strong>Cliquer le lien</strong> - Valide votre identite en un clic</li>
    <li><strong>Publication</strong> - Votre avis apparait sur la fiche sous 24h</li>
  </ol>
</div>

<p><a class="btn" href="${backHref}">Retour a la fiche</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
