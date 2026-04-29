/**
 * Pages Function fallback : SSR dynamique pour les pros hors wave1 SSG.
 *
 * CF Pages routing : si /pro/[slug]/index.html existe en static (wave1 ~17k
 * pros pre-rendered), il est servi direct. Sinon CF route ici.
 *
 * Ce fichier produit un HTML SEO-complet identique en title/meta/JSON-LD a la
 * version statique. Le layout body est simplifie (pas d'animations Astro
 * complexes, pas de composants Score/Medaille/ProMap riches) car le long-tail
 * (~85k pros) est principalement crawle par bots, pas visite directement par
 * users.
 *
 * Si un pro long-tail commence a tracter du traffic user, la prochaine regen
 * wave1 le promouvra automatiquement vers le pre-rendered set (top priority
 * dans regen_wave1_pros.py via must_keep + score boost).
 */

const SUPABASE_URL = "https://apuyeakgxjgdcfssrtek.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXllYWtneGpnZGNmc3NydGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDEwNTcsImV4cCI6MjA5MjUxNzA1N30.C7cw3T5Yj8W3LaYlLgWULlJlsP6iijxRKQvueA6WKOY";
const SITE = "https://lobservatoiredespros.com";

const SB_HEADERS = { apikey: ANON, Authorization: `Bearer ${ANON}` };

interface ProRow {
  id: string;
  nom_entreprise: string;
  slug: string;
  siret: string | null;
  siren: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  telephone: string | null;
  site_web: string | null;
  email: string | null;
  description: string | null;
  date_creation_entreprise: string | null;
  rge: boolean;
  qualibat: boolean;
  score_confiance: number;
  tier: "gratuit" | "argent" | "or";
  active: boolean;
  lat: number | null;
  lng: number | null;
  opening_hours: string | null;
  tranche_effectif: string | null;
  niveau_confiance: string | null;
  etat_administratif: string | null;
  pro_metiers?: { metier_id: string; metiers: { id: string; slug: string; nom: string; nom_pluriel: string; code_naf: string | null } | null }[];
  pro_zones?: { zone_id: string; zones: { id: string; slug: string; nom: string; code: string | null; type: string } | null }[];
}

const REGION_BY_DEPT_CODE: Record<string, string> = {
  "01": "Auvergne-Rhône-Alpes", "02": "Hauts-de-France", "03": "Auvergne-Rhône-Alpes",
  "04": "Provence-Alpes-Côte d'Azur", "05": "Provence-Alpes-Côte d'Azur",
  "06": "Provence-Alpes-Côte d'Azur", "07": "Auvergne-Rhône-Alpes", "08": "Grand Est",
  "09": "Occitanie", "10": "Grand Est", "11": "Occitanie", "12": "Occitanie",
  "13": "Provence-Alpes-Côte d'Azur", "14": "Normandie", "15": "Auvergne-Rhône-Alpes",
  "16": "Nouvelle-Aquitaine", "17": "Nouvelle-Aquitaine", "18": "Centre-Val de Loire",
  "19": "Nouvelle-Aquitaine", "21": "Bourgogne-Franche-Comté", "22": "Bretagne",
  "23": "Nouvelle-Aquitaine", "24": "Nouvelle-Aquitaine", "25": "Bourgogne-Franche-Comté",
  "26": "Auvergne-Rhône-Alpes", "27": "Normandie", "28": "Centre-Val de Loire",
  "29": "Bretagne", "2A": "Corse", "2B": "Corse", "30": "Occitanie", "31": "Occitanie",
  "32": "Occitanie", "33": "Nouvelle-Aquitaine", "34": "Occitanie", "35": "Bretagne",
  "36": "Centre-Val de Loire", "37": "Centre-Val de Loire", "38": "Auvergne-Rhône-Alpes",
  "39": "Bourgogne-Franche-Comté", "40": "Nouvelle-Aquitaine", "41": "Centre-Val de Loire",
  "42": "Auvergne-Rhône-Alpes", "43": "Auvergne-Rhône-Alpes", "44": "Pays de la Loire",
  "45": "Centre-Val de Loire", "46": "Occitanie", "47": "Nouvelle-Aquitaine",
  "48": "Occitanie", "49": "Pays de la Loire", "50": "Normandie", "51": "Grand Est",
  "52": "Grand Est", "53": "Pays de la Loire", "54": "Grand Est", "55": "Grand Est",
  "56": "Bretagne", "57": "Grand Est", "58": "Bourgogne-Franche-Comté",
  "59": "Hauts-de-France", "60": "Hauts-de-France", "61": "Normandie",
  "62": "Hauts-de-France", "63": "Auvergne-Rhône-Alpes", "64": "Nouvelle-Aquitaine",
  "65": "Occitanie", "66": "Occitanie", "67": "Grand Est", "68": "Grand Est",
  "69": "Auvergne-Rhône-Alpes", "70": "Bourgogne-Franche-Comté", "71": "Bourgogne-Franche-Comté",
  "72": "Pays de la Loire", "73": "Auvergne-Rhône-Alpes", "74": "Auvergne-Rhône-Alpes",
  "75": "Île-de-France", "76": "Normandie", "77": "Île-de-France", "78": "Île-de-France",
  "79": "Nouvelle-Aquitaine", "80": "Hauts-de-France", "81": "Occitanie",
  "82": "Occitanie", "83": "Provence-Alpes-Côte d'Azur", "84": "Provence-Alpes-Côte d'Azur",
  "85": "Pays de la Loire", "86": "Nouvelle-Aquitaine", "87": "Nouvelle-Aquitaine",
  "88": "Grand Est", "89": "Bourgogne-Franche-Comté", "90": "Bourgogne-Franche-Comté",
  "91": "Île-de-France", "92": "Île-de-France", "93": "Île-de-France",
  "94": "Île-de-France", "95": "Île-de-France",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Brand rule (CLAUDE.md) : em-dash (U+2014) and en-dash (U+2013) interdits
// dans tout contenu user-facing. DB peut contenir des en-dashes (Google Places
// horaires format "10:00 a 19:00"). On normalise systematiquement.
function sanitizeDashes<T extends string | null | undefined>(s: T): T {
  if (s === null || s === undefined) return s;
  return s.replace(/[—–]/g, "-") as T;
}

function schemaTypeForNaf(naf: string | null | undefined): string {
  if (!naf) return "LocalBusiness";
  const code = naf.replace(/\s/g, "").toUpperCase();
  if (code.startsWith("43.22A") || code.startsWith("43.22B")) return "Plumber";
  if (code.startsWith("43.21A")) return "Electrician";
  if (code.startsWith("43.91")) return "RoofingContractor";
  if (code.startsWith("43.32")) return "GeneralContractor";
  if (code.startsWith("43.29A")) return "HomeAndConstructionBusiness";
  if (code.startsWith("43.34Z")) return "HousePainter";
  if (code.startsWith("43.99")) return "GeneralContractor";
  if (code.startsWith("43.39Z")) return "HomeAndConstructionBusiness";
  if (code.startsWith("43.33Z")) return "HomeAndConstructionBusiness";
  if (code.startsWith("81.30Z")) return "HomeAndConstructionBusiness";
  if (code.startsWith("47.59A")) return "HomeGoodsStore";
  return "HomeAndConstructionBusiness";
}

function tierLabel(tier: string): string {
  if (tier === "or") return "Portrait Lauréat";
  if (tier === "argent") return "Portrait Vérifié";
  return "Portrait Recommandé";
}

function fmtDateFR(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return null;
  }
}

