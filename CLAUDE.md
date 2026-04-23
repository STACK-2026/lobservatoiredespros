# L'Observatoire des Pros , notes Claude Code

## Context ultra-court

Média éditorial français qui classe les artisans et entreprises du BTP et services à domicile. Pattern STACK-2026, lancé 2026-04-23. Domaine : **lobservatoiredespros.com** (LIVE).

## 📚 Documentation projet

Toutes les règles, décisions, et roadmap sont dans `docs/` :

- **[DESIGN.md](docs/DESIGN.md)** , DA complète : tokens, typo, composants, layout, animations, anti-patterns
- **[BRAND.md](docs/BRAND.md)** , voix éditoriale, vocabulaire, ton, positionnement, signature conceptuelle
- **[ROADMAP.md](docs/ROADMAP.md)** , 16 recommandations priorisées P0/P1/P2 issues de l'audit frontend-design, + data pipelines D1-D5
- **[DATA.md](docs/DATA.md)** , schéma Supabase 12 tables, méthode Score de Confiance, pipeline Sirene, enrichissements
- **[AUDIT_LOG.md](docs/AUDIT_LOG.md)** , historique des audits après chaque étape

**Règle** : à la fin de chaque grosse étape, auditer (seo-visual + seo-technical) et logger dans AUDIT_LOG.md.

---

## Quick refs infra

- **Domaine** : `lobservatoiredespros.com` (Cloudflare zone `06f85688f28bfa18e8b643ac3c4122e3`)
- **Preview** : `lobservatoiredespros.pages.dev`
- **Repo** : `STACK-2026/lobservatoiredespros`
- **Supabase** : `apuyeakgxjgdcfssrtek` (eu-west-3 Paris, KARMASTRO org)
- **Resend domain** : `send.lobservatoiredespros.com` (id `00a3fe8d-80cd-45d6-be82-02b59d987a3b`)
- **IndexNow key** : `a3f8d2c4b9e14f76a55e1c0b2d7e8f31`

---

## Deploy

```bash
# Automatique via GH Actions (push main)
git push origin main

# Manuel via wrangler
cd site
npm run build
npx wrangler pages deploy dist --project-name=lobservatoiredespros --branch=main
```

---

## Commandes courantes

```bash
# Import Sirene (1 combinaison)
python3 scripts/import_sirene.py --metier plombier --dept 89 --insert

# Import Sirene (15 combinaisons pilote)
python3 scripts/import_sirene.py --all-pilots --insert

# Cleanup slugs (retire digits suffix)
python3 scripts/cleanup_slugs.py --commit

# Build local
cd site && npm run build

# Dev local
cd site && npm run dev
```

---

## Règles critiques (héritées STACK-2026)

- **Tutoiement** lecteur, "nous" éditorial
- **Accents UTF-8** direct, jamais `\uXXXX`
- **Jamais de tiret cadratin** (em — ou en –). Remplacer par virgule ou tiret simple
- **Univers brand partout** (404, cookie banner, emails, OG)
- **JSON-LD UNE FOIS** par page (niveau BaseLayout)
- **Homepage riche >= 10 sections** (11 actuellement)
- **Favicon SVG brandé** (OdP monogramme animé)
- **Robots whitelist AI bots** (GPTBot, ClaudeBot, PerplexityBot, Google-Extended)
- **Analytics tracker custom Supabase** (pas GA/Plausible)
- **Rebuild-guard daily** (workflow)
- **Heures publication random 7h-9h FR** (à implémenter sur blog-auto)
- **Repo nom = domain sans TLD** → `lobservatoiredespros`

---

## État actuel (2026-04-23 16:30)

### ✅ Fait
- Phase 0 complète (infra, repo, DNS, Supabase, Resend, CF Pages)
- Site Astro SSG , 329 pages buildées (home + legal + piliers + 290 fiches pros Yonne + 15 classements dynamiques)
- Design system complet (palette, typo Instrument Serif, 18 composants signature)
- 290 plombiers Yonne scrapés INSEE et insérés Supabase avec vrais noms
- Slugs propres (`robert-tetard-auxerre`, plus de digits)
- Fiche pro v3 (ScoreCircle, pills, certifs actives, timeline, CTA doré)
- Classement v3 (SummaryHero centré, Top 15 avant intro, guide tarifaire cards)
- Homepage v2 (badge vérifié Meta/TikTok, hero pills, stats v2, pro CTA v2)
- Cleanup slugs (290 mis à jour via 2-pass PATCH)

### 🔴 En cours (P0 de la ROADMAP)
1. **P0.1 Ticker éditorial live** (signature salle de rédaction)
2. **P0.2 Verdict éditorial 1 phrase** sur fiche pro
3. **P0.3 "Ce que nous ne savons pas encore"** transparence
4. **P0.4 Typo scale poussée** (H1 +25%, tracking meta +25%)

### ⏸ Backlog important
- **D1** Pipeline enrichissement (Pages Jaunes, OSM, site web , sans Google Places)
- **D2** Import massive 14 combinaisons restantes (Paris, Côte-d'Or + Yonne reste)
- **P1/P2** 12 recommandations polish (cf ROADMAP.md)
- **L1-L4** Livraison STACK-2026 (28 points checklist, portfolio, vault memory)

---

## Scripts disponibles

| Script | Usage |
|---|---|
| `scripts/import_sirene.py` | Import pros INSEE via DuckDB + parquet |
| `scripts/enrich_rge.py` | Enrichissement RGE via API ADEME |
| `scripts/cleanup_slugs.py` | Retire suffixe digits des slugs |
| `scripts/test_recherche_entreprises.py` | Test API recherche-entreprises (rate limited) |

---

## Pages live

### Publiques (INDEXÉES)
- `/` (home éditoriale)
- `/methode/` (méthodologie)
- `/a-propos/`, `/redaction/`, `/archives/`
- `/candidater/`, `/newsletter/`, `/contact/`
- `/glossaire/` (15 termes), `/outils/`, `/outils/grille-devis/`
- `/metiers/`, `/departements/`, `/observations/`
- `/mentions-legales/`, `/politique-confidentialite/`, `/cgu/`

### Dynamiques Supabase
- `/plombier/yonne-89/` (290 pros)
- `/pro/[slug]/` (290 fiches pros)

### NOINDEX (pour l'instant)
- `/[metier]/[departement]/` (pas encore toutes les combinaisons remplies)
- `/pro/[slug]/` (en attendant enrichissements complets)
- `/selection/`, `/[metier]/` (pas assez de data)

---

## Actions manuelles restantes (backlog)

1. Connecter CF Pages project à GH repo (OAuth dashboard) pour auto-deploy sans wrangler manual
2. Zone-level redirect rule www → apex (nécessite token CF avec scope `rulesets`)
3. Activer security headers sur custom domain (CF cache les strip sur apex, pas sur preview URL)
4. Submit sitemap dans GSC
5. IndexNow ping post-publication
