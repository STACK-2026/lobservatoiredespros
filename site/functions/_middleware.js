// Server-side bot crawl logger.
// Each HTML GET from a bot is logged to Supabase page_views with is_bot=true.
// Humans are tracked via the consent-gated client JS, not through this middleware
// (CNIL: no server-side identification of identifiable users).
//
// Why server-side : AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot)
// do not execute client JS, so a beacon-only tracker is invisible to them.

const BOT_RE = /bot|crawl|spider|slurp|lighthouse|headless|curl|wget|python|httpx|scrap|fetch|monitor|preview|vercel|facebookexternalhit|whatsapp|telegram|skypeuripreview|linkedinbot|twitterbot|duckduckbot|yandex|semrush|ahrefs|mj12bot|dotbot|petalbot|seznambot|applebot|ccbot|claudebot|gptbot|google-extended|perplexitybot|youbot|amazonbot|bytespider|duckassistbot|chatgpt-user|oai-searchbot|anthropic|cohere|diffbot|archive|uptime|pingdom|gtmetrix|Nexus 5X Build\/MMB29P/i;

const ASSET_EXT = /\.(js|mjs|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|eot|map|json|xml|txt|mp4|webm|mp3|pdf|zip)$/i;

export async function onRequest(context) {
  const { request, next, env, waitUntil } = context;
  const response = await next();

  try {
    if (request.method !== "GET") return response;

    const url = new URL(request.url);
    const path = url.pathname;
    if (ASSET_EXT.test(path)) return response;
    if (path.startsWith("/api/")) return response;
    if (path.startsWith("/_astro/") || path.startsWith("/_worker")) return response;

    const ua = request.headers.get("user-agent") || "";
    if (!ua || !BOT_RE.test(ua)) return response;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return response;

    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return response;

    const payload = {
      path: path.slice(0, 500),
      referrer: (request.headers.get("referer") || "").slice(0, 500) || null,
      user_agent: ua.slice(0, 500),
      is_bot: true,
      country: request.headers.get("cf-ipcountry") || null,
      city: request.headers.get("cf-ipcity") || null,
    };

    waitUntil(
      fetch(`${env.SUPABASE_URL}/rest/v1/page_views`, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      }).catch(() => {}),
    );
  } catch {
    // silent: never break the page render
  }

  return response;
}
