#!/usr/bin/env python3
"""
lib_geo_fr.py , reference des 96 departements francais metropole + 13 regions.

Source : decoupage officiel INSEE (code_dept INSEE, code_region INSEE).
Les DOM (971-976) ne sont pas inclus (roadmap Phase 2 metropole only).

Usage :
  from lib_geo_fr import DEPARTEMENTS_FR, REGIONS_FR, dept_slug

  for code, info in DEPARTEMENTS_FR.items():
      print(code, info["nom"], info["slug"], info["region_code"])
"""

REGIONS_FR = {
    "ARA":  {"nom": "Auvergne-Rhone-Alpes",       "slug": "auvergne-rhone-alpes"},
    "BFC":  {"nom": "Bourgogne-Franche-Comte",    "slug": "bourgogne-franche-comte"},
    "BRE":  {"nom": "Bretagne",                   "slug": "bretagne"},
    "CVL":  {"nom": "Centre-Val de Loire",        "slug": "centre-val-de-loire"},
    "COR":  {"nom": "Corse",                      "slug": "corse"},
    "GES":  {"nom": "Grand Est",                  "slug": "grand-est"},
    "HDF":  {"nom": "Hauts-de-France",            "slug": "hauts-de-france"},
    "IDF":  {"nom": "Ile-de-France",              "slug": "ile-de-france"},
    "NOR":  {"nom": "Normandie",                  "slug": "normandie"},
    "NAQ":  {"nom": "Nouvelle-Aquitaine",         "slug": "nouvelle-aquitaine"},
    "OCC":  {"nom": "Occitanie",                  "slug": "occitanie"},
    "PDL":  {"nom": "Pays de la Loire",           "slug": "pays-de-la-loire"},
    "PAC":  {"nom": "Provence-Alpes-Cote d'Azur", "slug": "provence-alpes-cote-azur"},
}

