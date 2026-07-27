# Preuves de livraison du socle GEO

Date : 27 juillet 2026

## Portée

Branche source : `codex/odp-geo-citations`

Base : `origin/main` au commit `fe8e227`

Commit source : `27eaaa0d98c34fb1a60cbf1e98edd3d305d7cfcf`

Fusion `main` : `e8b56e2909cc49f95821c980ad7513f323008962`

Pull request : `https://github.com/STACK-2026/lobservatoiredespros/pull/1`

Rollback Cloudflare relevé avant preview :
`da3648e0-6715-4b5f-91fc-e100a4e005b0`, déploiement production réussi le
27 juillet 2026 à 10:48:12 UTC.

Preview validée :
`cf6c01c6-9a88-434b-8b50-5f3fd539a7c1`,
`https://cf6c01c6.lobservatoiredespros.pages.dev`.

Production déployée avec l'artefact intégral vérifié :
`a28900b3-ce39-4749-9d5b-65afe532c6c0`,
`https://a28900b3.lobservatoiredespros.pages.dev`.

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

Vérification HTTP en preview puis en production :

- 15 routes représentatives en 200 ;
- 3 anciennes URL auteurs en 301 vers `/redaction/` ;
- 6 user-agents IA de recherche et de réponse servis en 200 ;
- 21 fichiers sitemap déclarés ou référencés servis en 200 ;
- 105 404 URL uniques dans l'artefact sitemap, aucun doublon entre les shards ;
- aucun nom des personas retirées et aucun `SpeakableSpecification` ;
- auteur JSON-LD des observations relié à `NewsMediaOrganization` ;
- empreintes SHA-256 production identiques à l'artefact local pour le JSON, le
  CSV, le catalogue, `robots.txt`, `llms.txt`, `llms-full.txt` et le sitemap IA.

Google Search Console, propriété `sc-domain:lobservatoiredespros.com` :

- `sitemap-index.xml` lu le 27 juillet 2026, 0 erreur, 0 avertissement,
  105 403 URL soumises ;
- `ai-sitemap.xml` lu le 27 juillet 2026, 0 erreur, 0 avertissement ;
- la valeur `indexed: 0` exposée par l'API Sitemap ne doit pas être interprétée
  comme le nombre de pages indexées. La couverture d'indexation reste à lire
  dans le rapport Pages de l'interface GSC.

Baseline complète : `docs/gsc-baseline-2026-07-27.md`.

- 93,7 k pages dans l'index au 24 juillet ;
- aucune action manuelle et aucun problème de sécurité ;
- rupture de la longue traîne le 22 juillet, sans désindexation des URL
  inspectées ;
- rapport IA : 40 impressions sur 39 pages en 7 jours, dont 24 en France ;
- `/donnees/` crawlée et indexée douze minutes après sa mise en production.

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
- base de données non modifiée ;
- rollback possible par revert du lot ou restauration du déploiement Cloudflare
  `da3648e0-6715-4b5f-91fc-e100a4e005b0`.

## Risques résiduels et mesure

1. Le tracker de citations Gemini est actuellement dégradé par des réponses
   429 et des requêtes trop génériques. Il ne fournit plus de baseline fiable
   après juin. Il doit être réparé avant de mesurer l'effet du déploiement.
2. `npm install` signale 11 vulnérabilités dans les dépendances existantes,
   dont 8 élevées. Aucun `npm audit fix` n'a été appliqué afin de ne pas
   introduire une mise à jour non contrôlée dans ce chantier.
3. Le contrôle TypeScript global reste rouge sur des erreurs préexistantes :
   conflit de versions Vite et types Cloudflare `PagesFunction` manquants.
   Le build Astro du lot est vert.
4. Cloudflare Pages accepte au maximum 20 000 fichiers par déploiement. Le
   présent artefact en contient 19 748, soit une marge de 252 fichiers. Tout
   ajout de pages statiques doit désormais être compensé, déplacé vers le
   fallback edge ou accompagné d'une évolution d'architecture.

## Correctif de fraîcheur après diagnostic GSC

L'analyse de la rupture du 22 juillet a révélé que les fiches affichaient le
jour de chaque rebuild comme date de contrôle, même sans nouvelle donnée. Le
fallback edge utilisait aussi la date de chaque requête comme `datePublished`
du Review JSON-LD.

Le lot de suivi :

- utilise uniquement `created_at`, `updated_at`, `enriched_at` et
  `last_trust_sync` ;
- supprime le faux « prochain audit programmé » ;
- couvre le rendu statique et le fallback edge ;
- passe un cycle TDD rouge puis vert, suite GEO 9 sur 9 ;
- passe un build plafonné Supabase de 244 pages.

Production du lot de suivi :

- PR 2 fusionnée au commit
  `1ec662aaf7e0bfb780a27ae9a82c2e753f275e87` ;
- workflow intégral `30296583919` vert en 42 min 51 s ;
- déploiement Cloudflare
  `f68edc43-f64e-4a4a-b83d-d002ae75e495` ;
- fiches statique et edge contrôlées en 200 avec une date Supabase réelle ;
- six user-agents IA contrôlés en 200 ;
- empreintes des ressources GEO inchangées.

## Handoff du micro-lot suivant

Le contrôle élargi a ensuite trouvé un faux fil global « En direct » et des
valeurs `lastmod` retombant sur la date du rebuild. Le correctif est préparé
sur `codex/odp-truthful-crawl-signals`, mais n'est pas fusionné. L'utilisateur
a demandé d'arrêter les tests et de reprendre demain.

Le `dist` local provient d'un build interrompu et ne doit pas être déployé.
État exact et ordre de reprise :
`docs/geo-resume-2026-07-28.md`.

## Livraison

Le gate d'authenticité est levé : les profils individuels ont été retirés et
les contenus sont désormais attribués à « La rédaction de L'Observatoire » via
l'entité `NewsMediaOrganization`.

Les gates preview, comparaison des hubs, distributions, robots, sitemaps,
redirections et production ont été franchies. Le déploiement manuel conserve
le rollback précédent et le workflow GitHub indépendant reconstruit le même
commit.

Mesures à effectuer séparément :

1. 3 août 2026, J+7 : crawl des agents IA, GSC et citations ;
2. 10 août 2026, J+14 : comparaison des requêtes et citations avec la baseline ;
3. 24 août 2026, J+28 : décision d'itération sur les pages et jeux de données.
