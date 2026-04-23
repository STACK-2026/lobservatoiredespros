# DESIGN , L'Observatoire des Pros

Source unique de vérité pour la direction artistique, les tokens, les composants.

---

## 1. Principes

1. **Média éditorial, pas SaaS.** Chaque élément trahit la posture de rédaction. Pas de wording corporate ("plateforme", "solution", "optimiser").
2. **Éditorial institutionnel + moderne.** Mix The Infatuation + Michelin + Mediapart + Linear (pour la lisseur moderne).
3. **Le papier est sacré.** Jamais de fond blanc pur. Toujours `--paper` (#F7F3EC).
4. **L'or est précieux.** Médailles, accents signature uniquement. Jamais en fond de bouton.
5. **Le bleu Observatoire est institutionnel.** Boutons primaires, liens, signature.
6. **Imperfection éditoriale.** Un média a des tâches, annotations, tampons. Pas tout impeccable.
7. **Signature `border-radius asymétrique`.** Coin top-right arrondi 22-36px = reconnaissance visuelle unique.
8. **Tutoiement lecteur, "nous" éditorial.** Les lecteurs sont tutoyés. La marque parle en "nous" (notre rédaction).
9. **Guillemets français partout.** « comme ça ». Jamais "comme ça".
10. **Accents français obligatoires.** UTF-8 direct, jamais \uXXXX. Pas de tiret cadratin (em/en dash).

---

## 2. Tokens (CSS custom properties)

```css
/* Papier et encre */
--paper:             #F7F3EC;   /* fond principal */
--paper-warm:        #EFE7D6;   /* variant chaud */
--paper-deep:        #E7DFCD;   /* variant foncé */
--ink:               #1A1614;   /* texte principal */
--ink-soft:          #3D342E;   /* texte secondaire */
--ink-muted:         #7A6E63;   /* meta */

/* Signature */
--observatoire:      #1E3A52;   /* bleu institutionnel */
--observatoire-deep: #0F2335;
--or:                #B8863D;   /* or prestige */
--or-soft:           #D4A55C;
--or-deep:           #8E6828;

/* Contextuels */
--cachet:            #8B2E2A;   /* rouge rare, urgent éditorial */
--archive:           #4A5D3A;   /* vert archives */

/* Code couleur par métier (P1.5, à implémenter) */
--metier-plombier:   #3D6B8C;   /* bleu eau */
--metier-electricien:#D4A017;   /* or électrique */
--metier-couvreur:   #8B4A3D;   /* terracotta */
--metier-menuisier:  #6B4A2E;   /* bois */
--metier-isolation:  #4A6E3A;   /* vert laine */
```

---

## 3. Typographie

```css
--font-display: "Instrument Serif", Georgia, "Times New Roman", serif;
--font-body:    "Inter", -apple-system, "Segoe UI", Roboto, sans-serif;
--font-mono:    "JetBrains Mono", "SF Mono", ui-monospace, monospace;
```

**Pourquoi Instrument Serif ?** Serif moderne, lisse, ball terminals, feel Vercel/Linear 2025. Remplace Fraunces jugé trop classique.

### Scale

```css
.heading-hero    { clamp(4rem, 11vw, 9rem);    line-height: 0.96; letter-spacing: -0.03em; }
.heading-display { clamp(2.5rem, 5vw, 4.5rem); line-height: 1.02; letter-spacing: -0.028em; }
h2               { clamp(1.75rem, 3.2vw, 2.5rem); line-height: 1.15; }
h3               { clamp(1.35rem, 2.3vw, 1.75rem); line-height: 1.2; }
.lead / .chapo   { clamp(1.2rem, 1.8vw, 1.45rem); italic Instrument Serif; }
body             { 1.0625rem; line-height: 1.65; }
.meta-label      { 0.75rem; letter-spacing: 0.24em; text-transform: uppercase; }
.folio           { 0.78rem; JetBrains Mono; letter-spacing: 0.02em; }
```

**Règle d'or** : les meta-label en petites caps avec tracking **0.24em** (augmenter de 0.18em actuel) pour plus d'autorité éditoriale.

---

## 4. Composants signature

### Obligatoires (déjà codés)
- **Seal.astro** , sceau rotatif avec ring text + étoile 8 branches
- **Masthead.astro** , en-tête éditorial fin (ligne + meta + numéro édition)
- **ByLine.astro** , signature rédactionnelle (auteur, date, temps lecture)
- **DropCap.astro** , lettrine animée en début de paragraphe
- **PullQuote.astro** , citation extraite avec guillemets français
- **RankNumber.astro** , numéro de classement géant
- **CounterLive.astro** , compteur qui incrémente lentement
- **Medaille.astro** , médaille Or/Argent/Rédaction
- **EditorialHeader.astro** , header de section (ligne + dot + category + title + subtitle)
- **MethodologyBlock.astro** , encart méthodologie avec 6 critères
- **TelescopeWatermark.astro** , filigrane télescope XIXe
- **InkBleedDivider.astro** , divider signature (hairline, ornament, compass)
- **ProCard.astro v3** , carte pro border-radius asymétrique + pills horizontales + score circle mini
- **SummaryHero.astro** , bannière résumé avec constellation animée
- **InfoPill.astro** , pill moderne avec dot coloré + label + tooltip glossaire
- **ScoreCircle.astro** , cercle progress ring animé au scroll
- **SourceBadge.astro** , card source officielle avec icon
- **GlossaireTerm.astro** , terme inline avec tooltip dark + lien glossaire

### À coder (cf ROADMAP.md)
- **EditorialTicker.astro** (P0.1) , fil presse live qui défile
- **EditorialVerdict.astro** (P0.2) , verdict rédaction en 1 phrase
- **UnknownsCard.astro** (P0.3) , "ce que nous ne savons pas encore"
- **FranceMap.astro** (P0.4) , carte départements couverts
- **EditorialStamp.astro** (P2) , tampon encré rotation
- **MiniMap.astro** (P1.10) , mini-carte département isométrique
- **EditorialCursor.astro** (P1.8) , custom cursor loupe sur glossaire

---

## 5. Layout et grille

- **Containers** : `container-editorial` (72rem), `container-prose` (42rem), `container-wide` (84rem)
- **Padding latéral** : `clamp(1.25rem, 5vw, 5rem)` (respire sur desktop)
- **Max-width texte lisible** : 65 caractères (38rem)
- **Gouttière** : 1.5rem mobile, 2.5rem desktop

---

## 6. Animations

- **Scroll reveal** : `.fade-up`, `.blur-reveal`, `.scale-reveal`, `.slide-left`, `.slide-right`, `.stagger-children`, `.split-words`
- **Safety fallback** : `@keyframes safety-reveal` force visible après 2.5s
- **Prefers-reduced-motion** : opacity:1 transform:none !important
- **Seal rotation** : 26s linear infinite
- **Constellation twinkle** : 3.5s ease-in-out infinite par point
- **Scroll progress bar** : 2px or en haut de page
- **Card tilt 3D** : max 4° desktop only
- **Magnetic buttons** : 0.28 strength

### Durées standard
- Micro-interactions : 200-400ms
- Page reveals : 600-1200ms
- Easing : `cubic-bezier(0.22, 1, 0.36, 1)` (out-expo) pour arrivées, `cubic-bezier(0.76, 0, 0.24, 1)` (in-out) pour sorties

---

## 7. Patterns SEO / GEO visuels

- **Encart speakable** : `<aside data-speakable>` avec `<strong>` sur mot-clé, 50-90 mots, avant premier élément interactif
- **JSON-LD** injecté UNE SEULE FOIS par page (niveau BaseLayout)
- **Schema.org types utilisés** : NewsMediaOrganization, WebSite, Article, BreadcrumbList, FAQPage, HowTo, LocalBusiness, ItemList (ranking), DefinedTermSet (glossaire)
- **TL;DR data-speakable** obligatoire sur pages piliers

---

## 8. Breakpoints

```css
/* Mobile first , target iPhone 13 Pro et petit */
Small    : < 540px  ,  grid-1col, hero vertical, pills wrap
Medium   : 540-860  ,  grid-2col sur certains blocs
Large    : 860-1100 ,  grid-3col possible
XL       : > 1100   ,  full grid, sidebars
```

---

## 9. Anti-patterns à éviter

- ❌ Fond blanc pur (`#FFFFFF`)
- ❌ Texte noir pur (`#000000`)
- ❌ Inter sur titres (trop générique)
- ❌ Gradient violet/mauve (cliché IA)
- ❌ Émojis (tuent l'autorité éditoriale)
- ❌ Tiret cadratin em/en dash (— ou –)
- ❌ Buzzwords corporate ("plateforme", "solution", "optimiser")
- ❌ Border-radius 8px partout (générique)
- ❌ Shadows harshes style Material
- ❌ Animations qui bloquent l'interaction
