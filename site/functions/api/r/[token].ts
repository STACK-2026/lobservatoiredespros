import { verifyToken } from "../../_lib/token";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  PUBLIC_SUPABASE_URL?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  AVIS_TOKEN_SECRET: string;
}

interface AvisRow {
  id: string;
  pseudo: string;
  verdict: "oui" | "non" | "mitige";
  texte: string;
  status: string;
  created_at: string;
  published_at: string | null;
  pros: {
    slug: string;
    nom_entreprise: string;
    ville: string;
  } | null;
  pro_avis_responses: Array<{
    texte: string;
    version: number;
    created_at: string;
    updated_at: string;
  }>;
}

export const onRequestGet: PagesFunction<Env, "token"> = async (context) => {
  const tokenStr = String(context.params.token || "");
  const payload = await verifyToken(tokenStr, context.env.AVIS_TOKEN_SECRET);

  if (!payload) {
    return new Response(
      JSON.stringify({ ok: false, error: "token_invalid_or_expired" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const supabaseUrl =
    context.env.SUPABASE_URL || context.env.PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey =
    context.env.SUPABASE_SERVICE_KEY ||
    context.env.SUPABASE_ANON_KEY ||
    context.env.PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "supabase_not_configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const sbHeaders = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  };

  const avisRes = await fetch(
    `${supabaseUrl}/rest/v1/pro_avis?id=eq.${payload.avis_id}&select=id,pseudo,verdict,texte,status,created_at,published_at,pros(slug,nom_entreprise,ville),pro_avis_responses(texte,version,created_at,updated_at)`,
    { headers: sbHeaders }
  );

  if (!avisRes.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: "fetch_failed" }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const rows = (await avisRes.json()) as AvisRow[];

  if (rows.length === 0) {
    return new Response(
      JSON.stringify({ ok: false, error: "avis_not_found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const avis = rows[0];

  return new Response(
    JSON.stringify({
      ok: true,
      avis,
      token_type: payload.type,
      expires_at: new Date(payload.exp * 1000).toISOString(),
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};
