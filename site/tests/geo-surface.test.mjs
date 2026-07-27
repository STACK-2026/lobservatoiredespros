import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(siteRoot, relativePath), "utf8");
}

function parseRobotsGroups(source) {
  const groups = [];
  let agents = [];
  let rules = [];

  function flush() {
    if (agents.length) groups.push({ agents, rules });
    agents = [];
    rules = [];
  }

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      flush();
      continue;
    }
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;
    const field = match[1].trim().toLowerCase();
    const value = match[2].trim();
    if (field === "user-agent") {
      if (rules.length) flush();
      agents.push(value.toLowerCase());
    } else if (agents.length) {
      rules.push({ field, value });
    }
  }
  flush();
  return groups;
}

test("robots.txt autorise les agents de recherche sans exposer admin et API", async () => {
  const groups = parseRobotsGroups(await read("public/robots.txt"));
  const required = [
    "oai-searchbot",
    "chatgpt-user",
    "claude-searchbot",
    "claude-user",
    "perplexitybot",
    "perplexity-user",
  ];

  for (const agent of required) {
    const group = groups.find((candidate) => candidate.agents.includes(agent));
    assert.ok(group, `groupe robots manquant pour ${agent}`);
    assert.ok(
      group.rules.some((rule) => rule.field === "allow" && rule.value === "/"),
      `${agent} doit pouvoir lire le contenu public`,
    );
    for (const sensitivePath of ["/admin/", "/api/"]) {
      assert.ok(
        group.rules.some(
          (rule) => rule.field === "disallow" && rule.value === sensitivePath,
        ),
        `${agent} ne doit pas contourner l'exclusion ${sensitivePath}`,
      );
    }
  }
});

test("llms.txt oriente vers les ressources de données sans fausse cadence", async () => {
  const llms = await read("public/llms.txt");
  for (const expectedPath of [
    "/donnees/",
    "/donnees/classements.json",
    "/donnees/classements.csv",
    "/donnees/catalogue.json",
    "/llms-full.txt",
  ]) {
    assert.match(llms, new RegExp(expectedPath.replaceAll(".", "\\.")));
  }
  assert.doesNotMatch(llms, /Éditions mensuelles|Chaque mois, une édition numérotée/i);
});

test("les routes du catalogue de données existent", () => {
  for (const relativePath of [
    "src/pages/donnees/index.astro",
    "src/pages/donnees/classements.json.ts",
    "src/pages/donnees/classements.csv.ts",
    "src/pages/donnees/catalogue.json.ts",
    "public/llms-full.txt",
  ]) {
    assert.ok(existsSync(path.join(siteRoot, relativePath)), `${relativePath} absent`);
  }
});

test("BaseLayout émet un seul graphe JSON-LD sans déclaration IA trompeuse", async () => {
  const layout = await read("src/layouts/BaseLayout.astro");
  assert.doesNotMatch(layout, /ai-content-declaration|name="ai-sitemap"/);
  assert.match(layout, /"@graph"/);
  const jsonLdScripts = layout.match(/<script\s+type="application\/ld\+json"/g) || [];
  assert.equal(jsonLdScripts.length, 1);
});

test("aucun SpeakableSpecification n'est présenté comme signal GEO générique", async () => {
  for (const relativePath of [
    "src/utils/seo.ts",
    "src/layouts/BaseLayout.astro",
    "src/pages/methode/index.astro",
    "src/pages/pro/[slug].astro",
    "src/pages/outils/verifier-rge/index.astro",
    "src/pages/outils/verifier-siret/index.astro",
    "src/pages/observations/etat-du-marche/[dept].astro",
    "src/pages/index.astro",
    "src/pages/observations/[slug].astro",
    "src/pages/guide/comment-choisir-un-[metier].astro",
    "functions/pro/[[slug]].ts",
  ]) {
    assert.doesNotMatch(await read(relativePath), /SpeakableSpecification|jsonLdSpeakable/);
  }
});

