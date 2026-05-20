-- 2026-05-20 : tracking enrichissement coordonnees pros
alter table pros add column if not exists coords_enriched_at timestamptz;
alter table pros add column if not exists coords_source text check (coords_source in ('site_web', 'annuaire', 'google_places', 'pages_jaunes', 'manual', null));
create index if not exists idx_pros_coords_enriched on pros(coords_enriched_at) where coords_enriched_at is null;
comment on column pros.coords_enriched_at is 'Timestamp dernier passage pipeline enrich_pros_coords. NULL = jamais enrichi.';
comment on column pros.coords_source is 'Source du dernier enrichissement reussi (telephone OR email): site_web|annuaire|google_places|pages_jaunes|manual.';
