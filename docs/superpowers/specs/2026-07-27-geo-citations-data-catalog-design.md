# Socle GEO et catalogue de données citables

Date : 27 juillet 2026

## Objectif

Transformer les données agrégées de L'Observatoire des Pros en ressources
faciles à découvrir, vérifier et citer par les moteurs de recherche et les
assistants IA, sans changer les URL existantes, les classements, les
canoniques ni la disponibilité des pages.

Le chantier ne promet pas une citation. Il supprime les obstacles techniques
et éditoriaux observés entre le crawl et la citation.

## Diagnostic

Le site est déjà largement crawlé par les robots IA. Le journal `page_views`
contient près de 2,94 millions de requêtes déclarées comme bots depuis avril
2026, dont environ 996 000 GPTBot, 436 000 ClaudeBot, 28 000 OAI-SearchBot,
22 000 PerplexityBot et 7 400 ChatGPT-User.

Le problème principal n'est donc pas l'accès :

1. GPTBot et ClaudeBot de formation représentent une part importante du
   volume, mais ne prouvent pas une présence dans les réponses de recherche.
2. Les agrégats visibles sur les hubs métier et département portent sur les
   100 premiers résultats, alors que certains textes les présentent comme
   exhaustifs.
3. Il n'existe aucun téléchargement national stable en JSON ou CSV.
4. Les dates d'édition et de mise à jour sont parfois générées au jour du
   build, même quand les données n'ont pas changé.
5. `llms.txt`, les métadonnées IA et les commentaires de code attribuent à
   certains fichiers ou schémas un effet non documenté.
6. Le balisage JSON-LD est fragmenté dans plusieurs scripts et le
   `SpeakableSpecification` global ne correspond pas à l'usage documenté par
   Google pour ce site francophone.

Les comptages de crawl sont basés sur le `User-Agent`. Ils ne constituent pas
une vérification cryptographique de l'identité du robot. Toute restitution de
ces chiffres doit porter cette réserve.

## Principes

### Vérité visible et machine identiques

Chaque chiffre du JSON-LD doit être présent dans le contenu visible de la
page. Chaque total affiché doit préciser son périmètre : établissements actifs,
couple métier et département, date d'arrêt des sources.

### Agrégats complets, classement inchangé

Les agrégats sont calculés sur tous les établissements actifs reliés au métier
et au département dans la base. Le classement visible reste limité à ses
premiers résultats et conserve son ordre actuel.

Le terme retenu est `établissement`, et non `entreprise`, car une ligne Sirene
identifiée par un SIRET représente un établissement.

### Formats stables

Le site publie :

- `/donnees/`, catalogue humain et méthodologie courte ;
- `/donnees/classements.json`, agrégats complets ;
- `/donnees/classements.csv`, mêmes agrégats au format tabulaire ;
- `/donnees/catalogue.json`, description Schema.org du catalogue ;
- `/llms-full.txt`, dictionnaire de données et chemins canoniques.

Ces fichiers contiennent uniquement des agrégats. Aucun SIRET, téléphone,
adresse personnelle ou autre donnée individuelle n'est ajouté.

### Provenance et fraîcheur

La date de modification d'un agrégat provient de la date la plus récente entre
le dernier `updated_at` et le dernier `last_trust_sync` des lignes qui le
composent. Les deux dates sont aussi exposées séparément. La date du build
n'est jamais présentée comme une date de mise à jour des données.

La couverture d'enrichissement de confiance est mesurée séparément avec
`last_trust_sync`. Elle ne remplace pas la date de modification et ne sert pas
à masquer un taux de certification égal à zéro, qui peut être un résultat réel.

### Compatibilité, pas superstition

`llms.txt`, `llms-full.txt` et `ai-sitemap.xml` sont maintenus comme surfaces
d'orientation compatibles avec des consommateurs tiers. Ils ne sont pas
présentés comme des standards garantissant un classement ou une citation.

Les contrôles officiels restent prioritaires :

- robots.txt pour l'autorisation des crawlers ;
- sitemap XML standard pour la découverte ;
- contenu HTML indexable ;
- données structurées conformes au contenu visible ;
- fichiers JSON et CSV téléchargeables et stables.

## Architecture

### Agrégateur unique

`src/lib/dataset-catalog.ts` charge les caches existants :

- `pros` en version légère ;
- `pro_metiers` ;
- `pro_zones` ;
- `metiers` ;
- `zones`.

Il produit une ligne unique par couple métier et département :

- identifiants et libellés du métier ;
- code, slug et libellé du département ;
- nombre d'établissements actifs ;
- nombre et part RGE ;
- nombre et part Qualibat ;
- Score de Confiance médian ;
- couverture d'enrichissement de confiance ;
- date d'arrêt des données ;
- URL canonique du hub.

Les relations sont dédupliquées par établissement avant agrégation.

### Catalogue Schema.org

La page `/donnees/` porte un `DataCatalog`. Chaque hub porte un `Dataset`
référençant ce catalogue et les deux distributions nationales :

- `DataDownload` JSON ;
- `DataDownload` CSV.

Le créateur et l'éditeur sont l'organisation. Aucune licence ouverte n'est
inventée. Les conditions existantes restent accessibles via les mentions
légales jusqu'à décision juridique contraire.

### JSON-LD global

`BaseLayout.astro` émet un seul script JSON-LD contenant un `@graph`. Les
schémas existants sont conservés dans le graphe après retrait de leur
`@context` individuel.

La métadonnée non standard `ai-content-declaration` est retirée, car elle
déclare à tort l'ensemble des pages générées comme rédaction humaine. Le
`SpeakableSpecification` global est retiré. Les données structurées visibles
et factuelles restent intactes.

### Robots

Les agents de recherche et d'usage à la demande sont explicitement autorisés,
notamment :

- OAI-SearchBot ;
- ChatGPT-User ;
- Claude-SearchBot ;
- Claude-User ;
- PerplexityBot ;
- Perplexity-User.

Chaque groupe autorisé reprend aussi les exclusions `/admin/` et `/api/`.
Ainsi, une règle spécifique ne contourne pas les exclusions du groupe
générique.

## Invariants zéro-régression

Avant toute prévisualisation externe :

1. aucune URL existante n'est supprimée ou redirigée ;
2. aucun titre, canonical ou `noindex` critique n'est changé ;
3. le classement et les 60 fiches visibles restent identiques ;
4. le nombre de pages générées ne dépasse pas le plafond actuel ;
5. les nouveaux fichiers agrégés ne contiennent aucune donnée individuelle ;
6. le JSON et le CSV contiennent les mêmes lignes et les mêmes valeurs ;
7. chaque groupe de robot autorisé conserve les exclusions sensibles ;
8. une page ne contient qu'un script JSON-LD ;
9. les valeurs du Dataset correspondent au résumé visible ;
10. la production n'est pas déployée sans validation humaine.

## Hors périmètre de ce lot

- modification de la formule du Score de Confiance ;
- suppression ou remplacement des profils de rédaction non vérifiés ;
- migration de la table `page_views` ;
- ouverture d'une licence de réutilisation ;
- garantie de citation par un moteur tiers ;
- changement de fréquence éditoriale à l'échelle du site.

Les biographies de rédaction devront faire l'objet d'un chantier séparé :
preuve des identités et expériences annoncées, ou remplacement transparent
par une signature institutionnelle.
