# ROADMAP , L'Observatoire des Pros

16 recommandations priorisées issues de l'audit frontend-design (2026-04-23).
À faire dans l'ordre. Audit obligatoire à la fin de chaque étape.

---

## 🔴 P0 , critique, signature brand

### P0.1 Ticker éditorial live , fil presse live
- [ ] Component `EditorialTicker.astro` (marquee horizontal en haut de page, sous Header)
- [ ] Génère une séquence de 12-20 events à partir des pros Supabase
- [ ] Format : `[HH:MM] Observation n°XXX confirmée · [NOM] · [VILLE] · Score XX → YY`
- [ ] Animation `@keyframes ticker-scroll` (40s linear infinite)
- [ ] Pause au hover, reprise au leave
- [ ] Prefers-reduced-motion : désactivé
- [ ] Test mobile (scroll horizontal fluide, pas de débordement)

**Effet brand** : salle de rédaction, vivant, sérieux. Signature Bloomberg/Mediapart.

### P0.2 Verdict éditorial , punchline rédaction
- [ ] Component `EditorialVerdict.astro` (card avec guillemets français + signature)
- [ ] Intégré dans `/pro/[slug]/` juste sous H1, avant stats
- [ ] Pour les Portraits Recommandés gratuits : verdict généré depuis data (anciennete + certifs + signalement)
- [ ] Pour les Lauréats : verdict rédigé manuellement stocké en DB (nouveau champ `verdict_editorial TEXT`)
- [ ] Typo : Instrument Serif italique, 1.25rem, max 80 caractères
- [ ] Fond paper-warm, bord or gauche 3px

**Effet brand** : voix éditoriale assumée, style The Infatuation. Monétise le Portrait Lauréat.

### P0.3 "Ce que nous ne savons pas encore" , transparence journalistique
- [ ] Component `UnknownsCard.astro`
- [ ] Intégré dans `/pro/[slug]/` avant Sources
- [ ] Liste dynamique : avis clients absents → « Nous n'avons pas consulté les avis clients publics »
- [ ] Fond paper-warm, bord pointillé, icône `?` discrète
- [ ] Listing transparent, pas défensif

**Effet brand** : honneur du métier. Crée plus de confiance que masquer les trous.

### P0.4 Typo scale poussée
- [ ] H1 hero passer à `clamp(4rem, 11vw, 9rem)` (vs 8vw actuel)
- [ ] Meta-label tracking `0.24em` (vs 0.18em actuel)
- [ ] H2 garder mais réduire letter-spacing de 0.018 à 0.015
- [ ] Lead Instrument Serif italique à `clamp(1.3rem, 2vw, 1.55rem)`

**Effet brand** : plus d'autorité, plus éditorial, moins SaaS.

---

## 🟡 P1 , différenciation forte

### P1.5 Code couleur par métier
- [ ] CSS vars `--metier-plombier` à `--metier-isolation` (5 couleurs)
- [ ] Appliquer sur :
  - Fine bordure gauche 2px sur ProCard selon métier
  - Dot couleur sur InfoPill "Métier"
  - Accent des chiffres gros SummaryHero
  - Icon des tarifs v2 sur classement
- [ ] Test accessibilité (contraste AAA préservé)

### P1.6 "Dossiers ouverts · À suivre"
- [ ] Component `OpenDossiersCard.astro`
- [ ] Intégré dans classement entre Top 15 et suite
- [ ] Liste 3-5 dossiers en cours, mockés pour l'instant
- [ ] Format : « Certification RGE perdue à Sens (89) · dossier ouvert le 15 avril »
- [ ] Fond paper-warm + icône loupe

### P1.7 Pull quote charte éditoriale homepage
- [ ] Insérer `PullQuote` entre À la Une et Portrait
- [ ] Citations rotatives (5 variantes random au build)
- [ ] Ex : *« Un média n'a qu'une chose à vendre : sa crédibilité. »*
- [ ] Signature : « — Charte éditoriale, 2026 »

### P1.8 Cursor loupe sur GlossaireTerm
- [ ] Custom cursor SVG (loupe fine 20px)
- [ ] Apparaît uniquement au hover `.g-term`
- [ ] CSS `cursor: url(data:image/svg+xml,...), help;`
- [ ] Fallback cursor help sur navigateurs non-supportés

### P1.9 Badge vérifié : flash au remount
- [ ] Ajouter IntersectionObserver sur `.hero-verified`
- [ ] Au ré-entrée dans viewport après exit : replay animation pop
- [ ] Throttle : max 1x par 10s pour pas harceler

