export const ecUrl =
  import.meta.env.VITE_KUSAKARI_EC_URL || "http://127.0.0.1:5186/";
export const materialCodes = {
  tree_oak: "plant.oak",
  shrub_boxwood: "plant.boxwood",
  brick_paver: "garden.brick",
  bench_wood: "garden.bench",
};

export function placementRows(document, assets) {
  const rows = [];
  for (const object of document.objects) {
    let row = rows.find((entry) => entry.assetId === object.assetId);
    if (!row) {
      const asset = assets.find((entry) => entry.id === object.assetId);
      row = {
        assetId: object.assetId,
        name: asset?.name || object.assetId,
        materialCode: Object.hasOwn(materialCodes, object.assetId)
          ? materialCodes[object.assetId]
          : "",
        footprint: 0,
        quantity: 0,
        unit: "piece",
      };
      rows.push(row);
    }
    row.quantity += 1;
    const dimensions = assets.find(
      (entry) => entry.id === object.assetId,
    )?.baseDimensions;
    if (dimensions)
      row.footprint +=
        dimensions.width * dimensions.depth * object.scale.x * object.scale.z;
  }
  return rows;
}

export function shoppingUrl(rows) {
  if (rows.length === 0) throw new Error("庭に素材を配置してください。");
  const items = [];
  for (const row of rows) {
    if (!row.materialCode)
      throw new Error(`${row.name}には対応商品がありません。`);
    if (row.quantity > 99)
      throw new Error("一度に購入候補へ渡せる数量は、素材ごとに99点までです。");
    items.push({
      materialCode: row.materialCode,
      quantity: row.quantity,
      unit: "piece",
    });
  }
  const url = new URL("/materials", ecUrl);
  url.hash = new URLSearchParams({
    "canvas-items": JSON.stringify(items),
  }).toString();
  return url.href;
}
