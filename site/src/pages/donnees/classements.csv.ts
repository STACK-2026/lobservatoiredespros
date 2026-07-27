import type { APIRoute } from "astro";
import {
  getAggregateDatasetCatalog,
  serializeCatalogCsv,
} from "../../lib/dataset-catalog";

export const GET: APIRoute = async () => {
  const catalog = await getAggregateDatasetCatalog();
  return new Response(serializeCatalogCsv(catalog.rows), {
    headers: {
      "Content-Type": "text/csv; charset=UTF-8",
      "Content-Disposition": 'inline; filename="odp-classements-metiers-departements.csv"',
      "Cache-Control": "public, max-age=3600",
    },
  });
};
