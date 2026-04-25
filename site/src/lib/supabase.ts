/**
 * Supabase client pour lecture au build time des pros / classements / zones.
 * Utilise l'anon key (lecture publique) + RLS cote server-side.
 *
 * Fallback : si SUPABASE_SERVICE_KEY en env (build SSG), utilise le service
 * pour bypass RLS (plus rapide).
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
// Anon key publique , ok pour les reads
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXllYWtneGpnZGNmc3NydGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEwNTcsImV4cCI6MjA5MjUxNzA1N30.C7cw3T5Yj8W3LaYlLgWULlJlsP6iijxRKQvueA6WKOY";

// En priorite : service key si build-time, sinon anon
const key =
  (typeof process !== "undefined" && (process.env?.SUPABASE_SERVICE_KEY || process.env?.SUPABASE_SERVICE_ROLE_KEY)) ||
  SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, key, {
  auth: { persistSession: false },
  global: { headers: { "User-Agent": "lobservatoiredespros-ssg/1.0" } },
});

export interface ProRow {
  id: string;
  nom_entreprise: string;
  slug: string;
  siret: string | null;
  siren: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  telephone: string | null;
  site_web: string | null;
  description: string | null;
  portrait_long: string | null;
  citation: { text: string; auteur: string } | null;
  date_creation_entreprise: string | null;
  rge: boolean;
  qualibat: boolean;
  score_confiance: number;
  tier: "gratuit" | "argent" | "or";
  photos: string[];
  avis_moyen: number | null;
  avis_nombre: number;
  verified: boolean;
  active: boolean;
}

export interface MetierRow {
  id: string;
  slug: string;
  nom: string;
  nom_pluriel: string;
  code_naf: string | null;
  description: string | null;
}

export interface ZoneRow {
  id: string;
  type: "region" | "departement" | "ville";
  slug: string;
  nom: string;
  code: string | null;
  parent_id: string | null;
}

// --- Cache module-level pour eviter N queries au build ---
let _metiersCache: MetierRow[] | null = null;
let _zonesCache: ZoneRow[] | null = null;

export async function getMetiers(): Promise<MetierRow[]> {
  if (_metiersCache) return _metiersCache;
  const { data, error } = await supabase.from("metiers").select("*").order("nom");
  if (error) throw error;
  _metiersCache = data as MetierRow[];
  return _metiersCache;
}

export async function getZones(type?: "region" | "departement" | "ville"): Promise<ZoneRow[]> {
  if (_zonesCache && !type) return _zonesCache;
  let query = supabase.from("zones").select("*").order("nom");
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw error;
  if (!type) _zonesCache = data as ZoneRow[];
  return data as ZoneRow[];
}

export async function getMetierBySlug(slug: string): Promise<MetierRow | null> {
  const metiers = await getMetiers();
  return metiers.find((m) => m.slug === slug) || null;
}

export async function getZoneBySlug(slug: string): Promise<ZoneRow | null> {
  const zones = await getZones();
  return zones.find((z) => z.slug === slug) || null;
}

/** Cache module-level des liens pro_zones / pro_metiers (page batchee). */
let _proZonesCache: { pro_id: string; zone_id: string }[] | null = null;
let _proMetiersCache: { pro_id: string; metier_id: string }[] | null = null;

async function fetchAllPaginated<T>(table: string, cols: string): Promise<T[]> {
  const page = 1000;
  const all: T[] = [];
  for (let start = 0; ; start += page) {
    const { data, error } = await supabase.from(table).select(cols).range(start, start + page - 1);
    if (error) {
      console.error(`fetchAllPaginated ${table}:`, error);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < page) break;
  }
  return all;
}

export async function getAllProZones() {
  if (!_proZonesCache) {
    _proZonesCache = await fetchAllPaginated<{ pro_id: string; zone_id: string }>(
      "pro_zones",
      "pro_id, zone_id",
    );
  }
  return _proZonesCache;
}

export async function getAllProMetiers() {
  if (!_proMetiersCache) {
    _proMetiersCache = await fetchAllPaginated<{ pro_id: string; metier_id: string }>(
      "pro_metiers",
      "pro_id, metier_id",
    );
  }
  return _proMetiersCache;
}

export interface ProLite {
  id: string;
  slug: string;
  nom_entreprise: string;
  ville: string | null;
  rge: boolean;
  qualibat: boolean;
  score_confiance: number;
  niveau_confiance: string | null;
  etat_administratif: string | null;
  date_creation_entreprise: string | null;
  active: boolean;
}

