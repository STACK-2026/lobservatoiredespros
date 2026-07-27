# Baseline crawl IA

Date de mesure : 27 juillet 2026

Source : table Supabase `page_views`, lectures seules.

## Réserve de mesure

Les familles de robots sont identifiées par le `User-Agent` enregistré. Les
volumes prouvent que des clients se déclarant comme ces robots accèdent au
site. Ils ne prouvent pas à eux seuls que chaque requête vient d'une plage IP
officielle.

## Volumes cumulés observés

| Famille déclarée | Requêtes | Première vue | Dernière vue |
| --- | ---: | --- | --- |
| GPTBot | 995 823 | 27 avril | 26 juillet |
| ClaudeBot | 436 192 | 7 mai | 27 juillet |
| OAI-SearchBot | 28 214 | 2 mai | 27 juillet |
| PerplexityBot | 22 187 | 29 avril | 26 juillet |
| ChatGPT-User | 7 445 | 29 avril | 27 juillet |
| Claude-SearchBot | 13 | 8 mai | 27 juillet |
| Claude-User | 32 | 13 mai | 26 juillet |

Total de requêtes déclarées comme bots, toutes familles : 2 933 522.

## Lecture

- GPTBot et ClaudeBot ont réalisé des vagues de crawl très importantes.
- OAI-SearchBot reste actif et a dépassé 3 400 requêtes sur la semaine du
  20 juillet.
- ChatGPT-User reste régulièrement présent.
- PerplexityBot a fortement ralenti : plus de 8 600 requêtes sur la semaine du
  11 mai, contre 69 sur celle du 20 juillet.
- Les tests HTTP actuels renvoient 200 à OAI-SearchBot, Claude-SearchBot,
  PerplexityBot et GPTBot sur un hub et une fiche.

## Conclusion

Le site n'a pas un problème général d'interdiction des crawlers IA. Le
principal écart se situe après la découverte : périmètres statistiques
ambigus, absence de distributions téléchargeables, fraîcheur artificielle et
signaux non standard survalorisés.

Le suivi futur doit séparer :

1. robots de formation ;
2. robots de recherche et d'indexation ;
3. agents déclenchés par un utilisateur ;
4. citations réellement mesurées dans les réponses.
