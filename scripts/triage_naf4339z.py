#!/usr/bin/env python3
"""
Triage des fiches taggees "Plaquiste" (NAF 43.39Z fourre-tout) mal classees.

CONTEXTE
--------
Le code NAF 43.39Z "Autres travaux de finition" est un code INSEE fourre-tout
mappe 1:1 vers le metier "plaquiste" a l'import. Il couvre en realite : platrerie,
plaques de platre, enduits, finitions, nettoyage chantier, ET des artisans qui
exercent un autre metier reglemente (serrurier, plombier, etc.) declares sous ce
code generique. Voir migration 012 + memoire feedback-naf-4339z-fourre-tout.

Le SEUL signal local discriminant = la denomination (`pros.nom_entreprise`),
car l'INSEE classe TOUS ces pros en 43.39Z (le NAF ne distingue pas le metier reel).

CE SCRIPT (read-only par defaut)
--------------------------------
- Lit tous les pros tagges "plaquiste".
- Classe par denomination (regex a frontieres de mots, variantes FR, accent-fold).
- EXCLUT les noms qui revendiquent eux-memes platrerie/placo/cloison (vrais
  plaquistes mixtes -> bucket AMBIGU, jamais auto-reclasses).
- Sort un rapport CSV + un JSON de reclassement pour les cas CONFIANTS.

Usage:
  export SUPABASE_SERVICE_ROLE_KEY=...   # ou --service-key
  python3 scripts/triage_naf4339z.py                # rapport seul
"""
import argparse
import csv
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co/rest/v1"
PLAQUISTE_METIER_ID = "fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f"

# Metiers dedies cibles (apply-scope) : un nom qui les nomme = clairement mal classe.
# NB : valable UNIQUEMENT pour le bucket plaquiste (NAF 43.39Z fourre-tout, ou le NAF
# n'informe pas le metier). Pour un NAF specifique, le NAF choisi par l'entreprise fait
# autorite -> ne pas reclasser sur le nom.
TRADE_PATTERNS = {
    "serrurier":    r"\bserrur",                       # serrurier, serrurerie, serrures
    "plombier":     r"\bplomb",                        # plombier, plomberie
    "electricien":  r"\belectric",                     # electricien, electricite, electrique
    "menuisier":    r"\bmenuis",                       # menuisier, menuiserie
    "peintre":      r"\bpeintur|\bpeintre",            # peinture, peintre
    "carreleur":    r"\bcarrel|\bfaience",             # carrelage, carreleur, faience
    "couvreur":     r"\bcouvr|\btoiture|\bzinguer",    # couvreur, couverture, toiture, zinguerie
    "macon":        r"\bmaconn",                       # maconnerie (pas \bmacon -> faux positifs noms)
    "jardinier":    r"\bpaysag|\bjardin|espaces verts",# paysagiste, jardin, espaces verts
    "chauffagiste": r"\bchauffag",                     # chauffage, chauffagiste
    "climaticien":  r"\bclimatis",                     # climatisation
    "isolation":    r"\bisolation|\bisolant",          # isolation thermique
    "parqueteur":   r"\bparquet",                      # parquet
    "cuisiniste":   r"\bcuisinist",                    # cuisiniste
}

# Le nom revendique lui-meme l'activite plaquiste/platrerie -> NE PAS reclasser.
PLAQUISTE_SIGNAL = re.compile(
    r"\bplaqui|\bplaco|\bplatr|\bcloison|\bdoublage|\bplaque|faux.?plafond|\bstaff\b|\bisolation",
)

# Signal handyman / polyvalent -> multiservices (hors apply-scope, pour rapport).
MULTI_SIGNAL = re.compile(
    r"multi.?service|tout.?corps|tous.?corps|toutes.?mains|\brenov|batiment.?general|general.?batiment",
)

TRADE_RES = {k: re.compile(v) for k, v in TRADE_PATTERNS.items()}
APPLY_SCOPE = set(TRADE_PATTERNS.keys())


def fold(s: str) -> str:
    """Minuscule + sans accents pour matcher 'electricite' == 'électricité'."""
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower()


