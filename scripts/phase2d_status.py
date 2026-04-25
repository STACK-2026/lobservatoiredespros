#!/usr/bin/env python3
"""
phase2d_status.py , status snapshot Phase 2.D import national.

Affiche :
  - Process orchestrator + import_sirene PIDs
  - Progress per metier (dpts couverts / 96)
  - Last 15 lignes du log orchestrator

Usage : python3 scripts/phase2d_status.py
"""
import json
import subprocess
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LOG = REPO / "logs" / "phase2d" / "orchestrator.log"
ENV_MASTER = Path.home() / "stack-2026" / ".env.master"
PROJECT_REF = "apuyeakgxjgdcfssrtek"

METIERS = [
    "plombier", "electricien", "couvreur", "menuisier", "isolation",
    "chauffagiste", "plaquiste", "carreleur", "peintre", "serrurier",
    "macon", "jardinier", "climaticien", "cuisiniste", "parqueteur",
]


def load_pat():
    for line in ENV_MASTER.read_text().splitlines():
        if line.startswith("SUPABASE_PAT="):
            return line.split("=", 1)[1].strip()


def db_query(sql, pat):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {pat}",
            "Content-Type": "application/json",
            "User-Agent": "lobservatoiredespros-status/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    pat = load_pat()
    print("=" * 60)
    print("Phase 2.D Status , L'Observatoire des Pros")
    print("=" * 60)

    ps = subprocess.run(
        ["pgrep", "-fl", "orchestrator|import_sirene"],
        capture_output=True, text=True,
    ).stdout.strip()
    print("\nPROCESS:")
    if ps:
        print(ps)
    else:
        print("  (aucun process orchestrator/import en cours)")

    print("\nDB COVERAGE:")
    rows = db_query(
        """SELECT m.slug AS metier,
                  COUNT(DISTINCT z.code) FILTER (WHERE z.type='departement') AS dpts,
                  COUNT(DISTINCT pm.pro_id) AS pros
           FROM metiers m
           LEFT JOIN pro_metiers pm ON pm.metier_id = m.id
           LEFT JOIN pro_zones pz ON pz.pro_id = pm.pro_id
           LEFT JOIN zones z ON z.id = pz.zone_id
           GROUP BY m.slug
           ORDER BY m.slug""",
        pat,
    )
    by_slug = {r["metier"]: r for r in rows}
    for slug in METIERS:
        r = by_slug.get(slug, {"dpts": 0, "pros": 0})
        bar = "#" * (r["dpts"] // 4)
        print(f"  {slug:14} {r['dpts']:3}/96 dpts  {r['pros']:6} pros  {bar}")

    totals = db_query(
        "SELECT COUNT(*) AS pros, COUNT(*) FILTER (WHERE lat IS NOT NULL) AS geo, "
        "COUNT(*) FILTER (WHERE enriched_at IS NOT NULL) AS enr, "
        "COUNT(*) FILTER (WHERE last_trust_sync IS NOT NULL) AS bod FROM pros",
        pat,
    )[0]
    print(f"\nTOTAL : {totals['pros']:,} pros , geo {totals['geo']:,} , enr {totals['enr']:,} , bodacc {totals['bod']:,}")

    print("\nLAST LOG LINES:")
    if LOG.exists():
        lines = LOG.read_text().splitlines()
        for line in lines[-15:]:
            print("  " + line)
    else:
        print("  (no log yet)")


if __name__ == "__main__":
    main()
