/**
 * Grammaire des noms de département français.
 *
 * Chaque département a une "forme grammaticale" qui change la préposition :
 *   "Yonne"      → de l'Yonne / dans l'Yonne  (feminin + voyelle initiale)
 *   "Rhône"      → du Rhône / dans le Rhône    (masculin)
 *   "Côte-d'Or"  → de la Côte-d'Or / en Côte-d'Or  (feminin)
 *   "Paris"      → de Paris / à Paris          (ville , pas d'article)
 *   "Yvelines"   → des Yvelines / dans les Yvelines  (pluriel)
 *
 * Trois formes exposees :
 *   dept.in  → "dans l'Yonne", "à Paris", "en Côte-d'Or"
 *   dept.of  → "de l'Yonne", "de Paris", "de la Côte-d'Or"
 *   dept.the → "l'Yonne", "Paris", "la Côte-d'Or"  (nom avec article)
 */

type DeptGrammar = {
  in: string;
  of: string;
  the: string;
};

// Overrides explicites pour les cas les plus frequents ou irreguliers.
// Etendre ici quand de nouveaux departements sont imports.
const OVERRIDES: Record<string, DeptGrammar> = {
  // Departements pilotes
  "Yonne": { in: "dans l'Yonne", of: "de l'Yonne", the: "l'Yonne" },
  "Côte-d'Or": { in: "en Côte-d'Or", of: "de la Côte-d'Or", the: "la Côte-d'Or" },
  "Paris": { in: "à Paris", of: "de Paris", the: "Paris" },

  // Autres departements frequents (extensible)
  "Ain": { in: "dans l'Ain", of: "de l'Ain", the: "l'Ain" },
  "Aisne": { in: "dans l'Aisne", of: "de l'Aisne", the: "l'Aisne" },
  "Allier": { in: "dans l'Allier", of: "de l'Allier", the: "l'Allier" },
  "Ardèche": { in: "en Ardèche", of: "de l'Ardèche", the: "l'Ardèche" },
  "Ariège": { in: "en Ariège", of: "de l'Ariège", the: "l'Ariège" },
  "Aube": { in: "dans l'Aube", of: "de l'Aube", the: "l'Aube" },
  "Aude": { in: "dans l'Aude", of: "de l'Aude", the: "l'Aude" },
  "Eure": { in: "dans l'Eure", of: "de l'Eure", the: "l'Eure" },
  "Hérault": { in: "dans l'Hérault", of: "de l'Hérault", the: "l'Hérault" },
  "Indre": { in: "dans l'Indre", of: "de l'Indre", the: "l'Indre" },
  "Isère": { in: "en Isère", of: "de l'Isère", the: "l'Isère" },
  "Oise": { in: "dans l'Oise", of: "de l'Oise", the: "l'Oise" },
  "Orne": { in: "dans l'Orne", of: "de l'Orne", the: "l'Orne" },

  // Feminins qui acceptent "en" (regions/provinces historiques)
  "Corse": { in: "en Corse", of: "de Corse", the: "la Corse" },
  "Savoie": { in: "en Savoie", of: "de Savoie", the: "la Savoie" },
  "Haute-Savoie": { in: "en Haute-Savoie", of: "de Haute-Savoie", the: "la Haute-Savoie" },

  // Pluriels
  "Alpes-de-Haute-Provence": { in: "dans les Alpes-de-Haute-Provence", of: "des Alpes-de-Haute-Provence", the: "les Alpes-de-Haute-Provence" },
  "Alpes-Maritimes": { in: "dans les Alpes-Maritimes", of: "des Alpes-Maritimes", the: "les Alpes-Maritimes" },
  "Ardennes": { in: "dans les Ardennes", of: "des Ardennes", the: "les Ardennes" },
  "Bouches-du-Rhône": { in: "dans les Bouches-du-Rhône", of: "des Bouches-du-Rhône", the: "les Bouches-du-Rhône" },
  "Côtes-d'Armor": { in: "dans les Côtes-d'Armor", of: "des Côtes-d'Armor", the: "les Côtes-d'Armor" },
  "Deux-Sèvres": { in: "dans les Deux-Sèvres", of: "des Deux-Sèvres", the: "les Deux-Sèvres" },
  "Hautes-Alpes": { in: "dans les Hautes-Alpes", of: "des Hautes-Alpes", the: "les Hautes-Alpes" },
  "Hautes-Pyrénées": { in: "dans les Hautes-Pyrénées", of: "des Hautes-Pyrénées", the: "les Hautes-Pyrénées" },
  "Hauts-de-Seine": { in: "dans les Hauts-de-Seine", of: "des Hauts-de-Seine", the: "les Hauts-de-Seine" },
  "Landes": { in: "dans les Landes", of: "des Landes", the: "les Landes" },
  "Pyrénées-Atlantiques": { in: "dans les Pyrénées-Atlantiques", of: "des Pyrénées-Atlantiques", the: "les Pyrénées-Atlantiques" },
  "Pyrénées-Orientales": { in: "dans les Pyrénées-Orientales", of: "des Pyrénées-Orientales", the: "les Pyrénées-Orientales" },
  "Vosges": { in: "dans les Vosges", of: "des Vosges", the: "les Vosges" },
  "Yvelines": { in: "dans les Yvelines", of: "des Yvelines", the: "les Yvelines" },

  // Feminins "la"
  "Charente": { in: "en Charente", of: "de la Charente", the: "la Charente" },
  "Charente-Maritime": { in: "en Charente-Maritime", of: "de la Charente-Maritime", the: "la Charente-Maritime" },
  "Corrèze": { in: "en Corrèze", of: "de la Corrèze", the: "la Corrèze" },
  "Creuse": { in: "dans la Creuse", of: "de la Creuse", the: "la Creuse" },
  "Dordogne": { in: "en Dordogne", of: "de la Dordogne", the: "la Dordogne" },
  "Drôme": { in: "dans la Drôme", of: "de la Drôme", the: "la Drôme" },
  "Gironde": { in: "en Gironde", of: "de la Gironde", the: "la Gironde" },
  "Haute-Garonne": { in: "en Haute-Garonne", of: "de la Haute-Garonne", the: "la Haute-Garonne" },
  "Haute-Loire": { in: "en Haute-Loire", of: "de la Haute-Loire", the: "la Haute-Loire" },
  "Haute-Marne": { in: "en Haute-Marne", of: "de la Haute-Marne", the: "la Haute-Marne" },
  "Haute-Saône": { in: "en Haute-Saône", of: "de la Haute-Saône", the: "la Haute-Saône" },
  "Haute-Vienne": { in: "en Haute-Vienne", of: "de la Haute-Vienne", the: "la Haute-Vienne" },
  "Ille-et-Vilaine": { in: "en Ille-et-Vilaine", of: "de l'Ille-et-Vilaine", the: "l'Ille-et-Vilaine" },
  "Indre-et-Loire": { in: "en Indre-et-Loire", of: "de l'Indre-et-Loire", the: "l'Indre-et-Loire" },
  "Loire": { in: "dans la Loire", of: "de la Loire", the: "la Loire" },
  "Loire-Atlantique": { in: "en Loire-Atlantique", of: "de la Loire-Atlantique", the: "la Loire-Atlantique" },
  "Lozère": { in: "en Lozère", of: "de la Lozère", the: "la Lozère" },
  "Manche": { in: "dans la Manche", of: "de la Manche", the: "la Manche" },
  "Marne": { in: "dans la Marne", of: "de la Marne", the: "la Marne" },
  "Mayenne": { in: "en Mayenne", of: "de la Mayenne", the: "la Mayenne" },
  "Meurthe-et-Moselle": { in: "en Meurthe-et-Moselle", of: "de la Meurthe-et-Moselle", the: "la Meurthe-et-Moselle" },
  "Meuse": { in: "dans la Meuse", of: "de la Meuse", the: "la Meuse" },
  "Moselle": { in: "en Moselle", of: "de la Moselle", the: "la Moselle" },
  "Nièvre": { in: "dans la Nièvre", of: "de la Nièvre", the: "la Nièvre" },
  "Saône-et-Loire": { in: "en Saône-et-Loire", of: "de la Saône-et-Loire", the: "la Saône-et-Loire" },
  "Sarthe": { in: "dans la Sarthe", of: "de la Sarthe", the: "la Sarthe" },
  "Seine-et-Marne": { in: "en Seine-et-Marne", of: "de la Seine-et-Marne", the: "la Seine-et-Marne" },
  "Seine-Maritime": { in: "en Seine-Maritime", of: "de la Seine-Maritime", the: "la Seine-Maritime" },
  "Seine-Saint-Denis": { in: "en Seine-Saint-Denis", of: "de la Seine-Saint-Denis", the: "la Seine-Saint-Denis" },
  "Somme": { in: "dans la Somme", of: "de la Somme", the: "la Somme" },
  "Vendée": { in: "en Vendée", of: "de la Vendée", the: "la Vendée" },
  "Vienne": { in: "dans la Vienne", of: "de la Vienne", the: "la Vienne" },
};

const VOYELLES_INITIAL = /^[aàâäeéèêëiïîoôöuùûüyAÀÂÄEÉÈÊËIÏÎOÔÖUÙÛÜYhH]/;

/**
 * Retourne les formes grammaticales "in/of/the" pour un nom de departement.
 * Utilise l'override si connu, sinon une heuristique minimale.
 */
export function deptGrammar(nom: string): DeptGrammar {
  if (OVERRIDES[nom]) return OVERRIDES[nom];

  // Heuristique : si commence par voyelle ou h → l'X, de l'X, dans l'X
  if (VOYELLES_INITIAL.test(nom)) {
    return {
      in: `dans l'${nom}`,
      of: `de l'${nom}`,
      the: `l'${nom}`,
    };
  }

  // Defaut masculin : le X, du X, dans le X
  return {
    in: `dans le ${nom}`,
    of: `du ${nom}`,
    the: `le ${nom}`,
  };
}