async function fetchPro(slug: string): Promise<ProRow | null> {
  // Embedded select : pro + metier link + zone link in single query.
  const sel = "*,pro_metiers(metier_id,metiers(id,slug,nom,nom_pluriel,code_naf)),pro_zones(zone_id,zones(id,slug,nom,code,type))";
  const url = `${SUPABASE_URL}/rest/v1/pros?slug=eq.${encodeURIComponent(slug)}&active=eq.true&select=${encodeURIComponent(sel)}&limit=1`;
  try {
    const r = await fetch(url, { headers: SB_HEADERS });
    if (!r.ok) return null;
    const rows = (await r.json()) as ProRow[];
    const pro = rows[0];
    if (!pro) return null;
    // Sanitize all user-facing string fields once at fetch boundary so every
    // downstream renderer (HTML body + JSON-LD) inherits the cleaned values.
    pro.nom_entreprise = sanitizeDashes(pro.nom_entreprise);
    pro.adresse = sanitizeDashes(pro.adresse);
    pro.ville = sanitizeDashes(pro.ville);
    pro.description = sanitizeDashes(pro.description);
    pro.opening_hours = sanitizeDashes(pro.opening_hours);
    if (pro.pro_metiers) {
      for (const pm of pro.pro_metiers) {
        if (pm.metiers) {
          pm.metiers.nom = sanitizeDashes(pm.metiers.nom);
          pm.metiers.nom_pluriel = sanitizeDashes(pm.metiers.nom_pluriel);
        }
      }
    }
    if (pro.pro_zones) {
      for (const pz of pro.pro_zones) {
        if (pz.zones) pz.zones.nom = sanitizeDashes(pz.zones.nom);
      }
    }
    return pro;
  } catch {
    return null;
  }
}

interface JsonLdContext {
  pro: ProRow;
  pageUrl: string;
  metier: { slug: string; nom: string; nom_pluriel: string; code_naf: string | null } | null;
  zone: { slug: string; nom: string; code: string | null } | null;
  region: string | undefined;
  anciennete: number | null;
  dateCreationFR: string | null;
  fullDescription: string;
  faqEntries: { q: string; a: string }[];
}

