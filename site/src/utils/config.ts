import { siteConfig } from "../../site.config";

export { siteConfig };

/** Full URL for a path */
export function fullUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

/** Fonts self-hosted via @fontsource (imports BaseLayout) , typo moderne editoriale :
 *   - Fraunces (display) : serif variable moderne
 *   - Geist (body) : sans-serif Vercel, feel Apple/Linear
 *   - JetBrains Mono : metadata/folios
 *  Conserve pour compat retro , renvoie URL vide.
 */
export function fontsUrl(): string {
  return "";
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
