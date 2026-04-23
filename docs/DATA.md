# DATA , L'Observatoire des Pros

Schéma Supabase, pipelines, méthodologie du Score de Confiance.

---

## 1. Infrastructure Supabase

- **Projet** : `apuyeakgxjgdcfssrtek`
- **URL** : `https://apuyeakgxjgdcfssrtek.supabase.co`
- **Org** : KARMASTRO (STACK-2026 standard)
- **Region** : eu-west-3 (Paris)
- **Plan** : Free (upgrade Pro quand volume justifie)

---

## 2. Schéma SQL (12 tables)

### Tables éditoriales
- `metiers` , 5 métiers pilotes (plombier, électricien, couvreur, menuisier, isolation)
- `zones` , hiérarchie region/département/ville
- `pros` , professionnels importés Sirene + enrichissements
- `pro_metiers` , relation N:N pros ↔ métiers
- `pro_zones` , relation N:N pros ↔ zones d'intervention
- `classements` , position officielle éditée par dept × métier
- `pages_content` , cache contenu généré (intro, guide tarifaire, FAQ) par page

### Tables opérationnelles
- `abonnements` , souscriptions Portrait Vérifié/Lauréat (Stripe futur)
- `candidatures` , soumissions via `/candidater/`
- `page_metrics` , métriques GSC par page (cold mailing triggers)
- `page_views` , analytics tracker STACK-2026
- `newsletter_subscribers` , opt-in newsletter

### RLS (Row Level Security)
- Public read sur : `metiers`, `zones`, `pros`, `classements`, `pages_content`, `pro_metiers`, `pro_zones`
- Anonymous insert sur : `page_views`, `candidatures`, `newsletter_subscribers`
- Service role : accès complet (pipelines côté serveur)

### Migration
```bash
# Appliquer la migration initiale
cat supabase/migrations/20260423_000_initial_schema.sql | \
  curl -X POST "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/database/query" \
    -H "Authorization: Bearer $SUPABASE_PAT" \
    -H "Content-Type: application/json" \
    -d @-
```

---

## 3. Méthodologie du Score de Confiance /10

Calculé sur **6 critères objectifs publics** :

| Critère | Poids | Source | Méthode |
|---|---|---|---|
| Ancienneté entreprise | 3 pts max | INSEE Sirene | 1 pt / 5 ans, plafonné à 3 |
| Certification RGE | 2 pts | france-renov.gouv.fr | Présence au registre |
| Certification Qualibat | 2 pts* | qualibat.com | Présence au registre |
| Avis publics > 4/5 | 2 pts | Google / Pages Jaunes | Moyenne sur ≥ 10 avis |
| SIRET actif | 1 pt | INSEE Sirene | État administratif = A |
| Site web professionnel | 1 pt | Scraping manuel | Présence web indépendante |
| Photos réalisations | 1 pt | Portfolio public | ≥ 5 photos |

*RGE et Qualibat s'additionnent si les deux sont présents, total plafonné à 2 pts.

**Score actuel sans enrichissement** : ~4.5/10 max (ancienneté + SIRET + dénomination + adresse).
**Score avec enrichissement complet** : peut monter à 10/10.

### Pondération progressive

- **Baseline Sirene** (automatique) : ancienneté (0-3 pts) + catégorie entreprise + tranche effectif + siège + dénomination + adresse = **max 5.5 pts**
- **Enrichissements** : RGE, Qualibat, avis, site web, photos = **jusqu'à +4.5 pts**

---

## 4. Pipeline d'import Sirene

### Source
- **URL parquet** : `https://object.files.data.gouv.fr/data-pipeline-open/siren/stock/StockEtablissement_utf8.parquet`
- **UL parquet** (pour nom autoentrepreneur) : `https://object.files.data.gouv.fr/data-pipeline-open/siren/stock/StockUniteLegale_utf8.parquet`
- **Pas de rate limit** (stock parquet, pas API)
- **Outil** : DuckDB + httpfs extension

### Commande
```bash
# Test une combinaison
python3 scripts/import_sirene.py --metier plombier --dept 89

# Avec insertion Supabase
python3 scripts/import_sirene.py --metier plombier --dept 89 --insert

# Toutes les combinaisons pilote
python3 scripts/import_sirene.py --all-pilots --insert

# Dry-run comptage
python3 scripts/import_sirene.py --metier plombier --dept 89 --dry-run
```