### P1.10 Mini-carte département sur fiche pro
- [ ] Component `MiniMap.astro`
- [ ] SVG isométrique simplifié du dépt (Paris 75, Côte-d'Or 21, Yonne 89)
- [ ] Point or animé sur la ville du pro
- [ ] Remplace le `{p.ville} ({deptCode})` dans stats portrait
- [ ] 120px × 80px, desktop only (mobile : texte seul)

---

## 🟢 P2 , polish

### P2.11 Stamps / tampons rédactionnels
- [ ] Component `EditorialStamp.astro`
- [ ] SVG rotation légère (-6 à 6deg random)
- [ ] Encre rouge cachet ou or
- [ ] Text : « VÉRIFIÉ · 12.04.2026 » ou « LAURÉAT 2026 »
- [ ] Overlay sur les Portraits Lauréat, position absolue

### P2.12 Ink-bleed wet ink
- [ ] Remplacer InkBleedDivider ornament par SVG mask animé
- [ ] Path SVG simulant goutte d'encre qui se propage
- [ ] `@keyframes wet-ink-drop` 2s ease-out au scroll-in

### P2.13 Speakable button
- [ ] Bouton « Écouter cette page » en haut des articles
- [ ] Web Speech API (SpeechSynthesisUtterance)
- [ ] Play/pause/stop icon controls
- [ ] Fallback : lien vers version podcast

### P2.14 Calendrier éditorial footer
- [ ] Section dans Footer : planning prochaines éditions
- [ ] Format : `N°1 avril (courante) · N°2 mai · N°3 juin · N°4 juillet`
- [ ] Indicateur visuel (point coloré) courant/à venir

### P2.15 Stats théâtraux homepage
- [ ] Upgrade stat-block-v2 avec « reel mécanique »
- [ ] Chaque chiffre tourne sur une flip-clock simulée au compteur
- [ ] CSS `transform: rotateX()` par digit
- [ ] Durée 1.8s avec bounce final

### P2.16 Édition papier téléchargeable
- [ ] Bouton discret « Télécharger l'édition 2026 en PDF »
- [ ] Génération PDF côté build (scripts/generate_pdf.py + weasyprint)
- [ ] Artefact physique = preuve sérieux

---

## 🔵 Data / Pipeline

### D1 , Scraping enrichissement (sans Google Places)
- [ ] Pipeline Pages Jaunes : scrape par ville/département
- [ ] Pipeline OpenStreetMap Overpass : coords + horaires
- [ ] Pipeline sites web : détection + scraping (mentions légales, email, téléphone)
- [ ] Détection de site web existant via recherche DuckDuckGo
- [ ] Stockage enrichissements dans table `pros_enrichissements`

### D2 , Massive import 14 combinaisons restantes
- [ ] Paris 75 × 5 métiers (plombier, électricien, couvreur, menuisier, isolation)
- [ ] Côte-d'Or 21 × 5 métiers
- [ ] Yonne 89 × 4 métiers restants (électricien, couvreur, menuisier, isolation)
- [ ] Volume estimé : ~12 000 pros
- [ ] Re-build Astro : peut faire 10 000+ pages

### D3 , Génération contenus Claude API
- [ ] Intro éditoriale unique par (métier × département)
- [ ] Guide tarifaire spécifique par zone
- [ ] FAQ contextualisée
- [ ] Stocker en cache `pages_content`

### D4 , Blog-auto Mistral+Claude-audit
- [ ] Reprendre pipeline `mistral_claude_blog_lib.py` du stack
- [ ] articles_plan.json 100 articles premier batch
- [ ] GH Actions cron + VPS runner self-hosted

### D5 , Retirer NOINDEX après data réelle
- [ ] Fiche pro : retirer noIndex une fois enrichissements en place
- [ ] Classement : retirer noIndex après QA visuel OK

---

## 🏁 Livraison

### L1 , Checklist 28 points STACK-2026
Voir `feedback_project_closure_workflow` dans memory.

### L2 , Ajouter au portfolio
- [ ] `~/stack-2026/augustinfoucheres/site/src/data/projects.ts`

### L3 , Resend forwarding
- [ ] `hello@send.lobservatoiredespros.com` → gmail augustin

### L4 , Vault sync + references memory
- [ ] Créer `reference_lobservatoiredespros_quick.md` dans memory vault

---

## Process : audit après chaque étape

Après chaque étape P0/P1/P2 :
1. Screenshot via `seo-visual` agent
2. Test SEO via `seo-technical` agent
3. Noter dans `docs/AUDIT_LOG.md` : date, étape, trouvailles, fix faits
4. Commit avec message `feat(p0.X): ...` ou `fix(p0.X): ...`
