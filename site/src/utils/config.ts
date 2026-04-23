import { siteConfig } from "../../site.config";

export { siteConfig };

/** Full URL for a path */
export function fullUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

/** Google Fonts URL , Fraunces display, Instrument Sans body, JetBrains Mono */
export function fontsUrl(): string {
  return "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,400;1,9..144,600&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap";
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
