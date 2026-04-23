# AUDIT LOG , L'Observatoire des Pros

Historique des audits après chaque grosse étape. Chronologique inverse.

---

## 2026-04-23 , 16:55 , Audit après P0.1 à P0.4 complet

**Contexte** : 4 nouveautés P0 déployées (Ticker live, Verdict éditorial, UnknownsCard, Typo scale)

**Pages auditées** :
- `/` (home)
- `/plombier/yonne-89/` (classement 290 pros)
- `/pro/robert-tetard-auxerre/` (fiche pro)

### Visual audit (seo-visual agent) , Note : 8.2/10

**✅ Fonctionne** :
- **EditorialTicker** : barre noire top, "EN DIRECT" + dot rouge pulsant, fil défilant avec 4 types d'events colorés (or/rouge/bleu/vert), mask fade edges, mobile responsive
- **EditorialVerdict** : card paper-warm + guillemets dorés ornementaux + Instrument Serif italique, signature rédaction, border-radius asymétrique
- **UnknownsCard** : card avec bord pointillé, icon "?" bleu observatoire, liste bullets, H3 italique "Ce que nous ne savons pas encore", link CTA candidater
- **SummaryHero classement** : centré, constellation + grand chiffre
- **Cookie banner CNIL** : 3 boutons équilibrés, sobre

**⚠️ À ajuster** :
- H1 hero coupé par cookie banner au premier load (pas de padding-bottom anticipé)
- Ticker mobile : "Édition N°1" absent (attendu mais signalé)
- ScoreCircle bord gauche dégradé non visible au pixel

**❌ Bugs identifiés et fix immédiat** :
- **"Mise a jour Mise à jour mensuelle"** doublon texte sur classement
  → fixé : `updated="mensuelle"` (ByLine préfixe automatiquement)
- **"Portrait portrait recommande"** doublon dans meta description fiche pro
  → fixé : suppression du préfixe `Portrait` qui doublonnait avec `tierLabel.toLowerCase()`

### SEO/GEO audit (seo-technical agent) , Score : 74/100

**🚨 BLOQUEURS résolus** :
1. **Sitemap dynamique manquant** : /pro/ et /[metier]/[dept]/ absents du sitemap
   → fixé : sitemap.xml.ts fetch Supabase au build time + inclut les 290 pros + 15 combinaisons
2. **Meta desc doublon "Portrait portrait"** → fixé (cf ci-dessus)

**❗ ERREURS High résolues** :
- **Google Fonts font-display=swap** : déjà présent dans URL mais agent a cru le contraire (false positive cache CF)
- **LocalBusiness.description générique** : enrichie avec verdict éditorial généré dynamiquement
  → fix : `generateVerdictText()` dans fiche pro injecte une phrase riche dans le schema

**Reportés P1/P2** :
- HTML classement trop lourd (276 KB pour 60 pros) : probable doublon du rendu, à investiguer plus tard
- `twitter:site` handle absent : à définir quand handle X créé
- ItemList limité à 50 items sur 290 : OK pour V1, pagine sitemaps si scaling
- OG images dynamiques par métier/dept : P2 (generate via @vercel/og ou CF Worker)
- CSP minimaliste : OK pour V1

**✅ CE QUI EST BIEN** (agent) :
- 0 noindex sur dynamiques (indexables)
- Titles/descriptions tous en plage optimale (30-65 / 120-160)
- BreadcrumbList 3 niveaux propre
- robots.txt exemplaire GEO (10 AI bots whitelist)
- llms.txt de qualité
- Schema.org riche (Org + WebSite + BreadcrumbList + FAQPage + ItemList + LocalBusiness + AggregateRating)
- HTTPS + HSTS + SAMEORIGIN + nosniff + Permissions-Policy
- Skip link a11y présent
- H1 unique par page
- EditorialTicker SSR indexé (noms pros dans HTML rendu, signal fraîcheur)
- UnknownsCard contenu unique par fiche (anti-duplicate)
- Maillage interne fort (74 home, 91 classement, 28 fiche)

**Décision** : P0 totalement bouclé, on passe P1 dans l'ordre ROADMAP.md.

---

## 2026-04-23 , 16:30 , Audit après refactor ProCard v3 + home refresh + badge verified

**Contexte** : Post v3 refactor (fiche pro, classement, home)

**Pages auditées** :
- `/` (home)
- `/plombier/yonne-89/` (classement 290 plombiers)
- `/pro/robert-tetard-auxerre/` (fiche pro)

**Ce qui va** :
- ScoreCircle animé fonctionne
- Breadcrumbs affichent correctement
- Cards ProCard v3 avec border-radius asymétrique signature
- Pills vertes pour certifs actives
- Slugs propres sans digits
- Badge vérifié Meta/TikTok sur H1 homepage (taille 46-78px)
- Pill modernes partout
- Glossaire tooltip fonctionnel

