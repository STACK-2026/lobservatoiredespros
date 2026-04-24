/**
 * Référence géographique France métropolitaine.
 * Mirror TS de scripts/lib_geo_fr.py (côté Python pour imports Sirene).
 * 96 départements + 13 régions administratives.
 */

export type DepartementInfo = {
  nom: string;
  slug: string;
  region: string;
};

export const REGION_BY_DEPT_CODE: Record<string, string> = {
  // Île-de-France
  "75": "Île-de-France",
  "77": "Île-de-France",
  "78": "Île-de-France",
  "91": "Île-de-France",
  "92": "Île-de-France",
  "93": "Île-de-France",
  "94": "Île-de-France",
  "95": "Île-de-France",
  // Auvergne-Rhône-Alpes
  "01": "Auvergne-Rhône-Alpes",
  "03": "Auvergne-Rhône-Alpes",
  "07": "Auvergne-Rhône-Alpes",
  "15": "Auvergne-Rhône-Alpes",
  "26": "Auvergne-Rhône-Alpes",
  "38": "Auvergne-Rhône-Alpes",
  "42": "Auvergne-Rhône-Alpes",
  "43": "Auvergne-Rhône-Alpes",
  "63": "Auvergne-Rhône-Alpes",
  "69": "Auvergne-Rhône-Alpes",
  "73": "Auvergne-Rhône-Alpes",
  "74": "Auvergne-Rhône-Alpes",
  // Bourgogne-Franche-Comté
  "21": "Bourgogne-Franche-Comté",
  "25": "Bourgogne-Franche-Comté",
  "39": "Bourgogne-Franche-Comté",
  "58": "Bourgogne-Franche-Comté",
  "70": "Bourgogne-Franche-Comté",
  "71": "Bourgogne-Franche-Comté",
  "89": "Bourgogne-Franche-Comté",
  "90": "Bourgogne-Franche-Comté",
  // Bretagne
  "22": "Bretagne",
  "29": "Bretagne",
  "35": "Bretagne",
  "56": "Bretagne",
  // Centre-Val de Loire
  "18": "Centre-Val de Loire",
  "28": "Centre-Val de Loire",
  "36": "Centre-Val de Loire",
  "37": "Centre-Val de Loire",
  "41": "Centre-Val de Loire",
  "45": "Centre-Val de Loire",
  // Corse
  "2A": "Corse",
  "2B": "Corse",
  // Grand Est
  "08": "Grand Est",
  "10": "Grand Est",
  "51": "Grand Est",
  "52": "Grand Est",
  "54": "Grand Est",
  "55": "Grand Est",
  "57": "Grand Est",
  "67": "Grand Est",
  "68": "Grand Est",
  "88": "Grand Est",
  // Hauts-de-France
  "02": "Hauts-de-France",
  "59": "Hauts-de-France",
  "60": "Hauts-de-France",
  "62": "Hauts-de-France",
  "80": "Hauts-de-France",
  // Normandie
  "14": "Normandie",
  "27": "Normandie",
  "50": "Normandie",
  "61": "Normandie",
  "76": "Normandie",
  // Nouvelle-Aquitaine
  "16": "Nouvelle-Aquitaine",
  "17": "Nouvelle-Aquitaine",
  "19": "Nouvelle-Aquitaine",
  "23": "Nouvelle-Aquitaine",
  "24": "Nouvelle-Aquitaine",
  "33": "Nouvelle-Aquitaine",
  "40": "Nouvelle-Aquitaine",
  "47": "Nouvelle-Aquitaine",
  "64": "Nouvelle-Aquitaine",
  "79": "Nouvelle-Aquitaine",
  "86": "Nouvelle-Aquitaine",
  "87": "Nouvelle-Aquitaine",
  // Occitanie
  "09": "Occitanie",
  "11": "Occitanie",
  "12": "Occitanie",
  "30": "Occitanie",
  "31": "Occitanie",
  "32": "Occitanie",
  "34": "Occitanie",
  "46": "Occitanie",
  "48": "Occitanie",
  "65": "Occitanie",
  "66": "Occitanie",
  "81": "Occitanie",
  "82": "Occitanie",
  // Pays de la Loire
  "44": "Pays de la Loire",
  "49": "Pays de la Loire",
  "53": "Pays de la Loire",
  "72": "Pays de la Loire",
  "85": "Pays de la Loire",
  // Provence-Alpes-Côte d'Azur
  "04": "Provence-Alpes-Côte d'Azur",
  "05": "Provence-Alpes-Côte d'Azur",
  "06": "Provence-Alpes-Côte d'Azur",
  "13": "Provence-Alpes-Côte d'Azur",
  "83": "Provence-Alpes-Côte d'Azur",
  "84": "Provence-Alpes-Côte d'Azur",
};

/**
 * Départements voisins (par région) pour les blocs "dans la même région"
 * sur les pages classement. Construit par inversion de REGION_BY_DEPT_CODE.
 */
const _byRegion: Record<string, string[]> = {};
for (const [code, region] of Object.entries(REGION_BY_DEPT_CODE)) {
  if (!_byRegion[region]) _byRegion[region] = [];
  _byRegion[region].push(code);
}
export const DEPT_CODES_BY_REGION = _byRegion;

/** Retourne les départements voisins (même région) hors soi-même. */
export function neighborDepts(deptCode: string): string[] {
  const region = REGION_BY_DEPT_CODE[deptCode];
  if (!region) return [];
  return (DEPT_CODES_BY_REGION[region] || []).filter((c) => c !== deptCode);
}
