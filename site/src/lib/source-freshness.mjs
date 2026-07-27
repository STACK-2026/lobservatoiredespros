const SOURCE_DATE_FIELDS = [
  "created_at",
  "updated_at",
  "enriched_at",
  "last_trust_sync",
];

function normalizedDate(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return {
    timestamp,
    iso: new Date(timestamp).toISOString().slice(0, 10),
  };
}

export function latestSourceDate(record = {}) {
  let latest = null;
  for (const field of SOURCE_DATE_FIELDS) {
    const candidate = normalizedDate(record[field]);
    if (candidate && (!latest || candidate.timestamp > latest.timestamp)) {
      latest = candidate;
    }
  }
  return latest?.iso || null;
}
