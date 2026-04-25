#!/usr/bin/env python3
"""
import_sirene.py , Import professionnels BTP depuis le stock parquet INSEE Sirene
                   vers la base Supabase de L'Observatoire des Pros.

Pattern reutilise de commandez/scripts/collect_sirene.py (DuckDB + httpfs +
parquet remote). Pas de rate limit, interrogation directe du dump INSEE.

Source : https://object.files.data.gouv.fr/data-pipeline-open/siren/stock/StockEtablissement_utf8.parquet

Usage :
  python3 scripts/import_sirene.py --dry-run              # comptage only
  python3 scripts/import_sirene.py --metier plombier --dept 89
  python3 scripts/import_sirene.py --metier plombier --depts 75,77,78,91,92,93,94,95  # IDF
  python3 scripts/import_sirene.py --metier plombier --all-depts --insert              # national 1 metier
  python3 scripts/import_sirene.py --all-metiers --dept 75 --insert                    # Paris, tous metiers
  python3 scripts/import_sirene.py --all-metiers --all-depts --insert                  # national complet
  python3 scripts/import_sirene.py --all-pilots                                        # legacy : 5 metiers x 3 depts
  python3 scripts/import_sirene.py --metier plombier --dept 89 --insert --limit 50

ETAT 2026-04-24 :
  , metiers : 15 codes NAF BTP (5 pilotes + 10 nouveaux)
  , depts : 96 (metropole complet via lib_geo_fr.DEPARTEMENTS_FR)
  , pilote historique : plombier/electricien/couvreur/menuisier/isolation sur 75/21/89
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import unicodedata
import urllib.request
from datetime import datetime, date
from pathlib import Path

try:
    import duckdb
except ImportError:
    print("ERROR : duckdb manquant. pip install --user duckdb", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = REPO_ROOT / "scripts"
CACHE_DIR = REPO_ROOT / "scripts" / ".cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

PARQUET_URL = "https://object.files.data.gouv.fr/data-pipeline-open/siren/stock/StockEtablissement_utf8.parquet"
UNITE_LEGALE_PARQUET = "https://object.files.data.gouv.fr/data-pipeline-open/siren/stock/StockUniteLegale_utf8.parquet"

SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co"

# Codes NAF pour les metiers du BTP (5 pilotes historiques + 10 nouveaux Phase 2)
# Note : plusieurs metiers peuvent partager un NAF (chauffagiste/climaticien sur 43.22B,
# carreleur/parqueteur sur 43.33Z). L'import filtre par NAF mais la table metiers
# conserve les labels distincts pour la presentation editoriale.
METIERS = {
    # Pilotes historiques (Yonne 89 livre Phase 1)
    "plombier":     {"naf": "43.22A", "nom": "Plombier",                    "nom_pluriel": "Plombiers"},
    "electricien":  {"naf": "43.21A", "nom": "Electricien",                 "nom_pluriel": "Electriciens"},
    "couvreur":     {"naf": "43.91B", "nom": "Couvreur",                    "nom_pluriel": "Couvreurs"},
    "menuisier":    {"naf": "43.32A", "nom": "Menuisier",                   "nom_pluriel": "Menuisiers"},
    "isolation":    {"naf": "43.29A", "nom": "Entreprise d'isolation",     "nom_pluriel": "Entreprises d'isolation"},
    # Nouveaux Phase 2 (extension nationale)
    "chauffagiste": {"naf": "43.22B", "nom": "Chauffagiste",                "nom_pluriel": "Chauffagistes"},
    "plaquiste":    {"naf": "43.39Z", "nom": "Plaquiste",                   "nom_pluriel": "Plaquistes"},
    "carreleur":    {"naf": "43.33Z", "nom": "Carreleur",                   "nom_pluriel": "Carreleurs"},
    "peintre":      {"naf": "43.34Z", "nom": "Peintre en batiment",         "nom_pluriel": "Peintres en batiment"},
    "serrurier":    {"naf": "43.32B", "nom": "Serrurier-metallier",         "nom_pluriel": "Serruriers-metalliers"},
    "macon":        {"naf": "43.99C", "nom": "Macon",                       "nom_pluriel": "Macons"},
    "jardinier":    {"naf": "81.30Z", "nom": "Jardinier paysagiste",        "nom_pluriel": "Jardiniers paysagistes"},
    "climaticien":  {"naf": "43.22B", "nom": "Climaticien",                 "nom_pluriel": "Climaticiens"},  # partage NAF avec chauffagiste
    "cuisiniste":   {"naf": "47.59A", "nom": "Cuisiniste",                  "nom_pluriel": "Cuisinistes"},   # retail specialisee
    "parqueteur":   {"naf": "43.33Z", "nom": "Parqueteur",                  "nom_pluriel": "Parqueteurs"},    # partage NAF avec carreleur
}

# Couverture nationale : 96 departements metropole via lib_geo_fr
# Import uniformise : DEPARTEMENTS[code] = {nom, slug, region_code}
from lib_geo_fr import DEPARTEMENTS_FR as DEPARTEMENTS, REGIONS_FR

# Sous-ensemble pilote historique (retrocompat --all-pilots, 5 metiers x 3 depts)
PILOT_METIERS = ("plombier", "electricien", "couvreur", "menuisier", "isolation")
PILOT_DEPTS = ("75", "21", "89")

SIRENE_COLUMNS = [
    "etab.siret",
    "etab.siren",
    "etab.denominationUsuelleEtablissement",
    "etab.enseigne1Etablissement",
    "etab.enseigne2Etablissement",
    "etab.enseigne3Etablissement",
    "etab.activitePrincipaleEtablissement",
    "etab.dateCreationEtablissement",
    "etab.etatAdministratifEtablissement",
    "etab.codePostalEtablissement",
    "etab.libelleCommuneEtablissement",
    "etab.codeCommuneEtablissement",
    "etab.numeroVoieEtablissement",
    "etab.typeVoieEtablissement",
    "etab.libelleVoieEtablissement",
    "etab.complementAdresseEtablissement",
    "etab.trancheEffectifsEtablissement",
    "etab.etablissementSiege",
    # UniteLegale , pour recuperer le nom du dirigeant si autoentrepreneur
    "ul.denominationUniteLegale",
    "ul.prenom1UniteLegale",
    "ul.nomUniteLegale",
    "ul.categorieJuridiqueUniteLegale",
    "ul.economieSocialeSolidaireUniteLegale",
    "ul.nomUsageUniteLegale",
    "ul.sigleUniteLegale",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def is_nd(val):
    return not val or str(val).strip() in ("[ND]", "ND", "NN", "")


def build_name(record):
    """Construit le nom de l'entreprise avec fallbacks en cascade :
    1. denominationUsuelleEtablissement
    2. enseigne1/2/3Etablissement
    3. denominationUniteLegale (raison sociale legale)
    4. sigleUniteLegale
    5. "Prenom NOM" dirigeant (autoentrepreneur)
    6. None -> exclure de l'import
    """
    for key in ("denominationUsuelleEtablissement", "enseigne1Etablissement",
                "enseigne2Etablissement", "enseigne3Etablissement",
                "denominationUniteLegale", "sigleUniteLegale"):
        name = record.get(key)
        if name and not is_nd(name):
            raw = str(name).strip()
            # Preserve ALL-CAPS (style INSEE) si :
            # , mot court (<=6 chars, sigle type PPS, KELNA, PSR89, SARL, EURL)
            # , ou nom entier en caps (plusieurs mots)
            if raw.isupper():
                return raw
            # Sinon : title case mais preserve les acronymes isoles
            words = raw.split()
            out_words = []
            for w in words:
                if len(w) <= 4 and w.isupper():
                    out_words.append(w)  # HE, PSR, etc.
                elif w.isupper() and len(w) <= 8:
                    out_words.append(w)  # PLOMBERIE, KELNA
                else:
                    out_words.append(w.title())
            return " ".join(out_words)

    # Fallback : autoentrepreneur , on reconstruit "Prenom NOM"
    prenom = record.get("prenom1UniteLegale") or ""
    nom = record.get("nomUsageUniteLegale") or record.get("nomUniteLegale") or ""
    if not is_nd(prenom) and not is_nd(nom):
        return f"{str(prenom).strip().title()} {str(nom).strip().upper()}"
    if not is_nd(nom):
        return str(nom).strip().upper()
    return None  # pas de nom exploitable, on exclura cette entree


def build_address(record):
    parts = []
    num = record.get("numeroVoieEtablissement") or ""
    typ = record.get("typeVoieEtablissement") or ""
    voie = record.get("libelleVoieEtablissement") or ""
    if not is_nd(num):
        parts.append(str(num))
    if not is_nd(typ):
        parts.append(str(typ))
    if not is_nd(voie):
        parts.append(str(voie))
    street = " ".join(parts).strip()
    cp = "" if is_nd(record.get("codePostalEtablissement")) else str(record["codePostalEtablissement"])
    commune = "" if is_nd(record.get("libelleCommuneEtablissement")) else str(record["libelleCommuneEtablissement"])
    if street and cp:
        return f"{street} {cp} {commune}".strip()
    return f"{cp} {commune}".strip() or commune


def slugify(text, max_len=70):
    """Slug ASCII robuste. Gere les accents, ponctuation, apostrophes."""
    text = unicodedata.normalize("NFKD", str(text))
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    text = re.sub(r"-+", "-", text)
    return text[:max_len].strip("-")


def build_slug(name, siren, ville):
    """Construit un slug propre : nom-ville (sans suffixe SIREN).
    Si collision detectee plus tard, le caller appendra -2, -3, etc.
    Le SIREN reste dans le champ p.siren pour traçabilite, mais pas dans l'URL.
    """
    base = slugify(name, max_len=40) if name else "pro"
    ville_slug = slugify(ville or "", max_len=20)
    parts = [p for p in [base, ville_slug] if p]
    return "-".join(parts)[:60]


def compute_score_confiance(record):
    """
    Calcul du Score de Confiance /10 , sans appel API externe.
    Base gratuite (6 criteres publics Sirene) :
      , anciennete (3 pts max)
      , categorie entreprise PME/ETI (0.5 pts)
      , tranche_effectif >= 1 salarie (0.5 pts)
      , etablissement siege (0.2 pts)
      , denomination renseignee non ND (0.3 pts)
      , adresse complete (0.5 pts)
    Autres points (RGE 2pts, avis Google 2pts, site web 1pt, photos 1pt)
    seront ajoutes par les scripts d'enrichissement posterieurs.
    """
    score = 0.0
    # Anciennete
    try:
        date_creation = record.get("dateCreationEtablissement")
        if date_creation:
            if isinstance(date_creation, str):
                year = int(date_creation[:4])
            else:
                year = date_creation.year
            age = datetime.now().year - year
            score += min(age / 5.0, 3.0)
    except Exception:
        pass

    # Tranche effectif
    te = str(record.get("trancheEffectifsEtablissement", "") or "").strip()
    if te and te not in ("NN", "00", "[ND]"):
        score += 0.5

    # Siege
    if str(record.get("etablissementSiege", "")).lower() in ("true", "1", "oui"):
        score += 0.2

    # Denomination
    name = build_name(record)
    if name and name != "Entreprise sans raison sociale":
        score += 0.3

    # Adresse complete
    address = build_address(record)
    if address and any(c.isdigit() for c in address) and len(address) > 15:
        score += 0.5

    return round(min(score, 10.0), 1)


# ---------------------------------------------------------------------------
# DuckDB query
# ---------------------------------------------------------------------------
def query_sirene(naf_code, dept, limit=None):
    """Query parquet INSEE (Etablissement JOIN UniteLegale) via DuckDB httpfs.
    Le join permet de recuperer le nom du dirigeant pour les autoentrepreneurs.
    """
    log(f"Query Sirene (Etab+UL) NAF={naf_code} dept={dept}...")
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")

    cols = ", ".join(SIRENE_COLUMNS)
    # Strip "etab." / "ul." pour les ORDER BY + WHERE
    where = f"""
        etab.activitePrincipaleEtablissement = '{naf_code}'
        AND etab.etatAdministratifEtablissement = 'A'
        AND etab.codePostalEtablissement LIKE '{dept}%'
    """
    limit_clause = f"LIMIT {int(limit)}" if limit else ""
    query = f"""
        SELECT {cols}
        FROM '{PARQUET_URL}' AS etab
        LEFT JOIN '{UNITE_LEGALE_PARQUET}' AS ul
          ON etab.siren = ul.siren
        WHERE {where}
        ORDER BY etab.dateCreationEtablissement DESC
        {limit_clause}
    """

    t0 = time.time()
    result = con.execute(query)
    # Columns arrive en "etab.siret", "ul.prenom1UniteLegale", etc. , on les aplatit
    raw_columns = [d[0] for d in result.description]
    columns = [c.split(".")[-1] for c in raw_columns]
    rows = result.fetchall()
    con.close()
    elapsed = time.time() - t0
    log(f"  , {len(rows):,} etablissements (avec UL join) en {elapsed:.1f}s")
    return [dict(zip(columns, r)) for r in rows]


def pros_to_dict(records, metier_key, dept_code):
    """Transform raw Sirene records vers le format Supabase public.pros.
    Exclut les records sans nom exploitable (pas d'autoentrepreneur fantome)."""
    out = []
    seen_slugs = set()
    metier = METIERS[metier_key]
    dept = DEPARTEMENTS[dept_code]
    excluded = 0
    for r in records:
        name = build_name(r)
        if not name:
            excluded += 1
            continue
        siret = str(r.get("siret", "")).strip()
        siren = str(r.get("siren", "")).strip()
        if not siren:
            excluded += 1
            continue
        ville = str(r.get("libelleCommuneEtablissement", "") or "").title()
        date_creation = r.get("dateCreationEtablissement")
        if isinstance(date_creation, (datetime, date)):
            date_creation_str = date_creation.isoformat()[:10]
        elif date_creation:
            date_creation_str = str(date_creation)[:10]
        else:
            date_creation_str = None
        slug = build_slug(name, siren, ville)
        # Dedup anti-collision (ne devrait pas arriver, siren inclus)
        if slug in seen_slugs:
            slug = f"{slug}-{siret[-5:]}"
        seen_slugs.add(slug)
        out.append({
            "nom_entreprise": name,
            "slug": slug,
            "siret": siret,
            "siren": siren,
            "adresse": build_address(r),
            "code_postal": str(r.get("codePostalEtablissement", "") or ""),
            "ville": ville,
            "date_creation_entreprise": date_creation_str,
            "score_confiance": compute_score_confiance(r),
            "tier": "gratuit",
            "active": True,
            "source": "sirene-insee",
            "_metier_key": metier_key,
            "_metier_naf": metier["naf"],
            "_dept_code": dept_code,
            "_dept_slug": dept["slug"],
        })
    if excluded:
        log(f"  exclus (sans nom ou sans SIREN) : {excluded}")
    return out


# ---------------------------------------------------------------------------
# Supabase INSERT (via REST API, service_role key)
# ---------------------------------------------------------------------------
def get_supabase_service_key():
    """Lit la service_role key depuis /tmp ou env."""
    # 1. Env var
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if key:
        return key
    # 2. Fichier local cache
    cache_file = Path("/tmp/lobs_svc.txt")
    if cache_file.exists():
        return cache_file.read_text().strip()
    # 3. Lire depuis env.master via PAT
    env_master = Path.home() / "stack-2026" / ".env.master"
    if env_master.exists():
        for line in env_master.read_text().splitlines():
            if line.startswith("SUPABASE_SERVICE_KEY=") or line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("SUPABASE_SERVICE_KEY introuvable (env, /tmp/lobs_svc.txt, ou .env.master)")


def supabase_upsert(table, rows, service_key, on_conflict="slug"):
    """Upsert batch via REST API. Return count of upserted rows."""
    if not rows:
        return 0
    # Cleanup underscored private keys
    clean = []
    for r in rows:
        clean.append({k: v for k, v in r.items() if not k.startswith("_")})
    url = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict={on_conflict}"
    data = json.dumps(clean).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
            "User-Agent": "lobservatoiredespros-import/1.0",
        },
    )
    try:
        resp = urllib.request.urlopen(req, timeout=40)
        return len(clean)
    except urllib.error.HTTPError as e:
        log(f"  HTTP {e.code} : {e.read().decode()[:400]}", "ERROR")
        return 0


