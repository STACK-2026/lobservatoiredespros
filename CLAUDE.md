# L'Observatoire des Pros , notes Claude Code

## Context ultra-court

Média éditorial français indépendant qui observe, vérifie et classe les artisans et entreprises du BTP et services à domicile. Pattern STACK-2026, lancé 2026-04-23. Domaine : **lobservatoiredespros.com** (LIVE).

**Édition N°1** , Yonne (89) , 290 plombiers · 253 bronze · 32 argent · 5 or.

---

## 📚 Documentation , à lire AVANT toute intervention

Tout est dans `docs/` :

- **[SESSION_STATE.md](docs/SESSION_STATE.md)** , état actuel au millimètre (infra, data, commandes). **Commencer par là.**
- **[ROADMAP.md](docs/ROADMAP.md)** , phases 1 à 8 vers déploiement national. Phase 1 livrée. Phase 2 = extension géographique nationale.
- **[AUDIT_LOG.md](docs/AUDIT_LOG.md)** , historique des audits par phase.
- **[DESIGN.md](docs/DESIGN.md)** , DA, tokens, composants (actuellement Fraunces + Geist, pas Instrument Serif).
- **[BRAND.md](docs/BRAND.md)** , charte voix éditoriale, tutoiement, ton.
- **[DATA.md](docs/DATA.md)** , schéma Supabase + pipelines data.

---

## Quick refs infra

| Ressource | Valeur |
|---|---|
| **Domaine** | `lobservatoiredespros.com` |
| **CF zone** | `06f85688f28bfa18e8b643ac3c4122e3` |
| **CF Pages project** | `lobservatoiredespros` |
| **Repo** | `STACK-2026/lobservatoiredespros` |
| **Supabase** | `apuyeakgxjgdcfssrtek` (eu-west-3 Paris, KARMASTRO org) |
| **Resend domain** | `send.lobservatoiredespros.com` (id `00a3fe8d-80cd-45d6-be82-02b59d987a3b`) |
| **IndexNow key** | `a3f8d2c4b9e14f76a55e1c0b2d7e8f31` |
| **Portfolio** | ajouté dans `augustinfoucheres/site/src/data/projects.ts` (catégorie Media) |

---

## Deploy

```bash
# Auto via GH Actions (push main)
git push origin main

# Manuel wrangler
cd site
export $(grep -E "^CLOUDFLARE_API_TOKEN=|^CLOUDFLARE_ACCOUNT_ID=" ../../.env.master | xargs)
npx wrangler pages deploy dist --project-name=lobservatoiredespros --branch=main --commit-dirty=true
```

---

## Scripts disponibles

| Script | Usage |
|---|---|
| `scripts/import_sirene.py` | Import pros INSEE via DuckDB parquet |
| `scripts/sync_rge_qualifications.py` | Enrichissement ADEME RGE (actuel + historique) |
| `scripts/geocode_pros.py` | Géocoding API Adresse data.gouv.fr |
| `scripts/enrich_entreprise.py` | Enrichissement recherche-entreprises.api.gouv.fr |
| `scripts/sync_bodacc.py` + `lib_bodacc.py` + `lib_trust_score.py` | BODACC + Trust Score v2 |
| `scripts/submit_indexnow.py` | Ping IndexNow + Bing |
| `scripts/cleanup_slugs.py` | Retire digits suffixe slugs |
| `scripts/fix_accents.py` | **⚠️ DANGEREUX** , casse les identifiers JS, ne pas rejouer aveuglément |

### Récupérer SERVICE_ROLE_KEY Supabase via PAT

```bash
SERVICE_KEY=$(curl -sS "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true" \
  -H "Authorization: Bearer $(grep '^SUPABASE_PAT=' ../.env.master | cut -d= -f2)" | \
  python3 -c "import json,sys;[print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role']")
```

---

## Règles critiques (héritées STACK-2026)

