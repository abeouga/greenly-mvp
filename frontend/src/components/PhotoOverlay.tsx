import { useRef, useState } from 'react';
import { homography, unitCorners, validCorners, validSurface, withPhotoBoundary } from '../domain/photoProjection';
import { useEditorStore } from '../stores/editorStore';
import type { GardenAsset, GardenDocument, ImagePoint } from '../types/garden';
import { PhotoCanvas } from '../three/PhotoCanvas';

interface PhotoOverlayProps {
  document: GardenDocument;
  assets: GardenAsset[];
  selectedAssetId: string | null;
  disabled: boolean;
  retryRequest: { objectId: string; sequence: number } | null;
  onModelLoaded: (id: string) => void;
  onModelFailed: (id: string) => void;
}

export function PhotoOverlay({ document, assets, selectedAssetId, disabled, retryRequest, onModelLoaded, onModelFailed }: PhotoOverlayProps) {
  const svg = useRef<SVGSVGElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [groundVisible, setGroundVisible] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [objectsVisible, setObjectsVisible] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);
  const draft = useEditorStore((state) => state.photoBoundaryDraft);
  const drawingBoundary = draft !== null;
  const [pointer, setPointer] = useState<ImagePoint | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [error, setError] = useState('');
  const photo = document.photo;
  const valid = photo ? validCorners(photo.corners) : false;
  const boundaryValid = photo ? validSurface(photo) : false;
  const surfaceVisible = boundaryValid && !drawingBoundary;
  const project = valid ? homography(unitCorners, photo!.corners) : null;

  function imagePoint(clientX: number, clientY: number): ImagePoint | null {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix || !photo) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return { x: point.x / photo.imageWidth, y: point.y / photo.imageHeight };
  }

  function updatePoint(index: number, point: ImagePoint) {
    if (!photo || disabled) return;
    const next = { x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) };
    const boundary = [...(draft ?? photo.boundary)]; boundary[index] = next;
    if (drawingBoundary) useEditorStore.getState().setPhotoBoundaryDraft(boundary);
    else useEditorStore.getState().setPhoto(withPhotoBoundary(photo, boundary));
  }

  function finishBoundary() {
    if (disabled) return;
    if (!useEditorStore.getState().confirmPhotoBoundary()) {
      setError('輪郭は3〜64点必要です。線の交差、面積不足、重複や近すぎる頂点を修正してください。');
      return;
    }
    setPointer(null);
    setError('');
  }

  function nearStart(point: ImagePoint) {
    const first = draft?.[0];
    if (!first || !photo) return false;
    const dx = (point.x - first.x) * photo.imageWidth, dy = (point.y - first.y) * photo.imageHeight;
    return Math.hypot(dx, dy) <= Math.max(14, photo.imageWidth / 80);
  }

  async function readPhoto(file: File | undefined) {
    if (!file || disabled) return;
    setError('');
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5_000_000) {
      setError('JPEGまたはPNGを5MB以内で選択してください。'); return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const image = new Image();
    image.src = dataUrl;
    try { await image.decode(); } catch { setError('画像を読み込めません。'); return; }
    if (image.naturalWidth > 6000 || image.naturalHeight > 6000 || image.naturalWidth * image.naturalHeight > 25_000_000) { setError('画像は各辺6000px、総画素数2500万以下にしてください。'); return; }
    useEditorStore.getState().setPhoto({ dataUrl, imageWidth: image.naturalWidth, imageHeight: image.naturalHeight, corners: [], boundary: [] });
    useEditorStore.getState().setPhotoBoundaryDraft([]);
    setPointer(null);
    setError('');
  }

  function hasFiles(event: React.DragEvent<HTMLDivElement>) {
    return Array.from(event.dataTransfer.types).includes('Files');
  }

  function handleFileDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setIsFileDragging(true);
  }

  function handleFileDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleFileDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsFileDragging(false);
  }

  function handleFileDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setIsFileDragging(false);
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files);
    const file = files.find((candidate) => ['image/jpeg', 'image/png'].includes(candidate.type)) ?? files[0];
    void readPhoto(file);
  }

  function onImageClick(event: React.MouseEvent<SVGSVGElement>) {
    if (!photo || disabled || dragging !== null || !drawingBoundary) return;
    const p = imagePoint(event.clientX, event.clientY);
    if (!p || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) return;
    if (drawingBoundary) {
      if (draft.length >= 64) { setError('輪郭は最大64点です。始点につないで確定するか、最後の点を戻してください。'); return; }
      useEditorStore.getState().setPhotoBoundaryDraft([...draft, p]);
      setError('');
    }
  }

  const pixels = (p: ImagePoint) => ({ x: p.x * photo!.imageWidth, y: p.y * photo!.imageHeight });
  const projected = (p: ImagePoint) => pixels(project!(p));
  const boundaryPoints = draft ?? photo?.boundary ?? [];
  const boundary = boundaryPoints.map((p) => pixels(p)).map((p) => `${p.x},${p.y}`).join(' ');
  const activePoints = drawingBoundary ? boundaryPoints : [];
  const previewStart = activePoints.length ? pixels(activePoints[activePoints.length - 1]) : null;
  const closing = drawingBoundary && draft.length >= 3 && pointer !== null && nearStart(pointer);
  const previewEnd = pointer ? pixels(closing ? draft![0] : pointer) : null;
  const grid: { a: ImagePoint; b: ImagePoint }[] = [];
  if (valid && project) {
    for (let x = 0; x <= document.width; x += 1) grid.push({ a: projected({ x: x / document.width, y: 0 }), b: projected({ x: x / document.width, y: 1 }) });
    for (let z = 0; z <= document.depth; z += 1) grid.push({ a: projected({ x: 0, y: z / document.depth }), b: projected({ x: 1, y: z / document.depth }) });
  }
  return <div className={`photo-workspace${isFileDragging ? ' is-dragging-file' : ''}`}
    onDragEnter={handleFileDragEnter} onDragOver={handleFileDragOver} onDragLeave={handleFileDragLeave} onDrop={handleFileDrop}>
    <input ref={fileInput} type="file" accept="image/jpeg,image/png" disabled={disabled} aria-label="庭の写真を選択"
      onChange={(event) => { void readPhoto(event.target.files?.[0]); event.target.value = ''; }} hidden />
    <div className="photo-controls">
      {photo && <button type="button" className="button button-secondary" disabled={disabled} onClick={() => { useEditorStore.getState().setPhoto(null); setPointer(null); setError(''); }}>写真を外す</button>}
      {photo && !drawingBoundary && <button type="button" className="button button-secondary" disabled={disabled} onClick={() => { useEditorStore.getState().setPhotoBoundaryDraft([]); setPointer(null); setError(''); }}>{boundaryValid ? '庭の領域を書き直す' : '庭の領域を描く'}</button>}
      {drawingBoundary && draft.length > 0 && <button type="button" className="button button-secondary" disabled={disabled} onClick={() => { useEditorStore.getState().setPhotoBoundaryDraft(draft.slice(0, -1)); setError(''); }}>最後の点を戻す</button>}
      {drawingBoundary && <button type="button" className="button button-secondary" disabled={disabled} onClick={() => { useEditorStore.getState().setPhotoBoundaryDraft(null); setPointer(null); setError(''); }}>輪郭の描画を取消</button>}
      <label><input type="checkbox" checked={groundVisible} onChange={(event) => setGroundVisible(event.target.checked)} /> 地面</label>
      <label><input type="checkbox" checked={gridVisible} onChange={(event) => setGridVisible(event.target.checked)} /> グリッド</label>
      <label><input type="checkbox" checked={objectsVisible} onChange={(event) => setObjectsVisible(event.target.checked)} /> 配置</label>
    </div>
    {error && <p role="alert" className="notice-error">{error}</p>}
    {!photo ? <button type="button" className="photo-empty" disabled={disabled} onClick={() => fileInput.current?.click()}>
      <span>庭の写真を選択してください。</span>
      <span className="photo-empty-hint">クリックして選択、またはここにドラッグ＆ドロップ</span>
    </button> : <>
      <p className="photo-hint" aria-live="polite">{drawingBoundary ? `庭の輪郭を描画中（${draft.length}/64点）。頂点を順にクリックし、3点以上で始点1につなぐと確定します。4点目でも描画は続きます。` : !boundaryValid ? '「庭の領域を描く」で庭の輪郭を指定してください。交差・面積不足・重複する頂点は確定できません。' : 'カタログで木などを選び、庭の領域内をクリックして配置します。木をクリックすると選択できます。輪郭の点はドラッグで調整できます。'}</p>
      <svg ref={svg} className="photo-stage" viewBox={`0 0 ${photo.imageWidth} ${photo.imageHeight}`} onClick={onImageClick}
        onPointerMove={(event) => { if (disabled) return; const p = imagePoint(event.clientX, event.clientY); if (!p) return; if (dragging !== null) updatePoint(dragging, p); else setPointer(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 ? p : null); }}
        onPointerLeave={() => setPointer(null)}
        onPointerUp={() => setDragging(null)} onPointerCancel={() => { setDragging(null); setPointer(null); }}>
        <image href={photo.dataUrl} width={photo.imageWidth} height={photo.imageHeight} />
        {surfaceVisible && <defs><clipPath id="garden-photo-boundary"><polygon points={boundary} /></clipPath></defs>}
        {surfaceVisible && groundVisible && <polygon data-testid="photo-ground" points={boundary} fill="#74b780" fillOpacity="0.16" stroke="#d9ee87" strokeWidth={Math.max(2, photo.imageWidth / 500)} />}
        {valid && surfaceVisible && gridVisible && <g clipPath="url(#garden-photo-boundary)">{grid.map(({ a, b }, i) => <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e9f7be" strokeOpacity="0.85" strokeWidth={Math.max(1, photo.imageWidth / 1100)} />)}</g>}
        {surfaceVisible && <foreignObject width={photo.imageWidth} height={photo.imageHeight}>
          <PhotoCanvas document={document} assets={assets} selectedAssetId={selectedAssetId} disabled={disabled}
            objectsVisible={objectsVisible} retryRequest={retryRequest} onModelLoaded={onModelLoaded} onModelFailed={onModelFailed} />
        </foreignObject>}
        {boundaryPoints.length > 1 && <polyline points={boundary} fill="none" stroke="#ffbd68" strokeWidth={Math.max(2, photo.imageWidth / 500)} pointerEvents="none" />}
        {previewStart && previewEnd && dragging === null && !disabled && <line data-testid="photo-preview-edge" x1={previewStart.x} y1={previewStart.y} x2={previewEnd.x} y2={previewEnd.y} stroke={closing ? '#d9ee87' : '#ffbd68'} strokeWidth={Math.max(2, photo.imageWidth / 500)} strokeDasharray="7 5" pointerEvents="none" />}
        {boundaryPoints.map((point, index) => { const p = pixels(point); const start = drawingBoundary && index === 0; return <g key={`b${index}`}>
          {start && draft.length >= 3 && <circle cx={p.x} cy={p.y} r={Math.max(14, photo.imageWidth / 80)} fill="transparent" stroke={closing ? '#d9ee87' : '#ffbd68'} strokeWidth="2"
            onClick={(event) => { event.stopPropagation(); finishBoundary(); }} onPointerDown={(event) => event.stopPropagation()} />}
          <circle data-testid={`photo-vertex-${index + 1}`} cx={p.x} cy={p.y} r={Math.max(10, photo.imageWidth / 110)} fill="#ffbd68" stroke="#593818" strokeWidth="3"
            role={start ? 'button' : undefined} tabIndex={start ? 0 : undefined} aria-label={start ? '始点につないで輪郭を確定' : undefined}
            onKeyDown={(event) => { if (start && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); finishBoundary(); } }}
            onClick={(event) => { event.stopPropagation(); if (start) finishBoundary(); }}
            onPointerDown={(event) => { event.stopPropagation(); if (disabled || start) return; setPointer(null); setDragging(index); event.currentTarget.setPointerCapture(event.pointerId); }} />
          {drawingBoundary && <text data-testid="photo-vertex-number" x={p.x} y={p.y + 4} textAnchor="middle" fontSize={Math.max(11, photo.imageWidth / 95)} fill="#593818" pointerEvents="none">{index + 1}</text>}
        </g>; })}
      </svg>
    </>}
  </div>;
}
