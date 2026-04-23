"""
BODACC client + analyseur pour le Trust Score.

Source : https://bodacc-datadila.opendatasoft.com (OpenDataSoft API v2.1)
Gratuit, pas de cle, rate limit genereux.

Types d'annonces :
  - Création : immatriculation
  - Modifications diverses : dirigeant, capital, siege, activite
  - Radiation : fin d'activite
  - Dépôts des comptes : publication comptes annuels (signal transparence)
  - Procédures collectives : liquidation, redressement, sauvegarde (ALERTE)
  - Ventes et cessions : fonds de commerce
"""

from __future__ import annotations

import datetime as _dt
import json
import time
import urllib.parse
import urllib.request
from typing import Any

BODACC_BASE = "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records"
UA = "ObservatoireDesPros/1.0 (contact@lobservatoiredespros.com)"


def fetch_bodacc_by_siren(siren: str, max_results: int = 100) -> list[dict[str, Any]]:
    """Recupere toutes les annonces BODACC pour un SIREN. Dedup par id.

    Le champ `registre` est un array avec le SIREN dans plusieurs formats
    ("487 581 969" et "487581969"), on match donc avec `like`.
    """
    clean = "".join(c for c in str(siren) if c.isdigit())
    if not clean:
        return []

    all_results: list[dict] = []
    offset = 0
    page_size = min(max_results, 100)

    while offset < max_results:
        params = {
            "where": f'registre like "{clean}"',
            "limit": str(page_size),
            "offset": str(offset),
            "order_by": "dateparution desc",
        }
        url = f"{BODACC_BASE}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                data = json.loads(r.read().decode("utf-8"))
        except Exception:
            break

        results = data.get("results") or []
        if not results:
            break
        all_results.extend(results)
        total = data.get("total_count", 0)
        if offset + page_size >= total or len(results) < page_size:
            break
        offset += page_size

    # Dedup par id (certaines annonces peuvent etre dupliquees entre pages)
    seen = set()
    uniq = []
    for a in all_results:
        aid = a.get("id")
        if aid and aid not in seen:
            seen.add(aid)
            uniq.append(a)
    return uniq


def _parse_date(s: str | None) -> _dt.date | None:
    if not s:
        return None
    try:
        return _dt.date.fromisoformat(s[:10])
    except Exception:
        return None


def map_famille_to_type(famille_lib: str | None) -> str:
    """Normalise famille BODACC vers un type court editorial."""
    if not famille_lib:
        return "autre"
    f = famille_lib.lower()
    if "creation" in f or "création" in f:
        return "creation"
    if "radiation" in f:
        return "radiation"
    if "dépôt" in f or "depot" in f:
        return "depot_comptes"
    if "modif" in f:
        return "modification"
    if "procédure" in f or "procedure" in f or "collective" in f:
        return "procedure_collective"
    if "vente" in f or "cession" in f:
        return "vente_cession"
    if "rétablissement" in f or "retablissement" in f:
        return "retablissement"
    return "autre"


def analyser_bodacc(annonces: list[dict]) -> dict:
    """Analyse les annonces pour extraire les signaux de confiance.

    Retourne un dict compatible avec le Trust Score v2 :
      - has_procedure_collective_active : bool
      - has_procedure_collective_passee : bool
      - nb_depots_comptes : int
      - dernier_depot_comptes : str | None (ISO date)
      - regularite_depots : str ('excellente' | 'bonne' | 'irreguliere' | 'aucune')
      - nb_modifications : int
      - nb_modifications_recentes : int (< 2 ans)
      - derniere_modification : str | None
      - est_radie : bool
      - date_creation_bodacc : str | None
      - procedures_historique : list[{date, nature, description}]
      - total_annonces : int
      - ventilation : dict par type
    """
    if not annonces:
        return {
            "has_procedure_collective_active": False,
            "has_procedure_collective_passee": False,
            "nb_depots_comptes": 0,
            "dernier_depot_comptes": None,
            "regularite_depots": "aucune",
            "nb_modifications": 0,
            "nb_modifications_recentes": 0,
            "derniere_modification": None,
            "est_radie": False,
            "date_creation_bodacc": None,
            "procedures_historique": [],
            "total_annonces": 0,
            "ventilation": {},
        }

    procedures = []
    depots = []
    modifs = []
    creation = None
    radiation = None
    ventilation: dict[str, int] = {}

    for a in annonces:
        t = map_famille_to_type(a.get("familleavis_lib"))
        ventilation[t] = ventilation.get(t, 0) + 1

        if t == "procedure_collective":
            procedures.append(a)
        elif t == "depot_comptes":
            depots.append(a)
        elif t == "modification":
            modifs.append(a)
        elif t == "creation" and not creation:
            creation = a
        elif t == "radiation" and not radiation:
            radiation = a

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

    # Procedures : detection actives vs passees (jugements de cloture ou plans resolus)
    procedures_passees = []
    nb_ouvertures = 0
    for p in procedures:
        jug = _safe_dict(p.get("jugement"))
        nature = (jug.get("nature") or "").lower()
        if any(kw in nature for kw in ["clôture", "cloture", "plan", "résolution", "resolution"]):
            procedures_passees.append(p)
        if "ouverture" in nature:
            nb_ouvertures += 1

    procedures_actives = nb_ouvertures > len(procedures_passees)

    # Regularite depots
    today = _dt.date.today()
    depots_sorted = sorted(depots, key=lambda x: x.get("dateparution", ""), reverse=True)
    last_depot = _parse_date(depots_sorted[0].get("dateparution")) if depots_sorted else None
    months_since_last = (
        (today - last_depot).days / 30 if last_depot else 999
    )

    regularite = "aucune"
    if len(depots) >= 5 and months_since_last < 15:
        regularite = "excellente"
    elif len(depots) >= 3 and months_since_last < 24:
        regularite = "bonne"
    elif len(depots) >= 1:
        regularite = "irreguliere"

    # Modifications recentes (< 2 ans)
    two_years_ago = today - _dt.timedelta(days=730)
    modifs_recentes = sum(1 for m in modifs
                           if (_parse_date(m.get("dateparution")) or today) >= two_years_ago)

    # Historique procedures (pour timeline)
    procedures_hist = []
    for p in procedures:
        jug = _safe_dict(p.get("jugement"))
        procedures_hist.append({
            "date": p.get("dateparution"),
            "nature": jug.get("nature") or "procédure",
            "description": jug.get("complementJugement") or "",
        })

    return {
        "has_procedure_collective_active": procedures_actives,
        "has_procedure_collective_passee": len(procedures_passees) > 0,
        "nb_depots_comptes": len(depots),
        "dernier_depot_comptes": depots_sorted[0].get("dateparution") if depots_sorted else None,
        "regularite_depots": regularite,
        "nb_modifications": len(modifs),
        "nb_modifications_recentes": modifs_recentes,
        "derniere_modification": modifs[0].get("dateparution") if modifs else None,
        "est_radie": radiation is not None,
        "date_creation_bodacc": creation.get("dateparution") if creation else None,
        "procedures_historique": procedures_hist,
        "total_annonces": len(annonces),
        "ventilation": ventilation,
    }