def supabase_get_metiers(service_key):
    """Fetch metiers table pour mapper slug -> id."""
    url = f"{SUPABASE_URL}/rest/v1/metiers?select=id,slug"
    req = urllib.request.Request(url, headers={
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "User-Agent": "lobservatoiredespros-import/1.0",
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return {r["slug"]: r["id"] for r in json.loads(resp.read())}


def supabase_get_zones(service_key):
    """Fetch zones (type=departement) pour mapper slug -> id."""
    url = f"{SUPABASE_URL}/rest/v1/zones?type=eq.departement&select=id,slug,code"
    req = urllib.request.Request(url, headers={
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "User-Agent": "lobservatoiredespros-import/1.0",
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        zones = json.loads(resp.read())
    return {z["slug"]: z["id"] for z in zones}, {z["code"]: z["id"] for z in zones}


def supabase_get_pros_ids(service_key, sirets):
    """Fetch pros UUID par SIRET (clé unique, vs SIREN partageable entre
    etablissements du meme groupe). Retourne dict siret -> id.

    Bug fix 2026-04-24 : le mapping siren->id perdait 1 entree par SIREN
    duplique entre 2 etablissements actifs, ce qui laissait des pros
    orphelins (sans pro_metiers / pro_zones link).
    """
    if not sirets:
        return {}
    ids = {}
    # Batch par 200
    for i in range(0, len(sirets), 200):
        batch = sirets[i:i+200]
        in_clause = ",".join(f'"{s}"' for s in batch)
        url = f"{SUPABASE_URL}/rest/v1/pros?select=id,siret&siret=in.({in_clause})"
        req = urllib.request.Request(url, headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "User-Agent": "lobservatoiredespros-import/1.0",
        })
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                for row in json.loads(resp.read()):
                    ids[row["siret"]] = row["id"]
        except urllib.error.HTTPError as e:
            log(f"  pros query HTTP {e.code}", "ERROR")
    return ids


# ---------------------------------------------------------------------------
# Main flow
# ---------------------------------------------------------------------------
def run_one(metier_key, dept_code, insert=False, limit=None, csv_out=None):
    """Run for one (metier x departement) combination."""
    naf = METIERS[metier_key]["naf"]
    records = query_sirene(naf, dept_code, limit=limit)
    if not records:
        log("  Pas de resultats.")
        return 0

    pros = pros_to_dict(records, metier_key, dept_code)

    # Sauvegarde CSV de debug
    csv_path = csv_out or (CACHE_DIR / f"pros_{metier_key}_{dept_code}.csv")
    fieldnames = [
        "nom_entreprise", "slug", "siret", "siren", "ville", "code_postal",
        "adresse", "date_creation_entreprise", "score_confiance", "tier",
        "_metier_key", "_metier_naf", "_dept_code", "_dept_slug",
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(pros)
    log(f"  CSV : {csv_path} ({len(pros)} rows)")

    # Top 10 par score
    top = sorted(pros, key=lambda p: -p["score_confiance"])[:10]
    log(f"  Top 10 par Score de Confiance :")
    for i, p in enumerate(top, 1):
        print(f"    #{i:02d} {p['score_confiance']:>4.1f}/10  {p['nom_entreprise'][:45]:<45} , {p['ville']:<20} ({p['code_postal']})")

    if not insert:
        return len(pros)

    # INSERT Supabase
    service_key = get_supabase_service_key()
    log(f"  INSERT Supabase (batch 100)...")
    # Fetch mapping
    metiers_map = supabase_get_metiers(service_key)
    _, zones_by_code = supabase_get_zones(service_key)

    metier_id = metiers_map.get(metier_key)
    zone_id = zones_by_code.get(dept_code)
    if not metier_id or not zone_id:
        log(f"  ERREUR : metier_id ou zone_id manquant (metier={metier_id}, zone={zone_id})", "ERROR")
        return 0

    # 1. Upsert pros
    total_upserted = 0
    for i in range(0, len(pros), 100):
        batch = pros[i:i+100]
        # Remove underscore fields before upsert
        n = supabase_upsert("pros", batch, service_key, on_conflict="slug")
        total_upserted += n
        log(f"    pros batch {i//100 + 1} : +{n}")
    log(f"  pros upserted : {total_upserted}")

    # 2. Fetch pros IDs by SIRET (unique key, contrairement a SIREN)
    sirets = [p["siret"] for p in pros if p.get("siret")]
    id_map = supabase_get_pros_ids(service_key, sirets)

    # 3. Upsert pro_metiers relation
    pro_metiers_rows = [
        {"pro_id": pro_id, "metier_id": metier_id}
        for siret, pro_id in id_map.items()
    ]
    total_pm = 0
    for i in range(0, len(pro_metiers_rows), 100):
        batch = pro_metiers_rows[i:i+100]
        n = supabase_upsert("pro_metiers", batch, service_key, on_conflict="pro_id,metier_id")
        total_pm += n
    log(f"  pro_metiers upserted : {total_pm}")

    # 4. Upsert pro_zones relation
    pro_zones_rows = [
        {"pro_id": pro_id, "zone_id": zone_id, "rayon_km": 30}
        for pro_id in id_map.values()
    ]
    total_pz = 0
    for i in range(0, len(pro_zones_rows), 100):
        batch = pro_zones_rows[i:i+100]
        n = supabase_upsert("pro_zones", batch, service_key, on_conflict="pro_id,zone_id")
        total_pz += n
    log(f"  pro_zones upserted : {total_pz}")

    return total_upserted


def resolve_dept_targets(args):
    """Retourne la liste des codes dept cibles selon les flags CLI."""
    if args.all_depts:
        return sorted(DEPARTEMENTS.keys())
    if args.depts:
        codes = [c.strip().upper() for c in args.depts.split(",") if c.strip()]
        unknown = [c for c in codes if c not in DEPARTEMENTS]
        if unknown:
            raise SystemExit(f"Dept(s) inconnu(s) : {', '.join(unknown)}")
        return codes
    if args.dept:
        return [args.dept]
    return []


def resolve_metier_targets(args):
    """Retourne la liste des slugs metier cibles selon les flags CLI."""
    if args.all_metiers:
        return list(METIERS.keys())
    if args.metiers:
        slugs = [s.strip().lower() for s in args.metiers.split(",") if s.strip()]
        unknown = [s for s in slugs if s not in METIERS]
        if unknown:
            raise SystemExit(f"Metier(s) inconnu(s) : {', '.join(unknown)}")
        return slugs
    if args.metier:
        return [args.metier]
    return []


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().split("\n\n")[0])
    # Selection metier
    ap.add_argument("--metier", choices=list(METIERS.keys()), help="Un seul metier")
    ap.add_argument("--metiers", help="Liste CSV de slugs metier (ex: plombier,electricien)")
    ap.add_argument("--all-metiers", action="store_true", help="Tous les metiers (15)")
    # Selection dept
    ap.add_argument("--dept", choices=list(DEPARTEMENTS.keys()), help="Un seul dept (code INSEE)")
    ap.add_argument("--depts", help="Liste CSV de codes dept (ex: 75,77,78,91,92,93,94,95 pour IDF)")
    ap.add_argument("--all-depts", action="store_true", help="Les 96 dpts metropole")
    # Retro-compat
    ap.add_argument("--all-pilots", action="store_true", help="Legacy : 5 metiers pilote x 3 depts pilote (75/21/89)")
    # Flags execution
    ap.add_argument("--insert", action="store_true", help="Insert dans Supabase")
    ap.add_argument("--dry-run", action="store_true", help="Comptage only")
    ap.add_argument("--limit", type=int, default=None, help="Limit par query (default: no limit)")
    args = ap.parse_args()

    # Mode legacy retro-compat
    if args.all_pilots:
        total = 0
        for m_key in PILOT_METIERS:
            for d_code in PILOT_DEPTS:
                log("=" * 72)
                log(f"METIER={m_key}  |  DEPT={d_code}")
                n = run_one(m_key, d_code, insert=args.insert, limit=args.limit)
                total += n
        log("=" * 72)
        log(f"TOTAL : {total:,} pros ({len(PILOT_METIERS)} metiers x {len(PILOT_DEPTS)} depts pilote)")
        return

    metiers = resolve_metier_targets(args)
    depts = resolve_dept_targets(args)
    if not metiers or not depts:
        ap.error("Il faut specifier metier(s) ET dept(s) : --metier/--metiers/--all-metiers + --dept/--depts/--all-depts")

    total = 0
    for m_key in metiers:
        for d_code in depts:
            log("=" * 72)
            log(f"METIER={m_key}  |  DEPT={d_code}")
            try:
                n = run_one(m_key, d_code, insert=args.insert, limit=args.limit)
                total += n
            except Exception as e:
                log(f"ERREUR combo {m_key}/{d_code} : {e}", "ERROR")
    log("=" * 72)
    log(f"TOTAL : {total:,} pros ({len(metiers)} metiers x {len(depts)} depts)")


if __name__ == "__main__":
    main()
