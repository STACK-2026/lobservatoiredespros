-- ============================================================================
-- Migration 012 (2026-05-13) : ajout métier "Multiservices" + reclass Pascal
-- ============================================================================
--
-- CONTEXTE
-- --------
-- Romain PASCAL (slug `romain-pascal-plaisians`, SIRET 93180831500010) a
-- signalé via /contact/ le 2026-05-13 être incorrectement classé "Plaquiste"
-- alors qu'il exerce comme "homme toutes mains" (handyman polyvalent).
--
-- Son APE INSEE = 43.39Z = "Autres travaux de finition" est un code
-- fourre-tout couvrant : plâtrerie, plaques de plâtre, enduits, finitions
-- diverses, nettoyage de chantier, ET les artisans multiservices.
--
-- Or, dans notre table `metiers`, le code NAF 43.39Z mappait exclusivement
-- vers "Plaquiste" (slug `plaquiste`). 6 707 pros taggés "Plaquiste" sont
-- potentiellement dans le même cas que Pascal (à auditer dans une migration
-- ultérieure via heuristique dénomination + libellé activité INSEE).
--
-- CETTE MIGRATION FAIT (idempotent + transactionnel) :
--   1. Crée le métier "Artisan multiservices" (slug `multiservices`, NAF 43.39Z)
--   2. Réassigne Pascal de Plaquiste → Multiservices (DELETE + INSERT atomique)
--   3. Bump `pros.updated_at` pour invalider caches en aval
--
-- INVARIANTS VÉRIFIÉS avant mutation :
--   - Pascal existe dans la table `pros`
--   - Pascal est bien tagué "plaquiste" dans `pro_metiers`
--   Si invariant violé → RAISE EXCEPTION → ROLLBACK automatique
--
-- ROLLBACK
-- --------
-- Cette migration n'est pas auto-revertible (DELETE permanent du couple
-- plaquiste). Pour annuler manuellement :
--   DELETE FROM pro_metiers WHERE pro_id='92590d45-...' AND metier_id=(select id from metiers where slug='multiservices');
--   INSERT INTO pro_metiers(pro_id, metier_id) VALUES ('92590d45-...', 'fe22a301-...');
-- Le métier `multiservices` peut être conservé (utile pour A.3 audit systémique).
--
-- VOIR AUSSI
-- ----------
-- - Memory: feedback_naf_4339z_fourre_tout.md
-- - Mail original Pascal: dans contact_messages WHERE email='romainpascal3@orange.fr'

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Création du métier "Multiservices" (idempotent)
-- ----------------------------------------------------------------------------
INSERT INTO public.metiers (slug, nom, nom_pluriel, code_naf, description)
VALUES (
  'multiservices',
  'Artisan multiservices',
  'Artisans multiservices',
  '43.39Z',
  'Artisan polyvalent (homme toutes mains) intervenant sur petits travaux multi-corps d''état : finitions, plâtrerie légère, pose, montage, dépannage. Le code NAF 43.39Z (Autres travaux de finition) couvre cette activité polyvalente sans être limitée à la plâtrerie/plaquisterie.'
)
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Reclassification Pascal (avec garde-fous)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_pro_id uuid := '92590d45-e024-4a5a-9402-b4131f41c32c'; -- Romain PASCAL Plaisians
  v_metier_plaquiste uuid := 'fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f';
  v_metier_multiservices uuid;
BEGIN
  -- Récupère l'id du nouveau métier
  SELECT id INTO v_metier_multiservices
  FROM public.metiers WHERE slug = 'multiservices';

  IF v_metier_multiservices IS NULL THEN
    RAISE EXCEPTION 'Migration 012 abort: metier slug=multiservices not found after INSERT';
  END IF;

  -- Invariant 1 : Pascal doit exister
  IF NOT EXISTS (SELECT 1 FROM public.pros WHERE id = v_pro_id) THEN
    RAISE EXCEPTION 'Migration 012 abort: pro % (Romain PASCAL Plaisians) not found', v_pro_id;
  END IF;

  -- Invariant 2 : Pascal doit être tagué plaquiste actuellement
  IF NOT EXISTS (
    SELECT 1 FROM public.pro_metiers
    WHERE pro_id = v_pro_id AND metier_id = v_metier_plaquiste
  ) THEN
    RAISE EXCEPTION 'Migration 012 abort: pro % not tagged plaquiste (already reclassified?)', v_pro_id;
  END IF;

  -- Insert nouveau couple AVANT delete = safe en cas de FK cascade imprévue
  INSERT INTO public.pro_metiers (pro_id, metier_id, specialite)
  VALUES (
    v_pro_id,
    v_metier_multiservices,
    'homme toutes mains, autres travaux de finition (correction post-signalement 2026-05-13)'
  )
  ON CONFLICT (pro_id, metier_id) DO NOTHING;

  -- Delete ancien couple plaquiste
  DELETE FROM public.pro_metiers
  WHERE pro_id = v_pro_id AND metier_id = v_metier_plaquiste;

  -- Bump updated_at pour invalider caches downstream (intel views, sitemap regen)
  UPDATE public.pros SET updated_at = now() WHERE id = v_pro_id;

  RAISE NOTICE 'Migration 012 OK: Pascal % reclassified plaquiste -> multiservices', v_pro_id;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATIONS POST-APPLY (à exécuter manuellement)
-- ============================================================================
-- Doit retourner 1 ligne avec metier slug='multiservices':
--   SELECT pm.pro_id, m.slug, m.nom
--   FROM pro_metiers pm
--   JOIN metiers m ON m.id = pm.metier_id
--   WHERE pm.pro_id = '92590d45-e024-4a5a-9402-b4131f41c32c';
--
-- Doit retourner 0 ligne:
--   SELECT * FROM pro_metiers
--   WHERE pro_id = '92590d45-e024-4a5a-9402-b4131f41c32c'
--     AND metier_id = 'fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f';
--
-- Doit retourner 1 ligne:
--   SELECT slug, nom, code_naf FROM metiers WHERE slug = 'multiservices';
