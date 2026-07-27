import type { MetierRow, ProLite, ZoneRow } from "./supabase";

export interface AggregateDatasetRow {
  metierId: string;
  metierSlug: string;
  metierNom: string;
  metierNomPluriel: string;
  codeNaf: string | null;
  departementId: string;
  departementSlug: string;
  departementNom: string;
  departementCode: string;
  etablissementsActifs: number;
  rgeCount: number;
  rgePercent: number;
  qualibatCount: number;
  qualibatPercent: number;
  scoreConfianceMedian: number;
  trustSyncCount: number;
  trustSyncCoveragePercent: number;
  recordDataModified: string | null;
  trustDataModified: string | null;
  dataModified: string | null;
  url: string;
}

export interface AggregateDatasetResult {
  rows: AggregateDatasetRow[];
  activeEstablishments: number;
  dataModified: string | null;
}

export function aggregateDatasetRows(input: {
  pros: ProLite[];
  proMetiers: { pro_id: string; metier_id: string }[];
  proZones: { pro_id: string; zone_id: string }[];
  metiers: MetierRow[];
  zones: ZoneRow[];
  baseUrl: string;
}): AggregateDatasetResult;
