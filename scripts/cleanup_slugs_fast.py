#!/usr/bin/env python3
"""
cleanup_slugs_fast.py , version SQL bulk de cleanup_slugs.py

Au lieu de 200k requetes REST sequentielles (3h), on fait :
  1. Fetch tous les pros (id, slug, nom_entreprise, ville, siren) , 1 query
  2. Calcule le slug propre par row (en Python avec slugify + dedup -2/-3)
  3. Bulk UPDATE via Management API SQL (batches de 500 ids / query)

Gain : 100x plus rapide (~100 sec vs ~3h).

Usage :
  python3 scripts/cleanup_slugs_fast.py --dry-run
  python3 scripts/cleanup_slugs_fast.py --commit
"""
import argparse
import json
import os
import re
import sys
import unicodedata
import urllib.request
from collections import defaultdict
from pathlib import Path

ENV_MASTER = Path.home() / "stack-2026" / ".env.master"
PROJECT_REF = "apuyeakgxjgdcfssrtek"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"


def load_pat():
    if not ENV_MASTER.exists():
        return None
    for line in ENV_MASTER.read_text().splitlines():
        if line.startswith("SUPABASE_PAT="):
            return line.split("=", 1)[1].strip()
    return None


def get_service_key():
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if key:
        return key
    pat = load_pat()
    if not pat:
        raise RuntimeError("PAT introuvable")
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys?reveal=true",
        headers={"Authorization": f"Bearer {pat}", "User-Agent": "lobs-cleanup/1.0"},
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        keys = json.loads(r.read())
    for k in keys:
        if k.get("name") == "service_role":
            return k.get("api_key")
    raise RuntimeError("service_role key introuvable")


def fetch_all(service_key):
    rows = []
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/pros?select=id,slug,nom_entreprise,ville,siren&limit=1000&offset={offset}"
        req = urllib.request.Request(url, headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "User-Agent": "lobs-cleanup/1.0",
        })
        with urllib.request.urlopen(req, timeout=60) as r:
            batch = json.loads(r.read())
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000
    return rows


def slugify(text, max_len=70):
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", str(text))
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    text = re.sub(r"-+", "-", text)
    return text[:max_len].strip("-")


def build_clean_slug(p):
    """Recompute clean slug from name + ville. No SIREN suffix."""
    base = slugify(p.get("nom_entreprise") or "", max_len=40) or "pro"
    ville_slug = slugify(p.get("ville") or "", max_len=20)
    parts = [pp for pp in [base, ville_slug] if pp]
    return "-".join(parts)[:60]


def sql_query(sql, pat):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {pat}",
            "Content-Type": "application/json",
            "User-Agent": "lobs-cleanup-sql/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()

    if args.dry_run and args.commit:
        ap.error("--dry-run et --commit s'excluent")

    service_key = get_service_key()
    pat = load_pat()
    if not pat:
        raise RuntimeError("PAT requis pour SQL bulk")

    print("Fetch all pros...")
    pros = fetch_all(service_key)
    print(f"  {len(pros)} pros recuperes")

    # Compute new slug for each
    proposals = []  # list of (id, old_slug, new_base)
    for p in pros:
        new_base = build_clean_slug(p)
        if not new_base:
            continue
        proposals.append((p["id"], p["slug"], new_base, p.get("siren") or ""))

    # Sort by siren (stable order) so dedup is deterministic
    proposals.sort(key=lambda x: (x[2], x[3]))

    # Apply dedup : first occurrence keeps base, suivants get -2, -3
    counters = defaultdict(int)
    final_assignments = []  # (id, old_slug, new_slug)
    for pid, old_slug, new_base, _siren in proposals:
        counters[new_base] += 1
        n = counters[new_base]
        if n == 1:
            new_slug = new_base
        else:
            new_slug = f"{new_base}-{n}"
        if new_slug != old_slug:
            final_assignments.append((pid, old_slug, new_slug))

    print(f"\n{len(final_assignments)} slugs a changer :")
    for pid, old, new in final_assignments[:5]:
        print(f"  {old}  ->  {new}")
    if len(final_assignments) > 5:
        print(f"  ... +{len(final_assignments) - 5} autres")

    if args.dry_run or not args.commit:
        print("\n[dry-run] pas de PATCH effectue.")
        return

    # 2-pass via SQL pour eviter les conflits de UNIQUE constraint
    # Pass 1 : tout renommer en __tmp_{shortid}__
    # Pass 2 : assigner les noms finals
    print("\nCommit pass 1 : renommage temporaire...")
    BATCH = 500
    pass1_done = 0
    for i in range(0, len(final_assignments), BATCH):
        batch = final_assignments[i:i + BATCH]
        cases = []
        ids = []
        for pid, _old, _new in batch:
            # Full pid hex (32 chars) pour eviter collisions tmp -> tmp
            tmp = f"__tmp_{pid.replace('-', '')}__"
            cases.append(f"WHEN '{pid}'::uuid THEN '{tmp}'")
            ids.append(f"'{pid}'::uuid")
        sql = f"""
        UPDATE pros SET slug = CASE id
          {' '.join(cases)}
        END
        WHERE id IN ({','.join(ids)})
        """
        sql_query(sql, pat)
        pass1_done += len(batch)
        if (i // BATCH) % 10 == 0:
            print(f"  pass 1 : {pass1_done}/{len(final_assignments)}")
    print(f"  pass 1 termine : {pass1_done}")

    print("\nCommit pass 2 : noms finals...")
    pass2_done = 0
    for i in range(0, len(final_assignments), BATCH):
        batch = final_assignments[i:i + BATCH]
        cases = []
        ids = []
        for pid, _old, new_slug in batch:
            # Escape single quotes
            esc = new_slug.replace("'", "''")
            cases.append(f"WHEN '{pid}'::uuid THEN '{esc}'")
            ids.append(f"'{pid}'::uuid")
        sql = f"""
        UPDATE pros SET slug = CASE id
          {' '.join(cases)}
        END
        WHERE id IN ({','.join(ids)})
        """
        sql_query(sql, pat)
        pass2_done += len(batch)
        if (i // BATCH) % 10 == 0:
            print(f"  pass 2 : {pass2_done}/{len(final_assignments)}")
    print(f"  pass 2 termine : {pass2_done}")

    print(f"\nDONE : {len(final_assignments)} slugs renommes en 2 passes SQL bulk")


if __name__ == "__main__":
    main()
