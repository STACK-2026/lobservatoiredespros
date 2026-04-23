# Roadmap , L'Observatoire des Pros

**État au 2026-04-24** : Édition N°1 LIVE · Yonne · 290 pros · prêt pour indexation GSC.

**Objectif final** : **déploiement national complet** , 96 départements × 15+ métiers BTP/services à domicile, ~100 000 pros, monétisation Vérifié/Lauréat, reconnaissance média de référence.

**Principe** : **zéro appel Claude API** côté génération. Rédaction humaine en session, data via APIs publiques gratuites.

---

## ✅ Phase 1 , Édition N°1 Yonne , LIVRÉE

- [x] Infra (DNS, GitHub, Supabase, CF Pages, Resend)
- [x] Design system éditorial moderne (Fraunces + Geist, palette paper/ink/or)
- [x] 18 composants signature
- [x] Import Sirene 290 plombiers Yonne via DuckDB parquet
- [x] Enrichissement ADEME RGE (actuel + historique)
- [x] Enrichissement Recherche Entreprises (dirigeants, catégorie, effectif)
- [x] Sync BODACC 290/290 pros (310+ événements)
- [x] Géocoding 290/290 via API Adresse data.gouv.fr
- [x] Trust Score v2 calculé (253 bronze · 32 argent · 5 or)
- [x] Carte Leaflet mini fiche pro + ClassementMap multi-markers
- [x] 3 articles observations rédigés direct (enquête + méthodologie + portrait)
- [x] 3 pages auteurs E-E-A-T (JSON-LD Person)
- [x] JSON-LD complet (NewsArticle + LocalBusiness + FAQPage + Speakable)
- [x] Sitemap + ai-sitemap strict sitemaps.org
- [x] llms.txt v2 (Trust Score + articles + auteurs)
- [x] Robots.txt 34 user-agents (14 AI + 7 search + blacklist SEO)
- [x] IndexNow + clé déposée
- [x] GH Actions deploy + rebuild-guard + digest daily
- [x] Portfolio augustinfoucheres ajouté catégorie Media

---

## 🔴 Phase 2 , Extension nationale géographique (priorité haute)

**Objectif** : 96 départements × 5 métiers = ~480 classements nationaux, ~50 000 pros.

### 2.1 Import massif Sirene
- [ ] Adapter `scripts/import_sirene.py` pour itérer tous les départements FR
- [ ] Batch département par département (timeout safe)
- [ ] Cible ~50 000 pros importés

### 2.2 Sync national
- [ ] `geocode_pros.py --only-missing` sur nouveaux pros
- [ ] `enrich_entreprise.py --only-missing`
- [ ] `sync_bodacc.py --only-missing`
- [ ] `sync_rge_qualifications.py` pour RGE
- [ ] Budget ~15h de sync

### 2.3 Zones + métiers en DB
- [ ] Ajouter 96 départements FR dans `zones`
- [ ] Ajouter 10 métiers complémentaires (chauffagiste, plaquiste, carreleur, peintre, serrurier, maçon, jardinier, climaticien, cuisiniste, parqueteur)
- [ ] **Cible : 1440 classements**

### 2.4 Guides tarifaires par métier
- [ ] Data `tarifsMetier` : 4 prestations × 15 métiers = 60 entrées
- [ ] Sources : France Rénov', ADEME, études sectorielles publiques

---

## 🟡 Phase 3 , Contenu éditorial national

### 3.1 Articles département
- [ ] 1 article "État du marché BTP [dept]" par département (500-800 mots)
- [ ] Template standardisé, data auto Supabase
- [ ] Cible 20 articles en 3 mois

### 3.2 Articles transversaux
- [ ] "5 départements qui certifient le plus RGE"
- [ ] "Procédures collectives BTP , où se concentrent-elles ?"
- [ ] "Le secteur BTP en France , radiographie data publique"
- [ ] "Pourquoi Qualibat compte plus que Pages Jaunes"

### 3.3 Extension catégories observations
- [ ] Dossiers, Guide pratique, Entretiens (1 article min par cat)

### 3.4 Pages auteurs enrichies
- [ ] Photo ou illustration signature
- [ ] Articles signés auto-générés depuis `observations.ts`

---

## 🟢 Phase 4 , Monétisation

### 4.1 Formules abonnement
- [ ] Portrait Recommandé : gratuit (actuel)
- [ ] Portrait Vérifié 29€/mois : photos, description longue, site web
- [ ] Portrait Lauréat 89€/mois : médaille or, portrait long format, entretien

### 4.2 Stripe
- [ ] Stripe Connect créé
- [ ] Products : Vérifié + Lauréat (mensuel + annuel)
- [ ] Checkout + webhook upgrade DB
- [ ] Portail client

### 4.3 Dashboard pro
- [ ] Auth magic link Resend sur `/pro/dashboard/`
- [ ] Upload décennale + RC pro + Kbis
- [ ] Photos réalisations (6 Vérifié / 15 Lauréat)
- [ ] Descriptif soumis validation rédaction
- [ ] Stats visites + CTR contact
- [ ] Statut abonnement Stripe

### 4.4 Admin interne rédaction
- [ ] Auth `/admin/` magic link + whitelist
- [ ] File candidatures en attente
- [ ] Workflow : examen → entretien → vérif terrain → publication
- [ ] Éditeur portrait Lauréat
- [ ] Override manuel Trust Score (audit trail log)

### 4.5 Signalements
- [ ] Formulaire `/signaler/` public
- [ ] Table `pro_signalements` + statut
- [ ] SLA 7j + email Resend auto

---

## 🔵 Phase 5 , Prospection B2B acquisition

