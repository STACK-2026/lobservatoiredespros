-- 2026-05-04 : table contact_messages (formulaire /contact/) + table form_events (tracking funnel)
-- Pattern STACK-2026 : RLS, anon insert avec consent, public read interdit.

-- =========================================================================
-- 1. contact_messages : remplit le bug /api/contact (endpoint manquant)
-- =========================================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         text NOT NULL,
  email       text NOT NULL,
  objet       text NOT NULL CHECK (objet IN ('piste','signalement','correction','candidature','presse','autre')),
  message     text NOT NULL,
  rgpd_consent boolean NOT NULL DEFAULT false,
  statut      text NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau','lu','traite','spam','archive')),
  ip_hash     text,
  user_agent  text,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_statut ON contact_messages (statut);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous insert contact with consent" ON contact_messages;
CREATE POLICY "Anonymous insert contact with consent"
  ON contact_messages FOR INSERT TO anon
  WITH CHECK (rgpd_consent = true);

-- Pas de policy SELECT/UPDATE/DELETE pour anon : seul service_role lit la boite.

-- =========================================================================
-- 2. form_events : funnel de conversion par formulaire
-- =========================================================================
CREATE TABLE IF NOT EXISTS form_events (
  id          bigserial PRIMARY KEY,
  form_id     text NOT NULL,           -- 'contact' | 'candidater' | 'newsletter'
  event       text NOT NULL CHECK (event IN ('view','focus','attempt','success','error','abandon')),
  field       text,                    -- nom du champ pour event='focus'
  path        text,                    -- URL au moment de l'event
  session_id  text,                    -- random côté client, persiste 30 min en sessionStorage
  is_bot      boolean DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_events_form_event ON form_events (form_id, event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_events_session ON form_events (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_form_events_created_at ON form_events (created_at DESC);

ALTER TABLE form_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous insert form_events" ON form_events;
CREATE POLICY "Anonymous insert form_events"
  ON form_events FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anonymous read form_events aggregated" ON form_events;
-- Pas de read public : agrégats consommés par admin via service_role.
