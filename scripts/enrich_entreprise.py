#!/usr/bin/env python3
"""
Enrichissement via API recherche-entreprises.api.gouv.fr (gratuit, pas de cle).

Recupere pour chaque SIREN :
  - categorie_entreprise (PME, ETI, GE)
  - tranche_effectif_salarie (00, 01, 02, ... 53, NN)
  - dirigeants[] : nom, prenoms, qualite
  - complements.est_qualiopi, est_ess, est_bio, etc.
  - etat_administratif (A active / C cessee)
  - convention_collective_renseignee

Met a jour la table pros. Plus apres, on re-run sync_bodacc pour recalculer
le Trust Score v2 avec les nouveaux signaux.

Usage :
    python3 scripts/enrich_entreprise.py --commit
    python3 scripts/enrich_entreprise.py --commit --only-missing
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

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
            headers={"Authorization": f"Bearer {pat}"},
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
}

API_RE = "https://recherche-entreprises.api.gouv.fr/search"
UA = "ObservatoireDesPros/1.0 (contact@lobservatoiredespros.com)"


def sb_get(path: str) -> list:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def sb_get_paged(path_no_limit: str, cap: int = 200000, page: int = 1000) -> list:
    """Paginé : PostgREST Supabase cap hardcodé = 1000 rows par requête.
    path_no_limit : query string SANS &limit / &offset.
    """
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
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url, data=data,
        headers={**HEADERS, "Prefer": "return=minimal"},
        method="PATCH",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def fetch_entreprise(siren: str) -> dict | None:
    """Retourne les infos enrichies pour un SIREN, ou None si introuvable."""
    clean = "".join(c for c in str(siren) if c.isdigit())
    if not clean:
        return None
    params = {"q": clean, "per_page": "1"}
    url = f"{API_RE}?{urllib.parse.urlencode(params)}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8"))
    except Exception:
        return None
    results = data.get("results") or []
    if not results:
        return None
    r0 = results[0]
    dirigeants = r0.get("dirigeants") or []
    complements = r0.get("complements") or {}

    return {
        "categorie_entreprise": r0.get("categorie_entreprise"),
        "tranche_effectif": r0.get("tranche_effectif_salarie"),
        "dirigeants_count": len(dirigeants),
        "dirigeants_json": [
            {
                "nom": d.get("nom"),
                "prenoms": d.get("prenoms"),
                "qualite": d.get("qualite"),
                "type": d.get("type_dirigeant"),
            }
            for d in dirigeants[:5]  # top 5
        ],
        "est_qualiopi": bool(complements.get("est_qualiopi")),
        "convention_collective": (
            complements.get("liste_idcc", [None])[0]
            if isinstance(complements.get("liste_idcc"), list) and complements.get("liste_idcc")
            else None
        ),
        "etat_administratif": r0.get("etat_administratif") or "A",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--only-missing", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sleep", type=float, default=0.15)
    args = parser.parse_args()

    where = ["active=eq.true", "siren=not.is.null"]
    if args.only_missing:
        where.append("enriched_at=is.null")
    # order=id stable pour pagination fiable
    where.append("order=id")
    q = "pros?select=id,slug,siren&" + "&".join(where)
    # Paginé pour absorber le volume post-import national (cap PostgREST = 1000/page)
    cap = args.limit if args.limit else 200000
    pros = sb_get_paged(q, cap=cap)
    print(f"[info] {len(pros)} pros to enrich (commit={args.commit})")

    ok = 0
    miss = 0
    for i, pro in enumerate(pros, start=1):
        info = fetch_entreprise(pro.get("siren") or "")
        if not info:
            miss += 1
            print(f"  [{i}/{len(pros)}] [MISS] {pro.get('slug')}: no API match")
            time.sleep(args.sleep)
            continue

        tag = "[DRY]" if not args.commit else "[OK]"
        cat = info.get("categorie_entreprise") or "?"
        eff = info.get("tranche_effectif") or "?"
        dir_count = info.get("dirigeants_count") or 0
        etat = info.get("etat_administratif") or "A"
        print(f"  [{i}/{len(pros)}] {tag} {pro.get('slug')} : {cat} · eff.{eff} · {dir_count} dirigeants · etat={etat}")

        if args.commit:
            body = {**info, "enriched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")}
            # JSONB directement comme liste
            body["dirigeants_json"] = info["dirigeants_json"]
            try:
                sb_patch(f"pros?id=eq.{pro['id']}", body)
                ok += 1
            except Exception as e:
                print(f"    [warn] patch failed: {e}")
                miss += 1
        else:
            ok += 1
        time.sleep(args.sleep)

    print(f"\n[done] enriched={ok}, missing={miss}")


if __name__ == "__main__":
    main()
