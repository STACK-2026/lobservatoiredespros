#!/bin/bash
# Marathon enrichissement national , chaîne complète "au millimètre"
# Ordre: attendre RGE (déjà lancé) -> enrich entreprise -> geocode -> BODACC (trust score en dernier)
# Lancé via nohup + caffeinate. Logs par source dans reports/.
set -uo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
TS=$(date +%Y%m%d_%H%M)
mkdir -p reports
CHAIN_LOG="reports/chain_${TS}.log"
exec > >(tee -a "$CHAIN_LOG") 2>&1

echo "=================================================="
echo "[chain] DÉMARRAGE $(date '+%F %T')"
echo "=================================================="

# --- service key ---
PAT=$(grep '^SUPABASE_PAT=' ~/stack-2026/.env.master | cut -d= -f2)
export SUPABASE_SERVICE_KEY=$(curl -sS "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true" -H "Authorization: Bearer $PAT" | python3 -c "import json,sys;[print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role']")
export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY"
# geocode_pros.py exige aussi SUPABASE_URL (sinon [FATAL] et skip) , incident 19/06
export SUPABASE_URL="https://apuyeakgxjgdcfssrtek.supabase.co"
if [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then echo "[chain] ERREUR: pas de service key"; exit 1; fi
echo "[chain] service key OK"

# --- 1. attendre la fin du RGE déjà en cours ---
echo "[chain] attente fin RGE..."
while pgrep -f sync_rge_qualifications >/dev/null; do sleep 60; done
echo "[chain] RGE terminé $(date '+%F %T')"

# --- 2. enrich entreprise (refresh complet) , conditionnel: API recherche-entreprises souvent down ---
echo "[chain] >>> ENRICH ENTREPRISE , health check API recherche-entreprises $(date '+%F %T')"
RE_TEST="https://recherche-entreprises.api.gouv.fr/search?q=833413271&per_page=1"
API_OK=0
for attempt in $(seq 1 12); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0" --max-time 20 "$RE_TEST")
  if [ "$code" = "200" ]; then API_OK=1; echo "[chain] API recherche-entreprises OK (HTTP 200) tentative $attempt"; break; fi
  echo "[chain] API recherche-entreprises indispo (HTTP $code), tentative $attempt/12, attente 10min"
  sleep 600
done
if [ "$API_OK" = "1" ]; then
  echo "[chain] >>> ENRICH ENTREPRISE (full) $(date '+%F %T')"
  python3 scripts/enrich_entreprise.py --commit --workers 10 > "reports/enrich_entreprise_${TS}.log" 2>&1
  echo "[chain] enrich entreprise fini, rc=$? $(date '+%F %T')"
  tail -6 "reports/enrich_entreprise_${TS}.log"
else
  echo "[chain] !!! SKIP enrich entreprise: API toujours indisponible après 2h de retry. Données d'avril conservées. À relancer manuellement quand l'API revient: python3 scripts/enrich_entreprise.py --commit --workers 10"
  touch "reports/ENRICH_SKIPPED_${TS}.marker"
fi

# --- 3. geocode (seulement les manquants) ---
echo "[chain] >>> GEOCODE (only-missing) $(date '+%F %T')"
python3 scripts/geocode_pros.py --commit --only-missing --workers 10 > "reports/geocode_${TS}.log" 2>&1
echo "[chain] geocode fini, rc=$? $(date '+%F %T')"
tail -6 "reports/geocode_${TS}.log"

# --- 4. BODACC + Trust Score (en dernier: croise RGE+entreprise+bodacc) ---
echo "[chain] >>> BODACC + TRUST SCORE (full) $(date '+%F %T')"
python3 scripts/sync_bodacc.py --commit --workers 8 > "reports/bodacc_${TS}.log" 2>&1
echo "[chain] bodacc fini, rc=$? $(date '+%F %T')"
tail -8 "reports/bodacc_${TS}.log"

echo "=================================================="
echo "[chain] CHAÎNE TERMINÉE $(date '+%F %T')"
echo "=================================================="
touch "reports/CHAIN_DONE_${TS}.marker"
