#!/usr/bin/env python3
"""
Bulk cleanup ULTRA fast : VALUES UPDATE 5000 rows per query.
"""
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


def load_pat():
    for line in ENV_MASTER.read_text().splitlines():
        if line.startswith("SUPABASE_PAT="):
            return line.split("=", 1)[1].strip()


def sql(query, pat):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": query}).encode(),
        headers={
            "Authorization": f"Bearer {pat}",
            "Content-Type": "application/json",
            "User-Agent": "lobs-bulk/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read())


def slugify(text, max_len=70):
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", str(text))
    text = text.encode("ascii", "ignore").decode("ascii").lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:max_len].strip("-")


def main():
    pat = load_pat()
    print("Fetch all pros via SQL...")
    rows = sql("SELECT id, slug, nom_entreprise, ville FROM pros", pat)
    print(f"  {len(rows)} pros")

    suffix_re = re.compile(r"-[0-9]{5,6}$")
    needs = []
    keepers = []
    for r in rows:
        s = r.get("slug") or ""
        if s.startswith("__tmp_") or suffix_re.search(s):
            needs.append(r)
        else:
            keepers.append(r)
    print(f"  {len(needs)} a renommer, {len(keepers)} deja propres")

    taken = set(k["slug"] for k in keepers)
    needs.sort(key=lambda r: r.get("id") or "")  # stable order

    assignments = []
    for r in needs:
        base = slugify(r.get("nom_entreprise") or "", 40) or "pro"
        ville = slugify(r.get("ville") or "", 20)
        parts = [p for p in [base, ville] if p]
        candidate = "-".join(parts)[:60] or "pro"
        n = 1
        original_candidate = candidate
        while candidate in taken:
            n += 1
            candidate = f"{original_candidate}-{n}"
        taken.add(candidate)
        if candidate != r["slug"]:
            assignments.append((r["id"], candidate))

    print(f"\n{len(assignments)} renames a appliquer via VALUES bulk SQL")

    BATCH = 5000
    done = 0
    for i in range(0, len(assignments), BATCH):
        batch = assignments[i:i + BATCH]
        values_parts = []
        for pid, ns in batch:
            esc = ns.replace("'", "''")
            values_parts.append(f"('{pid}'::uuid, '{esc}')")
        values_sql = ",\n".join(values_parts)
        query = f"""
        UPDATE pros SET slug = u.new_slug
        FROM (VALUES {values_sql}) AS u(id, new_slug)
        WHERE pros.id = u.id
        """
        try:
            sql(query, pat)
            done += len(batch)
            print(f"  done {done}/{len(assignments)}")
        except Exception as e:
            print(f"  ERR batch {i} : {str(e)[:200]}")

    print(f"\nFINAL : {done}/{len(assignments)} renames OK")


if __name__ == "__main__":
    main()
