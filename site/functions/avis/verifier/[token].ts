/**
 * CF Pages Function : GET /avis/verifier/<token>/
 *
 * Result page shown AFTER the API at /api/avis/verifier/<token> has already
 * processed the token and redirected here. This page is purely presentational:
 * it reads the current avis status from Supabase and shows the appropriate
 * outcome message.
 *
 * Special sentinel tokens (invalide, expire, erreur) are handled inline
 * without a DB lookup to avoid unnecessary roundtrips.
 */

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXllYWtneGpnZGNmc3NydGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEwNTcsImV4cCI6MjA5MjUxNzA1N30.C7cw3T5Yj8W3LaYlLgWULlJlsP6iijxRKQvueA6WKOY";

const SB_HEADERS = { apikey: ANON, Authorization: `Bearer ${ANON}` };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlShell(title: string, body: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} - L'Observatoire des Pros</title>
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
.status-icon{font-size:2.5rem;margin-bottom:1rem;display:block}
</style>
</head>
<body>
${body}
</body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const onRequestGet: PagesFunction<Record<string, unknown>, "token"> = async (context) => {
  const token = String(context.params.token || "");

  // Sentinel tokens set by api/avis/verifier/[token].ts on error paths
  if (token === "invalide") {
    return htmlShell(
      "Lien invalide",
      `<span class="status-icon" aria-hidden="true">?</span>
<h1>Lien invalide.</h1>
<p>Ce lien n'est pas reconnu. Soumettez a nouveau votre avis depuis la fiche du pro concerne.</p>
<p><a class="btn" href="/">Retour a l'accueil</a></p>`,
      400
    );
  }

  if (token === "expire") {
    return htmlShell(
      "Lien expire",
      `<span class="status-icon" aria-hidden="true">!</span>
<h1>Lien expire.</h1>
<p>Ce lien de confirmation a expire (validite 48 heures). Vous pouvez soumettre a nouveau votre avis depuis la fiche du pro concerne.</p>
<p><a class="btn" href="/">Retour a l'accueil</a></p>`
    );
  }

  if (token === "erreur") {
    return htmlShell(
      "Erreur technique",
      `<span class="status-icon" aria-hidden="true">!</span>
<h1>Erreur technique.</h1>
<p>Notre systeme n'a pas pu traiter votre confirmation. Reessayez plus tard ou ecrivez-nous via <a href="/contact/">/contact/</a>.</p>
<p><a class="btn" href="/">Retour a l'accueil</a></p>`,
      500
    );
  }

  // Real UUID token : look up the avis to display outcome
  let rows: Array<{
    status: string;
    pros: { slug: string; nom_entreprise: string } | null;
  }> = [];

  try {
    const avisRes = await fetch(
      `${SUPABASE_URL}/rest/v1/pro_avis?email_verification_token=eq.${encodeURIComponent(token)}&select=status,pros(slug,nom_entreprise)&limit=1`,
      { headers: SB_HEADERS }
    );
    if (avisRes.ok) {
      rows = (await avisRes.json()) as typeof rows;
    }
  } catch {
    // Fall through to generic error
  }

  if (rows.length === 0) {
    return htmlShell(
      "Lien introuvable",
      `<span class="status-icon" aria-hidden="true">?</span>
<h1>Lien introuvable.</h1>
<p>Ce token n'est associe a aucun avis. Le lien a peut-etre deja ete utilise ou a expire.</p>
<p><a class="btn" href="/">Retour a l'accueil</a></p>`,
      404
    );
  }

  const avis = rows[0];
  const proSlug = avis.pros?.slug || "";
  const proNom = avis.pros?.nom_entreprise || "l'entreprise";
  const proUrl = proSlug ? `/pro/${encodeURIComponent(proSlug)}/` : "/";

  if (avis.status === "publie") {
    return htmlShell(
      "Votre avis est publie",
      `<span class="status-icon" aria-hidden="true">*</span>
<h1>Votre avis est publie.</h1>
<p>Merci pour votre contribution. Votre avis sur <strong>${escapeHtml(proNom)}</strong> est desormais visible publiquement.</p>
<p><a class="btn" href="${escapeHtml(proUrl)}">Voir la fiche</a></p>`
    );
  }

  if (avis.status === "en_attente_preavis_artisan") {
    return htmlShell(
      "Avis verifie",
      `<span class="status-icon" aria-hidden="true">*</span>
<h1>Avis verifie.</h1>
<p>Votre avis sur <strong>${escapeHtml(proNom)}</strong> est confirme. L'artisan dispose de 48 heures pour preparer son droit de reponse avant publication automatique.</p>
<p>Vous recevrez une notification par email quand votre avis sera en ligne.</p>
<p><a class="btn" href="${escapeHtml(proUrl)}">Voir la fiche</a></p>`
    );
  }

  if (avis.status === "en_attente_moderation") {
    return htmlShell(
      "Avis transmis a la redaction",
      `<span class="status-icon" aria-hidden="true">*</span>
<h1>Avis transmis a la redaction.</h1>
<p>Votre avis sur <strong>${escapeHtml(proNom)}</strong> est confirme et a ete envoye a notre redaction pour examen. Nous vous tiendrons informe par email sous 48 heures.</p>
<p><a class="btn" href="${escapeHtml(proUrl)}">Voir la fiche</a></p>`
    );
  }

  // Fallback for unexpected status
  return htmlShell(
    "Avis enregistre",
    `<span class="status-icon" aria-hidden="true">*</span>
<h1>Avis enregistre.</h1>
<p>Votre avis sur <strong>${escapeHtml(proNom)}</strong> est dans nos systemes et sera traite sous peu.</p>
<p><a class="btn" href="${escapeHtml(proUrl)}">Voir la fiche</a></p>`
  );
};
