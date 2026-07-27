import { siteConfig } from "../../site.config";
import {
  getAllProLite,
  getAllProMetiers,
  getAllProZones,
  getMetiers,
  getZones,
} from "./supabase";
import {
  aggregateDatasetRows,
  type AggregateDatasetResult,
  type AggregateDatasetRow,
} from "./dataset-aggregate.mjs";

export type { AggregateDatasetRow };

export const DATA_CATALOG_URL = `${siteConfig.url}/donnees/`;
export const DATA_JSON_URL = `${siteConfig.url}/donnees/classements.json`;
export const DATA_CSV_URL = `${siteConfig.url}/donnees/classements.csv`;
export const DATASET_IDENTIFIER = "odp-classements-metiers-departements";

let catalogCache: AggregateDatasetResult | null = null;

export async function getAggregateDatasetCatalog(): Promise<AggregateDatasetResult> {
  if (catalogCache) return catalogCache;
  const [pros, proMetiers, proZones, metiers, zones] = await Promise.all([
    getAllProLite(),
    getAllProMetiers(),
    getAllProZones(),
    getMetiers(),
    getZones(),
  ]);

  catalogCache = aggregateDatasetRows({
    pros,
    proMetiers,
    proZones,
    metiers,
    zones,
    baseUrl: siteConfig.url,
  });
  return catalogCache;
}

export function findAggregateRow(
  catalog: AggregateDatasetResult,
  metierSlug: string,
  departementSlug: string,
): AggregateDatasetRow | null {
  return (
    catalog.rows.find(
      (row) =>
        row.metierSlug === metierSlug &&
        row.departementSlug === departementSlug,
    ) || null
  );
}

export function catalogVersion(dataModified: string | null): string {
  return dataModified || "date-source-indisponible";
}

export function serializeCatalogCsv(rows: AggregateDatasetRow[]): string {
  const headers: (keyof AggregateDatasetRow)[] = [
    "metierSlug",
    "metierNom",
    "metierNomPluriel",
    "codeNaf",
    "departementSlug",
    "departementNom",
    "departementCode",
    "etablissementsActifs",
    "rgeCount",
    "rgePercent",
    "qualibatCount",
    "qualibatPercent",
    "scoreConfianceMedian",
    "trustSyncCount",
    "trustSyncCoveragePercent",
    "recordDataModified",
    "trustDataModified",
    "dataModified",
    "url",
  ];

  const escapeCsv = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ].join("\n") + "\n";
}
