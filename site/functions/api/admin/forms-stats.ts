/**
 * GET /api/admin/forms-stats
 * Renvoie le funnel de conversion par formulaire + soumissions recentes.
 * Protege par header `Authorization: Bearer <ADMIN_TOKEN>`.
 *
 * Variables CF Pages requises :
 *   ADMIN_TOKEN          (secret, defini dashboard CF)
 *   SUPABASE_SERVICE_KEY (secret, service_role JWT lecture form_events)
 */

interface Env {
  ADMIN_TOKEN?: string;
  SUPABASE_SERVICE_KEY?: string;
}

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";

async function sbRpc(path: string, key: string): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = context.request.headers.get("authorization") || "";
  const expected = context.env.ADMIN_TOKEN;
  if (!expected || auth !== `Bearer ${expected}`) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const key = context.env.SUPABASE_SERVICE_KEY;
  if (!key) {
    return new Response(JSON.stringify({ ok: false, error: "missing SUPABASE_SERVICE_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Funnel par form_id sur 30j (humains seulement)
    const events = await sbRpc(
      "/rest/v1/form_events?select=form_id,event,created_at&is_bot=eq.false&created_at=gte." +
        encodeURIComponent(new Date(Date.now() - 30 * 86400000).toISOString()) +
        "&limit=10000",
      key,
    );

    // Aggregate
    const byForm: Record<string, Record<string, number>> = {};
    for (const e of events) {
      const fid = e.form_id;
      const ev = e.event;
      byForm[fid] ||= { view: 0, focus: 0, attempt: 0, success: 0, error: 0, abandon: 0 };
      byForm[fid][ev] = (byForm[fid][ev] || 0) + 1;
    }

    // 2. Last 20 contact_messages
    const contacts = await sbRpc(
      "/rest/v1/contact_messages?select=id,nom,email,objet,statut,created_at&order=created_at.desc&limit=20",
      key,
    );

    // 3. Last 20 candidatures
    const candidatures = await sbRpc(
      "/rest/v1/candidatures?select=id,nom_entreprise,email,formule,metier_slug,departement_code,statut,created_at&order=created_at.desc&limit=20",
      key,
    );

    // 4. Newsletter total + last 20
    const newsletter = await sbRpc(
      "/rest/v1/newsletter_subscribers?select=email,source,actif,created_at&order=created_at.desc&limit=20",
      key,
    );

    // 5. Total page_views par path /contact, /candidater, /newsletter (humains 30j)
    const pageviews30 = await sbRpc(
      "/rest/v1/page_views?select=path&is_bot=eq.false&created_at=gte." +
        encodeURIComponent(new Date(Date.now() - 30 * 86400000).toISOString()) +
        "&path=in.(/contact/,/candidater/,/newsletter/,/selection/)&limit=10000",
      key,
    );
    const pvByPath: Record<string, number> = {};
    for (const p of pageviews30) pvByPath[p.path] = (pvByPath[p.path] || 0) + 1;

    return new Response(
      JSON.stringify({
        ok: true,
        window: "30 derniers jours",
        funnel: byForm,
        page_views: pvByPath,
        contact_messages: contacts,
        candidatures,
        newsletter,
        generated_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