**Cible** : 1-4% des 50 000 pros → 500-2000 abonnés.

### 5.1 Enrichissement contacts (bloqué Places)
- [ ] **Google Places API activation** (action user GCP)
- [ ] Sync rating + reviews + tel + site web pour 50 000 pros
- [ ] Script `sync_places.py`

### 5.2 Pipeline prospection Resend
- [ ] 4 touches (T1/T2+7j/T3+14j/T4+21j) signature "Léa"
- [ ] Cible pros argent/or (meilleure conversion)
- [ ] Dedup + unsubscribed.json

### 5.3 Emails transactionnels
- [ ] Candidature reçue / validée / refusée
- [ ] Renouvellement J-15, J-5
- [ ] Fiche mise à jour (changement RGE, BODACC)

### 5.4 Newsletter particuliers
- [ ] Signup `/newsletter/` → Resend Audience (CF Pages Function)
- [ ] Envoi mensuel : article + Top 3 Lauréats + chiffre du mois
- [ ] Template HTML brand

---

## 🟣 Phase 6 , SEO avancé + GEO domination

### 6.1 Rich snippets avancés
- [ ] Schema `AggregateRating` sur classements
- [ ] `ItemList` enrichi (ranked + count + reviewedBy)
- [ ] `Review` quand avis Places sync
- [ ] `Event` pour éditions
- [ ] `Claim` pour vérifications fraude RGE

### 6.2 OG images dynamiques (satori+resvg)
- [ ] 1 PNG 1200×630 par fiche pro (nom + score + niveau)
- [ ] 1 PNG par article (titre + auteur + tag)
- [ ] 1 PNG par classement (Top 3 + département)
- [ ] Build-time

### 6.3 Core Web Vitals
- [ ] Audit Lighthouse régulier
- [ ] Target LCP <2.5s, INP <200ms, CLS <0.1
- [ ] Critical CSS inline, lazy images, preload fonts

### 6.4 Related content + next/prev
- [ ] Pros similaires sur fiche pro (3, même métier/département/score)
- [ ] Articles liés sur observations (3, même cat/auteur)
- [ ] Précédent/Suivant chronologique
- [ ] Table of contents pour articles > 1500 mots

### 6.5 Indexation agressive
- [ ] Auto-trigger IndexNow après sync BODACC mensuel
- [ ] Ping Bing Webmaster URLs modifiées
- [ ] Ping Google via GSC API (OAuth)
- [ ] RSS complet avec `<content:encoded>`

### 6.6 GEO AI visibility
- [ ] Monitoring mentions ChatGPT/Claude/Perplexity
- [ ] Page `/citations/` mentions externes
- [ ] Optimiser speakable avec faits vérifiables

---

## 🟠 Phase 7 , Marque et presse

### 7.1 Communication lancement national
- [ ] Press kit `/presse/` (logo, photos équipe, chiffres)
- [ ] Communiqués par lancement départemental groupé
- [ ] Cible : journalistes économie locale
- [ ] Positionnement "Michelin du BTP"

### 7.2 Partenariats
- [ ] CAPEB (Confédération Artisanat PME BTP)
- [ ] FFB (Fédération Française du Bâtiment)
- [ ] Qualibat endorsement

### 7.3 SEO brand
- [ ] "l'observatoire des pros" position 1 Google
- [ ] Knowledge panel Google
- [ ] Wikipedia quand notoriété critique

---

## 🔘 Phase 8 , Scale extensions verticales

**Une fois national BTP couvert**.

### 8.1 Services à domicile
- [ ] Jardinage, paysagisme
- [ ] Ménage, repassage
- [ ] Aide à la personne (RGPD renforcé)
- [ ] Informatique dépannage

### 8.2 Autres secteurs
- [ ] Auto/moto (mécaniciens, carrossiers)

### 8.3 International
- [ ] Belgique FR + Luxembourg
- [ ] Québec (partenariat)
- [ ] Suisse romande

---

## ✅ Checklist technique globale à vérifier régulièrement

- [ ] Build vert (`npm run build`)
- [ ] Sitemap à jour avec lastmod dynamique
- [ ] Accents 100% corrects (**⚠️ script `fix_accents.py` DANGEREUX , ne pas rejouer aveuglément, casse JS identifiers**)
- [ ] 0 lien cassé (audit curl grep)
- [ ] JSON-LD validé (Rich Results Test Google)
- [ ] robots.txt à jour nouveaux user-agents IA
- [ ] llms.txt aligné contenu actuel
- [ ] Security headers Cloudflare (HSTS, CSP)
- [ ] Sync BODACC mensuel après ajout pros

---

## 📞 Interventions user requises

- [ ] **Activer Google Places API** sur console.cloud.google.com (GCP project `3729498435`)
- [ ] **Re-soumettre sitemap-index.xml dans GSC** (après correction ai-sitemap)
- [ ] **Créer compte Stripe** + Products quand Phase 4
- [ ] **Valider positioning** Vérifié/Lauréat (prix, limites)
- [ ] **Fournir logo haute def** pour press kit Phase 7

---

## 📚 Docs `/docs/`

- `SESSION_STATE.md` , état actuel au millimètre
- `ROADMAP.md` , ce fichier
- `AUDIT_LOG.md` , historique audits
- `BRAND.md` , charte éditoriale
- `DATA.md` , schéma Supabase + pipelines
- `DESIGN.md` , DA + tokens + composants

---

<details>
<summary>📜 Historique , recommandations audit frontend P0/P1/P2 (2026-04-23)</summary>

16 recommandations priorisées issues de l'audit frontend-design.
**Tous livrés.** Détail historique :

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

</details>

