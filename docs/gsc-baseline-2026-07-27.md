# Baseline GSC avant relance

Date : 27 juillet 2026

Propriété : `sc-domain:lobservatoiredespros.com`

Sources :

- API Search Analytics et URL Inspection ;
- interface Google Search Console pour les rapports Pages, Actions manuelles,
  Sécurité et IA générative ;
- données finales GSC jusqu'au 25 juillet pour la recherche classique et
  jusqu'au 25 juillet pour le rapport IA.

## Conclusion

Le site n'a pas subi de désindexation massive ni de pénalité manuelle. Il a
subi une perte brutale d'exposition de la longue traîne à partir du 22 juillet.
Les URL inspectées restent indexées, crawlables et correctement
canonicalisées.

Le volume d'impressions IA reste faible mais réel. Sa géographie s'améliore
fortement : la France représente 60 % des impressions IA des 7 derniers jours,
contre 3,5 % sur l'ensemble des 3 mois disponibles.

## Recherche classique

Fenêtres complètes arrêtées au 24 juillet :

| Fenêtre | Clics | Impressions | CTR | Position | Pages avec impressions |
| --- | ---: | ---: | ---: | ---: | ---: |
| 18 au 24 juillet | 1 021 | 22 858 | 4,467 % | 7,58 | 13 723 |
| 11 au 17 juillet | 1 653 | 48 629 | 3,399 % | 7,24 | 24 461 |
| 27 juin au 24 juillet | 6 700 | 185 158 | 3,619 % | 7,16 | 56 925 |
| 30 mai au 26 juin | 8 730 | 271 270 | 3,218 % | 6,94 | 61 743 |

Variations :

- 7 jours : clics -38,23 %, impressions -53,00 %, pages visibles -43,90 % ;
- 28 jours : clics -23,25 %, impressions -31,74 %, pages visibles -7,80 % ;
- le CTR progresse et la position moyenne recule peu avant la rupture. La
  contraction de couverture explique davantage la baisse que le classement
  moyen des URL encore affichées.

### Rupture du 22 juillet

| Jour | Clics | Impressions | Pages avec impressions |
| --- | ---: | ---: | ---: |
| 21 juillet | 243 | 6 526 | 4 893 |
| 22 juillet | 35 | 584 | 474 |
| 24 juillet | 26 | 585 | 480 |

Les fiches pros passent de 4 771 pages et 6 362 impressions le 21 juillet à
449 pages et 558 impressions le 22 juillet. La France concentre la perte.

Le tableau de bord public de Google ne signale aucun incident de crawling,
d'indexation, de ranking ou de serving autour du 22 juillet. La dernière mise
à jour publique antérieure est le spam update mondial du 24 au 26 juin 2026.
Cette proximité ne prouve pas une causalité.

## Indexation et sécurité

Rapport Pages, mis à jour le 24 juillet :

- 93,7 k pages dans l'index ;
- 14,3 k pages non indexées ;
- 10 213 « Explorée, actuellement non indexée » ;
- 1 567 « Détectée, actuellement non indexée » ;
- 113 anciennes 404, dont plusieurs exemples `/donner-mon-avis/` répondent
  désormais 200 en production ;
- aucune action manuelle ;
- aucun problème de sécurité.

Dix URL représentatives ont été inspectées par API :

- toutes en verdict `PASS`, « Envoyée et indexée » ;
- robots autorisé, indexation autorisée, fetch réussi ;
- canonical Google identique au canonical déclaré ;
- la nouvelle page `/donnees/` a été crawlée et indexée le 27 juillet à
  17:37:26 UTC, douze minutes après le déploiement.

## Fonctionnalités d'IA générative

Le rapport GSC bêta dédié donne :

| Fenêtre | Impressions IA | Pages |
| --- | ---: | ---: |
| 24 heures | 2 | 2 |
| 7 jours | 40 | 39 |
| 28 jours | 258 | 239 |
| 3 mois disponibles | 951 | 871 |

Répartition France :

- 7 jours : 24 sur 40, soit 60 % ;
- 28 jours : 26 sur 258, soit 10,1 % ;
- 3 mois : 33 sur 951, soit 3,5 %.

Le signal utile français progresse donc fortement en part relative, tandis que
le volume IA global diminue. Le chantier GEO doit être mesuré sur la France et
sur les pages de données, pas uniquement sur le total mondial.

## Anomalie de fraîcheur corrigée dans le lot suivant

Avant correction, chaque rebuild quotidien affichait la date du jour comme
date de contrôle sur les fiches pros. Le fallback edge ajoutait aussi le jour
de la requête comme `datePublished` du Review JSON-LD. Cela créait un signal de
fraîcheur artificielle à grande échelle.

Le correctif :

- charge `created_at`, `updated_at`, `enriched_at` et `last_trust_sync` ;
- affiche la date réelle la plus récente du dossier ;
- date le Review avec la première observation réelle ;
- supprime le faux « prochain audit programmé » ;
- couvre les pages statiques et le fallback edge ;
- est protégé par un test dédié, suite GEO 9 sur 9 ;
- passe un build Supabase plafonné de 244 pages.

## Mesure

- J+7, 3 août : recherche classique, rapport IA France, crawl et citations ;
- J+14, 10 août : mêmes indicateurs et premières pages catalogue visibles ;
- J+28, 24 août : décision entre enrichissement éditorial, consolidation des
  fiches faibles et acquisition de sources externes.
