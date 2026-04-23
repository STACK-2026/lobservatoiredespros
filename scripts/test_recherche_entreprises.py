#!/usr/bin/env python3
"""
Test minimal de l'API Recherche d'Entreprises.
Valide qu'on recupere bien les pros d'un metier dans un departement.
Usage : python3 scripts/test_recherche_entreprises.py plombier 89
"""
import sys, json, urllib.request, urllib.parse, time

USER_AGENT = "ObservatoireDesPros/1.0 (contact@lobservatoiredespros.com)"

METIERS = {
    "plombier": "43.22A",
    "electricien": "43.21A",
    "couvreur": "43.91B",
    "menuisier": "43.32A",
    "isolation": "43.29A",
    "chauffagiste": "43.22B",
    "macon": "43.99C",
    "peintre": "43.34Z",
}

def fetch(params, max_retries=5):
    url = "https://recherche-entreprises.api.gouv.fr/search?" + urllib.parse.urlencode(params)
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                retry_after = int(e.headers.get("Retry-After", "2")) if e.headers else 2
                wait = min(retry_after + attempt * 2, 30)
                print(f"  429 rate limit, retry in {wait}s (attempt {attempt+1}/{max_retries})...", file=sys.stderr)
                time.sleep(wait)
                continue
            raise
    raise RuntimeError("Max retries exceeded")

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 test_recherche_entreprises.py <metier> <departement>", file=sys.stderr)
        print("Metiers disponibles:", list(METIERS.keys()), file=sys.stderr)
        sys.exit(1)

    metier, dept = sys.argv[1], sys.argv[2]
    if metier not in METIERS:
        print(f"Metier inconnu. Disponibles: {list(METIERS.keys())}", file=sys.stderr)
        sys.exit(1)

    naf = METIERS[metier]
    print(f"=== Test : {metier} (NAF {naf}) dans departement {dept} ===\n")

    params = {
        "activite_principale": naf,
        "departement": dept,
        "etat_administratif": "A",
        "per_page": 10,
        "page": 1,
    }
    data = fetch(params)

    print(f"Total resultats : {data.get('total_results')}")
    print(f"Total pages     : {data.get('total_pages')}")
    print(f"Page courante   : {data.get('page')}")
    print()

    results = data.get("results", [])
    if not results:
        print("Aucun resultat. Vereifier parametres ou API disponibilite.")
        return

    # Validation : le siege est-il bien dans le departement demande ?
    mismatches = 0
    print(f"{'NOM':<45} | {'VILLE':<18} | {'CP':<6} | {'NAF':<8} | RGE | CAT  | CREE")
    print("-" * 110)
    for r in results[:10]:
        siege = r.get("siege", {})
        rge = r.get("complements", {}).get("est_rge", False)
        cat = r.get("categorie_entreprise") or "-"
        dept_siege = siege.get("departement", "")
        mark = "!" if dept_siege != dept else " "
        if dept_siege != dept:
            mismatches += 1
        nom = (r.get("nom_complet") or "")[:44]
        ville = (siege.get("libelle_commune") or "")[:17]
        cp = siege.get("code_postal") or ""
        naf_val = r.get("activite_principale") or ""
        date_c = r.get("date_creation") or ""
        print(f"{mark} {nom:<43} | {ville:<18} | {cp:<6} | {naf_val:<8} | {str(rge):<5} | {cat:<4} | {date_c}")

    print()
    if mismatches:
        print(f"WARNING : {mismatches} resultats hors du departement {dept}")
    else:
        print("OK : tous les sieges sont bien dans le departement demande.")

    # Sample d'un pro riche
    p0 = results[0]
    print()
    print("=== Echantillon d'une fiche complete (premier resultat) ===")
    print(json.dumps({
        "nom_complet": p0.get("nom_complet"),
        "siren": p0.get("siren"),
        "siret_siege": p0.get("siege", {}).get("siret"),
        "date_creation": p0.get("date_creation"),
        "anciennete_annees": round((time.time() - time.mktime(time.strptime(p0.get("date_creation", "2000-01-01"), "%Y-%m-%d"))) / (365.25 * 86400), 1),
        "categorie_entreprise": p0.get("categorie_entreprise"),
        "tranche_effectif": p0.get("tranche_effectif_salarie"),
        "adresse": p0.get("siege", {}).get("adresse"),
        "ville": p0.get("siege", {}).get("libelle_commune"),
        "code_postal": p0.get("siege", {}).get("code_postal"),
        "departement": p0.get("siege", {}).get("departement"),
        "latitude": p0.get("siege", {}).get("latitude"),
        "longitude": p0.get("siege", {}).get("longitude"),
        "rge": p0.get("complements", {}).get("est_rge"),
        "qualiopi": p0.get("complements", {}).get("est_qualiopi"),
        "liste_rge": p0.get("siege", {}).get("liste_rge"),
        "dirigeants": [f"{d.get('prenoms','')} {d.get('nom','')}".strip() for d in (p0.get("dirigeants") or [])][:3],
        "activite": p0.get("libelle_activite_principale"),
    }, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
