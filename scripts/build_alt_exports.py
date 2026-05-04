"""
Génère :
  - exports/pros_brevo_ready_<date>.csv (colonnes Brevo : EMAIL, FNAME, LNAME, COMPANY, VILLE, DEPT, METIER, NIVEAU, SCORE, SITE)
  - exports/pros_notion_ready_<date>.csv (colonnes Notion-friendly + URL fiche)
"""
import csv
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPORTS = ROOT / "exports"


def latest_master() -> Path:
    cands = sorted(EXPORTS.glob("pros_with_email_*.csv"), reverse=True)
    if not cands:
        sys.exit("Master CSV introuvable")
    return cands[0]


def main():
    src = latest_master()
    today = date.today().isoformat()
    brevo_out = EXPORTS / f"pros_brevo_ready_{today}.csv"
    notion_out = EXPORTS / f"pros_notion_ready_{today}.csv"

    brevo_fields = [
        "EMAIL", "FIRSTNAME", "LASTNAME", "COMPANY", "VILLE",
        "DEPT_CODE", "DEPT_NOM", "METIER", "NIVEAU", "SCORE",
        "RGE", "QUALIBAT", "SITE_WEB", "TELEPHONE", "URL_FICHE",
    ]
    notion_fields = [
        "Nom entreprise", "Email", "Téléphone", "Site web",
        "Ville", "Département", "Métier", "Niveau confiance",
        "Score /10", "RGE", "Qualibat", "URL fiche", "SIRET",
        "Source",
    ]

    n = 0
    with src.open(encoding="utf-8") as fh, \
         brevo_out.open("w", newline="", encoding="utf-8") as fb, \
         notion_out.open("w", newline="", encoding="utf-8") as fn:
        reader = csv.DictReader(fh)
        wb = csv.DictWriter(fb, fieldnames=brevo_fields)
        wn = csv.DictWriter(fn, fieldnames=notion_fields)
        wb.writeheader()
        wn.writeheader()

        for r in reader:
            n += 1
            wb.writerow({
                "EMAIL": r["email"],
                "FIRSTNAME": r["nom_entreprise"][:50],
                "LASTNAME": r["ville"][:30],
                "COMPANY": r["nom_entreprise"],
                "VILLE": r["ville"],
                "DEPT_CODE": r["departement_code"],
                "DEPT_NOM": r["departement_nom"],
                "METIER": r["metier_principal"],
                "NIVEAU": r["niveau_confiance"],
                "SCORE": r["score_confiance"],
                "RGE": "oui" if r["rge"] == "1" else "non",
                "QUALIBAT": "oui" if r["qualibat"] == "1" else "non",
                "SITE_WEB": r["site_web"],
                "TELEPHONE": r["telephone"],
                "URL_FICHE": r["url_fiche_publique"],
            })
            wn.writerow({
                "Nom entreprise": r["nom_entreprise"],
                "Email": r["email"],
                "Téléphone": r["telephone"],
                "Site web": r["site_web"],
                "Ville": r["ville"],
                "Département": f"{r['departement_code']} {r['departement_nom']}",
                "Métier": r["metier_principal"],
                "Niveau confiance": r["niveau_confiance"],
                "Score /10": r["score_confiance"],
                "RGE": "oui" if r["rge"] == "1" else "non",
                "Qualibat": "oui" if r["qualibat"] == "1" else "non",
                "URL fiche": r["url_fiche_publique"],
                "SIRET": r["siret"],
                "Source": "lobservatoiredespros.com",
            })

    print(f"Brevo  : {n} lignes -> {brevo_out.name}")
    print(f"Notion : {n} lignes -> {notion_out.name}")


if __name__ == "__main__":
    main()
