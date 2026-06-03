#!/usr/bin/env python3
"""Genere la migration 016 : reclasse les fiches plaquiste (NAF 43.39Z) a signal
handyman/polyvalent (multiservices, renov, tout corps d'etat...) vers le metier
"Artisan multiservices" (cree en migration 012, meme NAF 43.39Z).

Lit exports/triage_naf4339z_multiservices.csv (bucket "multiservices" du triage :
signal multi ET aucun metier specifique nomme ET aucun signal placo/platrerie).
Suppose la colonne pros.code_naf deja creee (014).
"""
import csv

PLAQUISTE = "fe22a301-dbcc-4aa0-a7d5-a2f6ae901f1f"
rows = list(csv.DictReader(open("exports/triage_naf4339z_multiservices.csv")))
rows = [r for r in rows if r["proposed_metier"] == "multiservices" and r["proposed_metier_id"]]
rows.sort(key=lambda r: r["nom_entreprise"])
assert rows, "aucune ligne multiservices"
mid = rows[0]["proposed_metier_id"]
assert all(r["proposed_metier_id"] == mid for r in rows), "metier_id multiservices incoherent"

_lines = []
for i, r in enumerate(rows):
    comma = "," if i < len(rows) - 1 else ""
    nom = (r["nom_entreprise"] or "").replace("\n", " ").replace("--", "-")
    _lines.append(f"  ('{r['pro_id']}'::uuid){comma}  -- {nom}")
values = "\n".join(_lines)

sql = f"""-- ============================================================================
-- Migration 016 (2026-06-03) : reclassement plaquiste -> multiservices (NAF 43.39Z handyman)
-- ============================================================================
--
-- Suite de 012/014/015. Le bucket "multiservices" du triage (scripts/triage_naf4339z.py)
-- = fiches plaquiste dont le nom porte un signal polyvalent/handyman (multiservices,
-- renov, tout corps d'etat...) SANS nommer de metier specifique NI revendiquer
-- placo/platrerie. {len(rows)} fiches -> metier "Artisan multiservices" (cree migration 012,
-- meme NAF 43.39Z). Affichage plus juste qu'un "Plaquiste" generique ; NAF inchange.
--
-- pros.code_naf = '43.39Z' (vrai NAF, decouple du metier ; deja le cas mais idempotent).
-- IDEMPOTENT + TRANSACTIONNEL, memes garde-fous que 014/015.
-- VOIR : scripts/triage_naf4339z.py, exports/triage_naf4339z_multiservices.csv

BEGIN;

ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS code_naf text;

CREATE TEMP TABLE _reclass_016 (pro_id uuid PRIMARY KEY) ON COMMIT DROP;
INSERT INTO _reclass_016 (pro_id) VALUES
{values}
;

DO $$
DECLARE v_missing int; v_notplaq int; v_target uuid;
BEGIN
  SELECT id INTO v_target FROM public.metiers WHERE slug = 'multiservices';
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Migration 016 abort: metier multiservices introuvable (migration 012 absente?)';
  END IF;
  IF v_target <> '{mid}'::uuid THEN
    RAISE EXCEPTION 'Migration 016 abort: metier_id multiservices live (%) != attendu {mid}', v_target;
  END IF;

  SELECT count(*) INTO v_missing
    FROM _reclass_016 r LEFT JOIN public.pros p ON p.id = r.pro_id WHERE p.id IS NULL;
  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Migration 016 abort: % pro_id introuvables', v_missing;
  END IF;

  SELECT count(*) INTO v_notplaq
    FROM _reclass_016 r
    WHERE NOT EXISTS (SELECT 1 FROM public.pro_metiers pm
                      WHERE pm.pro_id = r.pro_id AND pm.metier_id = '{PLAQUISTE}'::uuid);
  IF v_notplaq > 0 THEN
    RAISE EXCEPTION 'Migration 016 abort: % pros plus tagges plaquiste (deja reclasses?)', v_notplaq;
  END IF;
END $$;

UPDATE public.pros SET code_naf = '43.39Z', updated_at = now()
 WHERE id IN (SELECT pro_id FROM _reclass_016);

INSERT INTO public.pro_metiers (pro_id, metier_id, specialite)
SELECT r.pro_id, '{mid}'::uuid,
       'reclassement 2026-06-03 (016) : NAF 43.39Z handyman/polyvalent -> Artisan multiservices (triage_naf4339z)'
  FROM _reclass_016 r
ON CONFLICT (pro_id, metier_id) DO NOTHING;

DELETE FROM public.pro_metiers
 WHERE metier_id = '{PLAQUISTE}'::uuid
   AND pro_id IN (SELECT pro_id FROM _reclass_016);

COMMIT;
"""

out = "supabase/migrations/20260603_016_reclass_plaquiste_to_multiservices.sql"
open(out, "w").write(sql)
print(f"Wrote {out} ({len(rows)} pros -> multiservices {mid})")
