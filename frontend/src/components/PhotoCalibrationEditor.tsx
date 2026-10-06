import { useRef, useState, type RefObject } from 'react';
import { requestJson } from '../api/http';
import { useEditorStore } from '../stores/editorStore';
import { withPhotoBoundary } from '../domain/photoProjection';
import { calibratedBoundaryError, projectWorld } from '../domain/calibratedProjection';
import type { GardenDocument, GardenPhoto, ImagePoint, PhotoCalibration } from '../types/garden';
import { Dialog } from './Dialog';
import { UiIcon } from './UiIcon';

export function PhotoCalibrationEditor({ document, photo, onClose, returnFocus }: {
  document: GardenDocument; photo: GardenPhoto; onClose: () => void; returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const old = photo.calibration;
  const [points, setPoints] = useState<ImagePoint[]>(old?.points ?? []);
  const [width, setWidth] = useState(old?.referenceWidth ?? document.width);
  const [depth, setDepth] = useState(old?.referenceDepth ?? document.depth);
  const [manual, setManual] = useState(old?.focalSource === 'manual');
  const [fov, setFov] = useState(old ? 2 * Math.atan(photo.imageHeight / (2 * old.focalLengthPx)) * 180 / Math.PI : 50);
  const [replaceBoundary, setReplaceBoundary] = useState(false);
  const [result, setResult] = useState<PhotoCalibration | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const order = ['手前左', '手前右', '奥右', '奥左'];
  const candidate = result ? { ...photo, calibration: result } : null;
  const nextPhoto = candidate && replaceBoundary ? withPhotoBoundary(candidate, points) : candidate;
  const boundaryError = nextPhoto ? calibratedBoundaryError(nextPhoto, document.width, document.depth) : null;
  const pixels = (point: ImagePoint) => `${point.x * photo.imageWidth},${point.y * photo.imageHeight}`;

  function invalidate() { setResult(null); setError(''); }
  async function calculate() {
    setBusy(true); setError(''); setResult(null);
    try {
      setResult(await requestJson<PhotoCalibration>('/api/photo-calibration', { method: 'POST', body: JSON.stringify({
        imageWidth: photo.imageWidth, imageHeight: photo.imageHeight, points,
        referenceWidth: width, referenceDepth: depth,
        focalLengthPx: manual ? photo.imageHeight / (2 * Math.tan(fov * Math.PI / 360)) : null,
      }) }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'カメラを推定できませんでした。'); }
    finally { setBusy(false); }
  }

  return <Dialog title="写真のカメラを合わせる" description="地面の基準と実測値から、奥行きと植栽の大きさを合わせます。"
    className="calibration-dialog" busy={busy} onClose={onClose} returnFocus={returnFocus} closeLabel="カメラ設定を閉じる" footer={<>
      <span className="dialog-footer-note">{result ? '水色の線は高さ1m。写真との見え方を確認してください。' : '計算結果を確認してから適用します。'}</span>
      <button type="button" className="button button-secondary" disabled={busy} onClick={onClose}>カメラ設定を取消</button>
      <button type="button" className="button button-primary" disabled={busy || !nextPhoto} onClick={() => {
        if (!nextPhoto) return;
        useEditorStore.getState().setPhoto(nextPhoto); onClose();
      }}><UiIcon name="check" size={16} />カメラを適用</button>
    </>}>
    <section className="calibration-editor" aria-label="写真のカメラ設定">
    <fieldset disabled={busy}>
      <div className="calibration-layout">
      <div className="calibration-image-area">
      <ol className="reference-order" aria-label="基準点を選ぶ順序">{order.map((label, index) => <li key={label} className={index < points.length ? 'is-done' : index === points.length ? 'is-current' : ''}><span>{index < points.length ? <UiIcon name="check" size={13} /> : index + 1}</span>{label}</li>)}</ol>
      <div className="calibration-image-frame">
      <svg ref={svg} className="calibration-stage" viewBox={`0 0 ${photo.imageWidth} ${photo.imageHeight}`} onClick={(event) => {
        if (busy || points.length >= 4) return;
        const matrix = svg.current?.getScreenCTM();
        if (!matrix) return;
        const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        const point = { x: p.x / photo.imageWidth, y: p.y / photo.imageHeight };
        if (point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1) { setPoints([...points, point]); invalidate(); }
      }}>
        <image href={photo.dataUrl} width={photo.imageWidth} height={photo.imageHeight} />
        <polyline points={[...points, ...(points.length === 4 ? [points[0]] : [])].map(pixels).join(' ')} fill="none" stroke="#ffcd66" strokeWidth="3" />
        {points.map((point, i) => <g key={i}>
          <circle cx={point.x * photo.imageWidth} cy={point.y * photo.imageHeight} r={photo.imageWidth / 80} fill="#ffcd66" />
          <text x={point.x * photo.imageWidth} y={point.y * photo.imageHeight + 5} fontSize={photo.imageWidth / 55} textAnchor="middle" fill="#17251b">{i + 1}</text>
        </g>)}
        {candidate && [-0.3, 0, 0.3].map((z) => {
          const base = projectWorld(candidate, { x: 0, y: 0, z: z * depth });
          const tip = projectWorld(candidate, { x: 0, y: 1, z: z * depth });
          return base && tip ? <line key={z} x1={base.x * photo.imageWidth} y1={base.y * photo.imageHeight}
            x2={tip.x * photo.imageWidth} y2={tip.y * photo.imageHeight} stroke="#63edff" strokeWidth="4" /> : null;
        })}
      </svg>
      </div>
      <div className="calibration-image-actions">
        <span role="status">{points.length < 4 ? `次の基準点：${points.length + 1} ${order[points.length]}` : '4点を指定済み'}</span>
        <button type="button" className="text-button" disabled={!points.length} onClick={() => { setPoints(points.slice(0, -1)); invalidate(); }}>基準点を1つ戻す</button>
        <button type="button" className="text-button" onClick={() => { setPoints([]); invalidate(); }}>基準点を選び直す</button>
      </div>
      </div>
      <div className="calibration-settings">
        <section><span className="step-label">01 / 基準点</span><h3>地面の長方形を選ぶ</h3><p>水平な地面の長方形を、写真上で順にクリックしてください。</p>
          <details><summary>基準の選び方</summary><p>庭の輪郭とは別の基準です。長方形の中心が庭の中心、手前側が3D庭の＋Z方向になります。広角の歪み・パノラマ・傾斜地には対応していません。</p></details>
        </section>
        <section><span className="step-label">02 / 実測値</span><h3>長方形のサイズ</h3>
          <div className="calibration-fields">
            <label>基準の幅（m）<input type="number" min="0.1" max="50" step="0.1" value={width} onChange={(e) => { setWidth(Number(e.target.value)); invalidate(); }} /></label>
            <label>基準の奥行き（m）<input type="number" min="0.1" max="50" step="0.1" value={depth} onChange={(e) => { setDepth(Number(e.target.value)); invalidate(); }} /></label>
          </div>
          <label className="check-label"><input type="checkbox" checked={manual} onChange={(e) => { setManual(e.target.checked); invalidate(); }} />画角を手動指定</label>
          {manual && <label className="fov-field">縦の画角（度）<input type="number" min="15" max="110" step="0.1" value={fov} onChange={(e) => { setFov(Number(e.target.value)); invalidate(); }} /></label>}
        </section>
        <section><span className="step-label">03 / 確認</span>
          <button type="button" className="button button-primary calculate-camera" disabled={points.length !== 4 || width < 0.1 || depth < 0.1 || width > 50 || depth > 50 || (manual && (fov < 15 || fov > 110))} onClick={() => void calculate()}>{busy ? '計算中…' : 'カメラを計算'}</button>
          {result && <div className="calibration-result" data-testid="calibration-quality"><UiIcon name="check" size={16} /><span>基準点のずれ <strong>{result.reprojectionErrorPx.toFixed(2)} px</strong><small>縦画角 {(2 * Math.atan(photo.imageHeight / (2 * result.focalLengthPx)) * 180 / Math.PI).toFixed(1)}°</small></span></div>}
          <label className="check-label replace-boundary"><input type="checkbox" checked={replaceBoundary} onChange={(e) => setReplaceBoundary(e.target.checked)} />庭の輪郭も基準長方形に合わせる（現在の輪郭を置換）</label>
          {boundaryError && <p className="notice-error">{boundaryError} カメラを適用してから輪郭を描き直すこともできます。</p>}
          {error && <p role="alert" className="notice-error">{error}</p>}
          {busy && <p role="status">カメラを計算中…</p>}
        </section>
      </div>
      </div>
    </fieldset>
    </section>
  </Dialog>;
}
