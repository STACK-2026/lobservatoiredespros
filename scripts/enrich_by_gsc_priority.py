#!/usr/bin/env python3
"""Enrich pros by GSC visibility priority (Google Places escargot).

Unlike enrich_pros_coords.py --phase P (which orders the queue by score_confiance),
this runner enriches the pros that users ACTUALLY SEE in Google first: pages that
already get clicks / impressions in Search Console. This maximises the value of the
limited Google Places free tier (~5-6k calls/month) by spending it on the pages most
likely to convert a visitor into a lead.

Pipeline:
  1. Pull /pro/ page performance from GSC (last 28d), rank clicks desc then impr desc.
  2. Cross-reference with the pros table; keep only pros still PENDING phase P
     (no site_web AND coords_enriched_at IS NULL) so we never re-bill an enriched pro.
  3. Call Google Places (NEW) Text Search for each, write telephone + site_web to Supabase.
     Every processed pro is marked coords_enriched_at so a re-run skips it (no double billing).

Emails are NOT fetched here (Places never returns email). After this run, the newly
discovered websites become the phase B queue:
    python3 scripts/enrich_pros_coords.py --phase B --workers 6 --commit

Usage:
  python3 scripts/enrich_by_gsc_priority.py --limit 30 --dry-run
  python3 scripts/enrich_by_gsc_priority.py --limit 5000 --workers 4 --commit
"""
from __future__ import annotations
import argparse
import json
import sys
import threading
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts.pros_enrich.places import search_pro as places_search_pro
from scripts.pros_enrich.db import (
    get_service_key,
    update_pro,
    build_update_body,
    SUPABASE_URL,
    _headers,
)

ENV = {}
for line in (ROOT.parent / ".env.master").read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        ENV[k.strip()] = v.strip()

GSC_SITE = "sc-domain:lobservatoiredespros.com"
TODAY = date(2026, 6, 2)


def gsc_token() -> str:
    data = urllib.parse.urlencode({
        "client_id": ENV["GSC_CLIENT_ID"], "client_secret": ENV["GSC_CLIENT_SECRET"],
        "refresh_token": ENV["GSC_REFRESH_TOKEN"], "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())["access_token"]


def gsc_pro_pages(token: str, days: int = 28) -> list[dict]:
    """Return [{slug, impr, clicks, pos}] for /pro/ pages, ranked clicks desc then impr desc."""
    url = (f"https://www.googleapis.com/webmasters/v3/sites/"
           f"{urllib.parse.quote(GSC_SITE, safe='')}/searchAnalytics/query")
    start = (TODAY - timedelta(days=days)).isoformat()
    rows, sr = [], 0
    while True:
        payload = {"startDate": start, "endDate": TODAY.isoformat(), "dimensions": ["page"],
                   "rowLimit": 25000, "startRow": sr, "dataState": "all"}
        req = urllib.request.Request(url, data=json.dumps(payload).encode(),
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=60) as r:
            batch = json.loads(r.read().decode()).get("rows", [])
        rows += batch
        if len(batch) < 25000:
            break
        sr += 25000
    out = []
    for r in rows:
        page = r["keys"][0]
        if "/pro/" not in page:
            continue
        out.append({"slug": page.rstrip("/").split("/pro/")[-1],
                    "impr": r["impressions"], "clicks": r["clicks"], "pos": r["position"]})
    out.sort(key=lambda g: (g["clicks"], g["impr"]), reverse=True)
    return out


def fetch_pending(key: str, slugs: list[str]) -> dict[str, dict]:
    """Map slug -> pro row, only for pros still PENDING phase P."""
    status = {}
    CH = 150
    for i in range(0, len(slugs), CH):
        chunk = slugs[i:i + CH]
        inlist = ",".join(chunk)
        q = (f"pros?select=id,slug,nom_entreprise,ville,code_postal,site_web,telephone,coords_enriched_at"
             f"&active=eq.true&slug=in.({inlist})")
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{q}", headers=_headers(key))
        with urllib.request.urlopen(req, timeout=40) as r:
            for row in json.loads(r.read().decode()):
                status[row["slug"]] = row
    return status


_lock = threading.Lock()
_stats = {"done": 0, "phone": 0, "site": 0, "match": 0}


def process(pro: dict, commit: bool, key: str) -> str:
    try:
        res = places_search_pro(pro)
    except Exception:
        return "err"
    body = build_update_body(res, source="google_places")
    with _lock:
        if res.get("phones"): _stats["phone"] += 1
        if res.get("site_web_final"): _stats["site"] += 1
        if res.get("matched"): _stats["match"] += 1
    if commit:
        try:
            update_pro(key, pro["id"], body)
        except Exception:
            return "err_db"
    return "ok"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=5000, help="max Places calls (free-tier guard)")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--days", type=int, default=28)
    args = ap.parse_args()
    if args.dry_run and args.commit:
        print("[FATAL] --dry-run and --commit are mutually exclusive"); sys.exit(1)

    key = get_service_key()
    print("[1/3] pulling GSC /pro/ visibility ...")
    tok = gsc_token()
    pages = gsc_pro_pages(tok, days=args.days)
    print(f"      {len(pages)} /pro/ pages with impressions")

    # Cross-reference enough of the ranked list to fill the limit with PENDING pros.
    # Take a generous slice (3x limit) to absorb already-enriched ones.
    head = pages[: max(args.limit * 3, 9000)]
    status = fetch_pending(key, [p["slug"] for p in head])
    queue = []
    for p in head:
        row = status.get(p["slug"])
        if not row:
            continue
        if row.get("site_web") or row.get("coords_enriched_at"):
            continue  # already enriched or already has a site
        queue.append(row)
        if len(queue) >= args.limit:
            break
    print(f"[2/3] {len(queue)} pending pros queued (ranked by clicks then impressions)")
    if not queue:
        print("      nothing to do."); return
    if args.dry_run:
        print("      DRY-RUN sample (first 8):")
        for row in queue[:8]:
            print(f"        {row['nom_entreprise']} | {row['code_postal']} {row['ville']} | {row['slug']}")

    print(f"[3/3] Places run: calls={len(queue)} workers={args.workers} commit={args.commit}")
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = [ex.submit(process, row, args.commit, key) for row in queue]
        for f in as_completed(futs):
            try:
                f.result()
            except Exception:
                pass
            with _lock:
                _stats["done"] += 1
                if _stats["done"] % 100 == 0 or _stats["done"] == len(queue):
                    el = time.time() - t0
                    print(f"      {_stats['done']}/{len(queue)} "
                          f"match={_stats['match']} phone={_stats['phone']} site={_stats['site']} "
                          f"({_stats['done']/max(el,0.1):.1f}/s)")
    el = time.time() - t0
    print(f"\n[done] calls={_stats['done']} match={_stats['match']} "
          f"phone={_stats['phone']} site={_stats['site']} in {el:.0f}s")
    print("Next (emails, free): python3 scripts/enrich_pros_coords.py --phase B --workers 6 --commit")


if __name__ == "__main__":
    main()
