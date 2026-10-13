import { useState } from 'react';
import { placementRows, shoppingUrl } from '../domain/shopping';
import { groundSummary } from '../domain/gardenSummary';

export function ConstructionDetails({ document, assets, disabled, onNavigate }) {
  const [error, setError] = useState('');
  const rows = placementRows(document, assets);
  const summary = groundSummary(document);
  function shop() {
    try { onNavigate(shoppingUrl(rows)); setError(''); }
    catch (reason) { setError(reason.message); }
  }
  return <details className="construction-details">
    <summary>数量・施工範囲</summary>
    <div>
          <p>{summary.label}</p>
          <p>
            面積：{summary.area?.toFixed(2) ?? "—"} m² / 外周：
            {summary.perimeter?.toFixed(2) ?? "—"} m
          </p>
          {rows.length === 0 && <p>配置したものはありません。</p>}
          {rows.map((row) => (
            <div key={row.assetId} className="plan-quantity-row">
              <span>
                {row.name}
                <small className="plan-footprint">
                  モデル底面の合計 {row.footprint.toFixed(2)} m²（重なりを含む）
                </small>
                {!row.materialCode && "（対応商品なし）"}
              </span>
              <span className="placement-quantity">{row.quantity}点</span>
            </div>
          ))}
          <p className="form-hint">庭に配置されている数量です。素材の追加・複製・削除に応じて更新されます。</p>
          <button onClick={shop} disabled={disabled || rows.length === 0}>
            この数量で商品を探す
          </button>
      {error && <p className="notice-error" role="alert">{error}</p>}
    </div>
  </details>;
}
