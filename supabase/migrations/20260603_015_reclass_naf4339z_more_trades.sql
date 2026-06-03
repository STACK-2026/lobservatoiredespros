-- ============================================================================
-- Migration 015 (2026-06-03) : extension reclassement NAF 43.39Z (couvreur/carreleur/jardinier/macon...)
-- ============================================================================
--
-- Suite de 014. Meme bug (NAF 43.39Z fourre-tout mappe 1:1 plaquiste) ; 014 ne
-- ciblait que serrurier/plombier/electricien/menuisier/peintre. Le triage etendu
-- (scripts/triage_naf4339z.py, tous metiers + exclusion signal multiservices)
-- identifie 71 fiches plaquiste supplementaires dont la denomination nomme
-- clairement un autre metier (ex. "TOITURE PRO" -> couvreur, "MTS PAYSAGE" -> jardinier,
-- "LD MACONNERIE" -> macon). Aucune ne revendique placo/platrerie ni n'est handyman.
--
-- pros.code_naf (cree par 014) recoit '43.39Z' (vrai NAF INSEE) pour ces pros.
-- IDEMPOTENT + TRANSACTIONNEL, memes garde-fous que 014.
-- VOIR : scripts/triage_naf4339z.py, exports/triage_naf4339z_apply.csv

BEGIN;

ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS code_naf text;

