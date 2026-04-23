-- ============================================================================
-- L'Observatoire des Pros , schéma initial
-- 2026-04-23 , Édition N°1
-- ============================================================================

-- Extensions
create extension if not exists pgcrypto;

-- ============================================================================
-- 1. Métiers référencés
-- ============================================================================
create table if not exists public.metiers (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text unique not null,
  nom text not null,
  nom_pluriel text not null,
  code_naf text,
  description text,
  metiers_complementaires uuid[] default '{}',
  created_at timestamptz default now()
);

create index if not exists metiers_slug_idx on public.metiers(slug);

-- ============================================================================
-- 2. Zones géographiques (region / département / ville)
-- ============================================================================
create table if not exists public.zones (
  id uuid primary key default extensions.gen_random_uuid(),
  type text not null check (type in ('region', 'departement', 'ville')),
  slug text not null,
  nom text not null,
  code text,
  parent_id uuid references public.zones(id),
  latitude decimal,
  longitude decimal,
  population integer,
  created_at timestamptz default now(),
  unique(type, slug)
);

create index if not exists zones_type_idx on public.zones(type);
create index if not exists zones_parent_idx on public.zones(parent_id);

-- ============================================================================
-- 3. Professionnels
-- ============================================================================
create table if not exists public.pros (
  id uuid primary key default extensions.gen_random_uuid(),
  nom_entreprise text not null,
  slug text unique not null,
  siret text,
  siren text,
  adresse text,
  code_postal text,
  ville text,
  telephone text,
  email text,
  site_web text,
  description text,
  portrait_long text,
  citation jsonb,
  date_creation_entreprise date,
  rge boolean default false,
  qualibat boolean default false,
  score_confiance decimal default 0 check (score_confiance >= 0 and score_confiance <= 10),
  tier text default 'gratuit' check (tier in ('gratuit', 'argent', 'or')),
  tier_expire_at timestamptz,
  photos text[] default '{}',
  avis_moyen decimal,
  avis_nombre integer default 0,
  verified boolean default false,
  active boolean default true,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists pros_slug_idx on public.pros(slug);
create index if not exists pros_siret_idx on public.pros(siret);
create index if not exists pros_score_idx on public.pros(score_confiance desc);
create index if not exists pros_tier_idx on public.pros(tier);
create index if not exists pros_active_idx on public.pros(active);

-- ============================================================================
-- 4. Relations pros <-> métiers
-- ============================================================================
create table if not exists public.pro_metiers (
  pro_id uuid references public.pros(id) on delete cascade,
  metier_id uuid references public.metiers(id) on delete cascade,
  specialite text,
  primary key (pro_id, metier_id)
);

create index if not exists pro_metiers_metier_idx on public.pro_metiers(metier_id);

-- ============================================================================
-- 5. Relations pros <-> zones d'intervention
-- ============================================================================
create table if not exists public.pro_zones (
  pro_id uuid references public.pros(id) on delete cascade,
  zone_id uuid references public.zones(id) on delete cascade,
  rayon_km integer default 30,
  primary key (pro_id, zone_id)
);

create index if not exists pro_zones_zone_idx on public.pro_zones(zone_id);

-- ============================================================================
-- 6. Classements (ordre contrôlé par page)
-- ============================================================================
create table if not exists public.classements (
  id uuid primary key default extensions.gen_random_uuid(),
  metier_id uuid not null references public.metiers(id),
  zone_id uuid not null references public.zones(id),
  pro_id uuid not null references public.pros(id) on delete cascade,
  position integer not null,
  score_page decimal,
  edition_num integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(metier_id, zone_id, pro_id)
);

create index if not exists classements_metier_zone_idx on public.classements(metier_id, zone_id, position);
create index if not exists classements_position_idx on public.classements(position);

-- ============================================================================
-- 7. Contenu généré par page (cache des intros, guides tarifaires, FAQ)
-- ============================================================================
create table if not exists public.pages_content (
  id uuid primary key default extensions.gen_random_uuid(),
  metier_id uuid references public.metiers(id),
  zone_id uuid references public.zones(id),
  intro text,
  guide_tarif text,
  faq jsonb,
  meta_title text,
  meta_description text,
  generated_at timestamptz default now(),
  generated_by text default 'claude-opus',
  unique(metier_id, zone_id)
);

create index if not exists pages_content_composite_idx on public.pages_content(metier_id, zone_id);

-- ============================================================================
-- 8. Abonnements pros (monétisation)
-- ============================================================================
create table if not exists public.abonnements (
  id uuid primary key default extensions.gen_random_uuid(),
  pro_id uuid not null references public.pros(id) on delete cascade,
  plan text not null check (plan in ('verifie', 'laureat')),
  prix_mensuel decimal not null,
  debut timestamptz not null,
  fin timestamptz not null,
  stripe_subscription_id text,
  actif boolean default true,
  created_at timestamptz default now()
);

create index if not exists abonnements_pro_idx on public.abonnements(pro_id);
create index if not exists abonnements_actif_idx on public.abonnements(actif);

-- ============================================================================
-- 9. Candidatures (soumises via /candidater/)
-- ============================================================================
create table if not exists public.candidatures (
  id uuid primary key default extensions.gen_random_uuid(),
  nom_entreprise text not null,
  siret text not null,
  code_naf text,
  dirigeant text,
  email text not null,
  metier_slug text,
  departement_code text,
  specialites text,
  annee_creation integer,
  formule text,
  motivation text,
  statut text default 'nouvelle' check (statut in ('nouvelle', 'examen', 'acceptee', 'refusee', 'archivee')),
  rgpd_consent boolean default false,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists candidatures_statut_idx on public.candidatures(statut);
create index if not exists candidatures_created_idx on public.candidatures(created_at desc);

-- ============================================================================
-- 10. Page metrics (performance GSC pour cold mailing pipeline)
-- ============================================================================
create table if not exists public.page_metrics (
  id uuid primary key default extensions.gen_random_uuid(),
  metier_id uuid references public.metiers(id),
  zone_id uuid references public.zones(id),
  impressions_gsc integer default 0,
  clics_gsc integer default 0,
  position_moyenne decimal,
  requete_principale text,
  date_releve date not null,
  created_at timestamptz default now()
);

create index if not exists page_metrics_date_idx on public.page_metrics(date_releve desc);

-- ============================================================================
-- 11. Analytics , page_views (pattern STACK-2026)
-- ============================================================================
create table if not exists public.page_views (
  id uuid primary key default extensions.gen_random_uuid(),
  path text not null,
  referrer text,
  user_agent text,
  is_bot boolean default false,
  created_at timestamptz default now()
);

create index if not exists page_views_path_idx on public.page_views(path);
create index if not exists page_views_created_idx on public.page_views(created_at desc);
create index if not exists page_views_bot_idx on public.page_views(is_bot);

-- ============================================================================
-- 12. Abonnements newsletter
-- ============================================================================
create table if not exists public.newsletter_subscribers (
  id uuid primary key default extensions.gen_random_uuid(),
  email text unique not null,
  source text,
  actif boolean default true,
  unsubscribed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists newsletter_email_idx on public.newsletter_subscribers(email);
create index if not exists newsletter_actif_idx on public.newsletter_subscribers(actif);

-- ============================================================================
-- RLS , Row Level Security
-- ============================================================================
alter table public.metiers enable row level security;
alter table public.zones enable row level security;
alter table public.pros enable row level security;
alter table public.pro_metiers enable row level security;
alter table public.pro_zones enable row level security;
alter table public.classements enable row level security;
alter table public.pages_content enable row level security;
alter table public.abonnements enable row level security;
alter table public.candidatures enable row level security;
alter table public.page_metrics enable row level security;
alter table public.page_views enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Lecture publique sur les tables editorialees
create policy "Public read metiers" on public.metiers for select using (true);
create policy "Public read zones" on public.zones for select using (true);
create policy "Public read pros active" on public.pros for select using (active = true);
create policy "Public read pro_metiers" on public.pro_metiers for select using (true);
create policy "Public read pro_zones" on public.pro_zones for select using (true);
create policy "Public read classements" on public.classements for select using (true);
create policy "Public read pages_content" on public.pages_content for select using (true);

-- Écriture anonyme , uniquement page_views + candidatures + newsletter
create policy "Anonymous insert page_views" on public.page_views for insert to anon with check (true);
create policy "Anonymous insert candidatures" on public.candidatures for insert to anon with check (true);
create policy "Anonymous insert newsletter" on public.newsletter_subscribers for insert to anon with check (true);

-- Service role has full access (enforced automatically)

-- ============================================================================
-- Seed initial , métiers + zones pilote
-- ============================================================================
insert into public.metiers (slug, nom, nom_pluriel, code_naf) values
  ('plombier', 'Plombier', 'Plombiers', '43.22A'),
  ('electricien', 'Électricien', 'Électriciens', '43.21A'),
  ('couvreur', 'Couvreur', 'Couvreurs', '43.91B'),
  ('menuisier', 'Menuisier', 'Menuisiers', '43.32A'),
  ('isolation', 'Entreprise d''isolation', 'Entreprises d''isolation', '43.29A')
on conflict (slug) do nothing;

-- Régions puis départements puis communes pilotes
with reg_if as (
  insert into public.zones (type, slug, nom, code)
  values ('region', 'ile-de-france', 'Île-de-France', 'IDF')
  on conflict (type, slug) do update set nom = excluded.nom
  returning id
), reg_bfc as (
  insert into public.zones (type, slug, nom, code)
  values ('region', 'bourgogne-franche-comte', 'Bourgogne-Franche-Comté', 'BFC')
  on conflict (type, slug) do update set nom = excluded.nom
  returning id
)
insert into public.zones (type, slug, nom, code, parent_id)
values
  ('departement', 'paris-75', 'Paris', '75', (select id from reg_if limit 1)),
  ('departement', 'cote-dor-21', 'Côte-d''Or', '21', (select id from reg_bfc limit 1)),
  ('departement', 'yonne-89', 'Yonne', '89', (select id from reg_bfc limit 1))
on conflict (type, slug) do nothing;
