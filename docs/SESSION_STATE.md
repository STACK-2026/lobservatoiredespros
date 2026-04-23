# État actuel , L'Observatoire des Pros

**Dernière mise à jour** : 2026-04-24 00:00
**Statut** : Site LIVE · prêt pour indexation GSC · pré-extension nationale

---

## 🌐 Infrastructure

| Ressource | Valeur | Notes |
|---|---|---|
| **Domaine** | `lobservatoiredespros.com` | apex + www via CF Pages |
| **CF Zone** | `06f85688f28bfa18e8b643ac3c4122e3` | |
| **CF Pages project** | `lobservatoiredespros` | branch main |
| **Dernier deploy** | `74fff826.lobservatoiredespros.pages.dev` | 2026-04-23 23:56 UTC |
| **Repo** | `STACK-2026/lobservatoiredespros` | GitHub (August1nnnn) |
| **Supabase project** | `apuyeakgxjgdcfssrtek` | eu-west-3 Paris, KARMASTRO org |
| **Resend domaine** | `send.lobservatoiredespros.com` | ID `00a3fe8d-80cd-45d6-be82-02b59d987a3b` |
| **IndexNow key** | `a3f8d2c4b9e14f76a55e1c0b2d7e8f31` | `.txt` déposé racine site |
| **Portfolio** | ✅ Ajouté dans `augustinfoucheres/site/src/data/projects.ts` | catégorie Media |
| **Admin dashboard** | Auto-sync daily-ingest 10h15 Paris | carte apparaît seule dans `/admin` |

---

## 📊 Données actuelles

| Métrique | Valeur |
|---|---|
| Pages buildées | **335** |
| URLs sitemap principal | **333** |
| URLs ai-sitemap | **12** (filtré AI-citable) |
| Pros actifs | **290** (Yonne 89, plombiers) |
| Pros géocodés | **290/290** |
| Pros enrichis (Recherche Entreprises) | **290/290** |
| Pros synchronisés BODACC | **290/290** |
| Événements BODACC stockés | **310+** |
| Répartition Trust Score v2 | 253 bronze · 32 argent · 5 or · 0 platine |
| Articles observations | **3** (enquête, méthodologie, portrait) |
| Pages auteurs | **3** (Camille Fabre, Antoine Delaunay, Sarah Poitevin) |

---

## 🧱 Stack technique

### Frontend
- **Astro 6 SSG** + Tailwind 4 + CSS custom properties
- **Fonts** : Fraunces (display italic éditorial) + Geist (body + titles sans-serif) + JetBrains Mono
- **Palette** : paper #F7F3EC · ink #1A1614 · observatoire #1E3A52 · or #B8863D · cachet #8B2E2A
- **Composants signature** : Seal, ScoreCircle, CompletenessGauge, VerifiedStamp, InfoPill, ProCard, ProCompactRow, ClassementMap, ProMap, TrustSignals, LegalTimeline, EditorialCartouche, SpeakableTLDR, ContactBlock, HeadlineFigure, EditorsLog, UnknownsCard, QualificationsBlock, GlossaireTerm
- **Animations** : glassmorphic header, mesh gradient hero, spring cubic-bezier, reveal au scroll, cursor loupe glossaire

### Backend data
- **Supabase** : tables `pros`, `pro_metiers`, `pro_zones`, `metiers`, `zones`, `pro_qualifications`, `pro_evenements_legaux`, `pro_documents`, `pro_scores_history`, `pro_signalements`
- **Colonnes pros enrichies** : `siret`, `siren`, `lat`, `lng`, `geocode_score`, `bodacc_synthese` (JSONB), `score_detail` (JSONB), `niveau_confiance`, `categorie_entreprise`, `tranche_effectif`, `dirigeants_count`, `dirigeants_json`, `est_qualiopi`, `etat_administratif`, `last_trust_sync`, `enriched_at`, `geocoded_at`, `email`

### Scripts Python
- `scripts/import_sirene.py` : import parquet Sirene via DuckDB
- `scripts/sync_rge_qualifications.py` : enrichissement ADEME RGE (actuel + historique)
- `scripts/geocode_pros.py` : géocoding API Adresse data.gouv.fr
- `scripts/enrich_entreprise.py` : enrichissement recherche-entreprises.api.gouv.fr
- `scripts/sync_bodacc.py` + `lib_bodacc.py` : fetch + analyser BODACC
- `scripts/lib_trust_score.py` : formule Trust Score v2 (4 niveaux)
- `scripts/submit_indexnow.py` : ping IndexNow + Bing
- `scripts/fix_accents.py` : script de qualité accents (ne pas rejouer aveuglément, casse JS identifiers)
- `scripts/cleanup_slugs.py` : retire digits suffixe slugs

