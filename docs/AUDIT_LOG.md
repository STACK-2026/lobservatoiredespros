# AUDIT LOG , L'Observatoire des Pros

Historique des audits après chaque grosse étape. Chronologique inverse.

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