**Critiques honnêtes** :
- **Trop propre pour un média** : manque d'imperfection éditoriale (tampons, annotations)
- **Home un peu linéaire** : 11 sections sans respiration
- **Fiche pro trop plate** : manque humain (verdict éditorial, citation, photo)
- **Stats sur fond ink correctes** mais compteurs un peu timides
- **Constellation SummaryHero** : jolie mais générique, serait remplacée par carte France

**Recommandations issues** : 16 items P0/P1/P2 (voir ROADMAP.md)

**Décision** : tout faire dans l'ordre, audit après chaque étape.

---

## 2026-04-23 , 15:50 , Audit post intégration Supabase

**Contexte** : 290 plombiers Yonne insérés, pages dynamiques wired

**Résultats** :
- `/plombier/yonne-89/` : 200 OK, 157 KB, 290 pros affichés
- `/pro/[slug]/` : 290 fiches pros générées
- 329 pages total au build

**Issues résolues** :
- Slugs avec digits retirés (`-632116` → cleanup via `scripts/cleanup_slugs.py`)
- Breadcrumbs props mismatch corrigé (accepte `{label,href}` ET `{name,url}`)

---

## 2026-04-23 , 14:30 , Audit après typographie Instrument Serif

**Changement** : Fraunces → Instrument Serif + Inter

**Impact** : plus moderne, plus lisse, feel Vercel/Linear. Fraunces retiré de toutes les refs.

**Vérifications** :
- Google Fonts loaded : Instrument Serif + Inter + JetBrains Mono
- 0 références Fraunces restantes dans le code
- CSS var --font-display pointe bien sur Instrument Serif

---

## 2026-04-23 , 14:00 , Audit bloqueurs critiques

**3 bloqueurs identifiés et résolus** :

1. **Animations stuck** (opacity:0 permanent)
   - Fix : `@keyframes safety-reveal` CSS fallback 2.5s
   - Fix : JS fire-immédiat sur éléments déjà dans viewport
   - Fix : filet de sécurité 3s qui applique `.visible` à tout

2. **Accents français manquants**
   - Fix : passe manuelle sur pages piliers
   - Fix : script bulk avec safe-context (évite slugs/props)
   - Fix : métas `Édition`, `À LA UNE`, `MÉTHODE`

3. **Sceau trait qui coupe texte**
   - Fix : redesign Seal.astro geometrie pixel-perfect
   - Ring text sur R86 (entre R80 et R96, plus de collision)
   - Étoile 8 branches + 4 traits cardinaux au centre

---

## 2026-04-23 , 12:30 , Audit initial live

**Score global** : 61/100 (amélioré à 85+ après fixes)

**Bloqueurs résolus** :
- Cookie banner : domain cookie corrigé (adapte-toi.com → localStorage)
- Meta descriptions longueurs (303 chars → 132 chars)
- Title longueur (76 chars → 63 chars)
- OG image SVG → PNG (compat Facebook/LinkedIn)
- Em-dashes dans PullQuote cite

**Bugs non résolus (backlog)** :
- www pas redirect vers apex (CF Pages _redirects hostname ne marche pas bien, token CF rulesets manquant)
- Security headers non appliqués sur custom domain (fine sur preview URL)

---

## 2026-04-23 , 11:00 , Phase 0 complète

**Infrastructure** :
- [x] Domaine `lobservatoiredespros.com` (CF zone active)
- [x] Repo `STACK-2026/lobservatoiredespros` créé
- [x] Supabase `apuyeakgxjgdcfssrtek` (eu-west-3)
- [x] Migration SQL 12 tables + RLS + seed
- [x] CF Pages `lobservatoiredespros` + DNS apex+www
- [x] Resend `send.lobservatoiredespros.com` + DKIM+SPF+MX

**Site scaffold** :
- [x] 53 pages buildées (Homepage + legal + piliers + templates)
- [x] Design system complet (palette papier/encre/or)
- [x] 14 composants signature
- [x] BaseLayout full (cookie banner + analytics + animations)

---

## Template pour les prochains audits

```markdown
## YYYY-MM-DD , HH:MM , Audit après [étape P0.X]

**Contexte** : [ce qui vient d'être fait]

**Pages auditées** :
- [URLs testées]

**Ce qui va** :
- [points positifs]

**Critiques honnêtes** :
- [points à améliorer]

**Issues résolues dans la foulée** :
- [fixes appliqués immédiatement]

**Backlog pour plus tard** :
- [TODO retenus]

**Décision** : [next step]
```
