-- ============================================================================
-- RGE Qualifications detail table
-- 2026-04-23 , migration apres D1 Enrichissement RGE ADEME
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pro_qualifications (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  pro_id UUID REFERENCES public.pros(id) ON DELETE CASCADE,
  siret TEXT NOT NULL,
  organisme TEXT NOT NULL,            -- qualibat, qualifelec, cequami, certibat, qualit_enr
  nom_certificat TEXT NOT NULL,       -- QUALIBAT-RGE, QUALIFELEC-RGE, etc.
  domaine TEXT NOT NULL,              -- Libellé du domaine technique
  meta_domaine TEXT,                  -- Catégorie haute (ex: Travaux d'efficacité énergétique)
  nom_qualification TEXT NOT NULL,
  code_qualification TEXT NOT NULL,   -- Code technique (5211D101)
  particulier BOOLEAN DEFAULT FALSE,  -- qualif pour particuliers
  date_debut DATE,
  date_fin DATE,                      -- Date d'expiration
  url_certificat TEXT,                -- Lien PDF du certificat
  telephone_source TEXT,
  email_source TEXT,
  site_internet_source TEXT,
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(siret, code_qualification)
);

CREATE INDEX IF NOT EXISTS idx_pro_qualif_siret ON public.pro_qualifications(siret);
CREATE INDEX IF NOT EXISTS idx_pro_qualif_pro ON public.pro_qualifications(pro_id);
CREATE INDEX IF NOT EXISTS idx_pro_qualif_actif ON public.pro_qualifications(date_fin) WHERE date_fin >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_pro_qualif_meta ON public.pro_qualifications(meta_domaine);

-- Colonnes d'agregat sur pros
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS nb_qualifications_actives INTEGER DEFAULT 0;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS liste_certificats TEXT[] DEFAULT '{}';

-- RLS public read
ALTER TABLE public.pro_qualifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read qualifs" ON public.pro_qualifications;
CREATE POLICY "Public read qualifs" ON public.pro_qualifications FOR SELECT USING (true);
