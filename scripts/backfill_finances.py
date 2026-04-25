#!/usr/bin/env python3
"""
backfill_finances.py , Backfill CA + resultat_net + marge_brute + annee_bilan
                       pour les pros deja enrichis (avant ajout du flag
                       include=finances dans enrich_entreprise.py).

A executer apres enrich_entreprise.py si la pipeline initiale n'avait pas
encore le flag finances.

Usage :
  python3 scripts/backfill_finances.py --commit
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

ROOT = Path(__file__).resolve().parent.parent
ENV_MASTER = ROOT.parent / ".env.master"


def _load_env(path):
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
            headers={"Authorization": f"Bearer {pat}", "User-Agent": "lobs-fin/1.0"},
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
    "User-Agent": "lobservatoiredespros-fin/1.0",
    "Prefer": "return=minimal",
}

API_RE = "https://recherche-entreprises.api.gouv.fr/search"
UA = "ObservatoireDesPros/1.0 (contact@lobservatoiredespros.com)"


def sb_get_paged(path: str, cap: int = 200000, page: int = 1000) -> list:
    out: list = []
    start = 0
    sep = "&" if "?" in path else "?"
    while start < cap:
        url = f"{SUPABASE_URL}/rest/v1/{path}{sep}offset={start}&limit={page}"
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


def fetch_finances(siren: str):
    clean = "".join(c for c in str(siren) if c.isdigit())
    if not clean:
        return None
    params = {"q": clean, "per_page": "1", "include": "finances", "minimal": "true"}
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
    fin = (results[0].get("finances") or {})
    if not fin:
        return None
    try:
        latest = max(fin.keys())
    except ValueError:
        return None
    f = fin[latest] or {}
    return {
        "ca": f.get("ca"),
        "resultat_net": f.get("resultat_net"),
        "marge_brute": f.get("marge_brute"),
        "annee_bilan": int(latest) if str(latest).isdigit() else None,
    }


_lock = threading.Lock()


def _process(pro, commit, sleep_s):
    siren = (pro.get("siren") or "").replace(" ", "")
    if not siren:
        return "skip"
    fin = fetch_finances(siren)
    if not fin or not any(v is not None for v in fin.values()):
        if sleep_s:
            time.sleep(sleep_s)
        return "miss"
    if commit:
        try:
            sb_patch(f"pros?id=eq.{pro['id']}", fin)
        except Exception:
            return "fail"
    if sleep_s:
        time.sleep(sleep_s)
    return "ok"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--workers", type=int, default=2, help="API rate-limited per IP")
    ap.add_argument("--sleep", type=float, default=0.1)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    pros = sb_get_paged(
        "pros?select=id,siren,ca&active=eq.true&siren=not.is.null&ca=is.null&order=id"
    )
    if args.limit:
        pros = pros[: args.limit]
    print(f"[info] {len(pros)} pros sans finances (workers={args.workers})", flush=True)

    ok = miss = fail = skip = 0
    done = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
        futures = [ex.submit(_process, p, args.commit, args.sleep) for p in pros]
        for f in as_completed(futures):
            try:
                status = f.result()
            except Exception:
                status = "fail"
            with _lock:
                if status == "ok":
                    ok += 1
                elif status == "miss":
                    miss += 1
                elif status == "skip":
                    skip += 1
                else:
                    fail += 1
                done += 1
                if done % 500 == 0:
                    rate = done / max(time.time() - t0, 1)
                    print(f"  progress {done}/{len(pros)} ok={ok} miss={miss} ({rate:.1f}/s)", flush=True)

    print(f"\n[done] ok={ok} miss={miss} fail={fail} skip={skip} en {time.time()-t0:.0f}s")


if __name__ == "__main__":
    main()
