import { onRequestGet as __api_candidature_ts_onRequestGet } from "/Users/lestoilettesdeminette/stack-2026/lobservatoiredespros/site/functions/api/candidature.ts"
import { onRequestPost as __api_candidature_ts_onRequestPost } from "/Users/lestoilettesdeminette/stack-2026/lobservatoiredespros/site/functions/api/candidature.ts"

export const routes = [
    {
      routePath: "/api/candidature",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_candidature_ts_onRequestGet],
    },
  {
      routePath: "/api/candidature",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_candidature_ts_onRequestPost],
    },
  ]