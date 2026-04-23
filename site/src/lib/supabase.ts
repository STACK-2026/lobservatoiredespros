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
