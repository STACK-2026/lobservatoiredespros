# Plan d'exécution GEO et données citables

Date : 27 juillet 2026

Statut : livré en production le 27 juillet 2026, PR 1, merge `e8b56e2`,
déploiement Cloudflare vérifié `a28900b3-ce39-4749-9d5b-65afe532c6c0`.

## Gate 1 : contrôles RED

Créer un contrôle Node sans dépendance externe qui échoue tant que :

- les agents de recherche actuels ne sont pas présents dans `robots.txt` ;
- les exclusions `/admin/` et `/api/` ne sont pas appliquées à chaque groupe
  explicitement autorisé ;
- les quatre routes de données n'existent pas ;
- `llms.txt` ne pointe pas vers le catalogue ;
- le layout émet plusieurs scripts JSON-LD ou une déclaration IA trompeuse.

Commande cible :

```sh
npm run test:geo
```

## Gate 2 : agrégateur

1. Étendre `ProLite` avec les horodatages de source nécessaires.
2. Implémenter l'agrégateur pur et dédupliquer les relations.
3. Calculer les totaux, pourcentages, médiane, couverture et date d'arrêt.
4. Tester un jeu de données miniature avec doublons, actifs et inactifs.

## Gate 3 : surfaces de données

1. Créer la page `/donnees/`.
2. Créer les distributions JSON et CSV.
3. Créer la description de catalogue JSON-LD.
4. Créer `llms-full.txt`.
5. Ajouter les routes au sitemap standard et au sitemap d'orientation IA.

## Gate 4 : hubs

1. Remplacer les agrégats du top 100 par les agrégats complets.
2. Conserver le classement et ses listes inchangés.
3. Corriger les formulations d'exhaustivité.
4. Afficher la date d'arrêt réelle.
5. Relier le Dataset aux distributions nationales.

## Gate 5 : signaux techniques

1. Corriger les groupes de `robots.txt`.
2. Mettre à jour `llms.txt` sans promesse non documentée.
3. Regrouper les schémas en un seul `@graph`.
4. Retirer les métadonnées IA non standard et le speakable global.

## Gate 6 : vérification

1. Installer les dépendances déclarées dans le worktree.
2. Exécuter les contrôles source.
3. Construire un échantillon avec caps de prévisualisation.
4. Vérifier le JSON, le CSV et un hub généré.
5. Vérifier les canoniques, robots, sitemaps et le nombre de scripts JSON-LD.
6. Comparer le HTML du hub avant et après sur les invariants critiques.
7. Préparer le rollback par revert du lot.

## Gate 7 : livraison

Le GO utilisateur a été reçu. La preview
`cf6c01c6-9a88-434b-8b50-5f3fd539a7c1` a été validée avant la production.
Le rollback précédent reste
`da3648e0-6715-4b5f-91fc-e100a4e005b0`.
