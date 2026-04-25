#!/usr/bin/env python3
"""
import_sirene_bulk.py , Import national Sirene en UNE SEULE query DuckDB
                         pour les 15 metiers x 96 dpts metropole, au lieu
                         des 1440 queries du script per-combo.

Gain attendu : 30h -> 30-60 min (network INSEE parquet downloade une seule fois).

Strategie :
  1. Une query DuckDB avec ROW_NUMBER() PARTITION BY (naf, dpt) pour LIMIT par combo
  2. Filtrage codeCommuneEtablissement (corrige le bug Corse 2A/2B vs codePostal)
  3. Pour chaque ligne : determiner le(s) metier(s) (NAF partage : 43.22B et 43.33Z)
  4. Bulk upsert pros + pro_metiers + pro_zones via Supabase REST (batches 100)
  5. Audit post-import par metier via audit_metier_post_import.py

Usage :
  python3 scripts/import_sirene_bulk.py --dry-run --limit 5    # test rapide
  python3 scripts/import_sirene_bulk.py --insert --limit 100   # import complet
"""

import argparse
import csv
import os
import sys
import time
from datetime import datetime, date
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

# Reuse la logique existante de import_sirene.py
sys.path.insert(0, str(Path(__file__).resolve().parent))
from import_sirene import (  # noqa: E402
    METIERS,
    DEPARTEMENTS,
    SIRENE_COLUMNS,
    PARQUET_URL,
    UNITE_LEGALE_PARQUET,
    SUPABASE_URL,
    CACHE_DIR,
    build_name,
    build_address,
    build_slug,
    compute_score_confiance,
    is_nd,
    log,
    get_supabase_service_key,
    supabase_upsert,
    supabase_get_metiers,
    supabase_get_zones,
    supabase_get_pros_ids,
)

try:
    import duckdb
