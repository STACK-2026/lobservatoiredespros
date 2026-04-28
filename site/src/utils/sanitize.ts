/**
 * Strip em-dash (U+2014) and en-dash (U+2013) from any DB-sourced string
 * before rendering. Brand rule (CLAUDE.md) : tirets cadratins interdits dans
 * tout contenu user-facing, on remplace par tiret simple "-".
 *
 * Cas d'usage typique : opening_hours fournis par Google Places utilisent
 * des en-dashes pour les plages horaires (ex "10:00–19:00"). On normalise.
 */
export function sanitizeDashes<T extends string | null | undefined>(s: T): T {
  if (s === null || s === undefined) return s;
  return s.replace(/[—–]/g, "-") as T;
}
