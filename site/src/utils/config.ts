import { siteConfig } from "../../site.config";

export { siteConfig };

/** Full URL for a path */
export function fullUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

/** Google Fonts URL , typo moderne editoriale :
 *   - Fraunces (display) : serif variable moderne, axe SOFT=100 pour un rendu fluide
 *   - Geist (body) : sans-serif Vercel, tres lisible, feel Apple/Linear
 *   - JetBrains Mono : metadata/folios
 */
export function fontsUrl(): string {
  return "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,100;1,9..144,300..700,100&family=Geist:wght@300..700&family=JetBrains+Mono:wght@400;500;600&display=swap";
}

/** Numéro d'édition formatté */
export function editionLabel(n?: number): string {
  const num = n ?? siteConfig.editionNumber;
  return `Édition N°${num}`;
}

/** Date courante en FR , "Jeudi 23 avril 2026" */
export function dateFR(d: Date = new Date()): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Meta label FR en petites capitales */
export function metaLabel(text: string): string {
  return text.toUpperCase();
}
