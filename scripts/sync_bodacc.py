#!/usr/bin/env python3
"""
Sync BODACC + Trust Score v2 pour tous les pros actifs.

Pipeline :
  1. Fetch pros depuis Supabase (siren + etat admin + qualifs count)
  2. Pour chaque SIREN :
     - BODACC : fetch annonces + analyser
     - Upsert dans pro_evenements_legaux (timeline)
     - Agrege les donnees pour trust score
     - Calcule trust score v2
     - Update pros (bodacc_synthese, score_detail, niveau_confiance, score_confiance)
  3. Rate limit : 5 req/s (BODACC genereux mais pas de source a stresser)

Usage :
    python3 scripts/sync_bodacc.py                   # dry-run
    python3 scripts/sync_bodacc.py --commit          # ecrit en DB
    python3 scripts/sync_bodacc.py --commit --siren 487581969  # test un SIREN
    python3 scripts/sync_bodacc.py --commit --limit 10
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from lib_bodacc import fetch_bodacc_by_siren, analyser_bodacc, map_famille_to_type
from lib_trust_score import calculer_trust_score

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
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_SERVICE_KEY")
)

if not SUPABASE_KEY:
    # Fetch via PAT management API
    pat = os.environ.get("SUPABASE_PAT")
    if pat:
        req = urllib.request.Request(
            "https://api.supabase.com/v1/projects/apuyeakgxjgdcfssrtek/api-keys?reveal=true",
            headers={"Authorization": f"Bearer {pat}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                keys = json.loads(r.read().decode("utf-8"))
                for k in keys:
                    if k.get("name") == "service_role":
                        SUPABASE_KEY = k.get("api_key")
                        break
        except Exception as e:
            print(f"[warn] could not fetch service_role via PAT: {e}")

if not SUPABASE_KEY:
    print("[FATAL] SUPABASE_SERVICE_ROLE_KEY required")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def sb_get(path: str) -> list[dict]:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def sb_get_paged(path_no_limit: str, cap: int = 200000, page: int = 1000) -> list[dict]:
    """PostgREST Supabase cap = 1000 rows/requête ; on pagine jusqu'à cap."""
    out: list[dict] = []
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
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={**HEADERS, "Prefer": "return=minimal"}, method="PATCH")
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def sb_upsert(path: str, rows: list[dict], on_conflict: str):
    url = f"{SUPABASE_URL}/rest/v1/{path}?on_conflict={on_conflict}"
    data = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def fetch_pros(only_missing: bool, siren_filter: str | None, limit: int) -> list[dict]:
    select = (
        "id,slug,siren,siret,score_confiance,tier,rge,qualibat,"
        "date_creation_entreprise,last_trust_sync,"
        "categorie_entreprise,tranche_effectif,dirigeants_count,"
        "etat_administratif,est_qualiopi"
    )
    where = ["active=eq.true", "siren=not.is.null"]
    if only_missing:
        where.append("last_trust_sync=is.null")
    if siren_filter:
        where.append(f"siren=eq.{siren_filter}")
    where.append("order=id")
    q = f"pros?select={select}&" + "&".join(where)
    # Paginé : cap PostgREST 1000/page, on itère jusqu'au `limit` fourni ou 200k.
    cap = limit if limit else 200000
    return sb_get_paged(q, cap=cap)


def count_qualifications(pro_id: str) -> tuple[int, int, int, int]:
    """Retourne (actives, historiques, organismes_distincts, expirees_recemment)."""
    rows = sb_get(f"pro_qualifications?select=organisme,date_fin&pro_id=eq.{pro_id}&limit=500")
    if not rows:
        return 0, 0, 0, 0
    today = time.strftime("%Y-%m-%d")
    six_months_ago = time.strftime("%Y-%m-%d", time.localtime(time.time() - 180 * 86400))
    actives = sum(1 for r in rows if (r.get("date_fin") or "9999") >= today)
    expirees_rec = sum(1 for r in rows
                        if six_months_ago <= (r.get("date_fin") or "9999") < today)
    orgs = len({r.get("organisme") for r in rows if r.get("organisme")})
    return actives, len(rows), orgs, expirees_rec


_stats_lock_b = threading.Lock()