function buildContext(pro: ProRow, pageUrl: string): JsonLdContext {
  const metierLink = pro.pro_metiers?.[0]?.metiers || null;
  const zoneLink = pro.pro_zones?.find((pz) => pz.zones?.type === "departement")?.zones || pro.pro_zones?.[0]?.zones || null;
  const deptCode = zoneLink?.code || (pro.code_postal ? pro.code_postal.slice(0, 2) : "");
  const region = deptCode ? REGION_BY_DEPT_CODE[deptCode] : undefined;
  const anciennete = pro.date_creation_entreprise
    ? new Date().getFullYear() - parseInt(pro.date_creation_entreprise.slice(0, 4), 10)
    : null;
  const dateCreationFR = fmtDateFR(pro.date_creation_entreprise);

  // Verdict editorial inline (mimics src/pages/pro/[slug].astro generateVerdictText)
  const parts: string[] = [];
  if (anciennete !== null && anciennete >= 25) parts.push(`Ancrage local solide (${anciennete} ans au registre)`);
  else if (anciennete !== null && anciennete >= 10) parts.push(`Entreprise artisanale établie (${anciennete} ans)`);
  else if (anciennete !== null && anciennete >= 3) parts.push(`Entreprise confirmée (${anciennete} ans)`);
  else if (anciennete !== null) parts.push("Entreprise récemment immatriculée");
  if (pro.rge && pro.qualibat) parts.push("doublement certifiée RGE et Qualibat");
  else if (pro.rge) parts.push("certifiée RGE");
  else if (pro.qualibat) parts.push("qualifiée Qualibat");
  else parts.push("non certifiée publiquement à ce jour");
  parts.push(pro.siret ? "SIRET actif INSEE confirmé" : "SIRET à confirmer");
  const richDescription = parts.join(", ") + ".";
  const metierNom = metierLink?.nom || "Professionnel";
  const fullDescription = `${richDescription} ${metierNom} à ${pro.ville || "-"} (${deptCode}). Inscrit au registre Sirene de l'INSEE${metierLink?.code_naf ? `, code NAF ${metierLink.code_naf}` : ""}.`;

  // FAQ entries (3 questions clé pour FAQPage schema + accordion HTML)
  const faqEntries: { q: string; a: string }[] = [];
  faqEntries.push({
    q: `${pro.nom_entreprise} est-elle une entreprise active ?`,
    a: pro.siret
      ? `Oui. ${pro.nom_entreprise} dispose d'un numéro SIRET actif (${pro.siret}) au registre Sirene de l'INSEE${pro.date_creation_entreprise ? `, immatriculée depuis ${pro.date_creation_entreprise.slice(0, 4)}` : ""}. L'état administratif est ${pro.etat_administratif === "cessee" ? "cessé selon les dernières données INSEE" : "actif"}.`
      : `Le numéro SIRET de ${pro.nom_entreprise} n'a pas été confirmé à ce jour. Nous recommandons de vérifier directement auprès de l'INSEE avant tout engagement contractuel.`,
  });
  if (metierLink && pro.ville) {
    faqEntries.push({
      q: `${pro.nom_entreprise} est-elle qualifiée comme ${metierLink.nom.toLowerCase()} à ${pro.ville} ?`,
      a: `${pro.nom_entreprise} est référencée comme ${metierLink.nom.toLowerCase()} à ${pro.ville}${deptCode ? ` (${deptCode})` : ""}${metierLink.code_naf ? `, sous le code NAF ${metierLink.code_naf}` : ""}. ${pro.rge ? "L'entreprise est certifiée RGE (Reconnu Garant de l'Environnement). " : ""}${pro.qualibat ? "Elle dispose également d'une qualification Qualibat. " : ""}Notre rédaction ne réalise pas d'audit terrain pour les Portraits Recommandés (gratuits) : la qualification listée provient des sources publiques INSEE, ADEME et Qualibat.`,
    });
  }
  faqEntries.push({
    q: `Comment L'Observatoire vérifie-t-il les informations de ${pro.nom_entreprise} ?`,
    a: `Toutes les données affichées sur cette page proviennent exclusivement de sources publiques : base Sirene de l'INSEE (état civil), annuaire RGE de france-renov.gouv.fr (certifications environnementales), répertoire Qualibat (qualifications BTP) et BODACC (événements légaux). Aucune information n'est saisie par l'entreprise elle-même sans contrôle éditorial. Méthodologie complète sur ${SITE}/methode/.`,
  });

  return {
    pro,
    pageUrl,
    metier: metierLink,
    zone: zoneLink,
    region,
    anciennete,
    dateCreationFR,
    fullDescription,
    faqEntries,
  };
}

