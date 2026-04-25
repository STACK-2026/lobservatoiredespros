#!/usr/bin/env python3
"""
enrich_osm.py , Enrichit la table pros depuis OpenStreetMap Overpass API.

Strategie :
  1. Pour chaque dpt couvert (zones Supabase), calcule le bbox depuis les
     pros geocodes du dpt.
  2. Query OSM Overpass : nwr["ref:FR:SIRET"](bbox); out;
  3. Indexe les resultats par SIRET (avec phone, website, email, opening_hours).
  4. UPDATE pros pour les SIRETs match , uniquement les champs NULL.

Sources OSM : tag `ref:FR:SIRET` + tags phone / contact:phone / website /
contact:website / email / contact:email / opening_hours.

Gratuit, illimite (avec courtoisie : 1 query par dpt, sleep 2s entre dpts).

Usage :
  python3 scripts/enrich_osm.py --commit                 # tous dpts
  python3 scripts/enrich_osm.py --depts 75,77,89 --commit  # liste
  python3 scripts/enrich_osm.py --dry-run                # comptage only
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).resolve().parent.parent
ENV_MASTER = ROOT.parent / ".env.master"


def _load_env(path: Path):
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and v and k not in os.environ:
            os.environ[k] = v


_load_env(ENV_MASTER)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or "https://apuyeakgxjgdcfssrtek.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_KEY:
    pat = os.environ.get("SUPABASE_PAT")
    if pat:
        req = urllib.request.Request(
            "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true",
            headers={
                "Authorization": f"Bearer {pat}",
                "User-Agent": "lobservatoiredespros-osm/1.0",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                keys = json.loads(r.read().decode("utf-8"))
                for k in keys:
                    if k.get("name") == "service_role":
                        SUPABASE_KEY = k.get("api_key")
                        break
        except Exception:
            pass

if not SUPABASE_KEY:
    print("[FATAL] SUPABASE_SERVICE_ROLE_KEY required")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "User-Agent": "lobservatoiredespros-osm/1.0",
    "Prefer": "return=minimal",
}

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
UA_OSM = "ObservatoireDesPros/1.0 (contact@lobservatoiredespros.com)"


def log(msg: str):
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def sb_get_paged(path_no_limit: str, cap: int = 200000, page: int = 1000) -> list:
    out: list = []
    start = 0
    sep = "&" if "?" in path_no_limit else "?"
    while start < cap:
        url = f"{SUPABASE_URL}/rest/v1/{path_no_limit}{sep}offset={start}&limit={page}"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as r:
            batch = json.loads(r.read().decode("utf-8"))
        if not batch:
            break
        out.extend(batch)
        if len(batch) < page:
            break
        start += page
    return out


def sb_patch(path: str, body: dict):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        data=data,
        headers=HEADERS,
        method="PATCH",
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read()


def get_dept_bboxes() -> Dict[str, dict]:
    """Calcule bbox par dpt depuis pros geocodes (active=true)."""
    log("Fetch pros geocodes pour bbox dpts...")
    rows = sb_get_paged(
        "pros?select=lat,lng,code_postal,ville&lat=not.is.null&active=eq.true&order=id"
    )
    log(f"  {len(rows)} pros geocodes recuperes")
    # Bucket par code dept (substring code_postal)
    buckets: Dict[str, dict] = {}
    for r in rows:
        cp = (r.get("code_postal") or "").strip()
        if len(cp) < 2:
            continue
        # 2A/2B : codes postaux Corses commencent par 200/201/202
        if cp.startswith("20"):
            cp_int = int(cp[:5]) if cp[:5].isdigit() else 0
            dept = "2A" if cp_int < 20200 else "2B"
        else:
            dept = cp[:2]
        lat = r.get("lat")
        lng = r.get("lng")
        if lat is None or lng is None:
            continue
        b = buckets.setdefault(
            dept, {"lat_min": 999, "lat_max": -999, "lng_min": 999, "lng_max": -999}
        )
        b["lat_min"] = min(b["lat_min"], lat)
        b["lat_max"] = max(b["lat_max"], lat)
        b["lng_min"] = min(b["lng_min"], lng)
        b["lng_max"] = max(b["lng_max"], lng)
    # Padding 0.05 deg de marge
    for dept, b in buckets.items():
        b["lat_min"] -= 0.05
        b["lat_max"] += 0.05
        b["lng_min"] -= 0.05
        b["lng_max"] += 0.05
    return buckets


def overpass_query_dept(bbox: dict, timeout: int = 45) -> List[dict]:
    """Query OSM Overpass pour SIRET-tagged dans le bbox."""
    q = f"""
