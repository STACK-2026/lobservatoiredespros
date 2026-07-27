# Preuves de livraison du socle GEO

Date : 27 juillet 2026

## Portée

Branche isolée : `codex/odp-geo-citations`

Base : `origin/main` au commit `fe8e227`

Production : non modifiée

Rollback Cloudflare relevé avant preview :
`da3648e0-6715-4b5f-91fc-e100a4e005b0`, déploiement production réussi le
27 juillet 2026 à 10:48:12 UTC.

## Découverte principale

La pagination générique Supabase lisait les tables de plus de 100 000 lignes
sans ordre stable. Un premier build du catalogue n'a chargé que 65 054
établissements actifs. Après ajout d'un ordre déterministe sur les clés, le
même build en charge 103 650.

Cette correction explique aussi l'écart trouvé lors du premier contrôle sur le
hub `multiservices/ain-01` : 5 dossiers visibles mais 4 dans l'agrégat. Après
correction, les deux surfaces indiquent 5.

## Artefacts vérifiés

- 1 536 agrégats métier et département ;
- 103 650 établissements actifs dans le corpus ;
- 62 couples avec plus de 100 établissements, donc tronqués par l'ancienne
  statistique du hub ;
- 370 établissements pour le couple le plus large, plombier et Yonne ;
- couverture minimale de l'enrichissement de confiance : 98,7 % ;
- JSON agrégé : environ 1,2 Mo ;
- CSV agrégé : environ 345 Ko ;
- 1 537 lignes CSV, en-tête compris.

## Commandes et résultats

`npm run test:geo`

- 8 tests réussis ;
- robots et exclusions sensibles ;
- routes de données ;
- `llms.txt` ;
- graphe JSON-LD unique ;
- absence de faux signal Speakable ;
- absence des trois personas non corroborées dans les surfaces publiques ;
- redirections 301 des anciennes URL auteurs ;
- déduplication et exclusion des inactifs.

`DEPT_BUILD_CAP=1 WAVE1_BUILD_CAP=2 OG_PRO_CAP=2 OG_CLASSEMENT_CAP=1 npm run build`

- build Astro réussi ;
- 247 pages générées dans le build plafonné ;
- aucune erreur de compilation.

`npm run build`, sans plafond

- build Astro intégral réussi le 27 juillet 2026 ;
- 17 577 pages HTML générées ;
- 19 748 fichiers dans `dist` ;
- 15 800 fiches pros, 1 536 hubs métier et département, 600 OG de classement
  et 1 500 OG de fiches pros traversés ;
- durée : 2 353,85 secondes ;
- aucune erreur de build.

`npm run verify:geo`

- statut `ok` sur l'artefact intégral ;
- 19 748 fichiers inspectés ;
- 1 536 hubs candidats, hub témoin `carreleur/ain-01` ;
- JSON et CSV cohérents ;
- aucun champ individuel interdit dans les agrégats ;
- `DataCatalog`, `Dataset` et deux `DataDownload` présents ;
- une seule balise JSON-LD par page ;
- canonical du catalogue correct ;
- hub visible, Dataset et distribution cohérents ;
- robots généré correct.

Vérification HTTP locale :

- `/donnees/` : 200, `text/html` ;
- `/donnees/classements.json` : 200, `application/json` ;
- `/donnees/classements.csv` : 200, `text/csv` ;
- hub échantillon : 200, `text/html`.

Lighthouse local sur `/donnees/` :

- SEO : 100 ;
- bonnes pratiques : 100 ;
- accessibilité : 94 ;
- performance : 87 ;
- CLS : 0 ;
- temps de blocage total : 20 ms.

## Contrôles de non-régression

- aucune URL de classement supprimée ;
- trois redirections 301 ajoutées uniquement pour consolider les anciennes
  pages auteurs vers `/redaction/` ;
- ordre et requête du classement visible inchangés ;
- canoniques existants conservés ;
- aucune donnée individuelle ajoutée aux téléchargements ;
- aucun nom des personas retirées dans les 19 748 fichiers générés ;
- aucun `SpeakableSpecification` dans l'artefact ;
- aucune ancienne URL auteur dans les sitemaps ;
- contrôle anti-fuite inter-projets réussi ;
- production et base de données non modifiées ;
- rollback possible par revert du lot ou restauration du déploiement Cloudflare
  `da3648e0-6715-4b5f-91fc-e100a4e005b0`.

## Risques restant à lever avant production

1. Le tracker de citations Gemini est actuellement dégradé par des réponses
   429 et des requêtes trop génériques. Il ne fournit plus de baseline fiable
   après juin. Il doit être réparé avant de mesurer l'effet du déploiement.
2. `npm install` signale 11 vulnérabilités dans les dépendances existantes,
   dont 8 élevées. Aucun `npm audit fix` n'a été appliqué afin de ne pas
   introduire une mise à jour non contrôlée dans ce chantier.
3. Le contrôle TypeScript global reste rouge sur des erreurs préexistantes :
   conflit de versions Vite et types Cloudflare `PagesFunction` manquants.
   Le build Astro du lot est vert.

## Gate recommandée

Le gate d'authenticité est levé : les profils individuels ont été retirés et
les contenus sont désormais attribués à « La rédaction de L'Observatoire » via
l'entité `NewsMediaOrganization`.

1. lancer une prévisualisation Cloudflare de la branche ;
2. comparer cinq hubs, dont deux avec plus de 100 établissements ;
3. vérifier les nouvelles distributions, robots, sitemaps et redirections ;
4. déployer en production avec rollback prêt ;
5. mesurer séparément crawl de recherche, visites à la demande et citations.
