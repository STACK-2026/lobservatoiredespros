#!/usr/bin/env python3
"""Genere la migration 015 : extension du reclassement NAF 43.39Z aux metiers
manques par 014 (couvreur, carreleur, jardinier, macon, ...).

Meme classe de bug que 014 (NAF 43.39Z fourre-tout -> metier reel d'apres la
denomination), mais le triage initial ne ciblait que 5 metiers. Re-run du triage
(scripts/triage_naf4339z.py) apres 014 -> nouvelle apply list. Suppose la colonne
pros.code_naf deja creee par 014.
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
-- Migration 015 (2026-06-03) : extension reclassement NAF 43.39Z (couvreur/carreleur/jardinier/macon...)
-- ============================================================================
--
-- Suite de 014. Meme bug (NAF 43.39Z fourre-tout mappe 1:1 plaquiste) ; 014 ne
-- ciblait que serrurier/plombier/electricien/menuisier/peintre. Le triage etendu
-- (scripts/triage_naf4339z.py, tous metiers + exclusion signal multiservices)
-- identifie {len(rows)} fiches plaquiste supplementaires dont la denomination nomme
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
{values}
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
      WHERE pm.pro_id = r.pro_id AND pm.metier_id = '{PLAQUISTE}'::uuid
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
 WHERE metier_id = '{PLAQUISTE}'::uuid
   AND pro_id IN (SELECT pro_id FROM _reclass_015);

COMMIT;
"""

out = "supabase/migrations/20260603_015_reclass_naf4339z_more_trades.sql"
open(out, "w").write(sql)
print(f"Wrote {out} ({len(rows)} pros)")
