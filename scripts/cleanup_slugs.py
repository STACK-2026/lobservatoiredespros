#!/usr/bin/env python3
"""
cleanup_slugs.py , retire les suffixes numeriques (-632116) des slugs.

Strategie :
- Fetch tous les pros
- Pour chaque pro avec slug finissant par -\d{5,6}, strip le suffixe
- Si collision avec un autre pro, append -2, -3, -4...
- UPDATE Supabase batch

Usage :
  python3 scripts/cleanup_slugs.py --dry-run
  python3 scripts/cleanup_slugs.py --commit
"""
import argparse
import json
import os
import re
import sys
import urllib.request
from collections import defaultdict
from pathlib import Path

SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co"


def get_service_key():
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if key:
        return key
    cache = Path("/tmp/lobs_svc.txt")
    if cache.exists():
        return cache.read_text().strip()
    env_master = Path.home() / "stack-2026" / ".env.master"
    if env_master.exists():
        for line in env_master.read_text().splitlines():
            if line.startswith("SUPABASE_SERVICE_KEY="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("SUPABASE_SERVICE_KEY introuvable")


def fetch_all_pros(service_key):
    """Fetch all pros in pages of 1000."""
    all_rows = []
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/pros?select=id,slug&active=eq.true&limit=1000&offset={offset}"
        req = urllib.request.Request(url, headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "User-Agent": "lobservatoiredespros-cleanup/1.0",
        })
        with urllib.request.urlopen(req, timeout=30) as r:
            rows = json.loads(r.read())
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < 1000:
            break
        offset += 1000
    return all_rows


def clean_slug(slug):
    """Retire le suffixe -\d{5,6} final."""
    return re.sub(r"-\d{5,6}$", "", slug)


def patch_slug(service_key, pro_id, new_slug):
    url = f"{SUPABASE_URL}/rest/v1/pros?id=eq.{pro_id}"
    payload = {"slug": new_slug}
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        method="PATCH",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
            "User-Agent": "lobservatoiredespros-cleanup/1.0",
        },
    )
    try:
        urllib.request.urlopen(req, timeout=15)
        return True
    except urllib.error.HTTPError as e:
        print(f"    PATCH ERROR {e.code} for {pro_id}: {e.read()[:200]}", file=sys.stderr)
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()
    if not args.dry_run and not args.commit:
        ap.error("--dry-run ou --commit")

    service_key = get_service_key()
    pros = fetch_all_pros(service_key)
    print(f"Fetched {len(pros)} pros")

    # Compute new slugs with collision handling
    occurrences = defaultdict(int)  # base_slug -> count
    changes = []  # list of (pro_id, old_slug, new_slug)

    # Sort by slug so the first occurrence (alphabetically) gets the base slug
    sorted_pros = sorted(pros, key=lambda p: p["slug"])

    for p in sorted_pros:
        old = p["slug"]
        base = clean_slug(old)
        occurrences[base] += 1
        if occurrences[base] == 1:
            new = base
        else:
            new = f"{base}-{occurrences[base]}"
        if new != old:
            changes.append((p["id"], old, new))

    print(f"\n{len(changes)} slugs a renommer :")
    for pid, old, new in changes[:10]:
        print(f"  {old} -> {new}")
    if len(changes) > 10:
        print(f"  ... et {len(changes) - 10} autres")

    if args.dry_run:
        print("\n[dry-run] pas de PATCH effectue.")
        return

    # Commit , on ne peut pas le faire naivement car certains nouveaux slugs existent deja
    # (ex: on veut renommer A en B, mais B existe deja avec un suffixe digit , donc B va
    # aussi etre renomme). Workaround : 2-pass
    # Pass 1 : rename tout en __old_{slug} (temporaire unique)
    # Pass 2 : rename __old_{slug} en le nom final
    print(f"\nCommit : 2-pass rename (temp -> final)")

    # Pass 1 : temp names
    ok1 = 0
    for pid, old, new in changes:
        temp = f"__tmp__{pid[-12:]}__"
        if patch_slug(service_key, pid, temp):
            ok1 += 1
    print(f"  pass 1 (temp) : {ok1}/{len(changes)}")

    # Pass 2 : final names
    ok2 = 0
    for pid, old, new in changes:
        if patch_slug(service_key, pid, new):
            ok2 += 1
    print(f"  pass 2 (final) : {ok2}/{len(changes)}")


if __name__ == "__main__":
    main()
