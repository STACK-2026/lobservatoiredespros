# Runbook : pipeline enrichissement coordonnees pros

## Commandes operationnelles

```bash
cd /Users/lestoilettesdeminette/stack-2026/lobservatoiredespros

# Smoke test (no commit, prints counts only)
python3 scripts/enrich_pros_coords.py --phase B --limit 10 --dry-run

# Phase B (sites web deja connus, ~3 519 pros) - main run
python3 scripts/enrich_pros_coords.py --phase B --workers 6 --commit

# Phase A (annuaire-entreprises) - BLOCKED, source has no contact data
# See plan amendment 2026-05-20 17:25 for alternatives.

# Phase Bprime (re-crawl new site_web from Phase A) - blocked while Phase A is blocked.

# Phase P (Google Places NEW Text Search Pro, escargot mode)
# Ranked by score_confiance DESC, rge DESC, qualif DESC - top tier first
# Free tier ~6 250 calls/month (200 USD / 32 USD/1000 calls)
# Live match rate observed on top-tier RGE pros : 90% phone, 60% site
python3 scripts/enrich_pros_coords.py --phase P --limit 6000 --workers 2 --commit
```

## Background run pattern

```bash
mkdir -p .logs
nohup python3 scripts/enrich_pros_coords.py --phase B --workers 6 --commit \
  > .logs/enrich-phase-B-$(date +%Y%m%d-%H%M).log 2>&1 &
echo "PID=$!"
disown
tail -f .logs/enrich-phase-B-*.log
```

## Monitoring coverage

```bash
SUPABASE_PAT=$(grep '^SUPABASE_PAT=' ../.env.master | cut -d= -f2)
SERVICE_KEY=$(curl -sS "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true" \
  -H "Authorization: Bearer $SUPABASE_PAT" \
  -H "User-Agent: ObservatoireDesProsBot/1.0" \
  | python3 -c "import json,sys;[print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='service_role']")

TOTAL=$(curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pros?select=id&active=eq.true" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 \
  | grep -i content-range | sed 's/.*\///' | tr -d '\r')

echo "=== coverage on $TOTAL active pros ==="
for f in telephone email site_web coords_enriched_at; do
  N=$(curl -sS "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1/pros?select=id&active=eq.true&$f=not.is.null" \
    -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Prefer: count=exact" -H "Range: 0-0" -I 2>&1 \
    | grep -i content-range | sed 's/.*\///' | tr -d '\r')
  pct=$(python3 -c "print(f'{$N/$TOTAL*100:.1f}')")
  echo "  $f filled: $N / $TOTAL ($pct%)"
done
```

## Timings (empirical, May 20 2026)

| Phase | Pros | Workers | Time | Rate | Match (phone / site) |
|---|---|---|---|---|---|
| Smoke B | 5 | 2 | 29 s | 0.17/s | 60% / 40% (5-pro variance) |
| B test 50 | 50 | 4 | 134 s | 0.37/s | 38% / 0% (most already had) |
| B full 3 519 | 3 519 | 6 | ~26 min (proj) | 2.3/s | ~90% / 0% (site_web pre-known) |
| P smoke 5 | 5 | 1 | 3 s | 1.6/s | 100% / 80% (top-tier RGE) |
| P test 50 | 50 | 2 | 18 s | 2.8/s | 90% / 60% (top-tier RGE) |
| P escargot 500 | 500 | 2 | ~3 min | 2.8/s | (running) |

Bottleneck Phase B : `MIN_DELAY=0.4` to `MAX_DELAY=1.2` random delay per HTTP fetch + 7 paths per pro.
Bottleneck Phase P : `MIN_DELAY=0.3` between Google calls (60 QPS soft limit, well under).
DEAD_DOMAINS cache short-circuits poorly-maintained sites.

## Phase P free tier budget

- 200 USD/month Google Maps Platform credit (GCP project 3729498435)
- Text Search Pro field mask : 32 USD / 1000 calls
- Monthly capacity : ~6 250 calls free
- Cost per nickel contact (normalized phone) : ~0.022 USD at 90% match rate

To check current quota consumed manually :
`https://console.cloud.google.com/google/maps-apis/quotas?project=3729498435`

## Idempotence

Re-running the same phase is safe : `coords_enriched_at IS NULL` filter skips already-processed pros.

To force re-enrichment of a specific pro :
```sql
update pros set coords_enriched_at = null, coords_source = null where id = 'xxx';
```

## Extraction quality benchmark (50-pro test)

- `email` extraction : 22 % (11 / 50 new emails found)
- `phone` extraction : 38 % (19 / 50 new phones found)
- `miss` rate : 0 % (all 50 pros visited successfully)

Pros without extractable contact info are marked `coords_enriched_at = now()` + `coords_source = 'site_web'` with `telephone/email` left unchanged (preserves any OSM data).

## Phone format note

Existing OSM-enriched phones are stored in raw `0X XX XX XX XX` format. New phones from this pipeline are normalized to `+33XXXXXXXXX`. Future work : run a normalization pass over the legacy OSM phones.

## Files

- `scripts/enrich_pros_coords.py` : orchestrator CLI
- `scripts/pros_enrich/helpers.py` : regex + validation
- `scripts/pros_enrich/contact_scraper.py` : site crawler
- `scripts/pros_enrich/api_gouv.py` : annuaire (currently inert, source blocked)
- `scripts/pros_enrich/db.py` : Supabase REST layer
- `tests/pros_enrich/` : 29 unit tests
- `.cache/pros_contact_html/` : HTML response cache (gitignored)

## Anti-source rule

Do NOT scrape Pages Jaunes, Societe.com, LinkedIn, or commercial directories without explicit user authorization. The current pipeline only touches the pro's own published website + (when source is added) Google Places API. See plan amendment for Phase A alternatives.
