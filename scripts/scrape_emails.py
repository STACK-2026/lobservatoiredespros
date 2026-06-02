#!/usr/bin/env python3
"""Scrape emails (and missing phones) from pros' own websites.

WHY a dedicated script instead of `enrich_pros_coords.py --phase B`:
  Phase B's query requires `coords_enriched_at IS NULL`. But the Google Places
  run (enrich_by_gsc_priority.py / --phase P) SETS coords_enriched_at when it
  writes a discovered site_web. So sites discovered by Places are invisible to
  phase B and their emails would never be scraped. This script targets the real
  set: every active pro with a site_web and no email yet, regardless of how the
  site was discovered.

Source of emails = the pro's OWN public website (contact / mentions-legales
pages). Places never exposes email, so this is the only legitimate source.

Usage:
  python3 scripts/scrape_emails.py --limit 50 --dry-run
  python3 scripts/scrape_emails.py --workers 6 --commit
"""
from __future__ import annotations
import argparse
import json
import sys
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts.pros_enrich.contact_scraper import fetch_contacts_for_site
from scripts.pros_enrich.db import (
    get_service_key, update_pro, SUPABASE_URL, _headers,
)


def fetch_targets(key: str, limit: int) -> list[dict]:
    """Active pros with a website but no email yet, most-visible first
    (score_confiance desc is a decent proxy; GSC-priority pros were enriched first
    so they already sit high in this list)."""
    out, offset, page = [], 0, 1000
    while True:
        cap = page if not limit else min(page, limit - len(out))
        if cap <= 0:
            break
        q = (f"pros?select=id,slug,site_web,telephone,email"
             f"&active=eq.true&site_web=not.is.null&email=is.null"
             f"&order=score_confiance.desc.nullslast,id&limit={cap}&offset={offset}")
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{q}", headers=_headers(key))
        with urllib.request.urlopen(req, timeout=40) as r:
            batch = json.loads(r.read().decode())
        if not batch:
            break
        out += batch
        offset += page
        if len(batch) < cap:
            break
    return out


_lock = threading.Lock()
_stats = {"done": 0, "email": 0, "phone": 0, "err": 0}


def process(pro: dict, commit: bool, key: str) -> str:
    site = pro.get("site_web") or ""
    if not site:
        return "no_site"
    try:
        res = fetch_contacts_for_site(site)
    except Exception:
        with _lock: _stats["err"] += 1
        return "err"
    body: dict = {}
    email = (res.get("primary_email") or "").strip()
    phones = res.get("phones") or []
    if email:
        body["email"] = email
    if phones and not pro.get("telephone"):
        body["telephone"] = phones[0]
    if not body:
        return "empty"
    with _lock:
        if email: _stats["email"] += 1
        if "telephone" in body: _stats["phone"] += 1
    if commit:
        try:
            update_pro(key, pro["id"], body)
        except Exception:
            with _lock: _stats["err"] += 1
            return "err_db"
    return "ok"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="0 = all")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if args.dry_run and args.commit:
        print("[FATAL] --dry-run and --commit are mutually exclusive"); sys.exit(1)

    key = get_service_key()
    targets = fetch_targets(key, args.limit)
    print(f"[info] email-scrape targets={len(targets)} workers={args.workers} commit={args.commit}")
    if not targets:
        print("nothing to do."); return

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = [ex.submit(process, p, args.commit, key) for p in targets]
        for f in as_completed(futs):
            try: f.result()
            except Exception: pass
            with _lock:
                _stats["done"] += 1
                if _stats["done"] % 100 == 0 or _stats["done"] == len(targets):
                    el = time.time() - t0
                    print(f"  {_stats['done']}/{len(targets)} email={_stats['email']} "
                          f"phone={_stats['phone']} err={_stats['err']} "
                          f"({_stats['done']/max(el,0.1):.1f}/s)")
    el = time.time() - t0
    print(f"\n[done] processed={_stats['done']} email+={_stats['email']} "
          f"phone+={_stats['phone']} err={_stats['err']} in {el:.0f}s")


if __name__ == "__main__":
    main()
