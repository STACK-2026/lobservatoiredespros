# Plan marathon , Enrichissement national + citabilité IA (L'Observatoire des Pros)

Démarré le 18/06/2026. Conversation Claude laissée ouverte pour exécution étape par étape.

## Objectif
Que **toute la donnée soit réelle pour les 103 650 pros actifs** (pas seulement la Yonne) :
RGE, Qualibat, BODACC, enrichissement entreprise, puis **re-scoring** national. Résultat :
chaque page métier×département porte un **Score de Confiance réel** + le **schema Dataset** +
la **phrase pré-citable** « D'après L'Observatoire des Pros, X% des [métier] de [dept]… » →
matière à **citation par les IA** (objectif position 0 / cité par ChatGPT/Perplexity/Gemini).

## État initial (18/06)
- 103 650 pros actifs. ~6 449 avec RGE (Yonne + 1 vague). Hors Yonne : RGE/Qualibat à 0%, score médian ~1 (non enrichi).
- Tracker AI-visibility : baseline **0/25 cité** (toutes flagships).

## Contraintes (à garder en tête)
- **Rate limits API** : ADEME ~6 req/s (RGE), BODACC ~5 req/s, recherche-entreprises ~modéré. → enrichissement = **plusieurs jours**, source par source, jamais en parallèle (quotas + charge Mac).
- **CI cassée** : `deploy-site.yml` plante sur `npm ci` (package-lock désynchronisé, esbuild). → déploiements en **wrangler manuel** tant que non réparée (Phase 6).
- **Build complet** = ~41 min (17 579 pages), lit Supabase (anon embarqué suffit).
- **Garde-fou véracité EN PLACE** : les pages n'affichent %RGE/Qualibat + Dataset QUE si la donnée est réelle (`dataReliable = rgeCount>0 || qualibatCount>0`). → **aucune donnée fausse n'est publiée à aucun moment**, les pages « s'allument » au fil de l'enrichissement, après chaque rebuild.

## Recette service key (toutes les commandes)
```bash
cd ~/stack-2026/lobservatoiredespros
PAT=$(grep '^SUPABASE_PAT=' ~/stack-2026/.env.master | cut -d= -f2)
export SUPABASE_SERVICE_KEY=$(curl -sS "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true" -H "Authorization: Bearer $PAT" | python3 -c "import json,sys;[print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role']")
export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY"
```

---

## ÉTAPES

### Phase 0 , Préparation , ✅ FAIT (18/06)
- [x] Garde-fou véracité codé (`src/pages/[metier]/[departement]/index.astro`, helper `jsonLdDataset` dans `seo.ts`).
- [x] Bug upsert `pro_qualifications` (ON CONFLICT doublons) corrigé dans `sync_rge_qualifications.py` (dédup par clé de conflit). Validé dept 90 = 0 erreur.
- [x] llms.txt passé en national + section « comment nous citer ».
- [x] Tracker AI-visibility hebdo en place (`~/stack-2026/scripts/ai_visibility/`, launchd lundi 9h).
- [ ] **Déployer le garde-fou** (build en cours) → live véridique. Vérifier : pages non enrichies n'affichent plus de %RGE.

### Phase 1 , RGE national , 🔄 EN COURS (~6h)
- [x] Lancé : `SUPABASE_SERVICE_KEY=… nohup python3 scripts/sync_rge_qualifications.py --all --workers 5 &` (log `reports/rge_sync_all_*.log`).
- [ ] Surveiller : `tail -f reports/rge_sync_all_*.log` ; vérifier 0 ERROR, débit ~5/s.
- [ ] Fin : contrôler le compte `rge=true` (doit passer de ~6,4k à un total cohérent).
- [ ] **Rebuild + deploy wrangler** → pages RGE/score nationales s'allument. Vérifier 3-4 depts live (Dataset + phrase citable réels, pas de 0%).

### Phase 2 , BODACC national (J+1, ~6h)
- [ ] `python3 scripts/sync_bodacc.py --commit --only-missing` (rate 5 req/s ; `--only-missing` = reprenable). Dry-run d'abord sans `--commit`.
- [ ] Vérifier Trust Score v2 alimenté, 0 erreur.

### Phase 3 , Enrichissement entreprise (J+2, ~quelques h)
- [ ] `python3 scripts/enrich_entreprise.py --commit --only-missing --workers 10` (dry-run d'abord).
- [ ] Vérifier formes juridiques, dirigeants, effectifs remplis.

### Phase 4 , Geocoding manquant (J+2/3, court)
- [ ] `python3 scripts/geocode_pros.py --commit --only-missing`.

### Phase 5 , Re-scoring + rebuild final + deploy (J+3)
- [ ] Le score est recalculé par chaque script enrichisseur ; vérifier la cohérence du `score_confiance` national (médianes plausibles, pas de ~1 généralisé).
- [ ] **Build complet + wrangler deploy** final.
- [ ] Vérif live large : échantillon de 8-10 pages métier×dept variées (Dataset + phrase + score réels + 0 tiret cadratin + 200).

### Phase 6 , Réparer la CI (lockfile)
- [ ] `npm install` (régénère `package-lock.json` en phase avec esbuild), vérifier que le diff ne touche QUE les deps, commit + push. → re-active deploy-site.yml + rebuild-guard auto.

### Phase 7 , Mesure (J+7 puis J+14)
- [ ] Relancer le tracker : `set -a; . ~/stack-2026/.env.master; set +a; python3 ~/stack-2026/scripts/ai_visibility/track.py` (ou attendre le cron lundi).
- [ ] Comparer le taux de citation vs baseline 0/25. Croiser avec GSC (impressions/position).
- [ ] **Décision** : si la citation monte → répliquer le playbook (Dataset + phrase citable + données réelles) sur **petfoodrate**, puis declarisons, score-immo, karmastro. Si ça ne bouge pas → le levier est le ranking/autorité (backlinks externes), pas l'on-page.

---

## Journal d'avancement
- 18/06 19h : Phase 0 quasi finie (garde-fou en build), Phase 1 lancée (RGE --all clean), bug dedup corrigé+validé.