test("la signature éditoriale publique ne repose sur aucune persona non corroborée", async () => {
  const publicEditorialFiles = [
    "site.config.ts",
    "src/data/redaction.ts",
    "src/data/observations.ts",
    "src/pages/index.astro",
    "src/pages/a-propos/index.astro",
    "src/pages/methode/index.astro",
    "src/pages/observations/index.astro",
    "src/pages/observations/[slug].astro",
    "src/pages/candidater/merci/index.astro",
    "src/pages/redaction/index.astro",
    "src/pages/og/observations/[slug].png.ts",
    "functions/pro/[[slug]].ts",
  ];
  const unverifiedPersonas = /Camille Fabre|Antoine Delaunay|Sarah Poitevin/;

  for (const relativePath of publicEditorialFiles) {
    assert.doesNotMatch(
      await read(relativePath),
      unverifiedPersonas,
      `${relativePath} expose encore une persona non corroborée`,
    );
  }

  const observationsSource = await read("src/data/observations.ts");
  assert.doesNotMatch(
    observationsSource,
    /authorSlug:\s*"(?:camille-fabre|antoine-delaunay|sarah-poitevin)"/,
  );
  assert.match(observationsSource, /authorSlug:\s*"redaction"/);

  const articlePage = await read("src/pages/observations/[slug].astro");
  assert.match(articlePage, /author:\s*\{\s*"@id":\s*ORG_ID\s*\}/);
  assert.doesNotMatch(articlePage, /"@type":\s*"Person"/);
  const seoHelpers = await read("src/utils/seo.ts");
  const articleHelper = seoHelpers.slice(
    seoHelpers.indexOf("export function jsonLdArticle"),
    seoHelpers.indexOf("export function jsonLdBreadcrumbs"),
  );
  assert.doesNotMatch(
    articleHelper,
    /author:\s*\{\s*"@type":\s*"Person"/,
  );
  assert.match(articleHelper, /author:\s*\{\s*"@id":\s*ORG_ID\s*\}/);
  assert.ok(
    !existsSync(path.join(siteRoot, "src/pages/redaction/[slug].astro")),
    "les profils Person individuels ne doivent plus être générés",
  );
});

test("les anciennes URL auteurs conservent leur équité via des 301", async () => {
  const redirects = await read("public/_redirects");
  for (const slug of [
    "camille-fabre",
    "antoine-delaunay",
    "sarah-poitevin",
  ]) {
    assert.match(
      redirects,
      new RegExp(`^/redaction/${slug}/?\\s+/redaction/\\s+301!?$`, "m"),
      `redirection 301 manquante pour ${slug}`,
    );
  }
});

test("les fiches pros utilisent uniquement des dates de source réelles", async () => {
  const profile = await read("src/pages/pro/[slug].astro");
  const edgeProfile = await read("functions/pro/[[slug]].ts");

  for (const field of [
    "created_at",
    "updated_at",
    "enriched_at",
    "last_trust_sync",
  ]) {
    assert.match(
      profile,
      new RegExp(`select\\([^)]*${field}`),
      `${field} doit être chargé pour dater le dossier`,
    );
  }

  assert.match(profile, /latestSourceDate/);
  assert.match(edgeProfile, /latestSourceDate/);
  assert.doesNotMatch(
    profile,
    /Dernier contrôle Sirene\s*:\s*\{new Date\(/,
  );
  assert.doesNotMatch(profile, /Prochain audit programmé/);
  assert.doesNotMatch(edgeProfile, /datePublished:\s*new Date\(/);
  assert.doesNotMatch(
    edgeProfile,
    /Examen rédactionnel daté du \$\{escapeHtml\(new Date\(/,
  );

  const { latestSourceDate } = await import("../src/lib/source-freshness.mjs");
  assert.equal(
    latestSourceDate({
      created_at: "2026-04-28T08:00:00Z",
      updated_at: "2026-07-19T09:00:00Z",
      enriched_at: "2026-05-02T09:00:00Z",
      last_trust_sync: "2026-07-20T10:00:00Z",
    }),
    "2026-07-20",
  );
  assert.equal(
    latestSourceDate({
      created_at: "2026-04-28T08:00:00Z",
      updated_at: null,
      enriched_at: null,
      last_trust_sync: null,
    }),
    "2026-04-28",
  );
  assert.equal(latestSourceDate({}), null);
});

test("les signaux globaux et sitemaps n'inventent ni activité ni fraîcheur", async () => {
  const ticker = await read("src/components/EditorialTicker.astro");
  const qualifications = await read("src/components/QualificationsBlock.astro");
  const sitemap = await read("src/pages/sitemap.xml.ts");
  const extensionSource = await read("src/lib/pros-all.ts");
  const extensionSitemap = await read(
    "src/pages/sitemap-pros-ext-[shard].xml.ts",
  );

  for (const inventedSignal of [
    /En direct/,
    /Score recalculé/,
    /Dossier ouvert/,
    /minutesAgo/,
    /const now = new Date\(\)/,
  ]) {
    assert.doesNotMatch(ticker, inventedSignal);
  }
  assert.match(ticker, /Registre public/);
  assert.match(ticker, /Établissement observé/);

  assert.doesNotMatch(
    qualifications,
    /:\s*today\.toLocaleDateString\("fr-FR"/,
  );
  assert.match(qualifications, /\{lastChecked && \(/);

  assert.match(sitemap, /\.order\("id"\)/);
  assert.doesNotMatch(sitemap, /lastmod:\s*now/);
  assert.doesNotMatch(sitemap, /u\.lastmod\s*\|\|\s*now/);
  assert.match(extensionSource, /latestSourceDate/);
  assert.doesNotMatch(
    extensionSource,
    /return new Date\(\)\.toISOString\(\)/,
  );
  assert.match(extensionSitemap, /r\.lastmod\s*\?/);
});

test("l'agrégateur déduplique et exclut les établissements inactifs", async () => {
  const { aggregateDatasetRows } = await import("../src/lib/dataset-aggregate.mjs");
  const result = aggregateDatasetRows({
    pros: [
      {
        id: "p1",
        active: true,
        rge: true,
        qualibat: false,
        score_confiance: 8,
        last_trust_sync: "2026-07-20T10:00:00Z",
        updated_at: "2026-07-21T10:00:00Z",
      },
      {
        id: "p2",
        active: true,
        rge: false,
        qualibat: true,
        score_confiance: 6,
        last_trust_sync: null,
        updated_at: "2026-07-22T10:00:00Z",
      },
      {
        id: "p3",
        active: false,
        rge: true,
        qualibat: true,
        score_confiance: 10,
        last_trust_sync: "2026-07-23T10:00:00Z",
        updated_at: "2026-07-23T10:00:00Z",
      },
    ],
    proMetiers: [
      { pro_id: "p1", metier_id: "m1" },
      { pro_id: "p1", metier_id: "m1" },
      { pro_id: "p2", metier_id: "m1" },
      { pro_id: "p3", metier_id: "m1" },
    ],
    proZones: [
      { pro_id: "p1", zone_id: "z1" },
      { pro_id: "p1", zone_id: "z1" },
      { pro_id: "p2", zone_id: "z1" },
      { pro_id: "p3", zone_id: "z1" },
    ],
    metiers: [
      {
        id: "m1",
        slug: "plombier",
        nom: "Plombier",
        nom_pluriel: "Plombiers",
        code_naf: "43.22A",
      },
    ],
    zones: [
      {
        id: "z1",
        type: "departement",
        slug: "yonne-89",
        nom: "Yonne",
        code: "89",
      },
    ],
    baseUrl: "https://lobservatoiredespros.com",
  });

  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0], {
    metierId: "m1",
    metierSlug: "plombier",
    metierNom: "Plombier",
    metierNomPluriel: "Plombiers",
    codeNaf: "43.22A",
    departementId: "z1",
    departementSlug: "yonne-89",
    departementNom: "Yonne",
    departementCode: "89",
    etablissementsActifs: 2,
    rgeCount: 1,
    rgePercent: 50,
    qualibatCount: 1,
    qualibatPercent: 50,
    scoreConfianceMedian: 7,
    trustSyncCount: 1,
    trustSyncCoveragePercent: 50,
    recordDataModified: "2026-07-22",
    trustDataModified: "2026-07-20",
    dataModified: "2026-07-22",
    url: "https://lobservatoiredespros.com/plombier/yonne-89/",
  });
  assert.equal(result.activeEstablishments, 2);
  assert.equal(result.dataModified, "2026-07-22");
});