except ImportError:
    print("ERROR : duckdb manquant. pip install --user duckdb", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Mapping NAF -> liste de metiers (1 NAF peut etre partage par 2 metiers)
# ---------------------------------------------------------------------------
NAF_TO_METIERS: Dict[str, List[str]] = {}
for slug, info in METIERS.items():
    NAF_TO_METIERS.setdefault(info["naf"], []).append(slug)

UNIQUE_NAFS = sorted(NAF_TO_METIERS.keys())
ALL_DEPTS = sorted(DEPARTEMENTS.keys())


def query_sirene_bulk(limit_per_combo: int = 100) -> List[dict]:
    """Query unique : tous NAFs x tous dpts en une seule passe parquet."""
    log("=" * 72)
    log(f"BULK Query Sirene : {len(UNIQUE_NAFS)} NAFs x {len(ALL_DEPTS)} dpts")
    log(f"  NAFs : {','.join(UNIQUE_NAFS)}")
    log(f"  Dpts : {len(ALL_DEPTS)} metropole (incl. 2A/2B)")
    log(f"  Limit per combo : {limit_per_combo}")
    log("=" * 72)

    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    con.execute("SET memory_limit='6GB';")
    con.execute("SET threads=4;")

    cols = ", ".join(SIRENE_COLUMNS)
    nafs_in = ",".join(f"'{n}'" for n in UNIQUE_NAFS)
    depts_in = ",".join(f"'{d}'" for d in ALL_DEPTS)

    # Filtrage par codeCommuneEtablissement (substring 1,2 = code dept INSEE)
    # Pour 2A/2B : codeCommuneEtablissement = "2A001" ou "2B001" -> SUBSTRING OK.
    # Pour metropole : codeCommune = "75056" (Paris) -> SUBSTRING(1,2) = "75" OK.
    # ROW_NUMBER PARTITION BY (naf, dept_insee) ordonne par creation desc.
    query = f"""
    WITH ranked AS (
      SELECT
        {cols},
        SUBSTRING(etab.codeCommuneEtablissement, 1, 2) AS _dept_code,
        etab.activitePrincipaleEtablissement AS _naf_code,
        ROW_NUMBER() OVER (
          PARTITION BY etab.activitePrincipaleEtablissement,
                       SUBSTRING(etab.codeCommuneEtablissement, 1, 2)
          ORDER BY etab.dateCreationEtablissement DESC NULLS LAST
        ) AS _rn
      FROM '{PARQUET_URL}' AS etab
      LEFT JOIN '{UNITE_LEGALE_PARQUET}' AS ul
        ON etab.siren = ul.siren
      WHERE etab.activitePrincipaleEtablissement IN ({nafs_in})
        AND etab.etatAdministratifEtablissement = 'A'
        AND SUBSTRING(etab.codeCommuneEtablissement, 1, 2) IN ({depts_in})
    )
    SELECT * FROM ranked WHERE _rn <= {int(limit_per_combo)}
    """

    t0 = time.time()
    log("Lancement query parquet (peut prendre 5-30 min selon network)...")
    result = con.execute(query)
    raw_columns = [d[0] for d in result.description]
    columns = [c.split(".")[-1] if "." in c else c for c in raw_columns]
    rows = result.fetchall()
    con.close()
    elapsed = time.time() - t0
    log(f"BULK query : {len(rows):,} rows en {elapsed:.0f}s ({len(rows)/elapsed:.0f}/s si non-zero)")
    return [dict(zip(columns, r)) for r in rows]


def row_to_pro(record: dict) -> Optional[dict]:
    """Transforme une row Sirene en dict pro Supabase. None si invalide."""
    name = build_name(record)
    if not name:
        return None
    siret = str(record.get("siret", "")).strip()
    siren = str(record.get("siren", "")).strip()
    if not siren or not siret:
        return None
    ville = str(record.get("libelleCommuneEtablissement", "") or "").title()
    date_creation = record.get("dateCreationEtablissement")
    if isinstance(date_creation, (datetime, date)):
        date_creation_str = date_creation.isoformat()[:10]
    elif date_creation:
        date_creation_str = str(date_creation)[:10]
    else:
        date_creation_str = None
    slug = build_slug(name, siren, ville)
    return {
        "nom_entreprise": name,
        "slug": slug,
        "siret": siret,
        "siren": siren,
        "adresse": build_address(record),
        "code_postal": str(record.get("codePostalEtablissement", "") or ""),
        "ville": ville,
        "date_creation_entreprise": date_creation_str,
        "score_confiance": compute_score_confiance(record),
        "tier": "gratuit",
        "active": True,
        "source": "sirene-insee",
    }


def deduplicate_slugs(pros: List[dict]) -> List[dict]:
    """Dedup propre : meme slug pour 2 SIRETs differents -> -2, -3, etc."""
    seen = {}
    counters: Dict[str, int] = {}
    out = []
    for p in pros:
        base = p["slug"]
        if base not in seen:
            seen[base] = p["siret"]
            out.append(p)
            continue
        # Meme slug pour 2 pros differents : numerote
        if seen[base] == p["siret"]:
            # Meme SIRET re-importe, garde slug original
            out.append(p)
            continue
        counters[base] = counters.get(base, 1) + 1
        new_slug = f"{base}-{counters[base]}"
        while new_slug in seen:
            counters[base] += 1
            new_slug = f"{base}-{counters[base]}"
        p["slug"] = new_slug
        seen[new_slug] = p["siret"]
        out.append(p)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n\n")[0])
    ap.add_argument("--limit", type=int, default=100, help="Limit per (naf, dpt) combo")
    ap.add_argument("--insert", action="store_true", help="Insert dans Supabase")
    ap.add_argument("--dry-run", action="store_true", help="Comptage only")
    ap.add_argument("--csv-out", help="Sauvegarder rows en CSV pour debug")
    args = ap.parse_args()

    if args.dry_run and args.insert:
        ap.error("--dry-run et --insert s'excluent")

    # 1. Bulk query
    rows = query_sirene_bulk(limit_per_combo=args.limit)

    if args.csv_out:
        log(f"CSV out : {args.csv_out}")
        with open(args.csv_out, "w", newline="", encoding="utf-8") as f:
            if rows:
                w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), extrasaction="ignore")
                w.writeheader()
                for r in rows:
                    w.writerow({k: ("" if v is None else str(v)) for k, v in r.items()})

    # 2. Stats par combo
    by_combo: Dict[Tuple[str, str], int] = {}
    for r in rows:
        key = (r.get("_naf_code"), r.get("_dept_code"))
        by_combo[key] = by_combo.get(key, 0) + 1
    log(f"Combos couverts : {len(by_combo)} / {len(UNIQUE_NAFS) * len(ALL_DEPTS)}")

    # 3. Build pros + relations
    valid_pros: List[dict] = []
    pro_relations: List[dict] = []  # rows with siret + metier_keys + dept_code
    excluded = 0
    for r in rows:
        pro = row_to_pro(r)
        if not pro:
            excluded += 1
            continue
        naf = r.get("_naf_code")
        dept_code = r.get("_dept_code")
        metier_keys = NAF_TO_METIERS.get(naf, [])
        if not metier_keys or dept_code not in DEPARTEMENTS:
            excluded += 1
            continue
        valid_pros.append(pro)
        pro_relations.append({
            "siret": pro["siret"],
            "metier_keys": metier_keys,
            "dept_code": dept_code,
        })

    log(f"Pros valides : {len(valid_pros)} / {len(rows)} (exclus : {excluded})")

    # 4. Dedup slugs
    valid_pros = deduplicate_slugs(valid_pros)

    if args.dry_run:
        log("=" * 72)
        log("DRY-RUN , aucune ecriture en DB. Termine.")
        return

    if not args.insert:
        log("Pas de --insert. Termine.")
        return

    # 5. Upsert pros (dedup par siret au cas ou)
    seen_sirets = set()
    pros_unique = []
    for p in valid_pros:
        if p["siret"] in seen_sirets:
            continue
        seen_sirets.add(p["siret"])
        pros_unique.append(p)
    log(f"Pros uniques par SIRET : {len(pros_unique)}")

    service_key = get_supabase_service_key()
    log("Fetch metier_id + zone_id maps Supabase...")
    metiers_map = supabase_get_metiers(service_key)
    _, zones_by_code = supabase_get_zones(service_key)

    log(f"Upsert {len(pros_unique)} pros (batches 100)...")
    total = 0
    for i in range(0, len(pros_unique), 100):
        batch = pros_unique[i:i + 100]
        n = supabase_upsert("pros", batch, service_key, on_conflict="slug")
        total += n
        if (i // 100) % 10 == 0:
            log(f"  pros batch {i//100 + 1}/{(len(pros_unique) + 99)//100} : +{n} (cumul {total})")
    log(f"pros upserted : {total}")

    # 6. Map sirets -> pro_id
    log("Fetch pro_id mapping (batches 200)...")
    sirets = [p["siret"] for p in pros_unique]
    id_map: Dict[str, str] = {}
    for i in range(0, len(sirets), 200):
        batch = sirets[i:i + 200]
        partial = supabase_get_pros_ids(service_key, batch)
        id_map.update(partial)
    log(f"pro_id mappes : {len(id_map)} / {len(sirets)}")

    # 7. Build pro_metiers + pro_zones (dedup au cas ou)
    pro_metiers_set: Set[Tuple[str, str]] = set()
    pro_zones_set: Set[Tuple[str, str]] = set()
    for rel in pro_relations:
        pro_id = id_map.get(rel["siret"])
        if not pro_id:
            continue
        zone_id = zones_by_code.get(rel["dept_code"])
        if zone_id:
            pro_zones_set.add((pro_id, zone_id))
        for mk in rel["metier_keys"]:
            metier_id = metiers_map.get(mk)
            if metier_id:
                pro_metiers_set.add((pro_id, metier_id))

    pro_metiers_rows = [{"pro_id": pid, "metier_id": mid} for pid, mid in pro_metiers_set]
    pro_zones_rows = [{"pro_id": pid, "zone_id": zid, "rayon_km": 30} for pid, zid in pro_zones_set]
    log(f"pro_metiers a upsert : {len(pro_metiers_rows)}")
    log(f"pro_zones a upsert   : {len(pro_zones_rows)}")

    # 8. Upsert relations (batches 100)
    log("Upsert pro_metiers...")
    total_pm = 0
    for i in range(0, len(pro_metiers_rows), 100):
        batch = pro_metiers_rows[i:i + 100]
        n = supabase_upsert("pro_metiers", batch, service_key, on_conflict="pro_id,metier_id")
        total_pm += n
    log(f"pro_metiers upserted : {total_pm}")

    log("Upsert pro_zones...")
    total_pz = 0
    for i in range(0, len(pro_zones_rows), 100):
        batch = pro_zones_rows[i:i + 100]
        n = supabase_upsert("pro_zones", batch, service_key, on_conflict="pro_id,zone_id")
        total_pz += n
    log(f"pro_zones upserted : {total_pz}")

    log("=" * 72)
    log(f"BULK IMPORT TERMINE : {len(pros_unique)} pros, {total_pm} pro_metiers, {total_pz} pro_zones")
    log("=" * 72)


if __name__ == "__main__":
    main()