CREATE TEMP TABLE _reclass_015 (pro_id uuid PRIMARY KEY, target uuid NOT NULL) ON COMMIT DROP;
INSERT INTO _reclass_015 (pro_id, target) VALUES
  ('4939b611-1935-4527-b538-305ea9f5f2c3'::uuid, '0ace3a0d-9ae5-4cd0-9b46-3959d05ca0d2'::uuid),  -- CARRELE-TOUT (carreleur)
  ('89d25489-f339-4c42-8dc3-63b8da630e18'::uuid, '0ace3a0d-9ae5-4cd0-9b46-3959d05ca0d2'::uuid),  -- ESPACE CARRELE (carreleur)
  ('7dcfffb4-8e73-438d-aa7d-93192bc8b46b'::uuid, '4c90c9c8-2189-4113-b458-f7a9b0f34e62'::uuid),  -- DS TOITURE (couvreur)
  ('caf5cf3a-78a3-4563-8f53-b8c1c78b5124'::uuid, '4c90c9c8-2189-4113-b458-f7a9b0f34e62'::uuid),  -- ENTREPRISE RAVAL TOITURE (couvreur)
  ('290b595c-1a43-4be9-9317-065f93fcfac0'::uuid, '4c90c9c8-2189-4113-b458-f7a9b0f34e62'::uuid),  -- IM TOITURE (couvreur)
  ('3360b5b7-048d-480e-a9d0-7bfe815679e7'::uuid, '4c90c9c8-2189-4113-b458-f7a9b0f34e62'::uuid),  -- PERFECT TOITURE & FACADE (couvreur)
  ('920eee71-30a0-4711-9cfb-b328d8d4dd77'::uuid, '4c90c9c8-2189-4113-b458-f7a9b0f34e62'::uuid),  -- PROPRE TOITURE (couvreur)
  ('6377bca2-cece-49ff-9f09-daa3797def03'::uuid, '4c90c9c8-2189-4113-b458-f7a9b0f34e62'::uuid),  -- RAVAL TOITURE & FILS (couvreur)
  ('3dd9ca6b-47f9-4956-879e-18771238fbaa'::uuid, '4c90c9c8-2189-4113-b458-f7a9b0f34e62'::uuid),  -- TCN TOITURE (couvreur)
  ('a70abb43-7b1b-43cb-b576-0fed387599fc'::uuid, '4c90c9c8-2189-4113-b458-f7a9b0f34e62'::uuid),  -- TOITURE LAND (couvreur)
  ('a7d35c51-f612-4757-968e-6b6d6e88e23f'::uuid, '4c90c9c8-2189-4113-b458-f7a9b0f34e62'::uuid),  -- TOITURE PRO (couvreur)
  ('16fcecc5-2189-4226-9a0b-5dffa7284a49'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- AES JARDINS&SERVICES (jardinier)
  ('5520e7be-e8d2-49df-8355-15446d1782a3'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- AF ESPACES VERTS (jardinier)
  ('1bd2d4a0-536b-4e79-90a3-989562175d4d'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- AL ESPACES VERTS (jardinier)
  ('9de28e7f-30a8-420b-830c-8f1aec96360e'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- ATOUT JARDIN HABITAT SERVICES (jardinier)
  ('937deede-ca8d-4a0a-b31a-4d0e7b4382f6'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- AUX BEAUX PAYSAGES (jardinier)
  ('4f8ae1f7-6000-4a83-8721-0385c10f2adc'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- AUX JARDINS DES MONIERS (jardinier)
  ('93524dd1-4d8c-4e99-9e21-fbfde6fb857a'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- Arnaud JARDIN (jardinier)
  ('f25fb833-a167-4b05-ba61-ad1484ee0177'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- BC PAYSAGES (jardinier)
  ('67b1c27a-05fe-4817-8fe2-b624fd9fc8d2'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- BRICOLE & JARDIN (jardinier)
  ('75e323bd-3ed1-49a0-b706-7eb33ea766d0'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- CHARBONNEL STEPHANE AMENAGEMENTS PAYSAGERS (jardinier)
  ('ea049c17-f0af-46e9-9c2a-b5e014cb997e'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- CLEM PAYSAGE (jardinier)
  ('7848c093-cd0e-4f43-9895-d738c2a87fa6'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- CLEM'PAYSAGES (jardinier)
  ('c2e1075a-3495-4837-8b34-718e671a5b4d'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- E2 PAYSAGE (jardinier)
  ('87e11d7a-1cd7-48a1-8166-9941b904506d'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- ENERGIES RENOUVELABLES - ESPACES VERTS (jardinier)
  ('cabe02a4-7371-4d3a-92eb-e9f35b1c8a88'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- EURL AZUR PAYSAGE (jardinier)
  ('cc750599-a889-466c-90b7-264347224c6d'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- FP  PAYSAGES EN HARMONIE (jardinier)
  ('b30c112b-5374-49ed-bfce-4cb4589d9767'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- GINKO JARDINS (jardinier)
  ('442cb1d0-f07b-4747-91da-11901bd19c65'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- JARDIN DES 3 FRONTIERES (jardinier)
  ('9e096027-1d60-4dbb-a816-9a1f1f2dd7a0'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- JARDIN MAXIME (jardinier)
  ('51f8ee05-4855-4d03-a6b4-74ee2489ef00'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- JARDIN SUSPENDU (jardinier)
  ('9e942811-b40b-4fd6-828a-0c35f3415e36'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- JARDINOVAS (jardinier)
  ('287b4f2e-9064-432e-a0bd-26acb863cd34'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- JARDINS & POTAGERS (jardinier)
  ('ffb7c2aa-a8fa-42d5-9027-14415cdd0238'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- JL PAYSAGES (jardinier)
  ('8286ea52-bf6f-400c-bc82-f6df18837956'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- JO PAYSAGE (jardinier)
  ('5da2975b-079d-4fbe-91ec-c9f5edd22a35'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- LB ENTRETIEN ESPACES VERTS (jardinier)
  ('6ed186ab-03e0-4b03-8da2-c44c5439073b'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- LE P'TIT JARDINIER (jardinier)
  ('8e80301e-a605-482b-b785-4f65692ccc71'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- LES JARDINS D' ELSA (jardinier)
  ('e5e6fe04-8871-4f8a-8ec9-c3ce1ac5454b'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- LES JARDINS DE YONI (jardinier)
  ('ffe2caa6-5db8-434f-a1f9-bb78d293373e'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- LES JARDINS DEL SOL (jardinier)
  ('8a7ad352-e8cd-4460-9f13-4fd4ed77f194'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- MA CREATION ET JARDINS (jardinier)
  ('1993b3ac-5133-497d-9d2e-50c3f06e8eaf'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- MAISON & JARDIN (jardinier)
  ('3992d39b-2b4f-4af3-8b34-cefcf0d5bb7e'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- MARIONNEAU PAYSAGE (jardinier)
  ('e8acc32b-c807-40b8-aee9-77d32bb54be7'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- ML ELAGAGE & PAYSAGE (jardinier)
  ('1862d6d3-bde9-4c82-96f0-4b04500ff2d0'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- MTS PAYSAGE (jardinier)
  ('16e38592-6a96-489d-8dcb-ee1157b67a03'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- Mickael JARDIN (jardinier)
  ('97bbaf7a-ad30-45ab-aae5-cea685ed4a9e'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- OUEST SIDE PAYSAGE (jardinier)
  ('c1edb5e4-5fae-4648-8e51-d503fa40eafa'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- PARMENTELOT PAYSAGE (jardinier)
  ('7e94287e-311f-450e-b9d0-be36c6cddb2b'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- SG PAYSAGE (jardinier)
  ('4cfc4294-966f-4adb-a3c8-cc10b3b5d29d'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- SP JARDIN (jardinier)
  ('50665bff-f4b0-48f9-97a4-d4c9a679019b'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- TB ESPACES VERTS (jardinier)
  ('bc91bafa-4b85-4ff3-8ad7-b9a73caef695'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- TECHNI CONFORT & JARDIN (jardinier)
  ('dc4b944e-d39d-4c74-b322-d69b0f6015fe'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- TMJ (TRAVAUX MAISON JARDIN) / ZEPHYR TANDEM / GAELLE HOCQUAUX HOME RELOOK (jardinier)
  ('e9c2b83f-1bfd-40f0-a948-a15475494b64'::uuid, 'ceaba6e8-eeb7-41e1-910d-ba1b91fcb471'::uuid),  -- VT TRAVAUX PAYSAGERS (jardinier)
  ('00a38951-99f9-4a4f-99d6-8029599f4bc8'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- A.D.N. MACONNERIE ET SERVICES (macon)
  ('04a0f392-eecc-4088-b3a3-232ddcd52bc7'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- ACA PETITE MACONNERIE (macon)
  ('681f7df1-105e-408f-90bc-61c7f4f6a3e0'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- BEN MACONNERIE ET PETITS TRAVAUX (macon)
  ('69c6ffbe-6aa5-4df4-984a-d187dd67de9c'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- BK MACONNERIE (macon)
  ('3f484a5f-a177-40da-ba5e-236650fb52a1'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- EBT MACONNERIE (macon)
  ('df59ebbc-d835-44fa-aa6b-52dbec1d5197'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- FAT MACONNERIE (macon)
  ('27d8aa74-e904-4a4a-a278-e7b7ea052235'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- FR MACONNERIE (macon)
  ('b8da5df4-3945-4c1d-b457-6431b0d0e620'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- JEAN PIERRE HONEL MACONNERIE (macon)
  ('763558e2-1ae2-4a34-a206-94d2e1708adc'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- KEVIN TOXE MACONNERIE (macon)
  ('3b3f848a-6231-4e10-b13a-b3b710f67df2'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- LAMBERT MACONNERIE (macon)
  ('6641ff3e-faa6-41c3-b33a-ff0e997f7724'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- LD MACONNERIE (macon)
  ('e3bd5179-7065-4e9e-b4e0-cc61f080b190'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- MACONNERIE MOYA PHILIPPE (macon)
  ('af3c5760-f709-4f26-88ba-111b06b1e0e4'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- MANDIN MACONNERIE (macon)
  ('52ccba77-a488-4a9c-aae1-2049428d744c'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- NDS ENDUITS MACONNERIE (macon)
  ('87683288-01da-484b-a62f-b09843c731bc'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- PVL MACONNERIE (macon)
  ('aa72a607-7ca1-4911-b56d-c5a4a77aec32'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid),  -- SARL M - D MACONNERIE (macon)
  ('b1963504-b9f9-419c-b07c-9cbcbf7e925c'::uuid, '8b2f8735-1f42-4bce-8da9-df984943b803'::uuid)  -- SJ MACONNERIE (macon)
;

DO $$
DECLARE v_missing int; v_notplaq int;
BEGIN
  SELECT count(*) INTO v_missing
    FROM _reclass_015 r LEFT JOIN public.pros p ON p.id = r.pro_id
    WHERE p.id IS NULL;
  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Migration 015 abort: % pro_id introuvables dans pros', v_missing;
  END IF;

  SELECT count(*) INTO v_notplaq
    FROM _reclass_015 r
    WHERE NOT EXISTS (
      SELECT 1 FROM public.pro_metiers pm
      WHERE pm.pro_id = r.pro_id AND pm.metier_id = 'fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f'::uuid
    );
  IF v_notplaq > 0 THEN
    RAISE EXCEPTION 'Migration 015 abort: % pros plus tagges plaquiste (deja reclasses?)', v_notplaq;
  END IF;
END $$;

UPDATE public.pros
   SET code_naf = '43.39Z', updated_at = now()
 WHERE id IN (SELECT pro_id FROM _reclass_015);

INSERT INTO public.pro_metiers (pro_id, metier_id, specialite)
SELECT r.pro_id, r.target,
       'reclassement 2026-06-03 (015) : NAF 43.39Z fourre-tout -> metier reel d apres denomination (triage_naf4339z)'
  FROM _reclass_015 r
ON CONFLICT (pro_id, metier_id) DO NOTHING;

DELETE FROM public.pro_metiers
 WHERE metier_id = 'fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f'::uuid
   AND pro_id IN (SELECT pro_id FROM _reclass_015);

COMMIT;
