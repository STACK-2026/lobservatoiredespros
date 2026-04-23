#!/usr/bin/env python3
"""
enrich_rge.py , Enrichit les pros importes avec la certification RGE.

Source officielle : ADEME, jeu de donnees "liste-des-entreprises-rge-2"
URL API : https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines

Usage :
  python3 scripts/enrich_rge.py --dept 89            # enrichit tous les pros du dept 89
  python3 scripts/enrich_rge.py --all-pilots         # tous depts pilote
  python3 scripts/enrich_rge.py --siret 12345678900012  # un seul SIRET (debug)

Impact sur le Score de Confiance :
  , RGE verifie : +2 pts (via recalcul apres enrichissement)
"""

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

ADEME_API = "https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines"
SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co"

DEPARTEMENTS = ["21", "75", "89"]

USER_AGENT = "lobservatoiredespros-enrich-rge/1.0 (redaction@lobservatoiredespros.com)"


def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def get_service_key():
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if key:
        return key
    cache_file = Path("/tmp/lobs_svc.txt")
    if cache_file.exists():
        return cache_file.read_text().strip()
    env_master = Path.home() / "stack-2026" / ".env.master"
    if env_master.exists():
        for line in env_master.read_text().splitlines():
            if line.startswith("SUPABASE_SERVICE_KEY="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("SUPABASE_SERVICE_KEY introuvable")


def ademe_search_rge(dept_code, max_results=10000):
    """
    Fetch all RGE companies matching dept (by code_postal prefix).
    Pagination : 10000 per request max.
    """
    size = min(10000, max_results)
    page = 0
    all_results = []
    while True:
        params = {
            "qs": f'code_postal:"{dept_code}*"',
            "size": size,
            "after": page * size if page > 0 else 0,
        }
        url = f"{ADEME_API}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.loads(r.read())
        except urllib.error.HTTPError as e:
            log(f"HTTP {e.code} : {e.read()[:300]}", "ERROR")
            return all_results
        results = data.get("results", [])
        if not results:
            break
        all_results.extend(results)
        if len(results) < size:
            break
        page += 1
        time.sleep(0.5)
    return all_results


def siret_from_record(r):
    return str(r.get("siret") or r.get("Siret") or r.get("SIRET") or "").strip()


def siren_from_siret(siret):
    return siret[:9] if len(siret) >= 9 else ""


def get_pros_by_dept(service_key, dept_code):
    """Fetch active pros whose code_postal starts with dept_code."""
    url = f"{SUPABASE_URL}/rest/v1/pros?select=id,siren,siret,code_postal,rge,score_confiance&code_postal=like.{dept_code}*&active=eq.true"
    req = urllib.request.Request(url, headers={
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "User-Agent": "lobservatoiredespros-enrich-rge/1.0",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def update_pro_rge(service_key, pro_id, rge_true, score_delta=0):
    """PATCH pros.rge = true + recalc score."""
    url = f"{SUPABASE_URL}/rest/v1/pros?id=eq.{pro_id}"
    payload = {"rge": rge_true}
    if score_delta:
        # Fetch current score then update
        pass  # simplification : on ne modifie que rge, le score sera recalcule plus tard
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        method="PATCH",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
            "User-Agent": "lobservatoiredespros-enrich-rge/1.0",
        },
    )
    try:
        urllib.request.urlopen(req, timeout=20)
        return True
    except urllib.error.HTTPError as e:
        log(f"PATCH {pro_id} HTTP {e.code}", "ERROR")
        return False


def run_dept(dept_code, dry_run=False):
    log(f"Enrichissement RGE , dept {dept_code}")
    service_key = get_service_key()

    # 1. Fetch all pros for this dept from Supabase
    pros = get_pros_by_dept(service_key, dept_code)
    log(f"  {len(pros)} pros actifs dans dept {dept_code}")

    if not pros:
        log("  Aucun pro importe pour ce dept , lance d'abord import_sirene.py")
        return

    pros_by_siren = {p["siren"]: p for p in pros if p.get("siren")}

    # 2. Fetch RGE list from ADEME
    rge_list = ademe_search_rge(dept_code)
    log(f"  {len(rge_list)} entreprises RGE trouvees dans {dept_code}*")

    # 3. Match by SIREN (premiers 9 digits du SIRET)
    matches = 0
    not_found = 0
    rge_sirens = set()
    for rge in rge_list:
        siret = siret_from_record(rge)
        siren = siren_from_siret(siret)
        if siren:
            rge_sirens.add(siren)

    updated = 0
    for siren, pro in pros_by_siren.items():
        if siren in rge_sirens and not pro.get("rge"):
            matches += 1
            if not dry_run:
                if update_pro_rge(service_key, pro["id"], True):
                    updated += 1
            else:
                log(f"  [dry] {siren} , RGE match (pro_id={pro['id']})")
    log(f"  RGE matches : {matches} / {len(pros_by_siren)} pros , {updated} PATCHes OK")


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n\n")[0])
    ap.add_argument("--dept", choices=DEPARTEMENTS)
    ap.add_argument("--all-pilots", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.all_pilots:
        for d in DEPARTEMENTS:
            run_dept(d, dry_run=args.dry_run)
    elif args.dept:
        run_dept(args.dept, dry_run=args.dry_run)
    else:
        ap.error("--dept ou --all-pilots")


if __name__ == "__main__":
    main()
