"""
Trust Score v2 , agregation multi-sources.

Sources d'entree :
  - Sirene/Recherche-Entreprises : anciennete, etat_administratif, dirigeant
  - ADEME RGE : qualifications actives/historiques/organismes
  - BODACC : procedures, regularite depots, modifications
  - Google Places (optionnel) : rating, reviews
  - Documents premium : decennale, RC pro verifiees

Sortie : dict { score, niveau, signaux_positifs[], signaux_alerte[], composantes{} }
"""

from __future__ import annotations

from typing import Any


def calculer_trust_score(inputs: dict[str, Any]) -> dict[str, Any]:
    """Calcule le Trust Score v2.

    Args:
        inputs: dict avec les cles optionnelles :
            anciennete_annees, etat_administratif, categorie_entreprise,
            tranche_effectif, est_qualiopi, dirigeant_identifie,
            qualifications_actives, qualifications_historiques,
            organismes_certificateurs, qualifications_expirees_recemment,
            has_procedure_collective_active, has_procedure_collective_passee,
            regularite_depots, nb_depots_comptes, nb_modifications_recentes,
            google_rating, google_reviews_count,
            decennale_verifiee, rc_pro_verifiee
    """
    score = 0.0
    positifs: list[str] = []
    alertes: list[str] = []
    composantes: dict[str, float] = {}

    age = float(inputs.get("anciennete_annees") or 0)
    etat = inputs.get("etat_administratif") or "A"

    # ==================================================================
    # Signaux bloquants : cessation / procedure active
    # ==================================================================
    if etat == "C":
        return {
            "score": 0.0,
            "niveau": "bronze",
            "signaux_positifs": [],
            "signaux_alerte": ["Entreprise cessée administrativement"],
            "composantes": {"cessation": 0.0},
        }

    if inputs.get("has_procedure_collective_active"):
        alertes.append("Procédure collective en cours")
        score -= 5.0
        composantes["procedure_active"] = -5.0

    if inputs.get("has_procedure_collective_passee"):
        alertes.append("Procédure collective passée (résolue)")
        score -= 1.0
        composantes["procedure_passee"] = -1.0

    qual_exp = int(inputs.get("qualifications_expirees_recemment") or 0)
    if qual_exp > 0:
        alertes.append(f"{qual_exp} qualification(s) RGE récemment expirée(s)")
        score -= 0.5
        composantes["qualif_expiree"] = -0.5

    # ==================================================================
    # SOCLE Sirene / structure (max 3pts)
    # ==================================================================
    socle = 0.0
    if age >= 3:
        socle += 0.5
    if age >= 10:
        socle += 1.0
        positifs.append(f"{int(age)} ans d'activité")
    if age >= 20:
        socle += 0.5
    if inputs.get("dirigeant_identifie"):
        socle += 0.5
    cat = (inputs.get("categorie_entreprise") or "").upper()
    if cat in ("PME", "ETI"):
        socle += 0.5
    tranche = inputs.get("tranche_effectif") or ""
    if tranche and tranche not in ("00", "NN"):
        socle += 0.5
        positifs.append("Entreprise avec salariés déclarés")
    composantes["socle"] = socle
    score += socle

    # ==================================================================
    # CERTIFICATIONS RGE (max 2.5pts)
    # ==================================================================
    certif = 0.0
    qa = int(inputs.get("qualifications_actives") or 0)
    qh = int(inputs.get("qualifications_historiques") or 0)
    orgs = int(inputs.get("organismes_certificateurs") or 0)
    if qa >= 1:
        certif += 1.0
        positifs.append(f"{qa} qualification(s) RGE active(s)")
    if qa >= 3:
        certif += 0.5
    if qa >= 6:
        certif += 0.5
        positifs.append("Expertise polyvalente reconnue")
    if orgs >= 2:
        certif += 0.5
        positifs.append("Certifié par plusieurs organismes")
    if qh >= 3:
        certif += 0.3
        positifs.append("Historique de certifications continu")
    composantes["certifications"] = certif
    score += certif

    # ==================================================================
    # TRANSPARENCE BODACC (max 2pts)
    # ==================================================================
    transp = 0.0
    reg = inputs.get("regularite_depots") or "aucune"
    if reg == "excellente":
        transp += 2.0
        positifs.append("Comptes déposés régulièrement")
    elif reg == "bonne":
        transp += 1.0
        positifs.append("Transparence comptable")
    elif reg == "irreguliere":
        transp += 0.3
    else:  # aucune
        if age > 2:
            alertes.append("Aucun dépôt de comptes public")

    nb_modifs = int(inputs.get("nb_modifications_recentes") or 0)
    if nb_modifs > 3:
        alertes.append(f"{nb_modifs} modifications statutaires récentes")
        transp -= 0.3
    composantes["transparence"] = transp
    score += transp

    # ==================================================================
    # AVIS GOOGLE (max 1.5pts, optionnel)
    # ==================================================================
    avis = 0.0
    rating = inputs.get("google_rating")
    count = int(inputs.get("google_reviews_count") or 0)
    if rating is not None and count >= 10:
        try:
            r = float(rating)
            if r >= 4.5:
                avis += 1.5
                positifs.append(f"{r}/5 sur {count} avis Google")
            elif r >= 4.0:
                avis += 1.0
            elif r >= 3.5:
                avis += 0.5
            else:
                alertes.append(f"Note Google faible ({r}/5)")
        except Exception:
            pass
    composantes["avis_google"] = avis
    score += avis

    # ==================================================================
    # BADGES VERIFIES (Premium)
    # ==================================================================
    badges = 0.0
    if inputs.get("decennale_verifiee"):
        badges += 0.5
        positifs.append("Attestation décennale vérifiée")
    if inputs.get("rc_pro_verifiee"):
        badges += 0.3
        positifs.append("Responsabilité civile pro vérifiée")
    if inputs.get("est_qualiopi"):
        badges += 0.3
        positifs.append("Certifié Qualiopi (formation)")
    composantes["badges_premium"] = badges
    score += badges

    # ==================================================================
    # Plafonnage + niveau
    # ==================================================================
    score = max(0.0, min(10.0, round(score * 10) / 10))

    if score >= 9.0 and inputs.get("decennale_verifiee"):
        niveau = "platine"
    elif score >= 7.5:
        niveau = "or"
    elif score >= 5.5:
        niveau = "argent"
    else:
        niveau = "bronze"

    return {
        "score": score,
        "niveau": niveau,
        "signaux_positifs": positifs,
        "signaux_alerte": alertes,
        "composantes": composantes,
    }