# Format : code INSEE -> {nom officiel, slug site, region code}
DEPARTEMENTS_FR = {
    "01": {"nom": "Ain",                      "slug": "ain-01",                        "region_code": "ARA"},
    "02": {"nom": "Aisne",                    "slug": "aisne-02",                      "region_code": "HDF"},
    "03": {"nom": "Allier",                   "slug": "allier-03",                     "region_code": "ARA"},
    "04": {"nom": "Alpes-de-Haute-Provence",  "slug": "alpes-de-haute-provence-04",    "region_code": "PAC"},
    "05": {"nom": "Hautes-Alpes",             "slug": "hautes-alpes-05",               "region_code": "PAC"},
    "06": {"nom": "Alpes-Maritimes",          "slug": "alpes-maritimes-06",            "region_code": "PAC"},
    "07": {"nom": "Ardeche",                  "slug": "ardeche-07",                    "region_code": "ARA"},
    "08": {"nom": "Ardennes",                 "slug": "ardennes-08",                   "region_code": "GES"},
    "09": {"nom": "Ariege",                   "slug": "ariege-09",                     "region_code": "OCC"},
    "10": {"nom": "Aube",                     "slug": "aube-10",                       "region_code": "GES"},
    "11": {"nom": "Aude",                     "slug": "aude-11",                       "region_code": "OCC"},
    "12": {"nom": "Aveyron",                  "slug": "aveyron-12",                    "region_code": "OCC"},
    "13": {"nom": "Bouches-du-Rhone",         "slug": "bouches-du-rhone-13",           "region_code": "PAC"},
    "14": {"nom": "Calvados",                 "slug": "calvados-14",                   "region_code": "NOR"},
    "15": {"nom": "Cantal",                   "slug": "cantal-15",                     "region_code": "ARA"},
    "16": {"nom": "Charente",                 "slug": "charente-16",                   "region_code": "NAQ"},
    "17": {"nom": "Charente-Maritime",        "slug": "charente-maritime-17",          "region_code": "NAQ"},
    "18": {"nom": "Cher",                     "slug": "cher-18",                       "region_code": "CVL"},
    "19": {"nom": "Correze",                  "slug": "correze-19",                    "region_code": "NAQ"},
    "21": {"nom": "Cote-d'Or",                "slug": "cote-dor-21",                   "region_code": "BFC"},
    "22": {"nom": "Cotes-d'Armor",            "slug": "cotes-darmor-22",               "region_code": "BRE"},
    "23": {"nom": "Creuse",                   "slug": "creuse-23",                     "region_code": "NAQ"},
    "24": {"nom": "Dordogne",                 "slug": "dordogne-24",                   "region_code": "NAQ"},
    "25": {"nom": "Doubs",                    "slug": "doubs-25",                      "region_code": "BFC"},
    "26": {"nom": "Drome",                    "slug": "drome-26",                      "region_code": "ARA"},
    "27": {"nom": "Eure",                     "slug": "eure-27",                       "region_code": "NOR"},
    "28": {"nom": "Eure-et-Loir",             "slug": "eure-et-loir-28",               "region_code": "CVL"},
    "29": {"nom": "Finistere",                "slug": "finistere-29",                  "region_code": "BRE"},
    "2A": {"nom": "Corse-du-Sud",             "slug": "corse-du-sud-2a",               "region_code": "COR"},
    "2B": {"nom": "Haute-Corse",              "slug": "haute-corse-2b",                "region_code": "COR"},
    "30": {"nom": "Gard",                     "slug": "gard-30",                       "region_code": "OCC"},
    "31": {"nom": "Haute-Garonne",            "slug": "haute-garonne-31",              "region_code": "OCC"},
    "32": {"nom": "Gers",                     "slug": "gers-32",                       "region_code": "OCC"},
    "33": {"nom": "Gironde",                  "slug": "gironde-33",                    "region_code": "NAQ"},
    "34": {"nom": "Herault",                  "slug": "herault-34",                    "region_code": "OCC"},
    "35": {"nom": "Ille-et-Vilaine",          "slug": "ille-et-vilaine-35",            "region_code": "BRE"},
    "36": {"nom": "Indre",                    "slug": "indre-36",                      "region_code": "CVL"},
    "37": {"nom": "Indre-et-Loire",           "slug": "indre-et-loire-37",             "region_code": "CVL"},
    "38": {"nom": "Isere",                    "slug": "isere-38",                      "region_code": "ARA"},
    "39": {"nom": "Jura",                     "slug": "jura-39",                       "region_code": "BFC"},
    "40": {"nom": "Landes",                   "slug": "landes-40",                     "region_code": "NAQ"},
    "41": {"nom": "Loir-et-Cher",             "slug": "loir-et-cher-41",               "region_code": "CVL"},
    "42": {"nom": "Loire",                    "slug": "loire-42",                      "region_code": "ARA"},
    "43": {"nom": "Haute-Loire",              "slug": "haute-loire-43",                "region_code": "ARA"},
    "44": {"nom": "Loire-Atlantique",         "slug": "loire-atlantique-44",           "region_code": "PDL"},
    "45": {"nom": "Loiret",                   "slug": "loiret-45",                     "region_code": "CVL"},
    "46": {"nom": "Lot",                      "slug": "lot-46",                        "region_code": "OCC"},
    "47": {"nom": "Lot-et-Garonne",           "slug": "lot-et-garonne-47",             "region_code": "NAQ"},
    "48": {"nom": "Lozere",                   "slug": "lozere-48",                     "region_code": "OCC"},
    "49": {"nom": "Maine-et-Loire",           "slug": "maine-et-loire-49",             "region_code": "PDL"},
    "50": {"nom": "Manche",                   "slug": "manche-50",                     "region_code": "NOR"},
    "51": {"nom": "Marne",                    "slug": "marne-51",                      "region_code": "GES"},
    "52": {"nom": "Haute-Marne",              "slug": "haute-marne-52",                "region_code": "GES"},
    "53": {"nom": "Mayenne",                  "slug": "mayenne-53",                    "region_code": "PDL"},
    "54": {"nom": "Meurthe-et-Moselle",       "slug": "meurthe-et-moselle-54",         "region_code": "GES"},
    "55": {"nom": "Meuse",                    "slug": "meuse-55",                      "region_code": "GES"},
    "56": {"nom": "Morbihan",                 "slug": "morbihan-56",                   "region_code": "BRE"},
    "57": {"nom": "Moselle",                  "slug": "moselle-57",                    "region_code": "GES"},
    "58": {"nom": "Nievre",                   "slug": "nievre-58",                     "region_code": "BFC"},
    "59": {"nom": "Nord",                     "slug": "nord-59",                       "region_code": "HDF"},
    "60": {"nom": "Oise",                     "slug": "oise-60",                       "region_code": "HDF"},
    "61": {"nom": "Orne",                     "slug": "orne-61",                       "region_code": "NOR"},
    "62": {"nom": "Pas-de-Calais",            "slug": "pas-de-calais-62",              "region_code": "HDF"},
    "63": {"nom": "Puy-de-Dome",              "slug": "puy-de-dome-63",                "region_code": "ARA"},
    "64": {"nom": "Pyrenees-Atlantiques",     "slug": "pyrenees-atlantiques-64",       "region_code": "NAQ"},
    "65": {"nom": "Hautes-Pyrenees",          "slug": "hautes-pyrenees-65",            "region_code": "OCC"},
    "66": {"nom": "Pyrenees-Orientales",      "slug": "pyrenees-orientales-66",        "region_code": "OCC"},
    "67": {"nom": "Bas-Rhin",                 "slug": "bas-rhin-67",                   "region_code": "GES"},
    "68": {"nom": "Haut-Rhin",                "slug": "haut-rhin-68",                  "region_code": "GES"},
    "69": {"nom": "Rhone",                    "slug": "rhone-69",                      "region_code": "ARA"},
    "70": {"nom": "Haute-Saone",              "slug": "haute-saone-70",                "region_code": "BFC"},
    "71": {"nom": "Saone-et-Loire",           "slug": "saone-et-loire-71",             "region_code": "BFC"},
    "72": {"nom": "Sarthe",                   "slug": "sarthe-72",                     "region_code": "PDL"},
    "73": {"nom": "Savoie",                   "slug": "savoie-73",                     "region_code": "ARA"},
    "74": {"nom": "Haute-Savoie",             "slug": "haute-savoie-74",               "region_code": "ARA"},
    "75": {"nom": "Paris",                    "slug": "paris-75",                      "region_code": "IDF"},
    "76": {"nom": "Seine-Maritime",           "slug": "seine-maritime-76",             "region_code": "NOR"},
    "77": {"nom": "Seine-et-Marne",           "slug": "seine-et-marne-77",             "region_code": "IDF"},
    "78": {"nom": "Yvelines",                 "slug": "yvelines-78",                   "region_code": "IDF"},
    "79": {"nom": "Deux-Sevres",              "slug": "deux-sevres-79",                "region_code": "NAQ"},
    "80": {"nom": "Somme",                    "slug": "somme-80",                      "region_code": "HDF"},
    "81": {"nom": "Tarn",                     "slug": "tarn-81",                       "region_code": "OCC"},
    "82": {"nom": "Tarn-et-Garonne",          "slug": "tarn-et-garonne-82",            "region_code": "OCC"},
    "83": {"nom": "Var",                      "slug": "var-83",                        "region_code": "PAC"},
    "84": {"nom": "Vaucluse",                 "slug": "vaucluse-84",                   "region_code": "PAC"},
    "85": {"nom": "Vendee",                   "slug": "vendee-85",                     "region_code": "PDL"},
    "86": {"nom": "Vienne",                   "slug": "vienne-86",                     "region_code": "NAQ"},
    "87": {"nom": "Haute-Vienne",             "slug": "haute-vienne-87",               "region_code": "NAQ"},
    "88": {"nom": "Vosges",                   "slug": "vosges-88",                     "region_code": "GES"},
    "89": {"nom": "Yonne",                    "slug": "yonne-89",                      "region_code": "BFC"},
    "90": {"nom": "Territoire de Belfort",    "slug": "territoire-de-belfort-90",      "region_code": "BFC"},
    "91": {"nom": "Essonne",                  "slug": "essonne-91",                    "region_code": "IDF"},
    "92": {"nom": "Hauts-de-Seine",           "slug": "hauts-de-seine-92",             "region_code": "IDF"},
    "93": {"nom": "Seine-Saint-Denis",        "slug": "seine-saint-denis-93",          "region_code": "IDF"},
    "94": {"nom": "Val-de-Marne",             "slug": "val-de-marne-94",               "region_code": "IDF"},
    "95": {"nom": "Val-d'Oise",               "slug": "val-doise-95",                  "region_code": "IDF"},
}

assert len(DEPARTEMENTS_FR) == 96, f"attendu 96 dpts metropole, obtenu {len(DEPARTEMENTS_FR)}"


def dept_codes():
    """Retourne la liste triee des 96 codes dept."""
    return sorted(DEPARTEMENTS_FR.keys())


def dept_info(code):
    """Retourne info dept ou leve KeyError."""
    return DEPARTEMENTS_FR[code]


def dept_slug(code):
    return DEPARTEMENTS_FR[code]["slug"]


def region_info(region_code):
    return REGIONS_FR[region_code]


if __name__ == "__main__":
    print(f"{len(REGIONS_FR)} regions, {len(DEPARTEMENTS_FR)} departements metropole")
    for code in sorted(DEPARTEMENTS_FR.keys()):
        d = DEPARTEMENTS_FR[code]
        print(f"  {code}  {d['nom']:<35s}  {d['slug']:<40s}  ({d['region_code']})")
