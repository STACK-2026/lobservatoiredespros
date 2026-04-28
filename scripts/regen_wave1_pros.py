"""
Regen wave1 whitelist for SSG.

Pattern aligned on ratingcafe wave1_slugs.json :
- Pull all active pros from DB
- Compute top 10 per (metier, zone) combo by score_confiance desc
- UNION with must_keep floor (current live sitemap pros)
- Output site/src/data/wave1_pros.json (sorted unique array)

Why must_keep : never drop already-indexed slugs (SEO regression). New slugs
gained via Phase 2.D are added; existing ones are preserved even if their
score drops below top10 threshold for that combo.

Usage :
    SUPABASE_SERVICE_ROLE_KEY=... python3 scripts/regen_wave1_pros.py
    # or fetch live first :
    python3 scripts/regen_wave1_pros.py --fetch-live
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

REPO_ROOT = Path(__file__).resolve().parent.parent
WAVE1_OUT = REPO_ROOT / "site" / "src" / "data" / "wave1_pros.json"
LIVE_SITEMAP_URL = "https://lobservatoiredespros.com/sitemap.xml"

SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
    "SUPABASE_SERVICE_KEY"
)

PER_COMBO_TOP = 10
PAGE = 1000

# Cap pratique CF Pages : 20k files. On garde une marge pour les autres pages
# (classements, glossaire, observations, OG PNGs, sitemap shards, etc.).
WAVE1_CAP = int(os.environ.get("WAVE1_CAP", "18500"))


def fetch_live_must_keep() -> set[str]:
    """Pull current sitemap and extract /pro/<slug>/ slugs as must_keep floor."""
    print(f"[must_keep] Fetching {LIVE_SITEMAP_URL}")
    req = urllib.request.Request(
        LIVE_SITEMAP_URL, headers={"User-Agent": "regen-wave1-pros/1.0"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read().decode("utf-8", errors="replace")
    slugs = re.findall(r"/pro/([^/<]+)/</loc>", body)
    out = sorted(set(slugs))
    print(f"[must_keep] {len(out)} live /pro/ slugs (floor)")
    return set(out)


def sb_get(path: str, params: dict[str, Any] | None = None) -> Any:
    if not SUPABASE_KEY:
        sys.exit(
            "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) env var required"
        )
    qs = urlencode(params or {}, doseq=True)
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if qs:
        url += "?" + qs
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def fetch_paginated(path: str, params: dict[str, Any]) -> list[dict[str, Any]]:
    all_rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        p = dict(params)
        p["offset"] = str(offset)
        p["limit"] = str(PAGE)
        rows = sb_get(path, p)
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < PAGE:
            break
        offset += PAGE
    return all_rows


def compute_top_per_combo(
    pros: list[dict[str, Any]],
    pro_metiers: list[dict[str, Any]],
    pro_zones: list[dict[str, Any]],
) -> set[str]:
    """Top N per (metier_id, zone_id) by score_confiance desc."""
    pro_by_id = {p["id"]: p for p in pros}

    zones_by_pro: dict[str, list[str]] = {}
    for pz in pro_zones:
        zones_by_pro.setdefault(pz["pro_id"], []).append(pz["zone_id"])

    combos: dict[tuple[str, str], list[str]] = {}
    for pm in pro_metiers:
        for zid in zones_by_pro.get(pm["pro_id"], []):
            combos.setdefault((pm["metier_id"], zid), []).append(pm["pro_id"])

    top_pro_ids: set[str] = set()
    for pro_ids in combos.values():
        sortable = [pid for pid in pro_ids if pid in pro_by_id]
        sortable.sort(
            key=lambda pid: (
                pro_by_id[pid].get("score_confiance") or 0,
                pro_by_id[pid].get("nom_entreprise") or "",
            ),
            reverse=True,
        )
        for pid in sortable[:PER_COMBO_TOP]:
            top_pro_ids.add(pid)

    top_slugs = {
        pro_by_id[pid]["slug"]
        for pid in top_pro_ids
        if pro_by_id[pid].get("slug")
    }
    print(
        f"[top10] {len(combos)} combos, {len(top_pro_ids)} unique pros, "
        f"{len(top_slugs)} slugs"
    )
    return top_slugs


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--fetch-live",
        action="store_true",
        help="Use current sitemap as must_keep floor (default if no DB key)",
    )
    ap.add_argument(
        "--cap",
        type=int,
        default=WAVE1_CAP,
        help=f"Hard cap on wave1 size (default {WAVE1_CAP})",
    )
    args = ap.parse_args()

    must_keep: set[str] = set()
    try:
        must_keep = fetch_live_must_keep()
    except Exception as e:
        print(f"[must_keep] WARN: failed to fetch live sitemap: {e}")

    if not SUPABASE_KEY:
        print("[wave1] No SUPABASE_SERVICE_ROLE_KEY, using must_keep only")
        wave1 = sorted(must_keep)
    else:
        print("[db] Pulling pros, pro_metiers, pro_zones...")
        pros = fetch_paginated(
            "pros",
            {
                "select": "id,slug,score_confiance,nom_entreprise,active",
                "active": "eq.true",
                "slug": "not.is.null",
                "order": "id.asc",
            },
        )
        print(f"[db] {len(pros)} pros active w/ slug")
        pro_metiers = fetch_paginated(
            "pro_metiers", {"select": "pro_id,metier_id", "order": "pro_id.asc"}
        )
        print(f"[db] {len(pro_metiers)} pro_metiers links")
        pro_zones = fetch_paginated(
            "pro_zones", {"select": "pro_id,zone_id", "order": "pro_id.asc"}
        )
        print(f"[db] {len(pro_zones)} pro_zones links")

        top_slugs = compute_top_per_combo(pros, pro_metiers, pro_zones)
        union = top_slugs | must_keep
        print(f"[union] top10={len(top_slugs)} ∪ must_keep={len(must_keep)} = {len(union)}")

        # Hard cap : if union exceeds cap, drop lowest-priority NEW slugs first
        # (must_keep always wins). Sort by score desc within new-only set.
        if len(union) > args.cap:
            new_only = top_slugs - must_keep
            pros_by_slug = {
                p["slug"]: p for p in pros if p.get("slug")
            }
            new_sorted = sorted(
                new_only,
                key=lambda s: (
                    -(pros_by_slug.get(s, {}).get("score_confiance") or 0),
                    s,
                ),
            )
            keep_new = args.cap - len(must_keep)
            if keep_new < 0:
                keep_new = 0
                print(
                    f"[cap] WARN must_keep ({len(must_keep)}) exceeds cap ({args.cap}); "
                    "must_keep wins (no new slugs)."
                )
            wave1 = sorted(must_keep | set(new_sorted[:keep_new]))
            print(f"[cap] capped at {len(wave1)} (kept {keep_new} new)")
        else:
            wave1 = sorted(union)

    WAVE1_OUT.parent.mkdir(parents=True, exist_ok=True)
    WAVE1_OUT.write_text(
        json.dumps(wave1, ensure_ascii=False, indent=0).replace("\n", "\n"),
        encoding="utf-8",
    )
    print(f"[out] {WAVE1_OUT} : {len(wave1)} slugs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
