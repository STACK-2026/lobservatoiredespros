-- 2026-07-18 : table demandes (formulaire "Demander un devis" sur fiche pro vérifiée)
-- Pattern STACK-2026 identique à contact_messages (migration 010) : RLS, anon
-- insert avec consentement obligatoire, aucune lecture publique.
--
-- Contexte métier (Option B) : le formulaire n'est affiché côté front QUE sur
-- les fiches pros PAYANTS (pros.verified = true). Cette table reçoit les
-- demandes de devis des particuliers ; l'endpoint /api/devis fait aussi une
-- vérification en profondeur côté serveur avant tout insert (voir
-- site/functions/api/devis.ts).

CREATE TABLE IF NOT EXISTS public.demandes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id        uuid REFERENCES public.pros(id),
  pro_slug      text,
  nom           text NOT NULL,
  email         text,
  telephone     text,
  message       text,
  ip_hash       text,
  rgpd_consent  boolean NOT NULL DEFAULT false,
  source        text NOT NULL DEFAULT 'fiche_devis',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demandes_pro_id ON public.demandes (pro_id);
CREATE INDEX IF NOT EXISTS idx_demandes_created_at ON public.demandes (created_at DESC);

ALTER TABLE public.demandes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous insert demandes with consent" ON public.demandes;
CREATE POLICY "Anonymous insert demandes with consent"
  ON public.demandes FOR INSERT TO anon
  WITH CHECK (rgpd_consent = true);

-- Pas de policy SELECT/UPDATE/DELETE pour anon : seul service_role lit la boîte
-- (comme contact_messages). Le pro reçoit la demande par email (Resend), pas
-- via un accès direct à cette table.