function buildJsonLd(ctx: JsonLdContext): unknown[] {
  const { pro, pageUrl, metier, zone, region, faqEntries, fullDescription } = ctx;
  const deptCode = zone?.code || (pro.code_postal ? pro.code_postal.slice(0, 2) : "");
  const lbType = schemaTypeForNaf(metier?.code_naf);

  // BreadcrumbList
  const crumbs: { name: string; url: string }[] = [{ name: "Accueil", url: SITE }];
  if (metier?.slug) crumbs.push({ name: metier.nom_pluriel, url: `${SITE}/${metier.slug}/` });
  if (metier?.slug && zone?.slug) crumbs.push({ name: zone.nom, url: `${SITE}/${metier.slug}/${zone.slug}/` });
  crumbs.push({ name: pro.nom_entreprise, url: pageUrl });
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.name, item: c.url,
    })),
  };

  // LocalBusiness (subtype via NAF)
  const lb: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": lbType,
    "@id": `${pageUrl}#business`,
    name: pro.nom_entreprise,
    url: pageUrl,
    description: fullDescription,
  };
  if (pro.telephone) lb.telephone = pro.telephone;
  if (pro.email) lb.email = pro.email;
  if (pro.site_web) lb.url = pro.site_web;
  if (pro.telephone || pro.email) {
    const cp: Record<string, unknown> = {
      "@type": "ContactPoint", contactType: "customer service",
      areaServed: "FR", availableLanguage: ["French"],
    };
    if (pro.telephone) cp.telephone = pro.telephone;
    if (pro.email) cp.email = pro.email;
    lb.contactPoint = cp;
  }
  if (pro.opening_hours) lb.openingHours = pro.opening_hours;
  if (pro.date_creation_entreprise) lb.foundingDate = pro.date_creation_entreprise;
  if (pro.tranche_effectif) {
    lb.numberOfEmployees = { "@type": "QuantitativeValue", value: pro.tranche_effectif };
  }
  const addr: Record<string, unknown> = { "@type": "PostalAddress", addressCountry: "FR" };
  if (pro.adresse) addr.streetAddress = pro.adresse;
  if (pro.ville) addr.addressLocality = pro.ville;
  if (pro.code_postal) addr.postalCode = pro.code_postal;
  if (region) addr.addressRegion = region;
  lb.address = addr;
  if (pro.lat !== null && pro.lng !== null) {
    lb.geo = { "@type": "GeoCoordinates", latitude: pro.lat, longitude: pro.lng };
  }
  if (pro.site_web) lb.sameAs = [pro.site_web];
  const ids: Record<string, unknown>[] = [];
  if (pro.siret) ids.push({ "@type": "PropertyValue", propertyID: "SIRET", value: pro.siret });
  if (pro.siren) ids.push({ "@type": "PropertyValue", propertyID: "SIREN", value: pro.siren });
  if (ids.length) lb.identifier = ids;

  // Speakable
  const speakableLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["[data-speakable]", "h1"],
    },
  };

  // Person : Camille Fabre, rédactrice en chef (E-E-A-T)
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE}/redaction/camille-fabre/#person`,
    name: "Camille Fabre",
    url: `${SITE}/redaction/camille-fabre/`,
    jobTitle: "Rédactrice en chef",
    knowsAbout: [
      "Réglementation du bâtiment",
      "Certifications RGE et Qualibat",
      "Données publiques Sirene INSEE",
      "Médias éditoriaux indépendants",
    ],
    worksFor: {
      "@type": "NewsMediaOrganization",
      "@id": `${SITE}/#organization`,
      name: "L'Observatoire des Pros",
    },
  };

  const ldArray: unknown[] = [breadcrumbLd, lb, speakableLd, personLd];

  // FAQPage
  if (faqEntries.length) {
    ldArray.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntries.map((e) => ({
        "@type": "Question",
        name: e.q,
        acceptedAnswer: { "@type": "Answer", text: e.a },
      })),
    });
  }

  // Editorial Review (only if score >= 6, mirrors astro page logic)
  if (pro.score_confiance !== null && pro.score_confiance >= 6) {
    ldArray.push({
      "@context": "https://schema.org",
      "@type": "Review",
      itemReviewed: {
        "@type": lbType, name: pro.nom_entreprise, url: pageUrl,
      },
      author: { "@id": `${SITE}/#organization` },
      publisher: { "@id": `${SITE}/#organization` },
      reviewRating: {
        "@type": "Rating",
        ratingValue: pro.score_confiance,
        bestRating: 10,
        worstRating: 0,
      },
      reviewBody: fullDescription,
      datePublished: new Date().toISOString().slice(0, 10),
    });
  }

  return ldArray;
}