def http_get(path: str, key: str):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/{path}",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def fetch_all_plaquiste(key: str):
    """Pagine tous les pros tagges plaquiste."""
    pros, offset, page, seen = [], 0, 1000, set()
    while True:
        # ORDER BY id STABLE : sans tri explicite, la pagination offset PostgREST
        # peut repeter/sauter des lignes (ordre non deterministe) -> doublons.
        sel = ("pros?select=id,slug,nom_entreprise,ville,code_postal,tier,description,"
               "pro_metiers!inner(metier_id)"
               f"&pro_metiers.metier_id=eq.{PLAQUISTE_METIER_ID}"
               f"&order=id&limit={page}&offset={offset}")
        batch = http_get(sel, key)
        if not batch:
            break
        for p in batch:                       # dedup defensif par id
            if p["id"] not in seen:
                seen.add(p["id"])
                pros.append(p)
        if len(batch) < page:
            break
        offset += page
    return pros


def classify(nom: str):
    """Retourne (decision, proposed_metier, matched_terms)."""
    n = fold(nom)
    trades = [t for t, rx in TRADE_RES.items() if rx.search(n)]
    is_plaq = bool(PLAQUISTE_SIGNAL.search(n))
    is_multi = bool(MULTI_SIGNAL.search(n))

    # Confiant SEULEMENT si un seul metier nomme, ni signal plaquiste, ni signal
    # multiservices (un handyman "MULTI SERVICES ET MACONNERIE" n'est pas un macon).
    if len(trades) == 1 and not is_plaq and not is_multi:
        return "confident", trades[0], trades
    if len(trades) >= 1:
        reason = "+plaquiste" if is_plaq else ("+multi" if is_multi else "multi-trade")
        return "ambiguous", None, trades + [reason]
    if is_multi and not is_plaq:
        return "multiservices", "multiservices", ["multi-signal"]
    return "keep", None, []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--service-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    ap.add_argument("--outdir", default="exports")
    args = ap.parse_args()
    if not args.service_key:
        sys.exit("ERROR: set SUPABASE_SERVICE_ROLE_KEY or --service-key")

    metiers = {m["slug"]: m["id"] for m in http_get("metiers?select=id,slug", args.service_key)}
    pros = fetch_all_plaquiste(args.service_key)
    print(f"Fetched {len(pros)} plaquiste-tagged pros")

    buckets = {"confident": [], "ambiguous": [], "multiservices": [], "keep": []}
    for p in pros:
        decision, proposed, terms = classify(p["nom_entreprise"] or "")
        row = {
            "pro_id": p["id"],
            "slug": p["slug"],
            "nom_entreprise": p["nom_entreprise"],
            "ville": p["ville"],
            "code_postal": p["code_postal"],
            "tier": p["tier"],
            "has_description": bool(p.get("description")),
            "proposed_metier": proposed or "",
            "proposed_metier_id": metiers.get(proposed, "") if proposed else "",
            "matched_terms": "|".join(terms),
        }
        buckets[decision].append(row)

    os.makedirs(args.outdir, exist_ok=True)
    # apply-scope = confiant ET metier dedie cible (les 5 trades)
    apply_rows = [r for r in buckets["confident"] if r["proposed_metier"] in APPLY_SCOPE]

    def dump_csv(name, rows):
        path = os.path.join(args.outdir, name)
        if not rows:
            return path
        with open(path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)
        return path

    dump_csv("triage_naf4339z_apply.csv", apply_rows)
    dump_csv("triage_naf4339z_ambiguous.csv", buckets["ambiguous"])
    dump_csv("triage_naf4339z_multiservices.csv", buckets["multiservices"])
    with open(os.path.join(args.outdir, "triage_naf4339z_apply.json"), "w") as f:
        json.dump(apply_rows, f, ensure_ascii=False, indent=2)

    # Resume
    from collections import Counter
    by_trade = Counter(r["proposed_metier"] for r in apply_rows)
    print("\n=== APPLY-SCOPE (confiant, metier dedie) ===")
    for t, c in sorted(by_trade.items()):
        print(f"  {t:12s}: {c}")
    print(f"  TOTAL apply : {len(apply_rows)}")
    print(f"\n  ambiguous (manuel)     : {len(buckets['ambiguous'])}")
    print(f"  multiservices (hors-scope rapport) : {len(buckets['multiservices'])}")
    print(f"  keep (vrai plaquiste)  : {len(buckets['keep'])}")
    print(f"\nEcrit dans {args.outdir}/triage_naf4339z_*.csv|.json")


if __name__ == "__main__":
    main()
