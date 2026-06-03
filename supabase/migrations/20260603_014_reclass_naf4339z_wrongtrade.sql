-- ============================================================================
-- Migration 014 (2026-06-03) : reclassement fiches NAF 43.39Z mal classees "Plaquiste"
-- ============================================================================
--
-- CONTEXTE (suite migration 012 + memoire feedback-naf-4339z-fourre-tout)
-- ----------------------------------------------------------------------
-- Le NAF 43.39Z "Autres travaux de finition" est un code INSEE fourre-tout
-- mappe 1:1 vers "plaquiste" a l'import. Des artisans exercant un AUTRE metier
-- reglemente (serrurier, plombier, electricien, menuisier, peintre) declares
-- sous ce code generique se retrouvaient affiches "Plaquiste" (titre, breadcrumb,
-- JSON-LD), avec risque editorial/image/RGPD (cf. signalement Pascal, migration 012).
--
-- Triage propre : scripts/triage_naf4339z.py classe les 6706 fiches plaquiste par
-- denomination (regex frontieres de mots, accent-fold), EXCLUT les noms revendiquant
-- platrerie/placo/cloison (vrais plaquistes mixtes -> non touches). 35 fiches
-- CONFIANTES (un seul autre metier nomme, aucun signal plaquiste) sont reclassees ici.
--
-- DECOUPLAGE NAF : ces pros restent immatricules 43.39Z a l'INSEE. On stocke leur
-- vrai NAF dans pros.code_naf (nouvelle colonne) ; le rendu affiche pros.code_naf
-- en priorite (fallback metier.code_naf). Ainsi le metier de navigation devient
-- "Serrurier" SANS afficher un faux NAF 43.32B. Le type Schema.org reste pilote
-- par le metier (inchange).
--
-- IDEMPOTENT + TRANSACTIONNEL. Garde-fous : pros existent ET sont bien tagges
-- plaquiste avant mutation, sinon RAISE EXCEPTION -> ROLLBACK.
--
-- ROLLBACK MANUEL (non auto-revertible, DELETE permanent du couple plaquiste) :
--   Pour chaque (pro_id,target) ci-dessous : DELETE le couple target, re-INSERT plaquiste,
--   et UPDATE pros SET code_naf=NULL. La colonne code_naf peut etre conservee.
--
-- VOIR AUSSI : scripts/triage_naf4339z.py, exports/triage_naf4339z_apply.csv

BEGIN;

-- 1. Colonne vrai-NAF par pro (decouple du metier). Idempotent.
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS code_naf text;
COMMENT ON COLUMN public.pros.code_naf IS 'Vrai code NAF/APE INSEE du pro (source de verite affichage), decouple du metier de navigation. NULL = fallback metier.code_naf.';