def _sync_one(pro: dict, commit: bool, sleep_s: float) -> dict:
    """Process one pro. Returns dict {status, niveau?, alertes_count?}."""
    siren = (pro.get("siren") or "").replace(" ", "")
    if not siren:
        return {"status": "skip"}
    try:
        annonces = fetch_bodacc_by_siren(siren)
        synthese = analyser_bodacc(annonces)
        qa, qh, orgs, qexp = count_qualifications(pro["id"])
        age = 0
        if pro.get("date_creation_entreprise"):
            try:
                year = int(pro["date_creation_entreprise"][:4])
                age = time.localtime().tm_year - year
            except Exception:
                age = 0
        ts_inputs = {
            "anciennete_annees": age,
            "etat_administratif": pro.get("etat_administratif") or "A",
            "categorie_entreprise": pro.get("categorie_entreprise"),
            "tranche_effectif": pro.get("tranche_effectif"),
            "dirigeant_identifie": (pro.get("dirigeants_count") or 0) > 0,
            "qualifications_actives": qa,
            "qualifications_historiques": qh,
            "organismes_certificateurs": orgs,
            "qualifications_expirees_recemment": qexp,
            **synthese,
            "decennale_verifiee": False,
            "rc_pro_verifiee": False,
            "est_qualiopi": bool(pro.get("est_qualiopi")),
        }
        ts = calculer_trust_score(ts_inputs)
        if commit:
            if annonces:
                rows = []

                def _safe_dict(val):
                    if isinstance(val, dict):
                        return val
                    if isinstance(val, str):
                        try:
                            parsed = json.loads(val)
                            return parsed if isinstance(parsed, dict) else {}
                        except Exception:
                            return {}
                    return {}

                for a in annonces:
                    famille = a.get("familleavis_lib") or ""
                    jug = _safe_dict(a.get("jugement"))
                    nature = jug.get("nature")
                    description = jug.get("complementJugement") or ""
                    if not description:
                        md = _safe_dict(a.get("modificationsgenerales")) or _safe_dict(a.get("depot"))
                        description = md.get("descriptif") or ""

                    rows.append({
                        "pro_id": pro["id"],
                        "siren": siren,
                        "source": "bodacc",
                        "type_evenement": map_famille_to_type(famille),
                        "nature_precise": nature,
                        "date_parution": a.get("dateparution"),
                        "tribunal": a.get("tribunal"),
                        "description": (description or "")[:1500],
                        "raw_data": a,
                    })
                for chunk_start in range(0, len(rows), 100):
                    sb_upsert(
                        "pro_evenements_legaux",
                        rows[chunk_start:chunk_start + 100],
                        on_conflict="siren,date_parution,type_evenement,nature_precise",
                    )

            sb_patch(
                f"pros?id=eq.{pro['id']}",
                {
                    "bodacc_synthese": synthese,
                    "score_detail": ts,
                    "niveau_confiance": ts["niveau"],
                    "score_confiance": ts["score"],
                    "last_trust_sync": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                },
            )
        if sleep_s:
            time.sleep(sleep_s)
        return {
            "status": "ok",
            "niveau": ts["niveau"],
            "alertes_count": len(ts.get("signaux_alerte", [])),
        }
    except Exception as e:
        if sleep_s:
            time.sleep(sleep_s)
        return {"status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--only-missing", action="store_true")
    parser.add_argument("--siren", type=str, default=None, help="filter a specific SIREN")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sleep", type=float, default=0.05)
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    pros = fetch_pros(args.only_missing, args.siren, args.limit)
    print(f"[info] {len(pros)} pros to sync (workers={args.workers}, commit={args.commit})")

    ok = 0
    skip = 0
    errors = 0
    stats_niveaux: dict = {}
    stats_alertes = 0
    done = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        futures = [ex.submit(_sync_one, pro, args.commit, args.sleep) for pro in pros]
        for f in as_completed(futures):
            try:
                res = f.result()
            except Exception as e:
                res = {"status": "error", "error": str(e)}
            with _stats_lock_b:
                if res["status"] == "ok":
                    ok += 1
                    niveau = res.get("niveau", "?")
                    stats_niveaux[niveau] = stats_niveaux.get(niveau, 0) + 1
                    stats_alertes += res.get("alertes_count", 0)
                elif res["status"] == "skip":
                    skip += 1
                else:
                    errors += 1
                done += 1
                if done % 500 == 0:
                    elapsed = time.time() - t0
                    rate = done / elapsed if elapsed > 0 else 0
                    print(f"  progress {done}/{len(pros)} ok={ok} err={errors} ({rate:.0f}/s)")

    print(f"\n[done] ok={ok} skip={skip} errors={errors} en {time.time()-t0:.0f}s")
    print(f"       niveaux: {stats_niveaux}")
    print(f"       alertes totales: {stats_alertes}")


if __name__ == "__main__":
    main()