### GH Actions workflows
- `.github/workflows/deploy-site.yml` : deploy sur push main
- `.github/workflows/rebuild-guard.yml` : cron 06:12 UTC daily (bump marker)
- `.github/workflows/digest.yml` : cron 06:45 UTC daily (email metrics Resend)
- `.github/workflows/cross-project-leaks.yml` : CI anti-flood

---

## 🔑 Commandes courantes

```bash
# Dev local
cd site && npm run dev

# Build local
cd site && npm run build

# Deploy manuel (wrangler)
cd site
export $(grep -E "^CLOUDFLARE_API_TOKEN=|^CLOUDFLARE_ACCOUNT_ID=" ../../.env.master | xargs)
npx wrangler pages deploy dist --project-name=lobservatoiredespros --branch=main --commit-dirty=true

# Auto-récupérer SERVICE_ROLE_KEY via PAT
SERVICE_KEY=$(curl -sS "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true" \
  -H "Authorization: Bearer $(grep '^SUPABASE_PAT=' ../../.env.master | cut -d= -f2)" | \
  python3 -c "import json,sys;[print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role']")

# Import Sirene (1 combinaison)
python3 scripts/import_sirene.py --metier plombier --dept 89 --insert

# Géocoding tous pros missing
SUPABASE_URL=https://apuyeakgxjgdcfssrtek.supabase.co SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY" \
  python3 scripts/geocode_pros.py --commit --only-missing

# Enrichissement Recherche Entreprises
SUPABASE_URL=https://apuyeakgxjgdcfssrtek.supabase.co SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY" \
  python3 scripts/enrich_entreprise.py --commit --only-missing

# Sync BODACC + recalcul Trust Score v2
SUPABASE_URL=https://apuyeakgxjgdcfssrtek.supabase.co SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY" \
  python3 scripts/sync_bodacc.py --commit --only-missing

# Ping IndexNow
python3 scripts/submit_indexnow.py --sitemap
```

---

## 🎯 Ce qui est LIVE et fonctionnel

### Pages publiques (INDEXÉES)
- `/` (home éditoriale moderne, hero mesh, chiffre-choc, livre de bord)
- `/methode/` (6 critères publics, E-E-A-T)
- `/glossaire/` (15 termes BTP, JSON-LD DefinedTermSet)
- `/outils/` + `/outils/grille-devis/` (guide lecture devis, HowTo schema)
- `/observations/` + 3 articles complets (`enquete-rge-yonne-412-sites`, `methodologie-score-confiance-etoiles`, `portrait-atelier-maurel-dijon`)
- `/redaction/` + 3 pages auteurs individuelles (JSON-LD Person)
- `/a-propos/`, `/archives/`, `/candidater/`, `/newsletter/`, `/contact/`, `/selection/`
- `/metiers/`, `/departements/`
- `/mentions-legales/`, `/politique-confidentialite/`, `/cgu/`

### Pages dynamiques Supabase
- `/plombier/yonne-89/` (classement + podium + palmarès + guide tarifaire + FAQ + carte)
- `/pro/[slug]/` × 290 fiches pros (hero + jauge/score + contact + qualifications RGE + map Leaflet + timeline BODACC + TrustSignals + cartouche E-E-A-T + unknowns 2 cols)

### SEO/GEO tech
- sitemap.xml (333 URLs + lastmod dynamique)
- ai-sitemap.xml (12 URLs filtrées, strict standard sans namespace custom)
- robots.txt (34 user-agents whitelistés : 14 AI + 7 search + blacklist SEO)
- llms.txt enrichi v2 (Trust Score + articles + auteurs + principes)
- JSON-LD : NewsMediaOrganization + WebSite + CollectionPage(FAQPage 8 Q/R) + BreadcrumbList + LocalBusiness + NewsArticle/ReportageNewsArticle + Person + SpeakableSpecification
- Meta AI hints (`ai-content-declaration`, `ai-sitemap`)
- Preconnect fonts + dns-prefetch Leaflet/CartoDB
- Security headers Cloudflare (HSTS preload, CSP, X-Frame, Permissions-Policy)
- IndexNow clé déposée + script ready

---

## 🚫 Non fait (volontaire ou en attente)

### En attente user
- **Google Places API** : endpoint bloqué (API_KEY_SERVICE_BLOCKED). Activation manuelle requise sur console.cloud.google.com → GCP project `3729498435` → Places API (New) → Enable. Débloquera ~100 scores argent → or + coordonnées réelles tel/email pros.

### Non fait (choix explicite)
- **Blog-auto Mistral+Claude-audit** : user a explicité "pas d'appel API". Articles rédigés direct en session (qualité > volume).
- **i18n EN/FR** : média FR-only par design.
- **Affiliate multi-merchant** : pas de produit.
- **DiagnosticQuiz** (kit adapte-toi) : pas un usage média.

---

## 📝 À faire , voir ROADMAP.md

Ouvrir `docs/ROADMAP.md` pour les phases suivantes jusqu'au déploiement national complet.
