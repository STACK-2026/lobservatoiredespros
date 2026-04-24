#!/usr/bin/env python3
"""
Geocode all pros via API Adresse data.gouv.fr.

- Gratuit, officiel FR, pas de rate limit annonce (soft : ~50 req/s max conseille)
- Reponses type GeoJSON FeatureCollection
- Score 0-1 (0.9+ = tres fiable), on garde meme les faibles mais tag dans geocode_score

Usage :
    python3 scripts/geocode_pros.py             # dry-run (no writes)
    python3 scripts/geocode_pros.py --commit    # ecrit les lat/lng en DB
    python3 scripts/geocode_pros.py --commit --only-missing   # skip pros deja geocodes
"""

from __future__ import annotations

import argparse
import os
import sys
import time
import urllib.parse
import urllib.request
import json
from pathlib import Path
from typing import Optional

# Charger .env.master + .env local (priorite local)
ROOT = Path(__file__).resolve().parent.parent
ENV_MASTER = ROOT.parent / ".env.master"
ENV_LOCAL = ROOT / ".env"

def _load_env(path: Path):
    if not path.exists(): return
    for line in path.read_text().splitlines():
        if not line or line.startswith("#") or "=" not in line: continue
        k, v = line.split("=", 1)
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and v and k not in os.environ:
            os.environ[k] = v

_load_env(ENV_MASTER)
_load_env(ENV_LOCAL)

SUPABASE_URL = os.environ.get("PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_SERVICE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY")
    or os.environ.get("PUBLIC_SUPABASE_ANON_KEY")
)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[FATAL] SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.master")
    sys.exit(1)

API_ADRESSE = "https://api-adresse.data.gouv.fr/search/"
HEADERS_SB = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}
UA = "lobservatoiredespros-geocoder/1.0 (augustin.foucheres@gmail.com)"


def _get(url: str, headers: Optional[dict] = None) -> dict:
    req = urllib.request.Request(url, headers=headers or {"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def _patch(url: str, body: dict):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=HEADERS_SB, method="PATCH")
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read()


def fetch_pros(only_missing: bool = False, cap: int = 200000) -> list[dict]:
    """Fetch tous les pros avec adresse + ville. Paginé par 1000 (cap PostgREST)
    jusqu'à `cap` lignes pour absorber le volume post-import national.
    """
    base = f"{SUPABASE_URL}/rest/v1/pros?select=id,slug,adresse,code_postal,ville"
    if only_missing:
        base += "&lat=is.null"
    base += "&active=eq.true&order=id"
    page = 1000
    out: list[dict] = []
    start = 0
    while start < cap:
        url = f"{base}&offset={start}&limit={page}"
        req = urllib.request.Request(url, headers=HEADERS_SB)
        with urllib.request.urlopen(req, timeout=30) as r:
            batch = json.loads(r.read().decode("utf-8"))
        if not batch:
            break
        out.extend(batch)
        if len(batch) < page:
            break
        start += page
    return out


def geocode_one(adresse: str, cp: str, ville: str) -> Optional[tuple[float, float, float]]:
    """Retourne (lat, lng, score) ou None. Score 0-1."""
    # Query : adresse complete. L'API est indulgente.
    parts = [p for p in [adresse, cp, ville] if p]
    if not parts:
        return None
    q = " ".join(parts)
    params = {"q": q, "limit": "1", "autocomplete": "0"}
    url = f"{API_ADRESSE}?{urllib.parse.urlencode(params)}"
    try:
        data = _get(url, headers={"User-Agent": UA, "Accept": "application/json"})
    except Exception as e:
        print(f"    [warn] API Adresse failed : {e}")
        return None
    feats = data.get("features") or []
    if not feats:
        return None
    f = feats[0]
    coords = f.get("geometry", {}).get("coordinates") or []
    if len(coords) != 2:
        return None
    lng, lat = coords[0], coords[1]
    score = f.get("properties", {}).get("score", 0.0)
    return float(lat), float(lng), float(score)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", action="store_true", help="ecrit en DB (sinon dry-run)")
    parser.add_argument("--only-missing", action="store_true", help="skip pros deja geocodes")
    parser.add_argument("--sleep", type=float, default=0.1, help="sleep entre requetes (s)")
    parser.add_argument("--limit", type=int, default=0, help="limite le nombre de pros traites")
    args = parser.parse_args()

    pros = fetch_pros(only_missing=args.only_missing)
    if args.limit:
        pros = pros[: args.limit]
    print(f"[info] {len(pros)} pros a geocoder (only-missing={args.only_missing}, commit={args.commit})")

    ok = 0
    fail = 0
    low_score = 0
    for i, p in enumerate(pros, start=1):
        adresse = (p.get("adresse") or "").strip()
        cp = (p.get("code_postal") or "").strip()
        ville = (p.get("ville") or "").strip()
        if not ville:
            fail += 1
            continue

        res = geocode_one(adresse, cp, ville)
        if not res:
            fail += 1
            print(f"  [{i}/{len(pros)}] {p['slug']} : no match ({adresse} {cp} {ville})")
            time.sleep(args.sleep)
            continue
        lat, lng, score = res
        if score < 0.4:
            low_score += 1

        tag = "[DRY]" if not args.commit else "[OK]"
        print(f"  [{i}/{len(pros)}] {tag} {p['slug']} : {lat:.5f}, {lng:.5f} (score={score:.2f})")

        if args.commit:
            patch_url = f"{SUPABASE_URL}/rest/v1/pros?id=eq.{p['id']}"
            body = {
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "geocode_score": round(score, 3),
                "geocoded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            }
            try:
                _patch(patch_url, body)
                ok += 1
            except Exception as e:
                print(f"    [warn] PATCH failed : {e}")
                fail += 1
        else:
            ok += 1

        time.sleep(args.sleep)

    print(f"\n[done] ok={ok} fail={fail} low_score<0.4={low_score}")


if __name__ == "__main__":
    main()
