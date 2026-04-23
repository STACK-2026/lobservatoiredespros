import { siteConfig } from "../../site.config";

/** JSON-LD pour la homepage (WebSite + CollectionPage) */
export function jsonLdHomepage() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.locale,
    publisher: { "@type": "NewsMediaOrganization", name: siteConfig.name, url: siteConfig.url },
  };
}

/** JSON-LD Article */
export function jsonLdArticle(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    image: opts.image || `${siteConfig.url}${siteConfig.ogImage}`,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: { "@type": "Person", name: opts.author },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}/favicon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    inLanguage: siteConfig.locale,
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

/** JSON-LD ItemList pour classements */
export function jsonLdRanking(opts: {
  name: string;
  items: { name: string; url: string; position: number }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    itemListElement: opts.items.map((i) => ({
      "@type": "ListItem",
      position: i.position,
      item: { "@type": "LocalBusiness", name: i.name, url: i.url },
    })),
  };
}

/** JSON-LD FAQPage */
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

/** Alias pour compat */
export const jsonLdFaq = jsonLdFAQ;

/** JSON-LD LocalBusiness pour fiche pro */
export function jsonLdLocalBusiness(opts: {
  name: string;
  url: string;
  description?: string;
  phone?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  aggregateRating?: { ratingValue: number; ratingCount?: number };
}) {
  const result: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: opts.name,
    url: opts.url,
    description: opts.description,
  };
  if (opts.phone) result.telephone = opts.phone;
  if (opts.address) {
    result.address = {
      "@type": "PostalAddress",
      ...opts.address,
      addressCountry: opts.address.addressCountry || "FR",
    };
  }
  if (opts.aggregateRating) {
    result.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: opts.aggregateRating.ratingValue,
      bestRating: 10,
      ratingCount: opts.aggregateRating.ratingCount || 1,
    };
  }
  return result;
}
