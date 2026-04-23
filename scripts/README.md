# Scripts , L'Observatoire des Pros

Pipelines de scraping, enrichissement, generation de contenu.

## APIs utilisees (toutes gratuites, publiques)

| API | Endpoint | Usage |
|---|---|---|
| **Recherche d'Entreprises** | `recherche-entreprises.api.gouv.fr/search` | Base Sirene avec filtre departement qui marche |
| **Decoupage administratif** | `geo.api.gouv.fr` | Regions, departements, communes |
| **Adresse & geocodage** | `api-adresse.data.gouv.fr` | Geocodage, reverse |
| **RGE ADEME** | `data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines` | Detail certifications RGE |
| **Google Places** | `places.googleapis.com/v1/places:searchText` | Avis + photos + horaires (payant, selectif) |

## Regles d'or

- User-Agent `ObservatoireDesPros/1.0 (contact@lobservatoiredespros.com)` sur chaque requete
- Rate limit 7 req/s max , sleep 200ms entre chaque call
- Respect du `Retry-After` sur 429
- Toujours filtrer `etat_administratif=A`
- Code NAF avec le point : `43.22A` (pas `4322A`)

## Scripts

### `test_recherche_entreprises.py`
Test minimal pour valider la reponse API sur 1 metier / 1 departement.
```bash
python3 scripts/test_recherche_entreprises.py plombier 89
```

### `seed_zones.py`
Remplit la table `zones` Supabase avec toutes les regions, departements et communes de France (uniquement pop > 1000 pour les communes).
```bash
python3 scripts/seed_zones.py
```

### `import_sirene.py`
Import complet Sirene pour un metier x departement. Pagination, dedup, upsert Supabase.
```bash
python3 scripts/import_sirene.py plombier 89
```

### `compute_score.py`
Calcul du Score de Confiance pour tous les pros d'une zone / metier.
```bash
python3 scripts/compute_score.py plombier 89
```

## Ordre d'execution complet

1. `seed_zones.py` (une fois)
2. `seed_metiers.py` (une fois , contenu dans la migration SQL)
3. `import_sirene.py <metier> <dept>` (par combinaison)
4. `compute_score.py <metier> <dept>` (apres import)
5. `enrich_google_places.py <metier> <dept>` (top 20 seulement)
6. `generate_content.py <metier> <dept>` (via Claude API)

## Codes NAF prioritaires

| NAF | Metier | Slug |
|---|---|---|
| 43.22A | Plomberie | plombier |
| 43.21A | Electricite | electricien |
| 43.91B | Couverture | couvreur |
| 43.32A | Menuiserie bois/PVC | menuisier |
| 43.29A | Isolation | isolation |
| 43.22B | Chauffage/clim | chauffagiste |
| 43.99C | Maconnerie | macon |
| 43.34Z | Peinture/vitrerie | peintre |
