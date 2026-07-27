function round1(value) {
  return Math.round(value * 10) / 10;
}

function isoDate(value) {
  if (typeof value !== "string" || value.length < 10) return null;
  return value.slice(0, 10);
}

function maxDate(values) {
  const dates = values.map(isoDate).filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  return round1(value);
}

function addRelation(index, proId, targetId) {
  const targets = index.get(proId) || new Set();
  targets.add(targetId);
  index.set(proId, targets);
}

/**
 * Construit les agrégats complets métier et département.
 * La fonction est pure afin de pouvoir tester la déduplication sans accès DB.
 */
export function aggregateDatasetRows({
  pros,
  proMetiers,
  proZones,
  metiers,
  zones,
  baseUrl,
}) {
  const activePros = new Map(
    pros.filter((pro) => pro.active).map((pro) => [pro.id, pro]),
  );
  const metierById = new Map(metiers.map((metier) => [metier.id, metier]));
  const deptById = new Map(
    zones
      .filter((zone) => zone.type === "departement")
      .map((zone) => [zone.id, zone]),
  );
  const metiersByPro = new Map();
  const deptsByPro = new Map();

  for (const relation of proMetiers) {
    if (activePros.has(relation.pro_id) && metierById.has(relation.metier_id)) {
      addRelation(metiersByPro, relation.pro_id, relation.metier_id);
    }
  }
  for (const relation of proZones) {
    if (activePros.has(relation.pro_id) && deptById.has(relation.zone_id)) {
      addRelation(deptsByPro, relation.pro_id, relation.zone_id);
    }
  }

  const groups = new Map();
  for (const [proId] of activePros) {
    const metierIds = metiersByPro.get(proId) || [];
    const deptIds = deptsByPro.get(proId) || [];
    for (const metierId of metierIds) {
      for (const deptId of deptIds) {
        const key = `${metierId}:${deptId}`;
        const proIds = groups.get(key) || new Set();
        proIds.add(proId);
        groups.set(key, proIds);
      }
    }
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const rows = [];
  for (const [key, proIds] of groups) {
    const [metierId, departementId] = key.split(":");
    const metier = metierById.get(metierId);
    const departement = deptById.get(departementId);
    if (!metier || !departement || !departement.code) continue;

    const groupPros = [...proIds].map((id) => activePros.get(id)).filter(Boolean);
    const total = groupPros.length;
    if (!total) continue;

    const rgeCount = groupPros.filter((pro) => pro.rge).length;
    const qualibatCount = groupPros.filter((pro) => pro.qualibat).length;
    const trustSyncCount = groupPros.filter((pro) => pro.last_trust_sync).length;
    const scores = groupPros
      .map((pro) => Number(pro.score_confiance))
      .filter((score) => Number.isFinite(score) && score >= 0);
    const recordDataModified = maxDate(groupPros.map((pro) => pro.updated_at));
    const trustDataModified = maxDate(groupPros.map((pro) => pro.last_trust_sync));

    rows.push({
      metierId: metier.id,
      metierSlug: metier.slug,
      metierNom: metier.nom,
      metierNomPluriel: metier.nom_pluriel,
      codeNaf: metier.code_naf || null,
      departementId: departement.id,
      departementSlug: departement.slug,
      departementNom: departement.nom,
      departementCode: departement.code,
      etablissementsActifs: total,
      rgeCount,
      rgePercent: round1((rgeCount / total) * 100),
      qualibatCount,
      qualibatPercent: round1((qualibatCount / total) * 100),
      scoreConfianceMedian: median(scores),
      trustSyncCount,
      trustSyncCoveragePercent: round1((trustSyncCount / total) * 100),
      recordDataModified,
      trustDataModified,
      dataModified: maxDate([recordDataModified, trustDataModified]),
      url: `${normalizedBaseUrl}/${metier.slug}/${departement.slug}/`,
    });
  }

  rows.sort(
    (a, b) =>
      a.departementCode.localeCompare(b.departementCode, "fr", { numeric: true }) ||
      a.metierSlug.localeCompare(b.metierSlug, "fr"),
  );

  return {
    rows,
    activeEstablishments: activePros.size,
    dataModified: maxDate(
      [...activePros.values()].flatMap((pro) => [
        pro.updated_at,
        pro.last_trust_sync,
      ]),
    ),
  };
}