function renderHtml(ctx: JsonLdContext): string {
  const { pro, pageUrl, metier, zone, region, anciennete, dateCreationFR, fullDescription, faqEntries } = ctx;
  const deptCode = zone?.code || (pro.code_postal ? pro.code_postal.slice(0, 2) : "");
  const tier = pro.tier || "gratuit";
  const tLabel = tierLabel(tier);

  const title = `${pro.nom_entreprise}, ${metier?.nom || "Professionnel"} ${pro.ville || ""} (${deptCode}) | L'Observatoire des Pros`;
  const description = `${tLabel} de ${pro.nom_entreprise}, ${(metier?.nom || "professionnel").toLowerCase()} à ${pro.ville || "-"}. Score de Confiance ${pro.score_confiance}/10. Sources publiques Sirene INSEE.`.slice(0, 250);

  const breadcrumbsHtml = (() => {
    const crumbs: { name: string; href: string | null }[] = [{ name: "Accueil", href: "/" }];
    if (metier?.slug) crumbs.push({ name: metier.nom_pluriel, href: `/${metier.slug}/` });
    if (metier?.slug && zone?.slug) crumbs.push({ name: zone.nom, href: `/${metier.slug}/${zone.slug}/` });
    crumbs.push({ name: pro.nom_entreprise, href: null });
    return crumbs
      .map((c, i) => {
        const last = i === crumbs.length - 1;
        if (last || !c.href) return `<span aria-current="page">${escapeHtml(c.name)}</span>`;
        return `<a href="${escapeHtml(c.href)}">${escapeHtml(c.name)}</a>`;
      })
      .join(' <span aria-hidden="true">›</span> ');
  })();

  const verifiedBadges: string[] = [];
  if (pro.siret) verifiedBadges.push(`<span class="pill verified">SIRET ${escapeHtml(pro.siret)}</span>`);
  if (metier?.code_naf) verifiedBadges.push(`<span class="pill neutral">NAF ${escapeHtml(metier.code_naf)}</span>`);
  if (pro.rge) verifiedBadges.push(`<span class="pill verified">RGE certifié</span>`);
  if (pro.qualibat) verifiedBadges.push(`<span class="pill or">Qualibat</span>`);
  if (anciennete && anciennete > 0) verifiedBadges.push(`<span class="pill info">${anciennete} ans d'activité</span>`);
  if (pro.code_postal) verifiedBadges.push(`<span class="pill neutral">${escapeHtml(pro.code_postal)}</span>`);

  const fullAddr = [pro.adresse, pro.code_postal, pro.ville].filter(Boolean).join(", ");
  const mapsUrl = pro.lat && pro.lng
    ? `https://www.google.com/maps?q=${pro.lat},${pro.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((pro.nom_entreprise || "") + " " + (fullAddr || ""))}`;

  const faqHtml = faqEntries.length
    ? `<section class="faq" aria-labelledby="faq-h">
        <h2 id="faq-h" class="display">Questions fréquentes</h2>
        <div class="faq-list">
          ${faqEntries
            .map(
              (e) => `<details><summary>${escapeHtml(e.q)}</summary><p>${escapeHtml(e.a)}</p></details>`,
            )
            .join("\n")}
        </div>
       </section>`
    : "";

  const scoreColor = pro.score_confiance >= 8 ? "#B8863D"
    : pro.score_confiance >= 6 ? "#1E3A52"
    : "#7A6E63";
  const scoreDisplay = pro.score_confiance >= 5
    ? `<div class="score-circle" style="border-color:${scoreColor};color:${scoreColor}"><span class="num">${pro.score_confiance.toFixed(1)}</span><span class="of">/10</span></div>`
    : `<div class="score-completion" aria-label="Dossier en cours d'examen"><span class="eyebrow">Dossier en examen</span><p>Le Score de Confiance n'est publié qu'après croisement complet des sources.</p></div>`;

  const verdictText = (() => {
    const score = pro.score_confiance || 0;
    if (score >= 8) return "Dossier solide. Cette entreprise satisfait nos critères principaux d'observation : ancienneté, certification, traces administratives publiques cohérentes.";
    if (score >= 6) return "Dossier recevable. Plusieurs critères sont validés via les sources publiques. La rédaction maintient une attention sur les évolutions du dossier.";
    if (score >= 4) return "Dossier partiel. L'entreprise existe au registre Sirene mais plusieurs critères publics restent à confirmer.";
    return "Dossier en cours. L'entreprise est immatriculée mais les sources publiques disponibles ne suffisent pas à un classement éditorial à ce stade.";
  })();

  const ld = buildJsonLd(ctx);
  const ldScripts = ld
    .map(
      (item) =>
        `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, "\\u003c")}</script>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#1E3A52">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${pageUrl}">
<link rel="alternate" hreflang="fr-FR" href="${pageUrl}">
<link rel="alternate" hreflang="x-default" href="${pageUrl}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="author" content="La rédaction de L'Observatoire">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${SITE}/og-default.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="article">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="L'Observatoire des Pros">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${SITE}/og-default.png">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap-index.xml">
<style>
:root{--paper:#F7F3EC;--paper-warm:#EFE7D6;--ink:#1A1614;--ink-soft:#3D342E;--ink-muted:#7A6E63;--observatoire:#1E3A52;--observatoire-deep:#0F2335;--or:#B8863D;--or-soft:#D4A55C;--cachet:#8B2E2A;--vert:#4A5D3A}
*{box-sizing:border-box}html,body{margin:0}
body{font-family:'Inter',system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:var(--paper);line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2,h3,.display{font-family:'Fraunces','Instrument Serif',Georgia,serif;font-weight:500;line-height:1.15;letter-spacing:-.01em;margin:0}
h1{font-size:clamp(2rem,4.5vw,3.25rem)}
h2.display{font-size:clamp(1.5rem,3vw,2.1rem);margin-top:2.5rem}
h3{font-size:1.15rem}
a{color:var(--observatoire);text-decoration:underline;text-underline-offset:.15em;text-decoration-thickness:1px}
a:hover{color:var(--observatoire-deep)}
header.nav{position:sticky;top:0;background:rgba(247,243,236,.94);backdrop-filter:blur(10px);border-bottom:1px solid rgba(26,22,20,.08);padding:.85rem 0;z-index:10}
header.nav .wrap{max-width:1100px;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
header.nav a.logo{font-family:'Fraunces',serif;font-weight:600;color:var(--ink);text-decoration:none;font-size:1.05rem;font-style:italic}
header.nav nav{display:flex;gap:1.25rem;flex-wrap:wrap}
header.nav nav a{color:var(--ink-muted);text-decoration:none;font-size:.88rem;font-weight:500}
header.nav nav a:hover{color:var(--observatoire)}
main{max-width:920px;margin:0 auto;padding:2.5rem 1.5rem 5rem}
.crumbs{font-size:.85rem;color:var(--ink-muted);margin-bottom:2rem}
.crumbs a{color:var(--ink-muted);text-decoration:none}.crumbs a:hover{color:var(--observatoire);text-decoration:underline}
.eyebrow{display:inline-block;font-size:.7rem;text-transform:uppercase;letter-spacing:.14em;font-weight:600;color:var(--or);margin-bottom:.5rem}
.tier-badge{display:inline-block;font-size:.78rem;letter-spacing:.06em;font-weight:600;padding:.25rem .65rem;border-radius:.4rem;margin-bottom:1rem;background:var(--paper-warm);color:var(--ink-soft)}
.hero{display:grid;grid-template-columns:1fr auto;gap:2rem;align-items:start;margin-top:1rem}
@media(max-width:680px){.hero{grid-template-columns:1fr}}
.subtitle{font-family:'Fraunces',serif;font-style:italic;font-size:1.2rem;color:var(--ink-soft);margin:1rem 0 1.5rem}
.score-circle{width:9rem;height:9rem;border-radius:50%;border:3px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;box-shadow:0 12px 32px -16px rgba(15,35,53,.18)}
.score-circle .num{font-family:'Fraunces',serif;font-size:2.6rem;font-weight:500;line-height:1}
.score-circle .of{font-size:.85rem;color:var(--ink-muted);margin-top:.15rem}
.score-completion{background:#fff;border:1px solid rgba(26,22,20,.08);border-radius:1rem;padding:1.25rem;max-width:18rem}
.score-completion .eyebrow{margin:0 0 .5rem}
.score-completion p{margin:0;color:var(--ink-muted);font-size:.85rem;line-height:1.5}
.pills{display:flex;gap:.5rem;flex-wrap:wrap;margin:1.5rem 0}
.pill{display:inline-flex;align-items:center;gap:.35rem;padding:.35rem .75rem;border-radius:.4rem;font-size:.78rem;font-weight:500;border:1px solid rgba(26,22,20,.1);background:#fff;color:var(--ink-soft)}
.pill.verified{border-color:var(--vert);color:var(--vert);background:rgba(74,93,58,.05)}
.pill.or{border-color:var(--or);color:var(--or);background:rgba(184,134,61,.06)}
.pill.info{border-color:var(--observatoire);color:var(--observatoire);background:rgba(30,58,82,.05)}
.cartouche{margin:2rem 0;padding:1.25rem 1.5rem;background:var(--paper-warm);border-left:3px solid var(--or);border-radius:.4rem 1rem 1rem .4rem;font-size:.92rem;color:var(--ink-soft)}
.cartouche .eyebrow{margin-bottom:.4rem}
.verdict{margin:2rem 0 3rem;padding:1.5rem;background:#fff;border:1px solid rgba(26,22,20,.08);border-radius:1rem;font-size:1.05rem;line-height:1.65}
.verdict p:first-child{margin-top:0}
.verdict p:last-child{margin-bottom:0}
.contact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin:1.5rem 0 3rem}
.contact-card{background:#fff;border:1px solid rgba(26,22,20,.08);border-radius:1rem;padding:1.25rem 1.5rem}
.contact-card .lbl{font-size:.7rem;text-transform:uppercase;letter-spacing:.12em;color:var(--ink-muted);font-weight:600;margin-bottom:.4rem}
.contact-card .val{font-family:'Fraunces',serif;font-size:1.15rem;color:var(--ink);word-break:break-word}
.contact-card a{color:var(--ink);text-decoration:underline;text-decoration-color:var(--or);text-underline-offset:.18em}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.1rem;background:var(--observatoire);border:1px solid var(--observatoire);border-radius:.5rem;color:#fff;text-decoration:none;font-size:.9rem;font-weight:500;transition:background .15s}
.btn:hover{background:var(--observatoire-deep)}
.btn.ghost{background:#fff;color:var(--ink);border-color:rgba(26,22,20,.15)}
.btn.ghost:hover{border-color:var(--ink);background:var(--paper-warm)}
.faq{margin-top:3rem}
.faq-list{display:flex;flex-direction:column;gap:.5rem;margin-top:1.5rem}
.faq details{background:#fff;border:1px solid rgba(26,22,20,.08);border-radius:.75rem;padding:1rem 1.25rem}
.faq summary{cursor:pointer;font-family:'Fraunces',serif;font-weight:500;font-size:1.02rem;list-style:none}
.faq summary::-webkit-details-marker{display:none}
.faq summary::before{content:"+";display:inline-block;margin-right:.6rem;color:var(--or);font-weight:600;transition:transform .2s}
.faq details[open] summary::before{transform:rotate(45deg)}
.faq p{margin:.85rem 0 0;color:var(--ink-soft);font-size:.93rem;line-height:1.65}
.byline{margin-top:4rem;padding:2rem;background:var(--paper-warm);border-radius:1rem;font-size:.9rem;color:var(--ink-soft)}
.byline .row{display:flex;gap:1rem;align-items:flex-start}
.byline .av{width:2.75rem;height:2.75rem;border-radius:.5rem;background:linear-gradient(135deg,var(--observatoire),var(--observatoire-deep));color:#fff;font-family:'Fraunces',serif;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.95rem}
.byline p{margin:0;line-height:1.55}
.byline .small{font-size:.8rem;color:var(--ink-muted);margin-top:.4rem}
.byline a{color:var(--ink-soft)}
footer{margin-top:4rem;padding:2.5rem 1.5rem;border-top:1px solid rgba(26,22,20,.1);font-size:.82rem;color:var(--ink-muted);text-align:center}
footer .links{display:flex;gap:1.25rem;justify-content:center;flex-wrap:wrap;margin-top:.6rem}
footer a{color:var(--ink-muted);text-decoration:none}
footer a:hover{color:var(--observatoire);text-decoration:underline}
address{font-style:normal;font-size:1.05rem;line-height:1.65;color:var(--ink)}
@media print{header.nav,footer{display:none}}
</style>
${ldScripts}
</head>
<body>
<header class="nav">
  <div class="wrap">
    <a class="logo" href="/">L'Observatoire des Pros</a>
    <nav>
      <a href="/selection/">La sélection</a>
      <a href="/metiers/">Métiers</a>
      <a href="/departements/">Départements</a>
      <a href="/methode/">Méthode</a>
      <a href="/observations/">Observations</a>
    </nav>
  </div>
</header>

<main>
  <nav class="crumbs" aria-label="Fil d'Ariane">${breadcrumbsHtml}</nav>

  <span class="eyebrow">Édition N°1 · ${escapeHtml(tLabel)}</span>

  <header class="hero">
    <div>
      <h1 data-speakable>${escapeHtml(pro.nom_entreprise)}</h1>
      <p class="subtitle" data-speakable>${escapeHtml(metier?.nom || "Professionnel")}${pro.ville ? ` à ${escapeHtml(pro.ville)}` : ""}${deptCode ? ` (${escapeHtml(deptCode)})` : ""}${dateCreationFR ? ` · Depuis ${escapeHtml(pro.date_creation_entreprise?.slice(0, 4) || "")}` : ""}</p>
      <div class="cartouche">
        <span class="eyebrow">Notre observation</span>
        <p>Cette fiche a été constituée à partir des sources publiques disponibles. Examen rédactionnel daté du ${escapeHtml(new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }))}.</p>
      </div>
      <div class="pills">
        ${verifiedBadges.join("\n        ")}
      </div>
    </div>
    <aside aria-label="Score de Confiance">
      ${scoreDisplay}
    </aside>
  </header>

  <section class="verdict" data-speakable>
    <span class="eyebrow">Verdict éditorial</span>
    <h2 class="display">${escapeHtml(verdictText.split(".")[0] + ".")}</h2>
    <p>${escapeHtml(fullDescription)}</p>
    ${region ? `<p style="margin-top:.75rem;color:var(--ink-muted);font-size:.9rem">Région ${escapeHtml(region)}.</p>` : ""}
  </section>

  <section>
    <h2 class="display">Coordonnées publiques</h2>
    <div class="contact-grid">
      ${pro.adresse || pro.code_postal || pro.ville
        ? `<div class="contact-card"><span class="lbl">Adresse</span><address class="val">${escapeHtml(fullAddr || "-")}</address>
           ${pro.lat && pro.lng ? `<p style="margin:.75rem 0 0"><a class="btn ghost" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener">Voir sur Google Maps</a></p>` : ""}
           </div>`
        : ""}
      ${pro.telephone
        ? `<div class="contact-card"><span class="lbl">Téléphone</span><p class="val"><a href="tel:${escapeHtml(pro.telephone.replace(/\s/g, ""))}">${escapeHtml(pro.telephone)}</a></p></div>`
        : ""}
      ${pro.site_web
        ? `<div class="contact-card"><span class="lbl">Site web</span><p class="val"><a href="${escapeHtml(pro.site_web)}" rel="noopener" target="_blank">${escapeHtml(pro.site_web.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a></p></div>`
        : ""}
      ${pro.email
        ? `<div class="contact-card"><span class="lbl">Email</span><p class="val"><a href="mailto:${escapeHtml(pro.email)}">${escapeHtml(pro.email)}</a></p></div>`
        : ""}
    </div>
  </section>

  ${faqHtml}

  <section class="byline">
    <div class="row">
      <div class="av">CF</div>
      <div>
        <p>Suivi rédactionnel par <a href="/redaction/camille-fabre/">Camille Fabre</a>, rédactrice en chef. Méthodologie complète sur <a href="/methode/">la page Méthode</a>.</p>
        <p class="small">Toutes les données affichées proviennent exclusivement de sources publiques officielles : INSEE Sirene (état civil), ADEME / france-renov.gouv.fr (RGE), Qualibat (qualifications), BODACC (événements légaux). Aucune information n'est saisie par l'entreprise sans contrôle éditorial.</p>
        ${pro.tier === "gratuit" ? `<p class="small">Cette entreprise n'a pas candidaté à un Portrait Vérifié ou Lauréat. Pour enrichir le dossier ou signaler une erreur, voir <a href="/candidater/">candidater</a> ou <a href="/contact/">contact</a>.</p>` : ""}
      </div>
    </div>
  </section>
</main>

<footer>
  <p>L'Observatoire des Pros · Média éditorial indépendant · Édition N°1, 2026</p>
  <div class="links">
    <a href="/methode/">Méthode</a>
    <a href="/redaction/">Rédaction</a>
    <a href="/a-propos/">À propos</a>
    <a href="/contact/">Contact</a>
    <a href="/mentions-legales/">Mentions légales</a>
    <a href="/politique-confidentialite/">Confidentialité</a>
  </div>
</footer>
</body>
</html>`;
}

function notFoundHtml(): Response {
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>Professionnel introuvable · L'Observatoire des Pros</title><meta name="robots" content="noindex"><style>body{font-family:Inter,system-ui,sans-serif;background:#F7F3EC;color:#1A1614;text-align:center;padding:4rem 1.5rem;line-height:1.6}h1{font-family:Fraunces,serif;font-size:2rem;margin:0 0 1rem}a{color:#1E3A52}</style></head><body><h1>Professionnel introuvable</h1><p>Cette fiche a peut-être été retirée du registre INSEE ou son URL a changé.</p><p><a href="/metiers/">Voir les métiers</a> · <a href="/departements/">Voir les départements</a> · <a href="/">Retour à l'accueil</a></p></body></html>`,
    {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    },
  );
}

export async function onRequest(context: any): Promise<Response> {
  const { params, next } = context;

  // 1. Try static asset first. CF Pages catch-all functions intercept their
  //    path before static lookup, so we MUST explicitly call next() to route
  //    wave1 slugs to their pre-rendered HTML (rich Astro UI). Function only
  //    renders for slugs without static (long-tail).
  try {
    const staticRes = await next();
    if (staticRes.ok) return staticRes;
    if (staticRes.status !== 404) return staticRes;
  } catch {
    // next() can throw if no asset binding ; fall through to dynamic render
  }

  // 2. Dynamic render for long-tail pros
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : String(slugParam || "");
  if (!slug) return notFoundHtml();

  const pro = await fetchPro(slug);
  if (!pro || !pro.active) return notFoundHtml();

  const pageUrl = `${SITE}/pro/${slug}/`;
  const ctx = buildContext(pro, pageUrl);
  const html = renderHtml(ctx);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=86400",
      "x-rendered-by": "edge-fallback",
      // Security headers : Pages Function responses ne sont pas couvertes
      // par _headers (qui ne s'applique qu'aux assets statiques). On les
      // injecte ici pour parité avec les pages SSG.
      "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
      "x-frame-options": "SAMEORIGIN",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      "content-security-policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.openstreetmap.org; connect-src 'self' https://apuyeakgxjgdcfssrtek.supabase.co https://recherche-entreprises.api.gouv.fr https://data.ademe.fr https://api-adresse.data.gouv.fr; font-src 'self' data: https://fonts.gstatic.com https://unpkg.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; manifest-src 'self'; worker-src 'self'; media-src 'self'; upgrade-insecure-requests",
    },
  });
}
