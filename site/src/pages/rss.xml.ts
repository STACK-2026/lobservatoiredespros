import type { APIRoute } from "astro";
import { siteConfig } from "../utils/config";

export const GET: APIRoute = async () => {
  const now = new Date().toUTCString();
  const base = siteConfig.url.replace(/\/$/, "");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title><![CDATA[${siteConfig.name} , Observations]]></title>
    <description><![CDATA[${siteConfig.description}]]></description>
    <link>${base}/</link>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    <language>${siteConfig.locale}</language>
    <copyright>© ${new Date().getFullYear()} ${siteConfig.legal.companyName}</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Astro + L'Observatoire des Pros</generator>
    <image>
      <url>${base}/og-default.svg</url>
      <title>${siteConfig.name}</title>
      <link>${base}/</link>
    </image>
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=UTF-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
