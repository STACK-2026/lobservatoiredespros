/**
 * DB-wide pros source for the extended sitemap (long-tail).
 *
 * Pulls every (slug, updated_at) from active pros, paginated by 1000 rows.
 * Excludes wave1 slugs (those are in sitemap.xml already and pre-rendered
 * with rich Astro UI ; everything in here is served by the edge fallback
 * function with simpler SEO-equivalent HTML).
 *
 * Module-level cache : the same array is reused across getStaticPaths +
 * GET invocations in a single build pass, so we pay the DB pull once.
 *
 * Fail-soft : if Supabase errors mid-pagination, returns whatever we
 * collected so far. Worst case empty array, ext sitemap is empty but
 * wave1 + classements + pages stay valid. Never throws.
 */
import wave1 from "../data/wave1_pros.json";

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXllYWtneGpnZGNmc3NydGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEwNTcsImV4cCI6MjA5MjUxNzA1N30.C7cw3T5Yj8W3LaYlLgWULlJlsP6iijxRKQvueA6WKOY";
const HEADERS = { apikey: ANON, Authorization: `Bearer ${ANON}` };

// Build-time fallback : prefer service key when available (bypass RLS, faster).
const KEY =
  (typeof process !== "undefined" && (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.SUPABASE_SERVICE_KEY)) ||
  ANON;
const SB_HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}` };

export interface ProSitemapRow {
  slug: string;
  lastmod: string;
}

let _cache: ProSitemapRow[] | null = null;

function isoDate(input: string | null | undefined): string {
  if (!input) return new Date().toISOString().split("T")[0];
  try {
    return new Date(input).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export async function getExtensionPros(): Promise<ProSitemapRow[]> {
  if (_cache) return _cache;

  const wave1Set = new Set(wave1 as string[]);
  const out: ProSitemapRow[] = [];
  const PAGE = 1000;
  // Safety bound : 1000 pages * 1000 rows = 1M, well over 110k DB total.
  const MAX_PAGES = 1000;

  let offset = 0;
  for (let i = 0; i < MAX_PAGES; i++) {
    const url = `${SUPABASE_URL}/rest/v1/pros?select=slug,updated_at&active=eq.true&slug=not.is.null&offset=${offset}&limit=${PAGE}&order=id.asc`;
    let res: Response;
    try {
      res = await fetch(url, { headers: SB_HEADERS });
    } catch {
      break; // network error : keep what we have
    }
    if (!res.ok && res.status !== 206) break;
    let rows: Array<{ slug: string | null; updated_at: string | null }>;
    try {
      rows = await res.json();
    } catch {
      break;
    }
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const r of rows) {
      if (r.slug && !wave1Set.has(r.slug)) {
        out.push({ slug: r.slug, lastmod: isoDate(r.updated_at) });
      }
    }
    if (rows.length < PAGE) break;
    offset += PAGE;
  }

  _cache = out;
  return out;
}
