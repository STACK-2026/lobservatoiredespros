# L'Observatoire des Pros

> Le guide de reference des professionnels francais.
> Media editorial independant qui observe, verifie et classe les artisans et entreprises du BTP et des services a domicile.

**Domaine** : [lobservatoiredespros.com](https://lobservatoiredespros.com)
**Edition N°1** : Avril 2026
**Preview** : https://lobservatoiredespros.pages.dev

## Stack

- **Framework** : Astro 6 (SSG)
- **Styling** : Tailwind CSS 4 + CSS custom properties (design system papier/encre/or)
- **Fonts** : Fraunces + Instrument Sans + JetBrains Mono
- **DB** : Supabase `apuyeakgxjgdcfssrtek` (eu-west-3 Paris)
- **Deploy** : Cloudflare Pages
- **Email** : Resend `send.lobservatoiredespros.com`

## Structure

```
site/                      , Astro SSG (53 pages buildees)
├── site.config.ts         , identite + seed editorial
├── src/
│   ├── components/        , 14 composants signature (Seal, Masthead, DropCap, PullQuote, CounterLive...)
│   ├── data/              , seed-pros.ts (MOCK), glossaire.ts
│   ├── layouts/BaseLayout.astro
│   ├── pages/             , pages statiques + dynamiques [metier]/[dept]/
│   ├── styles/global.css
│   └── utils/seo.ts
├── public/
└── package.json

scripts/                   , pipelines Python (scraping, enrichissement)
supabase/migrations/       , schema SQL applique
.github/workflows/         , deploy CF Pages + rebuild-guard
```

## Scripts

```bash
cd site
npm install
npm run dev       # dev local :4321
npm run build     # build SSG
```

## Etat

### Phase 0 , Infrastructure , fait
- Domaine Cloudflare zone active
- Repo `STACK-2026/lobservatoiredespros`
- Supabase + migration 12 tables + RLS
- CF Pages + DNS apex+www
- Resend domaine + DKIM+SPF+MX

### Phase 1 , Site editorial , fait
- Design system complet
- 53 pages buildees
- Homepage 11 sections
- Pages legitimite (methode, a-propos, candidater, redaction, archives)
- Pages outils (glossaire 15 termes, outils + grille-devis live)
- Legal (mentions, confidentialite, cgu)
- Operationnel (contact, newsletter, observations)
- Templates dynamiques NOINDEX (seed mock)
- SEO technique complet (sitemap, rss, robots AI-friendly, llms.txt, IndexNow)

### Phase 2 , Donnees reelles , en cours
Pipeline de scraping documente dans `scripts/README.md`. API validee : `recherche-entreprises.api.gouv.fr`. Enrichissements : ADEME RGE, geo.api.gouv.fr, Google Places.

### Phase 3 , Blog-auto Mistral+Claude-audit , a faire
### Phase 4 , Monetisation Stripe + cold mailing , a faire

## Regles STACK-2026

Tutoiement, accents UTF-8, pas de tiret cadratin, univers brand partout, JSON-LD une fois par page, homepage >=10 sections. Voir `CLAUDE.md` pour la liste complete.

## Contact

- Redaction : redaction@lobservatoiredespros.com
- Candidatures : candidature@lobservatoiredespros.com
- Repo : https://github.com/STACK-2026/lobservatoiredespros
