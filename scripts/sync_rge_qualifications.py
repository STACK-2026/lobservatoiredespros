#!/usr/bin/env python3
"""
sync_rge_qualifications.py , enrichit les pros avec leurs qualifications RGE
via l'API ADEME liste-des-entreprises-rge-2.

Pour chaque pro avec un SIRET :
- Fetch qualifications sur l'API ADEME (qs=siret:XXX, size=100)
- Upsert dans pro_qualifications
- Met a jour pros.rge (bool), pros.nb_qualifications_actives, pros.liste_certificats
- Recalcule pros.score_confiance avec regles enrichies

Usage :
  python3 scripts/sync_rge_qualifications.py --siret 48758196900010       # test un pro
  python3 scripts/sync_rge_qualifications.py --dept 89                     # tous les pros d'un dept
  python3 scripts/sync_rge_qualifications.py --all                         # tous les pros actifs
  python3 scripts/sync_rge_qualifications.py --dry-run --siret 48758196900010
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, date
from pathlib import Path

ADEME_DATASET = "liste-des-entreprises-rge-2"
ADEME_BASE = f"https://data.ademe.fr/data-fair/api/v1/datasets/{ADEME_DATASET}/lines"
# Historique : certaines qualifs (Qualit'EnR) ne sont QUE dans historique-rge
ADEME_HIST_DATASET = "historique-rge"
ADEME_HIST_BASE = f"https://data.ademe.fr/data-fair/api/v1/datasets/{ADEME_HIST_DATASET}/lines"
SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co"
USER_AGENT = "ObservatoireDesPros/1.0 (contact@lobservatoiredespros.com)"


def log(msg, level="INFO"):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def get_service_key():
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if key:
        return key
    cache = Path("/tmp/lobs_svc.txt")
    if cache.exists():
        return cache.read_text().strip()
    env_master = Path.home() / "stack-2026" / ".env.master"
    if env_master.exists():
        for line in env_master.read_text().splitlines():
            if line.startswith("SUPABASE_SERVICE_KEY="):
                return line.split("=", 1)[1].strip()
    raise RuntimeError("SUPABASE_SERVICE_KEY introuvable")


# ---------------------------------------------------------------------------
# ADEME API
# ---------------------------------------------------------------------------
def _fetch_url(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read()).get("results", [])
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(2 + attempt * 2)
                continue
            return []
        except Exception:
            return []
    return []


def fetch_rge_by_siret(siret):
    """Fetch qualifs depuis liste-des-entreprises-rge-2 ET historique-rge.
    Dedup par (organisme, code_qualification, date_debut, date_fin) car une qualif
    peut apparaitre N fois dans l'historique avec des dates_fin differentes (renouvelements).
    Pour chaque (organisme, code), on garde la version avec date_fin la plus tardive.
    """
    clean = re.sub(r"\D", "", str(siret))
    if not re.fullmatch(r"\d{14}", clean):
        log(f"SIRET invalide : '{siret}'", "WARN")
        return []

    # Fetch en parallele : courant + historique
    current = _fetch_url(f"{ADEME_BASE}?qs=siret:{clean}&size=100")
    historique = _fetch_url(f"{ADEME_HIST_BASE}?qs=siret:{clean}&size=200")

    # Combine en gardant la date_fin la plus tardive par (organisme, code_qualification)
    combined = {}
    for q in current + historique:
        org = q.get("organisme") or ""
        code = q.get("code_qualification") or ""
        if not org or not code:
            continue
        key = f"{org}::{code}"
        existing = combined.get(key)
        if not existing:
            combined[key] = q
        else:
            # Garde celui avec la date_fin la plus tardive (plus frais)
            existing_fin = existing.get("lien_date_fin") or ""
            new_fin = q.get("lien_date_fin") or ""
            if new_fin > existing_fin:
                combined[key] = q
    return list(combined.values())


# ---------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------
def supabase_fetch_pros(service_key, siret=None, dept=None, all_active=False):
    if siret:
        clean = re.sub(r"\D", "", siret)
        url = f"{SUPABASE_URL}/rest/v1/pros?select=id,siret,siren,score_confiance,date_creation_entreprise&siret=eq.{clean}"
    elif dept:
        url = f"{SUPABASE_URL}/rest/v1/pros?select=id,siret,siren,score_confiance,date_creation_entreprise&code_postal=like.{dept}*&active=eq.true&limit=5000"
    else:
        url = f"{SUPABASE_URL}/rest/v1/pros?select=id,siret,siren,score_confiance,date_creation_entreprise&active=eq.true&limit=10000"
    req = urllib.request.Request(url, headers={
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "User-Agent": USER_AGENT,
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def supabase_upsert(table, rows, service_key, on_conflict):
    if not rows:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict={on_conflict}"
    data = json.dumps(rows).encode()
    req = urllib.request.Request(
        url, data=data, method="POST",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        urllib.request.urlopen(req, timeout=30)
        return len(rows)
    except urllib.error.HTTPError as e:
        log(f"upsert {table} HTTP {e.code} : {e.read()[:400]}", "ERROR")
        return 0


def supabase_patch_pro(service_key, pro_id, patch):
    url = f"{SUPABASE_URL}/rest/v1/pros?id=eq.{pro_id}"
    req = urllib.request.Request(
        url, data=json.dumps(patch).encode(), method="PATCH",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        urllib.request.urlopen(req, timeout=15)
        return True
    except urllib.error.HTTPError as e:
        log(f"PATCH pro {pro_id} HTTP {e.code}", "ERROR")
        return False


# ---------------------------------------------------------------------------
# Score recalcul avec RGE enrichi
# ---------------------------------------------------------------------------
def compute_score_with_rge(pro, qualifs_actives, nb_qualifs_total, organismes):
    """Score /10 enrichi avec qualifications RGE detaillees."""
    score = 0.0

    # Anciennete Sirene (3 pts max)
    try:
        date_c = pro.get("date_creation_entreprise")
        if date_c:
            year = int(str(date_c)[:4])
            age = datetime.now().year - year
            score += min(age / 5.0, 3.0)
    except Exception:
        pass

    # Base : siege, categorie, effectif (donnees Sirene, on garde score base ~1.2-1.5)
    # (on utilise l'ancien score comme base , simplification)
    base_bonus = max(0, (pro.get("score_confiance") or 0) - min(3.0, (datetime.now().year - int(str(pro.get("date_creation_entreprise") or "2020")[:4])) / 5.0))
    score += min(base_bonus, 1.5)

    # RGE enrichi (max +4 pts)
    if len(qualifs_actives) > 0:
        score += 1.5  # Au moins 1 qualification active
    if len(qualifs_actives) >= 3:
        score += 0.5  # 3+ qualifs = polyvalent
    if len(qualifs_actives) >= 6:
        score += 0.5  # 6+ qualifs = expert
    if any(q.get("particulier") for q in qualifs_actives):
        score += 0.5  # Cible particuliers
    if len(organismes) >= 2:
        score += 0.5  # Multi-certificats
    # Qualif recente (< 2 ans)
    try:
        recents = [q for q in qualifs_actives if q.get("lien_date_debut") and q["lien_date_debut"] >= (datetime.now().year - 2).__str__() + "-01-01"]
        if recents:
            score += 0.5
    except Exception:
        pass

    return round(min(score, 10.0), 1)


# ---------------------------------------------------------------------------
# Main sync
# ---------------------------------------------------------------------------
def sync_pro(pro, service_key, dry_run=False):
    siret = pro.get("siret")
    if not siret:
        return {"skip": True, "reason": "no siret"}

    qualifs = fetch_rge_by_siret(siret)
    today = datetime.now().date().isoformat()

    if dry_run:
        log(f"[dry] SIRET {siret} : {len(qualifs)} qualifs ADEME")
        for q in qualifs[:3]:
            log(f"  {q.get('organisme')} / {q.get('code_qualification')} / {q.get('lien_date_debut')} , {q.get('lien_date_fin')}")
        return {"qualifs": len(qualifs), "dry": True}

    # Upsert pro_qualifications
    rows = []
    actives = []
    organismes = set()
    certificats = set()
    for q in qualifs:
        date_fin = q.get("lien_date_fin")
        is_active = date_fin and date_fin >= today
        if is_active:
            actives.append(q)
            organismes.add(q.get("organisme"))
            certificats.add(q.get("nom_certificat"))
        rows.append({
            "pro_id": pro["id"],
            "siret": re.sub(r"\D", "", siret),
            "organisme": q.get("organisme") or "",
            "nom_certificat": q.get("nom_certificat") or "",
            "domaine": q.get("domaine") or "",
            "meta_domaine": q.get("meta_domaine"),
            "nom_qualification": q.get("nom_qualification") or "",
            "code_qualification": q.get("code_qualification") or "",
            "particulier": bool(q.get("particulier")),
            "date_debut": q.get("lien_date_debut"),
            "date_fin": date_fin,
            "url_certificat": q.get("url_qualification"),
            "telephone_source": q.get("telephone"),
            "email_source": q.get("email"),
            "site_internet_source": q.get("site_internet"),
        })

    if rows:
        supabase_upsert("pro_qualifications", rows, service_key, on_conflict="siret,code_qualification")

    # PATCH le pro (rge bool, nb, liste, score)
    new_score = compute_score_with_rge(pro, actives, len(qualifs), organismes)
    patch = {
        "rge": len(actives) > 0,
        "nb_qualifications_actives": len(actives),
        "liste_certificats": sorted(list(certificats)),
        "score_confiance": new_score,
    }
    supabase_patch_pro(service_key, pro["id"], patch)
    return {
        "qualifs_total": len(qualifs),
        "qualifs_actives": len(actives),
        "organismes": list(organismes),
        "score": new_score,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--siret", help="Un SIRET specifique (test)")
    ap.add_argument("--dept", help="Tous les pros d'un departement (ex: 89)")
    ap.add_argument("--all", action="store_true", help="Tous les pros actifs")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    service_key = get_service_key()

    pros = supabase_fetch_pros(service_key, siret=args.siret, dept=args.dept, all_active=args.all)
    if not pros:
        log("Aucun pro trouve", "WARN")
        return
    log(f"{len(pros)} pros a synchroniser")

    total_qualifs = 0
    total_actives = 0
    pros_with_rge = 0
    for i, p in enumerate(pros, 1):
        result = sync_pro(p, service_key, dry_run=args.dry_run)
        if "skip" in result:
            continue
        total_qualifs += result.get("qualifs_total", 0)
        total_actives += result.get("qualifs_actives", 0)
        if result.get("qualifs_actives", 0) > 0:
            pros_with_rge += 1
        if i % 25 == 0:
            log(f"  {i}/{len(pros)} , {pros_with_rge} avec RGE, {total_qualifs} qualifs")
        # Rate limit ADEME : ~6 req/s max
        time.sleep(0.2)

    log(f"\n=== Sync terminee ===")
    log(f"  Pros traites          : {len(pros)}")
    log(f"  Pros avec RGE actif   : {pros_with_rge} ({100*pros_with_rge//max(1,len(pros))}%)")
    log(f"  Qualifs total         : {total_qualifs}")
    log(f"  Qualifs actives       : {total_actives}")


if __name__ == "__main__":
    main()