[out:json][timeout:{timeout}];
nwr["ref:FR:SIRET"]({bbox['lat_min']},{bbox['lng_min']},{bbox['lat_max']},{bbox['lng_max']});
out;
"""
    data = urllib.parse.urlencode({"data": q}).encode("utf-8")
    req = urllib.request.Request(
        OVERPASS_URL,
        data=data,
        headers={"User-Agent": UA_OSM},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout + 10) as r:
        return json.loads(r.read().decode("utf-8")).get("elements", [])


def extract_contact(tags: dict) -> dict:
    """Extrait phone / website / email / opening_hours / lat/lng from OSM tags."""
    return {
        "phone": tags.get("phone") or tags.get("contact:phone"),
        "website": tags.get("website") or tags.get("contact:website"),
        "email": tags.get("email") or tags.get("contact:email"),
        "opening_hours": tags.get("opening_hours"),
    }


def normalize_phone(p: Optional[str]) -> Optional[str]:
    if not p:
        return None
    p = p.strip()
    if len(p) < 8:
        return None
    return p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--commit", action="store_true", help="UPDATE pros (sinon dry-run)")
    ap.add_argument("--depts", help="CSV de codes dept (ex: 75,77,89). Default = tous")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--sleep", type=float, default=2.0, help="sleep entre dpts (courtoisie OSM)")
    args = ap.parse_args()

    if args.dry_run and args.commit:
        ap.error("--dry-run + --commit s'excluent")

    bboxes = get_dept_bboxes()
    log(f"Dpts avec pros geocodes : {len(bboxes)}")

    if args.depts:
        wanted = [d.strip() for d in args.depts.split(",") if d.strip()]
        bboxes = {k: v for k, v in bboxes.items() if k in wanted}
        log(f"Filtre actif : {sorted(bboxes.keys())}")

    # Build mapping siret -> contact
    log("Query OSM Overpass par dpt...")
    osm_by_siret: Dict[str, dict] = {}
    failures = []
    for dept in sorted(bboxes.keys()):
        bbox = bboxes[dept]
        try:
            t0 = time.time()
            els = overpass_query_dept(bbox)
            siret_count = 0
            for e in els:
                tags = e.get("tags") or {}
                siret = tags.get("ref:FR:SIRET")
                if not siret:
                    continue
                contact = extract_contact(tags)
                contact["phone"] = normalize_phone(contact["phone"])
                if any(contact.values()):
                    osm_by_siret[siret] = contact
                    siret_count += 1
            log(f"  dpt {dept} : {len(els)} OSM els , {siret_count} siret avec contact ({time.time()-t0:.0f}s)")
        except Exception as e:
            failures.append((dept, str(e)))
            log(f"  dpt {dept} : ERROR {e}")
        time.sleep(args.sleep)

    log(f"Total SIRETs OSM avec contact : {len(osm_by_siret)}")
    if failures:
        log(f"Failures dpt : {failures}")

    if not osm_by_siret:
        log("Aucun match OSM. Termine.")
        return

    # Match avec nos pros
    log("Fetch pros sirets a enrichir...")
    pros = sb_get_paged(
        "pros?select=id,siret,telephone,site_web,email&active=eq.true&siret=not.is.null&order=id"
    )
    log(f"  {len(pros)} pros actifs avec SIRET")

    # Build pro_by_siret index
    pros_by_siret = {p["siret"]: p for p in pros if p.get("siret")}
    # Aussi indexer par SIREN (9 premiers chiffres) pour matcher l'etablissement siege
    pros_by_siren: Dict[str, dict] = {}
    for p in pros:
        siret = p.get("siret") or ""
        if len(siret) >= 9:
            pros_by_siren.setdefault(siret[:9], p)

    # Compute updates : match exact SIRET d'abord, fallback SIREN
    updates = []
    matched_siret = matched_siren = 0
    for siret, contact in osm_by_siret.items():
        pro = pros_by_siret.get(siret)
        if pro:
            matched_siret += 1
        elif len(siret) >= 9:
            pro = pros_by_siren.get(siret[:9])
            if pro:
                matched_siren += 1
        if not pro:
            continue
        update = {}
        if not pro.get("telephone") and contact.get("phone"):
            update["telephone"] = contact["phone"]
        if not pro.get("site_web") and contact.get("website"):
            update["site_web"] = contact["website"]
        if not pro.get("email") and contact.get("email"):
            update["email"] = contact["email"]
        if not pro.get("opening_hours") and contact.get("opening_hours"):
            update["opening_hours"] = contact["opening_hours"]
        if update:
            update["pro_id"] = pro["id"]
            update["siret"] = siret
            updates.append(update)
    log(f"Updates a appliquer : {len(updates)} pros (match SIRET={matched_siret}, fallback SIREN={matched_siren})")

    if args.dry_run:
        for u in updates[:10]:
            log(f"  DRY {u['siret']}: {[k for k in u if k not in ('pro_id', 'siret')]}")
        log("DRY-RUN termine")
        return

    if not args.commit:
        log("Pas de --commit. Termine.")
        return

    # Apply (parallel patches)
    log(f"Apply {len(updates)} PATCH (workers=10)...")
    ok = 0
    fail = 0

    def _patch_one(u):
        body = {k: v for k, v in u.items() if k not in ("pro_id", "siret")}
        try:
            sb_patch(f"pros?id=eq.{u['pro_id']}", body)
            return True
        except Exception:
            return False

    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = [ex.submit(_patch_one, u) for u in updates]
        for f in as_completed(futures):
            if f.result():
                ok += 1
            else:
                fail += 1
    log(f"\n[done] OSM enrich : {ok} pros patch , {fail} fail")


if __name__ == "__main__":
    main()
