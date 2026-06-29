-- 2026-06-29 : Vue publique restreinte des avis + fermeture fuite PII.
--
-- Contexte : la fiche pro "wave1" (top pros) est pre-generee au build, donc ses
-- avis etaient figes jusqu'au prochain rebuild (un avis verifie recevait l'email
-- "publie" mais restait invisible). On ajoute une hydratation client qui lit les
-- avis publies en direct -> il faut une lecture anon SURE.
--
-- Probleme securite decouvert : la policy RLS "Public read published avis"
-- autorisait l'anon a lire TOUTES les colonnes des avis publies (RLS filtre les
-- lignes, pas les colonnes), exposant email / ip_hash / email_verification_token
-- via la cle anon publique. On ferme ca.

-- 1. Vue publique : colonnes non-PII uniquement + reponses en jsonb.
create or replace view public.v_pro_avis_public as
select a.id, a.pro_id, a.pseudo, a.verdict, a.texte, a.published_at,
  coalesce(
    (select jsonb_agg(jsonb_build_object('texte', r.texte, 'created_at', r.created_at) order by r.created_at)
     from public.pro_avis_responses r
     where r.avis_id = a.id and r.status = 'publie'),
    '[]'::jsonb
  ) as pro_avis_responses
from public.pro_avis a
where a.status = 'publie';

grant select on public.v_pro_avis_public to anon, authenticated;

-- 2. L'anon n'a plus acces brut a pro_avis (les Functions verifier/modifier/
--    submit utilisent la service key ; le build utilise la service role key ;
--    l'edge fn pro/[[slug]].ts et l'hydratation client lisent la vue).
revoke select on public.pro_avis from anon;
grant select (id, pro_id, pseudo, verdict, texte, published_at, status, created_at)
  on public.pro_avis to anon;
