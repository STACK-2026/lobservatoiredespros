#!/bin/bash
# Test /api/candidature endpoint apres deploy.
# Usage : bash scripts/test_candidature_api.sh

set -e

BASE="${BASE:-https://lobservatoiredespros.com}"

echo "=== Test 1 : GET (devrait etre 405) ==="
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE/api/candidature"
echo

echo "=== Test 2 : POST avec donnees factices valides ==="
RESPONSE=$(curl -s -o /tmp/cand_resp.txt -w "%{http_code}|%{redirect_url}" -X POST \
  "$BASE/api/candidature" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "nom=Test+Co&siret=12345678901234&naf=43.22A&dirigeant=Test+Test&email=test@test.fr&metier=plombier&departement=89&specialites=test&anciennete=2020&formule=recommandé&motivation=Test+API&rgpd=on")
echo "Reponse: $RESPONSE"
[ -s /tmp/cand_resp.txt ] && cat /tmp/cand_resp.txt
echo

echo "=== Test 3 : POST avec champ manquant (devrait etre 400) ==="
curl -s -o /tmp/cand_resp2.txt -w "Status: %{http_code}\n" -X POST \
  "$BASE/api/candidature" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "nom=Test"
[ -s /tmp/cand_resp2.txt ] && cat /tmp/cand_resp2.txt
echo

echo "=== Test 4 : Verifier que /candidater/merci/ existe ==="
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE/candidater/merci/"
echo

echo "=== Test 5 : Verifier la table candidatures DB ==="
PAT=$(grep '^SUPABASE_PAT=' ~/stack-2026/.env.master | cut -d= -f2)
curl -s -X POST "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/database/query" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -H "User-Agent: lobs-test/1.0" \
  -d '{"query":"SELECT COUNT(*) AS total, MAX(created_at) AS last FROM candidatures;"}'
echo
