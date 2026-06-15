/**
 * CF Pages Function : GET /pro/<slug>/donner-mon-avis/
 *
 * Displays the review submission form for a given pro. Served as a dynamic
 * function to avoid generating ~17k SSG pages (wave1 set) at build time.
 *
 * Routing note : CF Pages resolves /pro/<slug>/donner-mon-avis/ via this
 * function BEFORE the catch-all [[slug]].ts at functions/pro/[[slug]].ts
 * because path-specific segments take precedence over catch-alls.
 *
 * The form markup itself lives in _lib/avisForm.ts (shared with the edit page).
 */

import { renderAvisForm } from "../../_lib/avisForm";

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXllYWtneGpnZGNmc3NydGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEwNTcsImV4cCI6MjA5MjUxNzA1N30.C7cw3T5Yj8W3LaYlLgWULlJlsP6iijxRKQvueA6WKOY";

const SB_HEADERS = { apikey: ANON, Authorization: `Bearer ${ANON}` };

interface Env {
  PUBLIC_TURNSTILE_SITE_KEY?: string;
}

// Brand rule : no em-dash or en-dash in user-facing content
function sanitizeDashes(s: string | null | undefined): string {
  if (!s) return s ?? "";
  return s.replace(/[—–]/g, "-");
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  // pathname: /pro/<slug>/donner-mon-avis  (trailing slash stripped by CF)
  const pathParts = url.pathname.replace(/\/$/, "").split("/");
  // ["", "pro", "<slug>", "donner-mon-avis"]
  const slug = pathParts[2];
  if (!slug) {
    return new Response("Bad request", { status: 400 });
  }

  // Fetch pro (only fields needed for display)
  const proRes = await fetch(
    `${SUPABASE_URL}/rest/v1/pros?slug=eq.${encodeURIComponent(slug)}&select=nom_entreprise,ville,code_postal,active&active=eq.true&limit=1`,
    { headers: SB_HEADERS }
  );

  if (!proRes.ok) {
    return new Response("Service unavailable", { status: 502 });
  }

  const rows = (await proRes.json()) as Array<{
    nom_entreprise: string;
    ville: string | null;
    code_postal: string | null;
    active: boolean;
  }>;

  if (rows.length === 0) {
    return new Response(
      `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fiche introuvable - L'Observatoire des Pros</title>
<meta name="robots" content="noindex">
<style>body{font-family:Inter,system-ui,sans-serif;background:#F7F3EC;color:#1A1614;text-align:center;padding:4rem 1.75rem;line-height:1.6}h1{font-family:Fraunces,serif;font-style:italic;font-size:2rem;margin:0 0 1rem;font-weight:500}a{color:#1E3A52}</style>
</head><body>
<h1>Fiche introuvable</h1>
<p>La fiche pro recherchee n'existe pas ou a ete retiree.</p>
<p><a href="/">Retour a l'accueil</a></p>
</body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const pro = rows[0];
  const nom = sanitizeDashes(pro.nom_entreprise);
  const ville = sanitizeDashes(pro.ville);
  const cp = pro.code_postal || "";
  const turnstileSiteKey = context.env.PUBLIC_TURNSTILE_SITE_KEY || "";

  const html = renderAvisForm({
    mode: "create",
    slug,
    nom,
    ville,
    cp,
    actionUrl: "/api/avis/submit",
    hiddenFields: { pro_slug: slug },
    turnstileSiteKey,
    showEmail: true,
    showRgpd: true,
    eyebrow: "Donner mon avis",
    heading: `Partagez votre experience sur ${nom}.`,
    pageTitle: `Donner mon avis sur ${nom}`,
    submitLabel: "Publier mon avis",
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
