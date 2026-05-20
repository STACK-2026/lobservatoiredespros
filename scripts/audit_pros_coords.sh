#!/usr/bin/env bash
# Final verification audit for pros coords enrichment pipeline.
# Run AFTER Phase B completes. Outputs full coverage report.
set -euo pipefail

cd "$(dirname "$0")/.."

SUPABASE_PAT=$(grep '^SUPABASE_PAT=' ../.env.master | cut -d= -f2)
SERVICE_KEY=$(curl -sS "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true" \
  -H "Authorization: Bearer $SUPABASE_PAT" \
  -H "User-Agent: ObservatoireDesProsBot/1.0" \
  | python3 -c "import json,sys;[print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role']")

api() {
  curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/$1" \
    -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" "${@:2}"
}

count_field() {
  api "pros?select=id&active=eq.true&$1=not.is.null" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 \
    | grep -i "content-range" | sed 's/.*\///' | tr -d '\r'
}

TOTAL=$(api "pros?select=id&active=eq.true" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 \
  | grep -i "content-range" | sed 's/.*\///' | tr -d '\r')

echo "=== Pros coords enrichment audit (active pros: $TOTAL) ==="
for f in telephone email site_web coords_enriched_at; do
  N=$(count_field "$f")
  pct=$(python3 -c "print(f'{$N/$TOTAL*100:.2f}')")
  printf "  %-22s %6s / %s (%s%%)\n" "$f" "$N" "$TOTAL" "$pct"
done

echo ""
echo "=== Phase B specifically (coords_source=site_web) ==="
B=$(api "pros?select=id&coords_source=eq.site_web" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 \
  | grep -i "content-range" | sed 's/.*\///' | tr -d '\r')
B_EMAIL=$(api "pros?select=id&coords_source=eq.site_web&email=not.is.null" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 \
  | grep -i "content-range" | sed 's/.*\///' | tr -d '\r')
B_PHONE=$(api "pros?select=id&coords_source=eq.site_web&telephone=not.is.null" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 \
  | grep -i "content-range" | sed 's/.*\///' | tr -d '\r')
echo "  processed by Phase B  : $B"
echo "  with email            : $B_EMAIL"
echo "  with telephone        : $B_PHONE"

echo ""
echo "=== Idempotence test (Phase B remaining queue) ==="
REM=$(api "pros?select=id&active=eq.true&site_web=not.is.null&coords_enriched_at=is.null" -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 \
  | grep -i "content-range" | sed 's/.*\///' | tr -d '\r')
echo "  Phase B pending       : $REM (should be 0 after full run)"

echo ""
echo "=== Unit tests ==="
python3 -m pytest tests/pros_enrich/ -q 2>&1 | tail -3

echo ""
echo "=== Cross-project leak check ==="
LEAKS=$(grep -rE "augustinfoucheres|score-immo\.fr|expert-menuiserie\.fr|scoreimmo|commandeici|petfoodrate|kapital-pro|lobservatoiredespros\.com.*expert" \
  scripts/pros_enrich/ scripts/enrich_pros_coords.py 2>/dev/null | grep -v ".pyc" | head -3 || true)
if [ -z "$LEAKS" ]; then
  echo "  No portfolio cross-references found in pros_enrich code"
else
  echo "  LEAKS DETECTED:"
  echo "$LEAKS"
fi

echo ""
echo "=== Em-dash check ==="
DASHES=$(grep -rn -E "—|–" scripts/pros_enrich/ scripts/enrich_pros_coords.py docs/pros_enrich_runbook.md 2>/dev/null | head -3 || true)
if [ -z "$DASHES" ]; then
  echo "  No em-dashes in code or docs"
else
  echo "  EM-DASHES FOUND:"
  echo "$DASHES"
fi

echo ""
echo "=== Sample 5 random Phase B pros (visual QA) ==="
api "pros?select=slug,telephone,email,site_web&coords_source=eq.site_web&order=coords_enriched_at.desc&limit=5" \
  | python3 -m json.tool

echo ""
echo "=== AUDIT COMPLETE ==="
