import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(siteRoot, "dist");

async function readDist(relativePath) {
  return readFile(path.join(distRoot, relativePath), "utf8");
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory)) {
    const absolutePath = path.join(directory, entry);
    if ((await stat(absolutePath)).isDirectory()) files.push(...(await walk(absolutePath)));
    else files.push(absolutePath);
  }
  return files;
}

const jsonSource = await readDist("donnees/classements.json");
const json = JSON.parse(jsonSource);
assert.equal(json.schemaVersion, "1.0");
assert.ok(Array.isArray(json.rows) && json.rows.length > 0, "distribution JSON vide");
assert.equal(json.aggregateCount, json.rows.length);

const forbiddenIndividualFields = [
  "siret",
  "siren",
  "telephone",
  "email",
  "adresse",
  "nom_entreprise",
];
for (const row of json.rows) {
  for (const field of forbiddenIndividualFields) {
    assert.equal(Object.hasOwn(row, field), false, `champ individuel interdit : ${field}`);
  }
}

const csv = await readDist("donnees/classements.csv");
const csvLines = csv.trimEnd().split(/\r?\n/);
assert.equal(csvLines.length, json.rows.length + 1, "désalignement JSON et CSV");
assert.match(csvLines[0], /etablissementsActifs/);
assert.doesNotMatch(csvLines[0], /siret|telephone|email|adresse/i);

const catalog = JSON.parse(await readDist("donnees/catalogue.json"));
assert.equal(catalog["@type"], "DataCatalog");
assert.equal(catalog.dataset["@type"], "Dataset");
assert.equal(catalog.dataset.distribution.length, 2);

const dataHtml = await readDist("donnees/index.html");
assert.equal(
  (dataHtml.match(/type="application\/ld\+json"/g) || []).length,
  1,
  "la page catalogue doit avoir un seul graphe JSON-LD",
);
assert.match(dataHtml, /"@type":"DataCatalog"/);
assert.match(dataHtml, /rel="canonical" href="https:\/\/lobservatoiredespros\.com\/donnees\/"/);

const allFiles = await walk(distRoot);
const hubCandidates = [];
let hubHtml = "";
let hubPath = "";
for (const file of allFiles.filter((candidate) => candidate.endsWith("index.html"))) {
  const html = await readFile(file, "utf8");
  if (html.includes("cl-citable")) {
    hubCandidates.push(file);
    if (!hubHtml) {
      hubHtml = html;
      hubPath = file;
    }
  }
}
assert.ok(hubHtml, "aucun hub classement généré dans le build de contrôle");
assert.equal((hubHtml.match(/type="application\/ld\+json"/g) || []).length, 1);
assert.match(hubHtml, /"@type":"Dataset"/);
assert.match(hubHtml, /donnees\/classements\.json/);
assert.match(hubHtml, /donnees\/classements\.csv/);
assert.doesNotMatch(hubHtml, /ai-content-declaration|name="ai-sitemap"/);

const graphMatch = hubHtml.match(
  /<script type="application\/ld\+json">([^<]+)<\/script>/,
);
assert.ok(graphMatch, "graphe JSON-LD du hub introuvable");
const hubGraph = JSON.parse(graphMatch[1])["@graph"];
const hubDataset = hubGraph.find((node) => node["@type"] === "Dataset");
const hubItemList = hubGraph.find((node) => node["@type"] === "ItemList");
assert.ok(hubDataset && hubItemList, "Dataset ou ItemList absent du hub");

const canonicalMatch = hubHtml.match(/rel="canonical" href="([^"]+)"/);
assert.ok(canonicalMatch, "canonical du hub absent");
const aggregateRow = json.rows.find((row) => row.url === canonicalMatch[1]);
assert.ok(aggregateRow, `agrégat absent pour ${canonicalMatch[1]}`);
const variableByName = new Map(
  hubDataset.variableMeasured.map((variable) => [variable.name, variable.value]),
);
assert.equal(
  variableByName.get("Établissements actifs dans le corpus"),
  aggregateRow.etablissementsActifs,
);
assert.equal(
  variableByName.get("Part portant l'indicateur RGE"),
  aggregateRow.rgePercent,
);
assert.equal(
  variableByName.get("Part portant l'indicateur Qualibat"),
  aggregateRow.qualibatPercent,
);
assert.equal(
  variableByName.get("Score de Confiance médian (sur 10)"),
  aggregateRow.scoreConfianceMedian,
);
assert.ok(
  aggregateRow.etablissementsActifs >= hubItemList.numberOfItems,
  "le classement visible dépasse le corpus agrégé",
);
assert.match(
  hubHtml,
  new RegExp(`corpus recense ${aggregateRow.etablissementsActifs} établissements`),
  `résumé visible incohérent dans ${hubPath}`,
);

const robots = await readDist("robots.txt");
assert.match(robots, /User-agent: Claude-SearchBot/);
assert.match(robots, /User-agent: OAI-SearchBot/);

console.log(
  JSON.stringify(
    {
      status: "ok",
      aggregateCount: json.rows.length,
      corpusActiveEstablishments: json.corpusActiveEstablishments,
      dataModified: json.dataModified,
      distFileCount: allFiles.length,
      checkedHubCandidates: hubCandidates.length,
      checkedHub: path.relative(distRoot, hubPath),
    },
    null,
    2,
  ),
);
