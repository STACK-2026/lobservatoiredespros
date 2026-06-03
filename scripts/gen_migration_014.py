#!/usr/bin/env python3
"""Genere la migration 014 depuis exports/triage_naf4339z_apply.json (revu).

Reclasse les fiches plaquiste dont la denomination nomme un autre metier reglemente
(NAF 43.39Z fourre-tout), ET stocke leur vrai NAF INSEE (43.39Z) dans pros.code_naf
pour decoupler l'affichage du NAF du metier de navigation.
"""
import json

PLAQUISTE = "fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f"
rows = json.load(open("exports/triage_naf4339z_apply.json"))
rows.sort(key=lambda r: (r["proposed_metier"], r["nom_entreprise"]))

_lines = []
for i, r in enumerate(rows):
    comma = "," if i < len(rows) - 1 else ""
    nom = (r["nom_entreprise"] or "").replace("\n", " ").replace("--", "-")
    _lines.append(
        f"  ('{r['pro_id']}'::uuid, '{r['proposed_metier_id']}'::uuid){comma}"
        f"  -- {nom} ({r['proposed_metier']})"
    )
values = "\n".join(_lines)

sql = f"""-- ============================================================================
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
-- platrerie/placo/cloison (vrais plaquistes mixtes -> non touches). {len(rows)} fiches
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
{values}
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
      WHERE pm.pro_id = r.pro_id AND pm.metier_id = '{PLAQUISTE}'::uuid
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
 WHERE metier_id = '{PLAQUISTE}'::uuid
   AND pro_id IN (SELECT pro_id FROM _reclass_014);

COMMIT;

-- ============================================================================
-- VERIFS POST-APPLY (doivent retourner {len(rows)})
--   SELECT count(*) FROM pros WHERE code_naf='43.39Z';                       -- au moins {len(rows)}
--   SELECT count(*) FROM pro_metiers pm WHERE pm.pro_id IN (...) AND metier_id<>'{PLAQUISTE}';
-- Doit retourner 0 : aucun de ces pros encore tague plaquiste.
-- ============================================================================
"""

out = "supabase/migrations/20260603_014_reclass_naf4339z_wrongtrade.sql"
open(out, "w").write(sql)
print(f"Wrote {out} ({len(rows)} pros)")
