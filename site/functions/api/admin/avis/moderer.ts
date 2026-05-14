interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  ADMIN_MODERATION_TOKEN?: string;
}

function htmlPage(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>${title} - L'Observatoire des Pros</title><meta name="robots" content="noindex"><style>body{font-family:Inter,system-ui,sans-serif;background:#F7F3EC;color:#1A1614;text-align:center;padding:4rem 1.5rem;line-height:1.6;max-width:36rem;margin:0 auto}h1{font-family:Fraunces,serif;font-size:2rem;margin:0 0 1rem;font-style:italic}p{color:#555;margin:0.5rem 0}a{color:#1E3A52}</style></head><body>${body}</body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  const action = url.searchParams.get("action");
  const adminToken = url.searchParams.get("admin_token");

  if (!context.env.ADMIN_MODERATION_TOKEN) {
    return htmlPage("Configuration manquante", "<h1>Configuration manquante</h1><p>Le token de modération n'est pas configuré côté serveur.</p>", 500);
  }
  if (adminToken !== context.env.ADMIN_MODERATION_TOKEN) {
    return htmlPage("Accès refusé", "<h1>Accès refusé</h1><p>Le token administrateur fourni est invalide.</p>", 403);
  }
  if (!id || !action || !["publier", "rejeter"].includes(action)) {
    return htmlPage("Paramètres invalides", "<h1>Paramètres invalides</h1><p>Paramètres `id` et `action` (publier/rejeter) requis.</p>", 400);
  }

  const supabaseUrl = context.env.SUPABASE_URL || context.env.PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey =
    context.env.SUPABASE_SERVICE_KEY ||
    context.env.SUPABASE_ANON_KEY ||
    context.env.PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return htmlPage("Configuration manquante", "<h1>Configuration manquante</h1><p>Supabase n'est pas configuré côté serveur.</p>", 500);
  }
  const sbHeaders = { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` };

  const updateBody: Record<string, any> = {
    moderated_by: "admin",
    moderated_at: new Date().toISOString(),
  };
  if (action === "publier") {
    updateBody.status = "publie";
    updateBody.published_at = new Date().toISOString();
  } else {
    updateBody.status = "rejete";
  }

  const patchRes = await fetch(`${supabaseUrl}/rest/v1/pro_avis?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...sbHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(updateBody),
  });

  if (!patchRes.ok) {
    return htmlPage("Erreur DB", `<h1>Erreur</h1><p>Impossible de mettre à jour l'avis (HTTP ${patchRes.status}).</p>`, 502);
  }

  const verbe = action === "publier" ? "publié" : "rejeté";
  return htmlPage(
    `Avis ${verbe}`,
    `<h1>Avis ${verbe}</h1><p>L'action a été enregistrée. Vous pouvez fermer cette page.</p><p><a href="https://lobservatoiredespros.com">Retour au site</a></p>`
  );
};
