import type { APIRoute } from "astro";
import { jsonLdDataCatalog } from "../../utils/seo";
import {
  DATASET_IDENTIFIER,
  DATA_CATALOG_URL,
  DATA_CSV_URL,
  DATA_JSON_URL,
  catalogVersion,
  getAggregateDatasetCatalog,
} from "../../lib/dataset-catalog";

export const GET: APIRoute = async () => {
  const catalog = await getAggregateDatasetCatalog();
  const dataCatalog = jsonLdDataCatalog({
    url: DATA_CATALOG_URL,
    datasetUrl: DATA_CATALOG_URL,
    jsonUrl: DATA_JSON_URL,
    csvUrl: DATA_CSV_URL,
    identifier: DATASET_IDENTIFIER,
    version: catalogVersion(catalog.dataModified),
    dateModified: catalog.dataModified,
    rowCount: catalog.rows.length,
    establishmentCount: catalog.activeEstablishments,
  });

  return new Response(JSON.stringify(dataCatalog, null, 2), {
    headers: {
      "Content-Type": "application/ld+json; charset=UTF-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