-- 2. Table de correspondance (pro -> metier cible)
CREATE TEMP TABLE _reclass_014 (pro_id uuid PRIMARY KEY, target uuid NOT NULL) ON COMMIT DROP;
INSERT INTO _reclass_014 (pro_id, target) VALUES
  ('d0431ec2-79a3-4f12-9e87-3716e8a1abd2'::uuid, '59da697d-735e-42ab-bdcc-0b520a620e90'::uuid),  -- BAECHER ELECTRICITE (electricien)
  ('98fd4966-3d74-4076-8f7e-8646ade9ca18'::uuid, '6056e21e-21d6-408c-8685-d66d5b436f37'::uuid),  -- ACTIBA MENUISERIES (menuisier)
  ('06aa968e-5ae8-4b7a-a79a-338729c13653'::uuid, '6056e21e-21d6-408c-8685-d66d5b436f37'::uuid),  -- DIDIER CORNIERE MENUISERIE DES GRANDES OUCHES (menuisier)
  ('a1fe628e-e980-4028-b2a9-422613343714'::uuid, '6056e21e-21d6-408c-8685-d66d5b436f37'::uuid),  -- EF MENUISERIE (menuisier)
  ('d1d4ab03-034e-49d3-b0b7-716933443e35'::uuid, '6056e21e-21d6-408c-8685-d66d5b436f37'::uuid),  -- EMERAUDE MENUISERIES SOLUTIONS (menuisier)
  ('15be710a-945a-42ed-8d92-88e9f39868a6'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- AG PEINTURE (peintre)
  ('c34c8024-70f0-4346-a0d0-090cb341b39d'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- ARTI PEINTURE 75 (peintre)
  ('eb8ba58c-8c00-462c-bdc5-32ccef9aabde'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- BM PEINTURE DECO (peintre)
  ('951d50be-35de-4b56-8147-9aec7aa7819d'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- BRUNO PEINTURE (peintre)
  ('56559e27-16ec-4b2a-a84c-2f93330ad26d'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- BS PEINTURE & RENOVATION (peintre)
  ('2544da11-3c4a-480d-af39-627595128298'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- CONSTANT CHRISTOPHE PEINTURE DECO (peintre)
  ('490f87fd-7714-43c2-8d40-99cae095561b'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- FRANCE NORD PEINTURE (peintre)
  ('ebe727f3-d507-411c-985b-b30517e5b293'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- FRANCIS PEINTURE (peintre)
  ('c5477239-7027-4b75-8c0f-4fd2e01d3b54'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- JASON PEINTURE (peintre)
  ('24953bf3-9da2-42f8-a14d-3758d16203ca'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- JOURI PEINTURE (peintre)
  ('c11720cb-d752-4915-9f76-cfbdaa6102c3'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- LB PEINTURE 55 (peintre)
  ('539dba41-0e50-4a2d-a1f5-2f88fa6c73dc'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- M.B.A PEINTURE (peintre)
  ('302a92a6-039d-4e43-b9a6-fabf06ed35f7'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- MAURER PEINTURE ET FINITION  -  MAURER ' S EVENT (peintre)
  ('ee683795-22fe-4704-8bdd-c1eada0534e1'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- MGM PEINTURE (peintre)
  ('6767ad62-010f-4ddc-9948-548ee8673135'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- MT PEINTURE (peintre)
  ('9df785c0-4184-47f9-958d-b6c2d1f27c6f'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- NEMAUSUS PEINTURE (peintre)
  ('35c62941-b479-44f5-a0f4-ab679a477e78'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- OUALID PEINTURE (peintre)
  ('0f89c24c-29b6-4ed1-ae58-fc7225b2ee32'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- PEINTURE LF (peintre)
  ('4cd36352-c55d-43dd-aa7b-a7c3225a119b'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- QB PEINTURE (peintre)
  ('67d3b791-19ce-44db-972a-20543cfd64d5'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- RG SERVICE PEINTURE (peintre)
  ('f8835959-7251-4858-acba-d308b2702e5d'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- SOS ASSECHEMENTS & PEINTURES (peintre)
  ('0f38b2f1-4037-4e9e-9110-6f796a38fe4f'::uuid, '8fa679e8-51a4-4701-95fd-8aac44e34a95'::uuid),  -- VK PEINTRE (peintre)
  ('a9ea5c4a-ddaf-4f09-bec4-740e80a61104'::uuid, 'ff1d4711-f3bf-4a65-a5ac-b09c62098572'::uuid),  -- FT PLOMBERIE (plombier)
  ('c737e9cf-6b85-4c8d-ae27-26ff37be6096'::uuid, 'ff1d4711-f3bf-4a65-a5ac-b09c62098572'::uuid),  -- HF PLOMBERIE RENOV (plombier)
  ('ed36fb78-1e1c-4500-b7c4-253ff41f996c'::uuid, 'ff1d4711-f3bf-4a65-a5ac-b09c62098572'::uuid),  -- LOLO PLOMBERIE (plombier)
  ('8339a7e3-2db8-4957-9ed3-2f7d1c39cb21'::uuid, 'ff1d4711-f3bf-4a65-a5ac-b09c62098572'::uuid),  -- SOLUTION PLOMBERIE (plombier)
  ('86bcc532-d4f5-4daf-ba43-f39e6e4f70e5'::uuid, '62361452-77fb-4a37-a972-2ce84e341c6f'::uuid),  -- DEPANN'SERRURES (serrurier)
  ('5102efed-f0d0-48b3-a685-3311375d25f8'::uuid, '62361452-77fb-4a37-a972-2ce84e341c6f'::uuid),  -- SERRURERIE METALLERIE SERVICES (serrurier)
  ('41b6fbd4-1536-4ea1-81c3-5793175abc60'::uuid, '62361452-77fb-4a37-a972-2ce84e341c6f'::uuid),  -- SERRURIER URGENCES DEPANNAGE (serrurier)
  ('6ac75058-e60c-47e1-a3e2-84908f7abfb7'::uuid, '62361452-77fb-4a37-a972-2ce84e341c6f'::uuid)  -- SOS SERRURIER FRANCE (serrurier)
;

-- 3. Garde-fous (invariants) : abort + rollback si viole
DO $$
DECLARE v_missing int; v_notplaq int;
BEGIN
  SELECT count(*) INTO v_missing
    FROM _reclass_014 r LEFT JOIN public.pros p ON p.id = r.pro_id
    WHERE p.id IS NULL;
  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Migration 014 abort: % pro_id introuvables dans pros', v_missing;
  END IF;

  SELECT count(*) INTO v_notplaq
    FROM _reclass_014 r
    WHERE NOT EXISTS (
      SELECT 1 FROM public.pro_metiers pm
      WHERE pm.pro_id = r.pro_id AND pm.metier_id = 'fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f'::uuid
    );
  IF v_notplaq > 0 THEN
    RAISE EXCEPTION 'Migration 014 abort: % pros plus tagges plaquiste (deja reclasses?)', v_notplaq;
  END IF;
END $$;

-- 4. Stocke le vrai NAF INSEE (43.39Z) + invalide caches downstream
UPDATE public.pros
   SET code_naf = '43.39Z', updated_at = now()
 WHERE id IN (SELECT pro_id FROM _reclass_014);

-- 5. Insert metier cible AVANT delete (safe si FK cascade imprevue)
INSERT INTO public.pro_metiers (pro_id, metier_id, specialite)
SELECT r.pro_id, r.target,
       'reclassement 2026-06-03 : NAF 43.39Z fourre-tout -> metier reel d apres denomination (triage_naf4339z)'
  FROM _reclass_014 r
ON CONFLICT (pro_id, metier_id) DO NOTHING;

-- 6. Delete l ancien couple plaquiste
DELETE FROM public.pro_metiers
 WHERE metier_id = 'fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f'::uuid
   AND pro_id IN (SELECT pro_id FROM _reclass_014);

COMMIT;

-- ============================================================================
-- VERIFS POST-APPLY (doivent retourner 35)
--   SELECT count(*) FROM pros WHERE code_naf='43.39Z';                       -- au moins 35
--   SELECT count(*) FROM pro_metiers pm WHERE pm.pro_id IN (...) AND metier_id<>'fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f';
-- Doit retourner 0 : aucun de ces pros encore tague plaquiste.
-- ============================================================================
