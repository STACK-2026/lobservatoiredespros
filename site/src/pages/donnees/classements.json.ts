import type { APIRoute } from "astro";
import {
  DATASET_IDENTIFIER,
  DATA_CATALOG_URL,
  catalogVersion,
  getAggregateDatasetCatalog,
} from "../../lib/dataset-catalog";

export const GET: APIRoute = async () => {
  const catalog = await getAggregateDatasetCatalog();
  return new Response(
    JSON.stringify(
      {
        schemaVersion: "1.0",
        identifier: DATASET_IDENTIFIER,
        version: catalogVersion(catalog.dataModified),
        dataModified: catalog.dataModified,
        catalogUrl: DATA_CATALOG_URL,
        methodology:
          "Établissements actifs dédupliqués par couple métier et département. Les pourcentages utilisent le nombre d'établissements actifs comme dénominateur.",
        corpusActiveEstablishments: catalog.activeEstablishments,
        aggregateCount: catalog.rows.length,
        rows: catalog.rows,
      },
      null,
      2,
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
};
