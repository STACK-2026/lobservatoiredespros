import { siteConfig } from "../../site.config";

export { siteConfig };

/** Full URL for a path */
export function fullUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

/** Google Fonts URL , Instrument Serif (display) + Inter (body) + JetBrains Mono */
export function fontsUrl(): string {
  return "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
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
