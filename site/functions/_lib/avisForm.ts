/**
 * Shared renderer for the avis form (create + edit).
 *
 * Used by:
 *   - functions/pro/[[slug]]/donner-mon-avis.ts  (mode "create")
 *   - functions/avis/modifier/[token].ts          (mode "edit", prefilled)
 *
 * Keeping a single source of markup avoids drift between the two forms.
 */

export interface AvisFormOptions {
  mode: "create" | "edit";
  /** Pro slug, used for the "back to fiche" link. */
  slug: string;
  nom: string;
  ville: string;
  cp: string;
  /** Form POST target. */
  actionUrl: string;
  /** Hidden inputs (e.g. { pro_slug } or { token }). */
  hiddenFields: Record<string, string>;
  /** Turnstile site key ; empty string disables the widget. */
  turnstileSiteKey: string;
  /** Prefilled values (edit mode). */
  values?: { pseudo?: string; verdict?: string; texte?: string };
  showEmail: boolean;
  showRgpd: boolean;
  eyebrow: string;
  heading: string;
  /** <title> text ; defaults to heading. */
  pageTitle?: string;
  submitLabel: string;
  /** Optional HTML note shown above the charte (edit mode context). */
  introNote?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Brand rule : no em-dash or en-dash in user-facing content
function sanitizeDashes(s: string | null | undefined): string {
  if (!s) return s ?? "";
  return s.replace(/[—–]/g, "-");
}

export function renderAvisForm(opts: AvisFormOptions): string {
  const nom = sanitizeDashes(opts.nom);
  const ville = sanitizeDashes(opts.ville);
  const cp = opts.cp || "";
  const v = opts.values || {};
  const pseudoVal = escapeHtml(v.pseudo || "");
  const texteVal = escapeHtml(v.texte || "");
  const verdict = v.verdict || "";
  const turnstileSiteKey = opts.turnstileSiteKey || "";

  const ck = (val: string) => (verdict === val ? " checked" : "");

  const hidden = Object.entries(opts.hiddenFields)
    .map(([k, val]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(val)}">`)
    .join("\n    ");

  const emailField = opts.showEmail
    ? `
    <div class="field">
      <label for="email">Votre adresse email (verifiee, jamais affichee)</label>
      <input type="email" id="email" name="email" required maxlength="254" placeholder="vous@example.com" autocomplete="email">
      <span class="hint">Nous vous enverrons un lien de confirmation. L'email n'est jamais publie.</span>
    </div>
`
    : "";

  const rgpdField = opts.showRgpd
    ? `
    <div class="rgpd">
      <input type="checkbox" name="rgpd" id="rgpd" value="on" required>
      <label for="rgpd">J'accepte que mon avis soit publie sur L'Observatoire des Pros sous pseudo, et que mon email soit utilise pour verification et notification. Conservation 3 ans puis anonymisation automatique. <a href="/politique-confidentialite/">Politique de confidentialite</a>.</label>
    </div>
`
    : "";

  const introNote = opts.introNote
    ? `<div class="charte" style="border-left:3px solid var(--or)">${opts.introNote}</div>`
    : "";

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(opts.pageTitle || opts.heading)} - L'Observatoire des Pros</title>
<meta name="description" content="Partagez votre experience avec ${escapeHtml(nom)} de maniere verifiee et editoriale.">
<meta name="robots" content="noindex,follow">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,400;9..144,0,500;9..144,1,400;9..144,1,500;9..144,1,600&family=Inter:wght@400;500;600&display=swap">
<style>
:root{--paper:#F7F3EC;--paper-warm:#EEE6DC;--ink:#1A1614;--ink-soft:#403832;--ink-muted:#7A6F66;--observatoire:#1E3A52;--observatoire-deep:#0F2335;--or:#B8863D}
*{box-sizing:border-box}
html,body{margin:0}
body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:var(--paper);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased}
header.top{background:var(--paper-warm);padding:1.1rem clamp(1.75rem,5vw,2.5rem);border-bottom:1px solid rgba(26,22,20,.1)}
header.top .wrap{max-width:920px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
header.top a.logo{font-family:Fraunces,serif;font-style:italic;font-weight:600;color:var(--ink);text-decoration:none;font-size:1.05rem}
header.top a.back{font-size:.88rem;color:var(--ink-muted);text-decoration:none}
header.top a.back:hover{color:var(--observatoire)}
main{max-width:680px;margin:0 auto;padding:2.5rem clamp(1.75rem,5vw,2.5rem) 5rem}
@media(max-width:380px){header.top .wrap,main{padding-left:1.5rem;padding-right:1.5rem}}
.eyebrow{display:inline-block;font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;font-weight:600;color:var(--or);margin-bottom:.7rem}
h1{font-family:Fraunces,serif;font-size:clamp(1.7rem,4vw,2.4rem);font-style:italic;line-height:1.15;margin:0 0 .75rem;font-weight:500}
.pro-card{background:var(--paper-warm);border-left:3px solid var(--or);border-radius:0 .5rem .5rem 0;padding:.9rem 1.1rem;margin:1.25rem 0 1.75rem;font-size:.93rem}
.pro-card strong{color:var(--ink)}
.charte{background:#fff;border:1px solid rgba(26,22,20,.1);border-radius:.75rem;padding:1.4rem;margin:1.75rem 0;font-size:.91rem;color:var(--ink-soft)}
.charte h2{font-family:Fraunces,serif;font-style:italic;font-size:1.1rem;margin:0 0 .75rem;color:var(--ink)}
.charte ul{margin:.4rem 0;padding-left:1.15rem}
.charte li{margin:.3rem 0}
.charte a{color:var(--observatoire)}
.charte p{margin:.2rem 0}
form{display:flex;flex-direction:column;gap:1.2rem;margin-top:1.5rem}
.field{display:flex;flex-direction:column;gap:.3rem}
.field label{font-weight:500;font-size:.92rem;color:var(--ink)}
.field .hint{font-size:.82rem;color:var(--ink-muted)}
.field input[type="text"],
.field input[type="email"],
.field textarea{
  font-family:inherit;font-size:1rem;
  padding:.7rem .85rem;
  border:1px solid rgba(26,22,20,.18);
  border-radius:.45rem;
  background:#fff;color:var(--ink);
  transition:border-color .15s
}
.field input:focus,.field textarea:focus{outline:none;border-color:var(--observatoire)}
.field textarea{min-height:9rem;line-height:1.55;resize:vertical}
.counter{font-size:.78rem;color:var(--ink-muted);text-align:right;margin-top:.2rem}
.verdict-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.55rem}
.verdict-options label{
  display:flex;flex-direction:column;align-items:center;gap:.3rem;
  padding:.8rem;
  border:1px solid rgba(26,22,20,.15);
  border-radius:.5rem;
  background:#fff;cursor:pointer;text-align:center;
  transition:border-color .15s,background .15s;
  font-size:.9rem
}
.verdict-options label:has(input:checked){border-color:var(--observatoire);background:rgba(30,58,82,.04)}
.verdict-options input[type="radio"]{margin:0}
.verdict-options input[type="radio"]:checked+span{font-weight:600;color:var(--observatoire)}
.rgpd{display:flex;gap:.55rem;align-items:flex-start;font-size:.85rem;color:var(--ink-soft)}
.rgpd input{margin-top:.3rem;flex-shrink:0}
.rgpd a{color:var(--observatoire)}
/* Honeypot : visuellement absent, accessible aux bots */
.hp{position:absolute;left:-9999px;height:0;width:0;opacity:0;pointer-events:none}
button[type="submit"]{
  font-family:inherit;font-size:1rem;font-weight:500;
  padding:.9rem 1.5rem;
  background:var(--ink);color:var(--paper);
  border:none;border-radius:.5rem;
  cursor:pointer;align-self:flex-start;
  transition:background .15s
}
button[type="submit"]:hover{background:var(--observatoire)}
button[type="submit"]:active{transform:scale(.98)}
.cf-turnstile{margin:.2rem 0}
footer{margin-top:4rem;padding:1.75rem clamp(1.75rem,5vw,2.5rem);border-top:1px solid rgba(26,22,20,.1);font-size:.8rem;color:var(--ink-muted);text-align:center}
footer .links{display:flex;gap:1.1rem;justify-content:center;flex-wrap:wrap;margin-top:.4rem}
footer a{color:var(--ink-muted);text-decoration:none}
footer a:hover{color:var(--observatoire);text-decoration:underline}
</style>
</head>
<body>
<header class="top">
  <div class="wrap">
    <a class="logo" href="/">L'Observatoire des Pros</a>
    <a class="back" href="/pro/${escapeHtml(opts.slug)}/">&larr; Retour a la fiche</a>
  </div>
</header>

<main>
  <span class="eyebrow">${escapeHtml(opts.eyebrow)}</span>
  <h1>${escapeHtml(opts.heading)}</h1>

  <div class="pro-card">
    <strong>${escapeHtml(nom)}</strong>${ville ? ` &middot; ${escapeHtml(ville)}` : ""}${cp ? ` (${escapeHtml(cp)})` : ""}
  </div>

  ${introNote}

  <div class="charte">
    <h2>Charte des avis</h2>
    <ul>
      <li>Votre avis est <strong>anonyme cote public</strong> : seul votre pseudo apparait.</li>
      <li>Votre <strong>email est verifie</strong> par lien magique avant publication. Il reste confidentiel.</li>
      <li>Nous <strong>refusons les insultes et accusations penales</strong> non etayees. Un signalement entraine une moderation manuelle.</li>
      <li>Si l'artisan a un email connu, il dispose d'un <strong>droit de reponse public</strong>, avec un preavis de 48 heures pour les avis defavorables longs.</li>
      <li>Vos donnees (email, IP) sont anonymisees automatiquement apres 3 ans. Demande de suppression immediat via <a href="/contact/">/contact/</a>.</li>
    </ul>
  </div>

  <form method="POST" action="${escapeHtml(opts.actionUrl)}" enctype="application/x-www-form-urlencoded">
    ${hidden}
${emailField}
    <div class="field">
      <label for="pseudo">Pseudo public (2 a 30 caracteres)</label>
      <input type="text" id="pseudo" name="pseudo" required minlength="2" maxlength="30" placeholder="Votre pseudo affiche" autocomplete="nickname" value="${pseudoVal}">
    </div>

    <div class="field">
      <label>Recommandez-vous cette entreprise ?</label>
      <div class="verdict-options">
        <label><input type="radio" name="verdict" value="oui" required${ck("oui")}><span>Oui, je recommande</span></label>
        <label><input type="radio" name="verdict" value="mitige"${ck("mitige")}><span>Mitige</span></label>
        <label><input type="radio" name="verdict" value="non"${ck("non")}><span>Non, je deconseille</span></label>
      </div>
    </div>

    <div class="field">
      <label for="texte">Votre recit (100 a 5000 caracteres)</label>
      <textarea id="texte" name="texte" required minlength="100" maxlength="5000" placeholder="Decrivez votre experience de maniere factuelle...">${texteVal}</textarea>
      <div class="counter" id="counter" aria-live="polite">0 / 5000</div>
    </div>

    <!-- Honeypot : les bots remplissent ce champ, les humains ne le voient pas -->
    <div class="hp" aria-hidden="true">
      <label for="company">Ne pas remplir</label>
      <input type="text" id="company" name="company" tabindex="-1" autocomplete="off">
    </div>

    ${
      turnstileSiteKey
        ? `<div class="cf-turnstile" data-sitekey="${escapeHtml(turnstileSiteKey)}" data-theme="light"></div>`
        : ""
    }
${rgpdField}
    <button type="submit">${escapeHtml(opts.submitLabel)}</button>
  </form>
</main>

<footer>
  <p>L'Observatoire des Pros &middot; Media editorial independant &middot; Edition N&deg;1, 2026</p>
  <div class="links">
    <a href="/methode/">Methode</a>
    <a href="/contact/">Contact</a>
    <a href="/mentions-legales/">Mentions legales</a>
    <a href="/politique-confidentialite/">Confidentialite</a>
  </div>
</footer>

${turnstileSiteKey ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : ""}
<script>
(function () {
  var textarea = document.getElementById("texte");
  var counter = document.getElementById("counter");
  if (!textarea || !counter) return;
  function update() {
    var len = (textarea.value || "").length;
    counter.textContent = len + " / 5000";
    counter.style.color = len >= 4800 ? "#a82a2a" : len >= 100 ? "#4A5D3A" : "#7A6F66";
  }
  textarea.addEventListener("input", update);
  update();
})();
</script>
</body>
</html>`;

  return html;
}
