/**
 * CF Pages Function : GET /avis/merci/
 *
 * Silent-accept redirect target for honeypot-caught submissions.
 * Provides a plausible "thank you" response without revealing bot detection.
 * noindex to prevent SEO indexing.
 */

export const onRequestGet: PagesFunction = async () => {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Merci - L'Observatoire des Pros</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:#F7F3EC;color:#1A1614;text-align:center;padding:5rem 1.75rem;max-width:36rem;margin:0 auto;line-height:1.6;-webkit-font-smoothing:antialiased}
h1{font-family:Fraunces,serif;font-style:italic;font-size:2rem;margin:0 0 1rem;font-weight:500}
p{color:#403832}
a{color:#1E3A52}
.btn{display:inline-block;margin-top:1.25rem;padding:.8rem 1.4rem;background:#1A1614;color:#F7F3EC;border-radius:.5rem;text-decoration:none;font-size:.95rem;font-weight:500}
.btn:hover{background:#1E3A52}
</style>
</head>
<body>
<h1>Merci.</h1>
<p>Votre message a ete recu. Si une verification d'email est necessaire, vous recevrez un lien dans les prochaines minutes.</p>
<p><a class="btn" href="/">Retour a l'accueil</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
