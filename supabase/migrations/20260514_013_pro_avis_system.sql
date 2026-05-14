-- ============================================================================
-- Migration 013 (2026-05-14) : Système d'avis pros + droit de réponse
-- ============================================================================
-- Spec : docs/superpowers/specs/2026-05-13-systeme-avis-pros-design.md
-- 4 tables nouvelles + 1 trigger update_pro_avis_aggregate + 3 policies RLS.
-- Tout dans une transaction BEGIN/COMMIT pour rollback total si erreur.

BEGIN;

-- 1. Avis principal
CREATE TABLE IF NOT EXISTS public.pro_avis (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  pro_id uuid NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'avis' CHECK (type IN ('avis','litige')),

  pseudo text NOT NULL CHECK (length(pseudo) BETWEEN 2 AND 30),
  email text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  email_verification_token text UNIQUE,
  email_verification_expires_at timestamptz,

  verdict text NOT NULL CHECK (verdict IN ('oui','non','mitige')),
  texte text NOT NULL CHECK (length(texte) BETWEEN 100 AND 5000),

  status text NOT NULL DEFAULT 'en_attente_verif_email'
    CHECK (status IN (
      'en_attente_verif_email',
      'en_attente_preavis_artisan',
      'en_attente_moderation',
      'publie',
      'rejete',
      'supprime'
    )),
  moderation_reason text,
  moderated_at timestamptz,
  moderated_by text,
  preavis_envoye_at timestamptz,
  published_at timestamptz,

  ip_hash text,
  user_agent text,
  rgpd_consent boolean NOT NULL DEFAULT false,
  anonymized_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_avis_pro_status_idx
  ON public.pro_avis(pro_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS pro_avis_token_idx
  ON public.pro_avis(email_verification_token);
CREATE INDEX IF NOT EXISTS pro_avis_pending_idx
  ON public.pro_avis(status)
  WHERE status IN ('en_attente_preavis_artisan','en_attente_moderation');
CREATE INDEX IF NOT EXISTS pro_avis_anonymize_idx
  ON public.pro_avis(published_at)
  WHERE anonymized_at IS NULL AND status = 'publie';

-- 2. Réponses de l'artisan
CREATE TABLE IF NOT EXISTS public.pro_avis_responses (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  avis_id uuid NOT NULL UNIQUE REFERENCES public.pro_avis(id) ON DELETE CASCADE,
  pro_id uuid NOT NULL REFERENCES public.pros(id),
  texte text NOT NULL CHECK (length(texte) BETWEEN 50 AND 2000),
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'publie' CHECK (status IN ('publie','supprime')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_avis_responses_pro_idx
  ON public.pro_avis_responses(pro_id);

-- 3. Audit trail des éditions de réponses
CREATE TABLE IF NOT EXISTS public.pro_avis_response_history (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.pro_avis_responses(id) ON DELETE CASCADE,
  texte_old text,
  texte_new text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by_ip_hash text
);

CREATE INDEX IF NOT EXISTS pro_avis_response_history_response_idx
  ON public.pro_avis_response_history(response_id, changed_at DESC);

-- 4. Magic link tokens (audit + revocation)
CREATE TABLE IF NOT EXISTS public.pro_response_tokens (
  id uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  avis_id uuid NOT NULL REFERENCES public.pro_avis(id) ON DELETE CASCADE,
  pro_id uuid NOT NULL REFERENCES public.pros(id),
  token_hash text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('preavis','reponse')),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_from_ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_response_tokens_hash_idx
  ON public.pro_response_tokens(token_hash);
CREATE INDEX IF NOT EXISTS pro_response_tokens_avis_idx
  ON public.pro_response_tokens(avis_id);

-- 5. Trigger update pros.avis_moyen + avis_nombre
CREATE OR REPLACE FUNCTION update_pro_avis_aggregate()
RETURNS trigger AS $$
DECLARE
  v_pro_id uuid;
  v_count integer;
  v_score decimal;
BEGIN
  v_pro_id := COALESCE(NEW.pro_id, OLD.pro_id);

  SELECT
    COUNT(*),
    AVG(CASE verdict WHEN 'oui' THEN 5 WHEN 'mitige' THEN 3 WHEN 'non' THEN 1 END)
  INTO v_count, v_score
  FROM public.pro_avis
  WHERE pro_id = v_pro_id AND status = 'publie';

  UPDATE public.pros
  SET avis_nombre = v_count,
      avis_moyen = v_score,
      updated_at = now()
  WHERE id = v_pro_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pro_avis_aggregate_trigger ON public.pro_avis;
CREATE TRIGGER pro_avis_aggregate_trigger
AFTER INSERT OR UPDATE OF status OR DELETE ON public.pro_avis
FOR EACH ROW EXECUTE FUNCTION update_pro_avis_aggregate();

-- 6. RLS Policies
ALTER TABLE public.pro_avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_avis_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous insert avis with consent" ON public.pro_avis;
CREATE POLICY "Anonymous insert avis with consent"
ON public.pro_avis FOR INSERT TO anon
WITH CHECK (rgpd_consent = true AND status = 'en_attente_verif_email');

DROP POLICY IF EXISTS "Public read published avis" ON public.pro_avis;
CREATE POLICY "Public read published avis"
ON public.pro_avis FOR SELECT TO anon
USING (status = 'publie');

DROP POLICY IF EXISTS "Public read responses of published avis" ON public.pro_avis_responses;
CREATE POLICY "Public read responses of published avis"
ON public.pro_avis_responses FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.pro_avis WHERE id = avis_id AND status = 'publie'
  )
  AND status = 'publie'
);

COMMIT;
