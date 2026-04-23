# L'Observatoire des Pros , notes Claude Code

## Contexte

Media editorial francais qui classe les artisans et entreprises du BTP et des services a domicile. Pattern STACK-2026, lance 2026-04-23.

## Quick refs

- **Domaine** : lobservatoiredespros.com (Cloudflare zone `06f85688f28bfa18e8b643ac3c4122e3`, registrar Cloudflare)
- **Repo** : `STACK-2026/lobservatoiredespros`
- **Preview** : `https://lobservatoiredespros.pages.dev`
- **Supabase** : `apuyeakgxjgdcfssrtek` (KARMASTRO org, region eu-west-3 Paris)
- **Resend domaine** : `send.lobservatoiredespros.com` (id `00a3fe8d-80cd-45d6-be82-02b59d987a3b`)
- **IndexNow key** : `a3f8d2c4b9e14f76a55e1c0b2d7e8f31`

## DA (direction artistique)

- **Palette papier/encre/or** : paper `#F7F3EC`, ink `#1A1614`, observatoire `#1E3A52`, or `#B8863D`, cachet `#8B2E2A`, archive `#4A5D3A`
- **Typo** : Fraunces (display) + Instrument Sans (body) + JetBrains Mono (folio/meta) , Google Fonts v1
- **Palette gestuelle** : Sceau rotation lente 26s, compteur live avec pulse or, ink bleed transitions, drop caps animees, numeros de classement sticky, corner curl cards, cursor glow, magnetic buttons, split words reveal
- **Ton** : media editorial institutionnel (Michelin/Que Choisir/Mediapart). « Notre redaction », « nos inspecteurs », numero d'edition sur chaque page, guillemets francais « », jamais d'emoji, jamais de tiret cadratin

## Distinctions monetisees

1. **Portrait Recommande** , gratuit, automatique pour les actifs Sirene retenus (Score de Confiance)
2. **Portrait Verifie** , 29€/mo, medaille Argent, dossier enrichi
3. **Portrait Laureat** , 89€/mo, medaille Or, portrait long format + entretien + verification terrain

## Methodologie Score /10

1. Anciennete Sirene (3 pts)
2. RGE / Qualibat (2 pts)
3. Avis publics > 4/5 (2 pts)
4. SIRET actif (1 pt)
5. Site web pro (1 pt)
6. Photos realisations (1 pt)

## Etat au 2026-04-23 , session 1

- Phase 0 complete (domaine + repo + supabase + CF Pages + resend + DNS)
- 53 pages Astro buildees (Homepage riche 11 sections, Methode long format, A propos, Candidater avec 3 offres, Redaction, Observations, Archives, Contact, Newsletter, Glossaire 15 termes, Outils 1 live, Selection, Metiers, Departements, 3 legal pages, 15 classement NOINDEX, 15 fiches pro NOINDEX, 5 metier national NOINDEX)
- Migration Supabase appliquee (12 tables + RLS + seed metiers + zones pilotes)
- Seed data mock en `site/src/data/seed-pros.ts` (15 pros illustratifs) , REMPLACER par scrape Sirene reel avant de retirer les NOINDEX

## PROCHAINES ETAPES CRITIQUES

### Avant tout push en prod reel des classements

1. **Pipeline Sirene** , API `recherche-entreprises.api.gouv.fr` validee (252 plombiers NAF 43.22A / CP 89*). Aucune cle requise.
2. **Enrichissement Places API Google** , budget ~$17 pour ~500 pros avec 2 calls chacun
3. **Import RGE** , annuaire telechargeable sur data.gouv.fr
4. **Scraping Qualibat** , site qualibat.com par SIRET (pas d'API publique)
5. **Calcul score reel** dans scripts/compute_score.py puis INSERT Supabase
6. **Read Supabase depuis Astro** , remplacer `seed-pros.ts` par lecture build-time via `@supabase/supabase-js`
7. **Retirer NOINDEX** sur pages dynamiques une fois les donnees reelles en place

### Pipelines operationnels a construire

- Blog-auto Mistral+Claude-audit dans `blog-auto/`
- Cron GitHub Actions runner VPS
- Rebuild-guard daily workflow
- Cold mailing Lea via Resend (apres premiers rankings GSC)

## Regles heritees

- TOUJOURS `git push origin main` , le repo est public STACK-2026 (pas de second remote)
- Accents UTF-8 direct
- Jamais de tiret cadratin
- Univers brand partout (sceau, papier, or, folio)
- JSON-LD UNE FOIS par page (dans BaseLayout)
- Homepage riche >=10 sections
- Tutoiement partout sauf legal
- Pattern STACK-2026 : cookie banner CNIL, analytics Supabase, favicon SVG anime, 404 branche, robots AI-friendly, llms.txt, sitemap

## Actions manuelles residuelles

- Configurer CF Pages pour builder depuis `site/` (ou laisser le workflow GH Actions deployer)
- Ajouter GitHub Actions secrets si pipeline CI pousse vers CF
- Resend : creer la redirection `redaction@lobservatoiredespros.com` vers gmail augustin.foucheres@
- Le bloc GH Pages / workflows de deploy peut etre genere depuis template-blog-auto pattern
