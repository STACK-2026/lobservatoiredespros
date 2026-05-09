-- 2026-05-09 : etendre events.type CHECK pour tracking contact (phone/email/website)
-- Pattern reveal-on-click sur fiche pro : capture intentions de contact pour
-- monetisation per-pro (medaille Argent/Or paye 29 ou 89 EUR/an).

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;

ALTER TABLE public.events ADD CONSTRAINT events_type_check CHECK (
  type = ANY (ARRAY[
    'phone_click'::text,
    'phone_reveal'::text,
    'email_click'::text,
    'email_reveal'::text,
    'website_click'::text,
    'cta_click'::text,
    'form_view'::text,
    'form_focus'::text,
    'form_submit'::text,
    'form_abandon'::text,
    'affiliate_click'::text
  ])
);

-- Index pour analytics par pro (target = pro_slug)
CREATE INDEX IF NOT EXISTS idx_events_target_type_ts ON public.events (target, type, ts DESC);
