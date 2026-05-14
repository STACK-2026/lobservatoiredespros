/**
 * CF Pages Function : GET /r/<token>/
 *
 * Magic link page for artisans to act on an avis:
 * - Preview the avis (pseudo, verdict, texte, pro info)
 * - Form 1: Publish or update a public response (POST /api/r/<token>/repondre)
 * - Form 2: Flag the avis (POST /api/r/<token>/signaler)
 * - Form 3: Request deletion (POST /api/r/<token>/demander-suppression)
 * - Form 4: Renew access link (POST /api/r/<token>/renouveler)
 *
 * Uses internal fetch to /api/r/<token> rather than Supabase directly,
 * keeping token verification logic in a single place.
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  AVIS_TOKEN_SECRET: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlShell(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)} - L'Observatoire des Pros</title><meta name="robots" content="noindex"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><style>:root{--paper:#F7F3EC;--paper-warm:#EEE6DC;--ink:#1A1614;--ink-soft:#403832;--ink-muted:#7A6F66;--observatoire:#1E3A52;--or:#B8863D;--alert:#A82A2A;--vert:#1A7A3C}*{box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:var(--paper);color:var(--ink);margin:0;line-height:1.6;-webkit-font-smoothing:antialiased}header.top{background:var(--paper-warm);padding:1.2rem clamp(1.75rem,5vw,2.5rem);border-bottom:1px solid rgba(26,22,20,.08)}header.top a.logo{font-family:Fraunces,serif;font-style:italic;font-weight:600;color:var(--ink);text-decoration:none;font-size:1.1rem}main{max-width:720px;margin:0 auto;padding:2.5rem clamp(1.75rem,5vw,2.5rem) 5rem}@media(max-width:380px){header.top,main{padding-left:1.25rem;padding-right:1.25rem}}h1{font-family:Fraunces,serif;font-style:italic;font-size:clamp(1.6rem,3.5vw,2.2rem);line-height:1.2;margin:0 0 1rem;font-weight:500}h2{font-family:Fraunces,serif;font-style:italic;font-size:1.3rem;margin:2.5rem 0 1rem;font-weight:500}.eyebrow{display:inline-block;font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;font-weight:600;color:var(--or);margin-bottom:.7rem}.pill{display:inline-block;font-size:.78rem;font-weight:500;padding:.25rem .7rem;border-radius:.35rem;background:#fff;border:1px solid rgba(26,22,20,.12);color:var(--ink-soft)}.pill.oui{border-color:var(--vert);color:var(--vert);background:rgba(26,122,60,.06)}.pill.non{border-color:var(--alert);color:var(--alert);background:rgba(168,42,42,.06)}.pill.mitige{border-color:var(--or);color:var(--or);background:rgba(184,134,61,.08)}.avis-card{background:#fff;border:1px solid rgba(26,22,20,.08);border-radius:.75rem;padding:1.5rem;margin:1.5rem 0}.avis-meta{font-size:.85rem;color:var(--ink-muted);margin-bottom:.7rem;display:flex;gap:1rem;flex-wrap:wrap}.avis-texte{white-space:pre-wrap;color:var(--ink-soft);line-height:1.65}.response-existing{background:var(--paper-warm);border-left:3px solid var(--or);border-radius:0 .5rem .5rem 0;padding:1rem 1.25rem;margin:1rem 0;font-size:.95rem}.response-existing h3{font-family:Fraunces,serif;font-style:italic;font-size:1.05rem;margin:0 0 .5rem;color:var(--ink)}.form-block{background:#fff;border:1px solid rgba(26,22,20,.08);border-radius:.75rem;padding:1.5rem;margin:1.5rem 0}.form-block h3{font-family:Fraunces,serif;font-style:italic;font-size:1.2rem;margin:0 0 .5rem;color:var(--ink)}.form-block .hint{font-size:.85rem;color:var(--ink-muted);margin-bottom:1rem}textarea{font-family:inherit;font-size:1rem;width:100%;padding:.7rem .85rem;border:1px solid rgba(26,22,20,.18);border-radius:.45rem;background:#fff;color:var(--ink);min-height:7rem;line-height:1.55;resize:vertical}textarea:focus{outline:none;border-color:var(--observatoire)}.counter{font-size:.78rem;color:var(--ink-muted);text-align:right;margin-top:.2rem}button{font-family:inherit;font-size:.95rem;font-weight:500;padding:.7rem 1.3rem;border-radius:.45rem;cursor:pointer;border:none;transition:background .15s}button.primary{background:var(--ink);color:var(--paper)}button.primary:hover{background:var(--observatoire)}button.warn{background:#fff;color:var(--alert);border:1px solid var(--alert)}button.warn:hover{background:rgba(168,42,42,.08)}button.muted{background:#fff;color:var(--ink-soft);border:1px solid rgba(26,22,20,.18)}button.muted:hover{background:var(--paper-warm)}.notice{background:var(--paper-warm);border-radius:.5rem;padding:1rem 1.25rem;margin:1rem 0;font-size:.92rem;color:var(--ink-soft)}.notice.success{background:rgba(26,122,60,.08);border-left:3px solid var(--vert)}.actions-secondary{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem}.expires{font-size:.82rem;color:var(--ink-muted);margin-top:2rem;padding:1rem;background:var(--paper-warm);border-radius:.5rem}.expires button{margin-top:.5rem}</style></head><body><header class="top"><a class="logo" href="/">L'Observatoire des Pros</a></header><main>${body}</main></body></html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function verdictLabel(v: string): string {
  if (v === "oui") return "Recommande";
  if (v === "non") return "Deconseille";
  return "Mitige";
}

export const onRequestGet: PagesFunction<Env, "token"> = async (context) => {
  const token = String(context.params.token || "");
  if (!token) {
    return htmlShell(
      "Lien invalide",
      `<h1>Lien invalide</h1><p>Le token est manquant.</p><p><a href="/">Retour a l'accueil</a></p>`,
      400
    );
  }

  const url = new URL(context.request.url);
  const successParam = url.searchParams.get("success");

  // Fetch via internal API to keep token verification in one place
  const apiUrl = new URL(
    `/api/r/${encodeURIComponent(token)}`,
    url.origin
  ).toString();

  let apiRes: Response;
  try {
    apiRes = await fetch(apiUrl, {
      headers: { "User-Agent": "lobservatoire-r-page/1.0" },
    });
  } catch {
    return htmlShell(
      "Erreur technique",
      `<h1>Erreur technique</h1><p>Notre systeme n'a pas pu charger les details de cet avis. Reessayez dans quelques instants.</p>`,
      500
    );
  }

  if (!apiRes.ok) {
    if (apiRes.status === 403) {
      return htmlShell(
        "Lien expire",
        `<h1>Lien expire ou invalide.</h1>
<p>Ce lien n'est plus valide. Si vous avez besoin d'un nouvel acces, demandez un renouvellement ci-dessous.</p>
<form method="POST" action="/api/r/${encodeURIComponent(token)}/renouveler" style="margin-top:1.2rem">
  <button type="submit" class="primary">Demander un nouveau lien</button>
</form>
<p style="margin-top:1.5rem"><a href="/">Retour a l'accueil</a></p>`,
        403
      );
    }
    if (apiRes.status === 404) {
      return htmlShell(
        "Avis introuvable",
        `<h1>Avis introuvable</h1>
<p>Cet avis n'existe plus dans nos systemes.</p>
<p><a href="/">Retour a l'accueil</a></p>`,
        404
      );
    }
    return htmlShell(
      "Erreur technique",
      `<h1>Erreur technique</h1>
<p>Notre systeme n'a pas pu charger les details de cet avis. Reessayez dans quelques instants ou contactez-nous via <a href="/contact/">/contact/</a>.</p>`,
      500
    );
  }

  type ApiData = {
    ok: boolean;
    avis: {
      id: string;
      pseudo: string;
      verdict: "oui" | "non" | "mitige";
      texte: string;
      status: string;
      created_at: string;
      published_at: string | null;
      pros: { slug: string; nom_entreprise: string; ville: string | null } | null;
      pro_avis_responses: Array<{
        texte: string;
        version: number;
        created_at: string;
        updated_at: string;
      }>;
    };
    token_type: "preavis" | "reponse";
    expires_at: string;
  };

  let data: ApiData;
  try {
    data = (await apiRes.json()) as ApiData;
  } catch {
    return htmlShell(
      "Erreur technique",
      `<h1>Erreur technique</h1><p>Reponse API invalide.</p>`,
      500
    );
  }

  if (!data.ok) {
    return htmlShell(
      "Erreur",
      `<h1>Erreur</h1><p>Reponse API invalide.</p>`,
      500
    );
  }

  const avis = data.avis;
  const existingResponse = (avis.pro_avis_responses || [])[0] ?? null;
  const proNom = avis.pros?.nom_entreprise || "votre entreprise";
  const proSlug = avis.pros?.slug || "";

  // Post-action success notices
  let successHtml = "";
  if (successParam === "repondu") {
    successHtml = `<div class="notice success">Votre reponse a ete publiee. Le visiteur a recu une notification.</div>`;
  } else if (successParam === "signale") {
    successHtml = `<div class="notice success">L'avis a ete signale a notre redaction. Vous serez informe de la decision.</div>`;
  } else if (successParam === "suppression-demandee") {
    successHtml = `<div class="notice success">Votre demande de suppression a ete transmise a notre redaction.</div>`;
  } else if (successParam === "renouvele") {
    successHtml = `<div class="notice success">Un nouveau lien d'acces vous a ete envoye par email.</div>`;
  }

  const expiresDate = new Date(data.expires_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const isPreavis =
    data.token_type === "preavis" &&
    avis.status === "en_attente_preavis_artisan";

  const introHtml = isPreavis
    ? `<span class="eyebrow">Preavis 48 heures</span>
<h1>Un avis sur votre fiche sera publie sous 48 heures.</h1>
<p>Vous disposez d'un droit de reponse public. Preparez votre reponse maintenant pour qu'elle soit publiee en meme temps que l'avis.</p>`
    : `<span class="eyebrow">Votre droit de reponse</span>
<h1>Un avis a ete publie sur la fiche de ${escapeHtml(proNom)}.</h1>
<p>Vous pouvez repondre publiquement a cet avis, le signaler a notre redaction, ou demander sa suppression argumentee.</p>`;

  const dateAvis = new Date(avis.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Response form: edit existing or create new
  const responseFormHtml = existingResponse
    ? `<div class="response-existing">
  <h3>Votre reponse actuelle (version ${existingResponse.version})</h3>
  <div style="white-space:pre-wrap;color:var(--ink-soft)">${escapeHtml(existingResponse.texte)}</div>
</div>
<div class="form-block">
  <h3>Modifier ma reponse</h3>
  <p class="hint">La nouvelle version remplacera l'ancienne. Un historique interne est conserve.</p>
  <form id="form-edit" method="POST" action="/api/r/${encodeURIComponent(token)}/repondre">
    <textarea name="texte" id="ta-edit" required minlength="50" maxlength="2000">${escapeHtml(existingResponse.texte)}</textarea>
    <div class="counter" id="counter-edit">${existingResponse.texte.length} / 2000</div>
    <button type="submit" class="primary" style="margin-top:.8rem">Mettre a jour ma reponse</button>
  </form>
</div>`
    : `<div class="form-block">
  <h3>Publier ma reponse</h3>
  <p class="hint">Votre reponse apparaitra sous l'avis sur la fiche pro, signee de votre entreprise. Minimum 50 caracteres, maximum 2000.</p>
  <form id="form-new" method="POST" action="/api/r/${encodeURIComponent(token)}/repondre">
    <textarea name="texte" id="ta-new" required minlength="50" maxlength="2000" placeholder="Votre reponse publique..."></textarea>
    <div class="counter" id="counter-new">0 / 2000</div>
    <button type="submit" class="primary" style="margin-top:.8rem">Publier ma reponse</button>
  </form>
</div>`;

  const body = `
${successHtml}
${introHtml}

<h2>L'avis en question</h2>
<div class="avis-card">
  <div class="avis-meta">
    <span><strong>${escapeHtml(avis.pseudo)}</strong></span>
    <span>${dateAvis}</span>
    <span class="pill ${escapeHtml(avis.verdict)}">${verdictLabel(avis.verdict)}</span>
  </div>
  <div class="avis-texte">${escapeHtml(avis.texte)}</div>
</div>

<h2>Votre action</h2>
${responseFormHtml}

<div class="actions-secondary">
  <form method="POST" action="/api/r/${encodeURIComponent(token)}/signaler" onsubmit="return confirm('Confirmer le signalement de cet avis a notre redaction ?');" style="display:inline">
    <button type="submit" class="warn">Signaler cet avis</button>
  </form>
  <form method="POST" action="/api/r/${encodeURIComponent(token)}/demander-suppression" onsubmit="return confirm('Confirmer la demande de suppression ? L\\'avis passera en moderation manuelle.');" style="display:inline">
    <button type="submit" class="muted">Demander la suppression</button>
  </form>
</div>

<div class="expires">
  <strong>Validite du lien</strong> : jusqu'au ${expiresDate}. Au-dela, demandez un renouvellement.
  <br>
  <form method="POST" action="/api/r/${encodeURIComponent(token)}/renouveler" style="display:inline">
    <button type="submit" class="muted" style="margin-top:.5rem">Renouveler le lien d'acces</button>
  </form>
</div>

<script>
(function () {
  var taEdit = document.getElementById('ta-edit');
  var cEdit = document.getElementById('counter-edit');
  if (taEdit && cEdit) {
    taEdit.addEventListener('input', function () { cEdit.textContent = taEdit.value.length + ' / 2000'; });
  }
  var taNew = document.getElementById('ta-new');
  var cNew = document.getElementById('counter-new');
  if (taNew && cNew) {
    taNew.addEventListener('input', function () { cNew.textContent = taNew.value.length + ' / 2000'; });
  }
}());
</script>
`;

  const pageTitle = `Votre droit de reponse - ${proNom}`;
  return htmlShell(pageTitle, body);
};
