# Reprise ODP GEO, 28 juillet 2026

Ce document est le handoff de clôture demandé par l'utilisateur. Il faut le
lire avant toute reprise du chantier GEO de L'Observatoire des Pros.

## Production stable au moment de la clôture

- Branche de production : `main`.
- Commit production : `1ec662aaf7e0bfb780a27ae9a82c2e753f275e87`.
- PR du socle GEO : `https://github.com/STACK-2026/lobservatoiredespros/pull/1`.
- PR du correctif de fraîcheur des fiches :
  `https://github.com/STACK-2026/lobservatoiredespros/pull/2`.
- Déploiement Cloudflare intégral actuel :
  `f68edc43-f64e-4a4a-b83d-d002ae75e495`.
- URL immuable :
  `https://f68edc43.lobservatoiredespros.pages.dev`.
- Déploiement intégral précédent :
  `3ef2844a-d2be-4630-ab76-bc420ade592f`.
- Déploiement edge intermédiaire du même commit :
  `55e150d5-12dc-476b-a45e-a4175038fab1`.

Le workflow intégral de la PR 2 est vert :

- GitHub Actions : `30296583919` ;
- durée : 42 min 51 s ;
- build, artefact, Cloudflare, purge et IndexNow réussis.

Le workflow edge `30296583913` et le garde-fou inter-projets `30296583975`
sont également verts.

## Preuves live déjà obtenues

- catalogue de 1 536 agrégats et corpus de 103 650 établissements ;
- 105 404 URL uniques dans les sitemaps de l'artefact, aucun doublon ;
- `/`, `/donnees/`, JSON, `llms-full.txt`, sitemap-index et deux profils
  témoins répondent en 200 ;
- les trois anciennes biographies répondent en 301 vers `/redaction/` ;
- OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot et
  Perplexity-User reçoivent tous un 200 sur `/donnees/` ;
- données JSON, CSV, catalogue, robots, llms et sitemap IA identiques bit à
  bit entre les déploiements `3ef2844a` et `f68edc43` ;
- fiche statique `sh-paysage-babuf` : « Données au 19 juin 2026 » et
  « Données publiques mises à jour le 19 juin 2026 » ;
- fiche longue traîne `flamme-yssingeaux` : 200,
  `x-rendered-by: edge-fallback`, date publique réelle du 19 juin 2026 ;
- aucune des deux fiches ne contient l'ancien « Dernier contrôle Sirene » ni
  le faux « Prochain audit programmé ».

## Diagnostic GSC à conserver

- rapport Pages au 24 juillet : 93,7 k pages indexées ;
- 14,3 k non indexées ;
- aucune action manuelle ;
- aucun problème de sécurité ;
- rupture d'exposition le 22 juillet :
  4 893 pages avec impressions le 21, puis 474 le 22 ;
- 10 URL inspectées sont toujours indexées, crawlables, autorisées et
  canonicalisées ;
- rapport IA Google :
  - 7 jours : 40 impressions sur 39 pages, dont 24 en France ;
  - 28 jours : 258 impressions sur 239 pages ;
  - 3 mois : 951 impressions sur 871 pages ;
- aucun incident Google ni mise à jour publique déclaré autour du 22 juillet ;
- la dernière mise à jour publique antérieure était le spam update de juin,
  sans preuve qu'il soit la cause de la rupture.

Conclusion de travail : le stock indexé n'a pas disparu. Google a brutalement
réduit l'exposition de la longue traîne. Les faux signaux de fraîcheur étaient
une anomalie réelle à corriger, mais leur rôle causal n'est pas prouvé.

Baseline complète : `docs/gsc-baseline-2026-07-27.md`.

## Micro-lot non fusionné à reprendre

Branche locale :

`codex/odp-truthful-crawl-signals`

Portée :

- remplace le faux ticker global « En direct » par des extraits déterministes
  du registre public ;
- retire les heures et les assertions inventées « Score recalculé »,
  « Dossier ouvert » et numéros d'observation ;
- n'affiche plus une date de vérification de qualification lorsque
  `last_checked_at` est absent ;
- ordonne la pagination du sitemap principal par `id` ;
- calcule les `lastmod` des fiches avec le maximum réel de `created_at`,
  `updated_at`, `enriched_at` et `last_trust_sync` ;
- omet `lastmod` lorsqu'aucune date vérifiable n'existe ;
- conserve exactement les 105 404 URL, sans doublon.

État des preuves :

- TDD rouge observé avant implémentation ;
- suite ensuite verte, 10 tests sur 10 ;
- premier build plafonné réussi : 244 pages, 129,48 s ;
- `verify:geo` vert : 1 536 agrégats, 103 650 établissements ;
- sitemap construit : 17 554 URL principales et 87 850 URL longues traînes,
  soit 105 404 URL uniques ;
- 14 URL éditoriales sans date vérifiable omettent volontairement
  `lastmod` ;
- les 87 850 fiches longues traînes ont toutes une date source ;
- le témoin `flamme-yssingeaux` a `lastmod` au 19 juin 2026.

Après ce premier build, la date fixe des pages tarifs a été alignée sur le
dernier commit significatif du fichier source, soit le 11 juin 2026, et une
constante inutilisée a été retirée. Le second build exact a été interrompu à
la demande de l'utilisateur pour reprendre les tests demain. Le dossier
`site/dist` est donc incomplet et ne doit surtout pas être déployé.

## Ordre de reprise obligatoire

1. Lire l'inbox agent-bus Codex.
2. Vérifier la branche et le diff, puis lancer `npm run test:geo`.
3. Relancer le build plafonné exact avec la clé Supabase de `.env.master`.
4. Relancer `npm run verify:geo`.
5. Recompter les 105 404 URL et vérifier leur unicité.
6. Déployer uniquement cet artefact plafonné sur une preview Cloudflare.
7. Vérifier visuellement et par HTTP le ticker, les profils et les sitemaps.
8. Commit, push, ouvrir une PR draft et attendre le garde-fou.
9. Rendre la PR prête, fusionner, attendre le rebuild intégral de 42 minutes.
10. Vérifier le nouveau déploiement immuable, la production canonique, les
    user-agents IA, redirections, dates sources et empreintes.
11. Seulement après cette production finale, resoumettre
    `sitemap-index.xml` et `ai-sitemap.xml` dans GSC.
12. Mettre à jour les preuves, envoyer le message agent-bus à Claude et
    mesurer à J+7, J+14 et J+28.

## Garde-fous

- Ne pas déployer le `dist` local actuel, il provient d'un build interrompu.
- Ne pas réactiver silencieusement le workflow SEO guardrails, il est
  désactivé.
- Ne pas lancer de modification Supabase, aucune mutation DB n'est requise.
- Ne pas lancer `npm audit fix` dans ce chantier.
- Cloudflare Pages est à 19 748 fichiers sur une limite de 20 000.
- Ne pas promettre de citations IA ni attribuer causalement la chute à une
  mise à jour Google sans preuve.

