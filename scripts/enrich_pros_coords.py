#!/usr/bin/env python3
"""Pipeline coords enrichment.

Usage:
  python3 scripts/enrich_pros_coords.py --phase B --limit 10 --dry-run
  python3 scripts/enrich_pros_coords.py --phase B --workers 6 --commit
  python3 scripts/enrich_pros_coords.py --phase A --workers 4 --commit
  python3 scripts/enrich_pros_coords.py --phase Bprime --workers 6 --commit
  python3 scripts/enrich_pros_coords.py --phase P --limit 50 --workers 2 --commit  # escargot Google Places
"""
from __future__ import annotations
import argparse
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# Ensure repo root on path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts.pros_enrich.contact_scraper import fetch_contacts_for_site
from scripts.pros_enrich.api_gouv import fetch_annuaire_entreprise
from scripts.pros_enrich.places import search_pro as places_search_pro
from scripts.pros_enrich.db import (
    get_service_key,
    fetch_pros_batch,
    update_pro,
    build_update_body,
    count_pros_for_phase,
)

_lock = threading.Lock()
_stats = {"ok_email": 0, "ok_phone": 0, "ok_site": 0, "miss": 0, "done": 0}


def process_one(pro: dict, phase: str, commit: bool, key: str) -> str:
    if phase in ("B", "Bprime"):
        site = pro.get("site_web") or ""
        if not site:
            return "no_site"
        try:
            res = fetch_contacts_for_site(site)
        except Exception:
            return "err"
        res["site_web_final"] = site
        body = build_update_body(res, source="site_web")
        with _lock:
            if res.get("primary_email"): _stats["ok_email"] += 1
            if res.get("phones"): _stats["ok_phone"] += 1
        if not res.get("primary_email") and not res.get("phones"):
            # mark visited even when nothing found, so we don't re-crawl
            body = {"coords_enriched_at": body["coords_enriched_at"], "coords_source": "site_web"}
        if commit:
            try:
                update_pro(key, pro["id"], body)
            except Exception:
                return "err_db"
        return "ok"

    if phase == "A":
        siren = pro.get("siren") or ""
        if not siren:
            return "no_siren"
        try:
            res = fetch_annuaire_entreprise(siren)
        except Exception:
            return "err"
        # res may have site_web / telephone / email
        site = (res.get("site_web") or "").strip()
        body_data = {
            "primary_email": res.get("email") or "",
            "phones": [res.get("telephone")] if res.get("telephone") else [],
            "site_web_final": site,
        }
        body = build_update_body(body_data, source="annuaire")
        with _lock:
            if site: _stats["ok_site"] += 1
            if res.get("email"): _stats["ok_email"] += 1
            if res.get("telephone"): _stats["ok_phone"] += 1
        if commit:
            try:
                update_pro(key, pro["id"], body)
            except Exception:
                return "err_db"
        return "ok"

    if phase == "P":
        # Google Places API NEW Text Search Pro (escargot mode).
        # Always marks pro as visited via coords_enriched_at so we never re-bill the same pro.
        try:
            res = places_search_pro(pro)
        except Exception:
            return "err"
        body = build_update_body(res, source="google_places")
        with _lock:
            if res.get("phones"): _stats["ok_phone"] += 1
            if res.get("site_web_final"): _stats["ok_site"] += 1
        if commit:
            try:
                update_pro(key, pro["id"], body)
            except Exception:
                return "err_db"
        return "ok" if res.get("matched") else "no_match"

    raise ValueError(f"unknown phase: {phase}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", choices=["B", "A", "Bprime", "P"], required=True)
    parser.add_argument("--limit", type=int, default=0, help="0 = no cap")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.dry_run and args.commit:
        print("[FATAL] --dry-run and --commit are mutually exclusive")
        sys.exit(1)

    key = get_service_key()
    total = count_pros_for_phase(key, args.phase)
    print(f"[info] phase={args.phase} total_pending={total} workers={args.workers} commit={args.commit}")

    # Pagination loop
    fetched = 0
    offset = 0
    page = 1000
    pros: list = []
    while True:
        if args.limit and fetched >= args.limit:
            break
        batch = fetch_pros_batch(key, args.phase, limit=page, offset=offset)
        if not batch:
            break
        if args.limit:
            batch = batch[: max(0, args.limit - fetched)]
        pros.extend(batch)
        fetched += len(batch)
        offset += page
        if len(batch) < page:
            break

    print(f"[info] fetched={len(pros)} pros from phase queue")

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futures = [ex.submit(process_one, pro, args.phase, args.commit, key) for pro in pros]
        for f in as_completed(futures):
            try:
                status = f.result()
            except Exception:
                status = "err"
            with _lock:
                _stats["done"] += 1
                if status != "ok":
                    _stats["miss"] += 1
                if _stats["done"] % 50 == 0 or _stats["done"] == len(pros):
                    elapsed = time.time() - t0
                    rate = _stats["done"] / max(elapsed, 0.1)
                    print(
                        f"  progress {_stats['done']}/{len(pros)} "
                        f"email={_stats['ok_email']} phone={_stats['ok_phone']} site={_stats['ok_site']} "
                        f"miss={_stats['miss']} ({rate:.1f}/s)"
                    )

    elapsed = time.time() - t0
    print(
        f"\n[done] phase={args.phase} processed={_stats['done']} "
        f"email={_stats['ok_email']} phone={_stats['ok_phone']} site={_stats['ok_site']} "
        f"miss={_stats['miss']} in {elapsed:.0f}s"
    )


if __name__ == "__main__":
    main()
