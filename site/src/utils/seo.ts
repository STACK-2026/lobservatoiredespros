import { siteConfig } from "../../site.config";

/** Identifiant canonique de l'organisation éditoriale (réutilisable partout). */
export const ORG_ID = `${siteConfig.url}/#organization`;
export const WEBSITE_ID = `${siteConfig.url}/#website`;

/** Bloc NewsMediaOrganization enrichi, ancre @id utilisée par tous les schémas. */
export function jsonLdOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": ORG_ID,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/favicon.svg`,
      width: 512,
      height: 512,
    },
    foundingDate: "2026",
    inLanguage: siteConfig.locale,
    areaServed: { "@type": "Country", name: "France" },
    publishingPrinciples: `${siteConfig.url}/methode/`,
    ethicsPolicy: `${siteConfig.url}/methode/`,
    actionableFeedbackPolicy: `${siteConfig.url}/contact/`,
    diversityPolicy: `${siteConfig.url}/a-propos/`,
  };
}

/** JSON-LD pour la homepage (WebSite + publisher référencé par @id) */
export function jsonLdHomepage() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.locale,
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/selection/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** JSON-LD Article (publisher via @id, logo désormais dans Organization) */
export function jsonLdArticle(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  authorUrl?: string;
  wordCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    image: opts.image || `${siteConfig.url}${siteConfig.ogImage}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: {
      "@type": "Person",
      name: opts.author,
      ...(opts.authorUrl ? { url: opts.authorUrl } : {}),
    },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    inLanguage: siteConfig.locale,
    ...(opts.wordCount ? { wordCount: opts.wordCount } : {}),
  };
}

/** JSON-LD BreadcrumbList */
export function jsonLdBreadcrumbs(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** JSON-LD ItemList pour classements avec description + count */
export function jsonLdRanking(opts: {
  name: string;
  description?: string;
  items: {
    name: string;
    url: string;
    position: number;
    description?: string;
    ratingValue?: number;
    bestRating?: number;
  }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    numberOfItems: opts.items.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: opts.items.map((i) => ({
      "@type": "ListItem",
      position: i.position,
      item: {
        "@type": "LocalBusiness",
        name: i.name,
        url: i.url,
        ...(i.description ? { description: i.description } : {}),
        ...(i.ratingValue
          ? {
              review: {
                "@type": "Review",
                author: { "@id": ORG_ID },
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: i.ratingValue,
                  bestRating: i.bestRating || 10,
                  worstRating: 0,
                },
              },
            }
          : {}),
      },
    })),
  };
}

/** JSON-LD FAQPage (conservé pour GEO/AI même si Google a restreint les rich results) */
export function jsonLdFAQ(faq: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}
export const jsonLdFaq = jsonLdFAQ;

/**
 * Mapping NAF → sous-type Schema.org le plus spécifique.
 * Améliore le entity matching vs "LocalBusiness" générique.
 */
export function schemaTypeForNaf(naf: string | null | undefined): string {
  if (!naf) return "LocalBusiness";
  const code = naf.replace(/\s/g, "").toUpperCase();
  // Plomberie
  if (code.startsWith("43.22A") || code.startsWith("43.22B")) return "Plumber";
  // Electricité
  if (code.startsWith("43.21A")) return "Electrician";
  // Couverture / toiture
  if (code.startsWith("43.91B") || code.startsWith("43.91A")) return "RoofingContractor";
  // Menuiserie
  if (code.startsWith("43.32A") || code.startsWith("43.32B")) return "GeneralContractor";
  // Isolation
  if (code.startsWith("43.29A")) return "HomeAndConstructionBusiness";
  // Peinture
  if (code.startsWith("43.34Z")) return "HousePainter";
  // Maçonnerie
  if (code.startsWith("43.99C") || code.startsWith("43.99")) return "GeneralContractor";
  // Plaquerie
  if (code.startsWith("43.39Z")) return "HomeAndConstructionBusiness";
  // Carrelage / parquet
  if (code.startsWith("43.33Z")) return "HomeAndConstructionBusiness";
  // Jardinier
  if (code.startsWith("81.30Z")) return "HomeAndConstructionBusiness";
  // Cuisiniste (retail spécialisée)
  if (code.startsWith("47.59A")) return "HomeGoodsStore";
  return "HomeAndConstructionBusiness";
}

/** JSON-LD LocalBusiness (fiche pro) enrichi geo + sameAs + subtype + addressRegion.
 *  Pas d'AggregateRating fabriqué : on utilise Review éditorial séparé.
 */
export function jsonLdLocalBusiness(opts: {
  name: string;
  url: string;
  description?: string;
  phone?: string;
  email?: string;
  url_web?: string;
  openingHours?: string | null;
  naf?: string | null;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    postalCode?: string;
    addressRegion?: string;
    addressCountry?: string;
  };
  geo?: { lat: number; lng: number } | null;
  sameAs?: (string | null | undefined)[];
  identifier?: { siret?: string | null; siren?: string | null };
  /** Date de fondation (ISO YYYY-MM-DD) issue de Sirene */
  foundingDate?: string | null;
  /** Nombre de salaries (tranche INSEE, range textuel ou nombre minimal) */
  numberOfEmployees?: string | null;
}) {
  const type = schemaTypeForNaf(opts.naf);
  const result: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name: opts.name,
    url: opts.url,
    description: opts.description,
  };
  if (opts.phone) result.telephone = opts.phone;
  if (opts.email) result.email = opts.email;
  if (opts.url_web) result.url = opts.url_web;
  // ContactPoint structure pour AI parsers (richer than just telephone)
  if (opts.phone || opts.email) {
    const cp: Record<string, unknown> = {
      "@type": "ContactPoint",
      contactType: "customer service",
      areaServed: "FR",
      availableLanguage: ["French"],
    };
    if (opts.phone) cp.telephone = opts.phone;
    if (opts.email) cp.email = opts.email;
    result.contactPoint = cp;
  }
  // openingHoursSpecification : Schema.org demande "Mo-Fr 09:00-18:00" via openingHours
  if (opts.openingHours) {
    result.openingHours = opts.openingHours;
  }
  if (opts.foundingDate) result.foundingDate = opts.foundingDate;
  if (opts.numberOfEmployees) {
    result.numberOfEmployees = {
      "@type": "QuantitativeValue",
      value: opts.numberOfEmployees,
    };
  }
  if (opts.address) {
    const addr: Record<string, unknown> = {
      "@type": "PostalAddress",
      addressCountry: opts.address.addressCountry || "FR",
    };
    if (opts.address.streetAddress) addr.streetAddress = opts.address.streetAddress;
    if (opts.address.addressLocality) addr.addressLocality = opts.address.addressLocality;
    if (opts.address.postalCode) addr.postalCode = opts.address.postalCode;
    if (opts.address.addressRegion) addr.addressRegion = opts.address.addressRegion;
    result.address = addr;
  }
  if (opts.geo && typeof opts.geo.lat === "number" && typeof opts.geo.lng === "number") {
    result.geo = {
      "@type": "GeoCoordinates",
      latitude: opts.geo.lat,
      longitude: opts.geo.lng,
    };
  }
  const sameAs = (opts.sameAs || []).filter((x): x is string => typeof x === "string" && x.length > 0);
  if (sameAs.length) result.sameAs = sameAs;
  if (opts.identifier) {
    const ids: Record<string, unknown>[] = [];
    if (opts.identifier.siret) ids.push({ "@type": "PropertyValue", propertyID: "SIRET", value: opts.identifier.siret });
    if (opts.identifier.siren) ids.push({ "@type": "PropertyValue", propertyID: "SIREN", value: opts.identifier.siren });
    if (ids.length) result.identifier = ids;
  }
  return result;
}

/** JSON-LD Review éditorial pour une fiche pro (remplace l'AggregateRating falsifié).
 *  À émettre seulement si on a un verdict publié par la rédaction.
 */
export function jsonLdEditorialReview(opts: {
  itemUrl: string;
  itemName: string;
  itemType?: string;
  ratingValue: number;
  bestRating?: number;
  reviewBody?: string;
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": opts.itemType || "LocalBusiness",
      name: opts.itemName,
      url: opts.itemUrl,
    },
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    reviewRating: {
      "@type": "Rating",
      ratingValue: opts.ratingValue,
      bestRating: opts.bestRating || 10,
      worstRating: 0,
    },
    ...(opts.reviewBody ? { reviewBody: opts.reviewBody } : {}),
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
  };
}

/** JSON-LD AdministrativeArea pour ancrer une page classement à un département. */
export function jsonLdAdministrativeArea(opts: {
  name: string;
  code: string;
  region?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AdministrativeArea",
    name: opts.name,
    identifier: opts.code,
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: opts.region || "France",
      containedInPlace: { "@type": "Country", name: "France" },
    },
  };
}

/** JSON-LD SpeakableSpecification à embarquer dans WebPage pour désigner les
 *  passages lisibles par assistants vocaux / AI Overviews.
 */
export function jsonLdSpeakable(opts: {
  url: string;
  cssSelectors?: string[];
  xpath?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${opts.url}#webpage`,
    url: opts.url,
    speakable: {
      "@type": "SpeakableSpecification",
      ...(opts.cssSelectors && opts.cssSelectors.length
        ? { cssSelector: opts.cssSelectors }
        : {}),
      ...(opts.xpath && opts.xpath.length ? { xpath: opts.xpath } : {}),
    },
  };
}
