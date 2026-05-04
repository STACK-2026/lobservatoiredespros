"""
Export full list of active pros with email, joined with metier + departement.
Output: exports/pros_with_email_YYYY-MM-DD.csv
Usage:  python3 scripts/export_pros_emails.py
"""
import csv
import os
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_MASTER = ROOT.parent / ".env.master"

PROJECT_REF = "apuyeakgxjgdcfssrtek"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
SITE_BASE = "https://lobservatoiredespros.com"


def load_env(path: Path) -> dict:
    env = {}
    for line in path.read_text().splitlines():
        if line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env


def fetch_service_key(pat: str) -> str:
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/api-keys?reveal=true",
        headers={
            "Authorization": f"Bearer {pat}",
            "User-Agent": "lobservatoiredespros-export/1.0",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req) as r:
        import json
        for k in json.load(r):
            if k["name"] == "service_role" and k.get("type") == "legacy":
                return k["api_key"]
    raise RuntimeError("service_role key not found")


def fetch_rows(service_key: str, batch: int = 1000):
    """Page through pros table via PostgREST with embed of metier + zone."""
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Accept": "application/json",
    }
    select = (
        "id,slug,nom_entreprise,siret,email,telephone,site_web,"
        "adresse,code_postal,ville,"
        "score_confiance,niveau_confiance,tier,"
        "rge,qualibat,nb_qualifications_actives,"
        "date_creation_entreprise,categorie_entreprise,tranche_effectif,"
        "pro_metiers(metiers(slug,nom)),"
        "pro_zones(zones(code,nom,type))"
    )
    offset = 0
    while True:
        params = {
            "select": select,
            "active": "eq.true",
            "email": "not.is.null",
            "order": "score_confiance.desc.nullslast,nom_entreprise.asc",
            "limit": str(batch),
            "offset": str(offset),
        }
        url = f"{SUPABASE_URL}/rest/v1/pros?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as r:
            import json
            chunk = json.load(r)
        if not chunk:
            break
        for row in chunk:
            yield row
        if len(chunk) < batch:
            break
        offset += batch


def flatten(row: dict) -> dict:
    metiers = []
    for pm in row.get("pro_metiers") or []:
        m = (pm or {}).get("metiers") or {}
        if m.get("slug"):
            metiers.append(m["slug"])
    metiers = sorted(set(metiers))

    dept_code = ""
    dept_nom = ""
    for pz in row.get("pro_zones") or []:
        z = (pz or {}).get("zones") or {}
        if z.get("type") == "departement":
            dept_code = z.get("code") or ""
            dept_nom = z.get("nom") or ""
            break

    primary_metier = metiers[0] if metiers else ""
    public_url = ""
    if primary_metier and dept_code and row.get("slug"):
        public_url = f"{SITE_BASE}/pros/{primary_metier}/{dept_code}/{row['slug']}/"

    email = (row.get("email") or "").strip()
    return {
        "siret": row.get("siret") or "",
        "nom_entreprise": row.get("nom_entreprise") or "",
        "email": email,
        "email_valide_basique": "1" if ("@" in email and "." in email.split("@")[-1]) else "0",
        "telephone": row.get("telephone") or "",
        "site_web": row.get("site_web") or "",
        "adresse": row.get("adresse") or "",
        "code_postal": row.get("code_postal") or "",
        "ville": row.get("ville") or "",
        "departement_code": dept_code,
        "departement_nom": dept_nom,
        "metiers": "|".join(metiers),
        "metier_principal": primary_metier,
        "score_confiance": row.get("score_confiance") or "",
        "niveau_confiance": row.get("niveau_confiance") or "",
        "tier_abonnement": row.get("tier") or "",
        "rge": "1" if row.get("rge") else "0",
        "qualibat": "1" if row.get("qualibat") else "0",
        "nb_certifs_actives": row.get("nb_qualifications_actives") or 0,
        "date_creation": row.get("date_creation_entreprise") or "",
        "categorie_entreprise": row.get("categorie_entreprise") or "",
        "tranche_effectif": row.get("tranche_effectif") or "",
        "url_fiche_publique": public_url,
        "slug": row.get("slug") or "",
    }


def main():
    env = load_env(ENV_MASTER)
    pat = env.get("SUPABASE_PAT")
    if not pat:
        sys.exit("SUPABASE_PAT manquant dans .env.master")
    service_key = fetch_service_key(pat)

    out_dir = ROOT / "exports"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / f"pros_with_email_{date.today().isoformat()}.csv"

    fields = [
        "siret",
        "nom_entreprise",
        "email",
        "email_valide_basique",
        "telephone",
        "site_web",
        "adresse",
        "code_postal",
        "ville",
        "departement_code",
        "departement_nom",
        "metiers",
        "metier_principal",
        "score_confiance",
        "niveau_confiance",
        "tier_abonnement",
        "rge",
        "qualibat",
        "nb_certifs_actives",
        "date_creation",
        "categorie_entreprise",
        "tranche_effectif",
        "url_fiche_publique",
        "slug",
    ]

    n = 0
    with out_file.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        for row in fetch_rows(service_key):
            w.writerow(flatten(row))
            n += 1
            if n % 500 == 0:
                print(f"... {n} lignes")

    print(f"OK : {n} pros exportes -> {out_file}")


if __name__ == "__main__":
    main()