let _proLiteCache: ProLite[] | null = null;
export async function getAllProLite(): Promise<ProLite[]> {
  if (!_proLiteCache) {
    _proLiteCache = await fetchAllPaginated<ProLite>(
      "pros",
      "id,slug,nom_entreprise,ville,rge,qualibat,score_confiance,niveau_confiance,etat_administratif,date_creation_entreprise,active",
    );
  }
  return _proLiteCache;
}

/** Pros pour un metier + departement specifique, classes par score desc. */
export async function getProsByMetierDept(metierSlug: string, deptSlug: string): Promise<ProRow[]> {
  const metier = await getMetierBySlug(metierSlug);
  const zone = await getZoneBySlug(deptSlug);
  if (!metier || !zone) return [];

  // Join via pro_metiers + pro_zones tables
  const { data, error } = await supabase
    .from("pros")
    .select(`
      *,
      pro_metiers!inner(metier_id),
      pro_zones!inner(zone_id)
    `)
    .eq("pro_metiers.metier_id", metier.id)
    .eq("pro_zones.zone_id", zone.id)
    .eq("active", true)
    .order("score_confiance", { ascending: false })
    .limit(100);

  if (error) {
    console.error("getProsByMetierDept error:", error);
    return [];
  }
  return (data as unknown as ProRow[]) || [];
}

/** Tous les pros d'un metier (toutes zones). */
export async function getProsByMetier(metierSlug: string): Promise<ProRow[]> {
  const metier = await getMetierBySlug(metierSlug);
  if (!metier) return [];
  const { data, error } = await supabase
    .from("pros")
    .select(`*, pro_metiers!inner(metier_id)`)
    .eq("pro_metiers.metier_id", metier.id)
    .eq("active", true)
    .order("score_confiance", { ascending: false })
    .limit(500);
  if (error) return [];
  return (data as unknown as ProRow[]) || [];
}

export async function getProBySlug(slug: string): Promise<ProRow | null> {
  const { data, error } = await supabase
    .from("pros")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProRow;
}

/** Count actifs par (metier, dept) pour stats homepage. */
export async function getClassementCount(metierSlug: string, deptSlug: string): Promise<number> {
  const pros = await getProsByMetierDept(metierSlug, deptSlug);
  return pros.length;
}

/**
 * Combos (metierSlug, deptSlug) qui ont au moins un pro actif.
 * Unique requête, évite 1440 pages vides (15 métiers × 96 dpts seed national).
 * Retourne un Set de clés "metierSlug:deptSlug".
 */
let _comboCache: Set<string> | null = null;
export async function getMetierDeptCombos(): Promise<Set<string>> {
  if (_comboCache) return _comboCache;
  const metiers = await getMetiers();
  const zones = await getZones("departement");
  const metierById = new Map(metiers.map((m) => [m.id, m.slug]));
  const zoneById = new Map(zones.map((z) => [z.id, z.slug]));

  // Jointure 2-tables : fetch pro_metiers + pro_zones séparés puis joindre en mémoire.
  // Supabase cap default = 1000 rows ; on pagine par range(start, end) pour absorber
  // le volume national (50k+ pros × 1-2 liens chaque = jusqu'à ~100k rows chacun).
  const fetchAll = async <T,>(table: string, cols: string): Promise<T[]> => {
    const page = 1000;
    const all: T[] = [];
    for (let start = 0; ; start += page) {
      const { data, error } = await supabase
        .from(table)
        .select(cols)
        .range(start, start + page - 1);
      if (error) {
        console.error(`getMetierDeptCombos ${table} error`, error);
        return all;
      }
      if (!data || data.length === 0) break;
      all.push(...(data as T[]));
      if (data.length < page) break;
    }
    return all;
  };
  const [pm, pz] = await Promise.all([
    fetchAll<{ pro_id: string; metier_id: string }>("pro_metiers", "pro_id, metier_id"),
    fetchAll<{ pro_id: string; zone_id: string }>("pro_zones", "pro_id, zone_id"),
  ]);
  // Map pro_id → zone_ids[]
  const proToZones = new Map<string, string[]>();
  for (const row of pz) {
    const arr = proToZones.get(row.pro_id) || [];
    arr.push(row.zone_id);
    proToZones.set(row.pro_id, arr);
  }
  const combos = new Set<string>();
  for (const row of pm) {
    const mSlug = metierById.get(row.metier_id);
    if (!mSlug) continue;
    const zoneIds = proToZones.get(row.pro_id) || [];
    for (const zid of zoneIds) {
      const zSlug = zoneById.get(zid);
      if (!zSlug) continue;
      combos.add(`${mSlug}:${zSlug}`);
    }
  }
  _comboCache = combos;
  return combos;
}
