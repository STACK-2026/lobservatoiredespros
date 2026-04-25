#!/usr/bin/env python3
"""
audit_metier_post_import.py , verifie la coherence d'un import metier.

Verifications :
  1. Coverage : dpts couverts (target 96 metropole)
  2. Volume : nb pros total + moyenne/dpt + outliers
  3. Unicite : pas de SIRET duplique sur le meme metier
  4. Thin combos : dpts avec < 5 pros (a flagger pour filtrage UI)
  5. Junctions : pas de pros orphelins (pros sans pro_metiers ou pro_zones)

Exit code :
  0 = OK
  1 = WARN (issues mineures, on continue)
  2 = FAIL (issues critiques, halt)

Usage :
  python3 scripts/audit_metier_post_import.py --metier plombier
"""
import argparse
import json
import sys
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ENV_MASTER = Path.home() / "stack-2026" / ".env.master"
PROJECT_REF = "apuyeakgxjgdcfssrtek"


def load_pat():
    for line in ENV_MASTER.read_text().splitlines():
        if line.startswith("SUPABASE_PAT="):
            return line.split("=", 1)[1].strip()
    raise RuntimeError("SUPABASE_PAT introuvable dans .env.master")


def query(sql, pat):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {pat}",
            "Content-Type": "application/json",
            "User-Agent": "lobservatoiredespros-audit/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def audit(slug, pat):
    issues_critical = []
    issues_warn = []
    report = []

    cov_sql = f"""
        SELECT z.code, COUNT(DISTINCT pm.pro_id) AS pros
        FROM zones z
        JOIN pro_zones pz ON pz.zone_id = z.id
        JOIN pro_metiers pm ON pm.pro_id = pz.pro_id
        JOIN metiers m ON m.id = pm.metier_id
        WHERE z.type = 'departement' AND m.slug = '{slug}'
        GROUP BY z.code
        ORDER BY z.code
    """
    cov_rows = query(cov_sql, pat)
    cov = {r["code"]: r["pros"] for r in cov_rows}
    n_dpts = len(cov)
    total = sum(cov.values())
    avg = (total / n_dpts) if n_dpts else 0
    thin = [d for d, c in cov.items() if c < 5]
    very_thin = [d for d, c in cov.items() if c == 0]
    big = sorted(cov.items(), key=lambda kv: -kv[1])[:3]
    small = sorted(cov.items(), key=lambda kv: kv[1])[:3]

    report.append(f"Metier : {slug}")
    report.append(f"  Dpts couverts   : {n_dpts} / 96 metropole")
    report.append(f"  Pros total      : {total}")
    report.append(f"  Moyenne / dpt   : {avg:.1f}")
    report.append(f"  Top 3 dpts      : {', '.join(f'{d}={c}' for d, c in big)}")
    report.append(f"  Bottom 3 dpts   : {', '.join(f'{d}={c}' for d, c in small)}")

    if n_dpts < 70:
        issues_critical.append(f"coverage faible : {n_dpts}/96 dpts")
    elif n_dpts < 90:
        issues_warn.append(f"coverage incomplete : {n_dpts}/96 dpts")
    if thin:
        issues_warn.append(f"{len(thin)} dpts avec <5 pros : {','.join(thin[:8])}")
    if very_thin:
        issues_warn.append(f"{len(very_thin)} dpts sans pros : {','.join(very_thin[:8])}")

    dup_sql = f"""
        SELECT COUNT(*) - COUNT(DISTINCT p.siret) AS dupes
        FROM pros p
        JOIN pro_metiers pm ON pm.pro_id = p.id
        JOIN metiers m ON m.id = pm.metier_id
        WHERE m.slug = '{slug}' AND p.siret IS NOT NULL
    """
    dup_rows = query(dup_sql, pat)
    dupes = dup_rows[0].get("dupes", 0) if dup_rows else 0
    report.append(f"  SIRET dupliques : {dupes}")
    if dupes > 0:
        issues_critical.append(f"{dupes} SIRETs dupliques sur metier {slug}")

    orph_sql = f"""
        SELECT COUNT(*) AS orphans
        FROM pros p
        JOIN pro_metiers pm ON pm.pro_id = p.id
        JOIN metiers m ON m.id = pm.metier_id
        LEFT JOIN pro_zones pz ON pz.pro_id = p.id
        WHERE m.slug = '{slug}' AND pz.pro_id IS NULL
    """
    orph_rows = query(orph_sql, pat)
    orphans = orph_rows[0].get("orphans", 0) if orph_rows else 0
    report.append(f"  Pros orphelins  : {orphans} (sans pro_zones)")
    if orphans > 0:
        issues_critical.append(f"{orphans} pros orphelins sur metier {slug}")

    geo_sql = f"""
        SELECT
          COUNT(*) FILTER (WHERE p.lat IS NOT NULL) AS geo,
          COUNT(*) AS total
        FROM pros p
        JOIN pro_metiers pm ON pm.pro_id = p.id
        JOIN metiers m ON m.id = pm.metier_id
        WHERE m.slug = '{slug}'
    """
    geo_rows = query(geo_sql, pat)
    g = geo_rows[0] if geo_rows else {"geo": 0, "total": 0}
    pct = (100 * g["geo"] / g["total"]) if g["total"] else 0
    report.append(f"  Geocodes        : {g['geo']}/{g['total']} ({pct:.1f}%)")

    if issues_critical:
        report.append("")
        report.append("ISSUES CRITICAL:")
        for i in issues_critical:
            report.append(f"  - {i}")
    if issues_warn:
        report.append("")
        report.append("ISSUES WARN:")
        for i in issues_warn:
            report.append(f"  - {i}")
    if not issues_critical and not issues_warn:
        report.append("")
        report.append("STATUS : OK")

    print("\n".join(report))

    if issues_critical:
        return 2
    if issues_warn:
        return 1
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--metier", required=True)
    args = ap.parse_args()
    pat = load_pat()
    sys.exit(audit(args.metier, pat))


if __name__ == "__main__":
    main()
