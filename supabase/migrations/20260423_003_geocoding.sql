-- Add lat/lng columns to pros for mapping.
-- Geocoded via API Adresse data.gouv.fr (gratuit, source officielle FR).

ALTER TABLE pros
  ADD COLUMN IF NOT EXISTS lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS geocode_score NUMERIC(4, 3),
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pros_geo ON pros (lat, lng) WHERE lat IS NOT NULL;

NOTIFY pgrst, 'reload schema';