### Métiers pilotes (codes NAF)
| Slug | NAF | Libellé |
|---|---|---|
| plombier | 43.22A | Travaux d'installation d'eau et de gaz |
| electricien | 43.21A | Installation électrique |
| couvreur | 43.91B | Travaux de couverture |
| menuisier | 43.32A | Travaux de menuiserie bois et PVC |
| isolation | 43.29A | Autres travaux d'installation (isolation) |

### Départements pilotes
- **75** Paris (Île-de-France)
- **21** Côte-d'Or (Bourgogne-Franche-Comté)
- **89** Yonne (Bourgogne-Franche-Comté)

### Volume attendu (pilote)
| Métier | Paris (75) | Côte-d'Or (21) | Yonne (89) | Total |
|---|---|---|---|---|
| Plombier | ~3 115 | ~374 | 290 ✓ | ~3 779 |
| Électricien | ~4 623 | ~768 | ~484 | ~5 875 |
| Couvreur | ~618 | ~307 | ~258 | ~1 183 |
| Menuisier | ~X | ~X | ~X | ~X |
| Isolation | ~X | ~X | ~X | ~X |
| **Total est.** | ~8 500+ | ~1 500+ | ~1 100+ | **~12 000+** |

✓ = déjà inséré dans Supabase

---

## 5. Pipeline enrichissement (à construire)

### D1.a Enrichissement RGE (ADEME)
- **API** : `data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines`
- **Script** : `scripts/enrich_rge.py` (déjà écrit, non testé en masse)
- **Matching** : par SIREN (9 premiers chiffres SIRET)

### D1.b Enrichissement Pages Jaunes (scraping)
- **URL** : `pagesjaunes.fr/trouverlespros/recherche?quoiqui=[metier]&ou=[ville]`
- **Matching** : par nom + ville
- **Données** : téléphone, horaires, site web, rating (si présent)
- **Rate limit** : 1-3 requêtes/sec, User-Agent rotatif obligatoire

### D1.c Enrichissement OpenStreetMap (Overpass API)
- **Endpoint** : `https://overpass-api.de/api/interpreter`
- **Query** : tagged `craft=*` ou `office=craftsman` dans bbox dept
- **Matching** : nom + ville + coords
- **Gratuit, illimité, contact requested UA**

### D1.d Enrichissement site web (scraping propre)
- Si PJ ou OSM renvoie une URL :
  - Fetch HTML (respect robots.txt)
  - Extract : email (regex), téléphone, mentions légales, SIRET (cross-check)
  - Détection RGE/Qualibat mentionnés sur la page
  - Stockage : `pros.site_web`, `pros.telephone_web`, `pros.has_mentions_legales`

### D1.e Stratégie enrichissement sélective
Pas de Google Places (sans budget). Donc :
- **Top 20 par (métier × dept)** reçoivent enrichissement complet PJ + OSM + site web
- **Le reste** reste en base Sirene + RGE uniquement
- Pros Premium/Lauréat payants : enrichissement inclus dans l'abo

---

## 6. Pipeline de génération de contenu

### Claude API
- **Modèle** : `claude-opus-4-7` pour pages piliers (méthode, candidater)
- **Modèle** : `claude-haiku-4-5-20251001` pour pages de faible trafic (villes < 5k hab)
- **Prompt template** : voir `scripts/generate_content.py` (à construire)

### Génération par page (métier × département)
- Intro éditoriale 120-150 mots
- Guide tarifaire : 4-6 prestations avec fourchettes par zone
- FAQ 6 questions contextualisées
- Meta title ≤ 60 chars, meta description 140-160 chars

### Pipeline blog
- Mistral-large (draft 3500+ mots) → Claude Sonnet (audit grounding) → Mistral (fix)
- Shared lib : `~/stack-2026/scripts/mistral_claude_blog_lib.py`
- Intégration SERP brief Gemini 2.5 Pro en amont (obligatoire STACK-2026)

---

## 7. Sécurité / RGPD

### Données collectées (public side)
- Logs page_views : path, referrer, user_agent, is_bot (anonymisé)
- Consent CNIL : 13 mois max, banner 3 boutons
- Analytics tracker custom Supabase (pas GA/Plausible)

### Données collectées (Pro side)
- Candidatures : SIRET, nom, email, métier, zone (consent RGPD)
- Abonnements : données Stripe (hosted, pas stockées en clair)

### RLS enforced
- Anonymous ne peut que lire pros actifs + insérer dans page_views/candidatures
- Service_role : CI/CD et admin uniquement