- **Zéro appel Claude API** côté génération (user a explicité). Rédaction humaine en session.
- **Tutoiement** lecteur, "nous" éditorial
- **Accents UTF-8** direct, jamais `\uXXXX`, **JAMAIS de tiret cadratin** (— ou –) , virgule ou tiret simple
- **Univers brand partout** (404, cookie banner, emails, OG)
- **JSON-LD UNE FOIS** par page (niveau BaseLayout + ajouts par page)
- **Homepage riche >= 10 sections** (11 actuellement)
- **Favicon SVG brandé** (OdP monogramme animé)
- **Robots whitelist AI bots** (34 user-agents actuellement)
- **Analytics custom Supabase** (pas GA/Plausible)
- **Rebuild-guard daily** workflow + digest daily Resend
- **Heures publication random 7h-9h FR** si blog-auto un jour
- **Repo nom = domain sans TLD** → `lobservatoiredespros`

---

## État actuel (2026-04-24 00:00)

### ✅ Livré Phase 1 (Yonne)
- 335 pages buildées
- 333 URLs sitemap + 12 ai-sitemap
- 290 pros synchronisés (Sirene + ADEME + BODACC + géocoding + enrichissement)
- 3 articles observations rédigés direct
- 3 pages auteurs E-E-A-T
- Trust Score v2 (4 sources croisées)
- Typo moderne Fraunces + Geist
- 0 lien cassé, accents OK, JSON-LD validés
- Sitemap soumis GSC (ai-sitemap corrigé après erreurs balises custom)

### 🔴 Phase 2 (à démarrer) : extension nationale géographique
Voir [ROADMAP.md](docs/ROADMAP.md#phase-2).

---

## Admin / portfolio integration

- **Portfolio** : projet ajouté dans `augustinfoucheres/site/src/data/projects.ts` catégorie Media.
- **Admin dashboard auto-sync** : cron `daily-ingest` 10h15 Paris (STACK-2026/intel) → auto-ajoute le projet dans l'intel DB → apparaît dans `/admin` d'augustinfoucheres.com après propagation (premier passage cron si Supabase + GSC owned validé).
- **Intel alias** éventuel : dict `ALIASES` dans `STACK-2026/intel/scripts/auto_sync_projects.py`.

---

## Actions manuelles user restantes

1. **Activer Google Places API** sur console.cloud.google.com (GCP `3729498435`) , débloque scoring argent/or + tel/email pros.
2. **Re-soumettre sitemap-index.xml** dans GSC (ai-sitemap corrigé, les 12 URLs passeront OK).
3. **Connecter CF Pages project à GH repo** pour auto-deploy (actuellement wrangler manuel OK, mais GH Actions existe).
4. **Zone-level redirect rule www → apex** (nécessite token CF avec scope `rulesets`).
5. **Submit sitemap GSC** après resoumission.
6. **Valider positioning monétisation** quand phase 4 démarre (Vérifié 29€ / Lauréat 89€).

---

## Pages live principales

- `/` (home éditoriale Fraunces+Geist, hero mesh, chiffre-choc, 3 articles à la une)
- `/methode/` (6 critères publics + Trust Score v2)
- `/glossaire/` (15 termes + JSON-LD DefinedTermSet)
- `/observations/` + 3 articles (`enquete-rge-yonne-412-sites`, `methodologie-score-confiance-etoiles`, `portrait-atelier-maurel-dijon`)
- `/redaction/` + 3 pages auteurs (Camille Fabre, Antoine Delaunay, Sarah Poitevin)
- `/plombier/yonne-89/` (classement + carte interactive)
- `/pro/[slug]/` × 290 (hero + jauge/score + contact + qualifications + carte + timeline BODACC + signaux trust + sources)
- `/a-propos/`, `/archives/`, `/candidater/`, `/newsletter/`, `/contact/`, `/selection/`
- `/metiers/`, `/departements/`
- Légales : `/mentions-legales/`, `/politique-confidentialite/`, `/cgu/`
