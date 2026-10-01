import { useRef, useState } from 'react';
import { homography, pointInPolygon, unitCorners, validCorners, validSurface } from '../domain/photoProjection';
import { useEditorStore } from '../stores/editorStore';
import type { GardenAsset, GardenDocument, ImagePoint } from '../types/garden';

const labels = ['手前左', '手前右', '奥右', '奥左'];

export function PhotoOverlay({ document, assets, selectedAssetId, disabled }: { document: GardenDocument; assets: GardenAsset[]; selectedAssetId: string | null; disabled: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [groundVisible, setGroundVisible] = useState(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [objectsVisible, setObjectsVisible] = useState(true);
  const [dragging, setDragging] = useState<{ kind: 'corner' | 'boundary'; index: number } | null>(null);
  const draft = useEditorStore((state) => state.photoBoundaryDraft);
  const drawingBoundary = draft !== null;
  const [pointer, setPointer] = useState<ImagePoint | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [error, setError] = useState('');
  const photo = document.photo;
  const valid = photo ? validCorners(photo.corners) : false;
  const boundaryValid = photo ? validSurface(photo) : false;
  const draftValid = photo && draft !== null ? validSurface({ ...photo, boundary: draft }) : false;
  const surfaceVisible = boundaryValid && !drawingBoundary;
  const project = valid ? homography(unitCorners, photo!.corners) : null;
  const inverse = valid ? homography(photo!.corners, unitCorners) : null;

  function imagePoint(clientX: number, clientY: number): ImagePoint | null {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix || !photo) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    return { x: point.x / photo.imageWidth, y: point.y / photo.imageHeight };
  }

  function updatePoint(kind: 'corner' | 'boundary', index: number, point: ImagePoint) {
    if (!photo || disabled) return;
    const next = { x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) };
    if (kind === 'corner') {
      const corners = [...photo.corners];
      const linked = photo.boundary.length === 4 && photo.boundary.every((p, i) => p.x === photo.corners[i].x && p.y === photo.corners[i].y);
      corners[index] = next;
      useEditorStore.getState().setPhoto({ ...photo, corners, boundary: linked ? corners : photo.boundary });
    } else {
      const boundary = [...(draft ?? photo.boundary)]; boundary[index] = next;
      if (drawingBoundary) useEditorStore.getState().setPhotoBoundaryDraft(boundary);
      else useEditorStore.getState().setPhoto({ ...photo, boundary });
    }
  }

  function finishBoundary() {
    if (disabled) return;
    if (!useEditorStore.getState().confirmPhotoBoundary()) {
      setError('輪郭は3〜64点必要です。線の交差、面積不足、投影基準の四隅からのはみ出しを修正してください。');
      return;
    }
    setPointer(null);
    setError('');
  }

  function nearStart(point: ImagePoint) {
    const first = draft?.[0];
    const matrix = svg.current?.getScreenCTM();
    if (!first || !photo || !matrix) return false;
    const dx = (point.x - first.x) * photo.imageWidth, dy = (point.y - first.y) * photo.imageHeight;
    return Math.hypot(matrix.a * dx + matrix.c * dy, matrix.b * dx + matrix.d * dy) <= 14;
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
    if (!photo || disabled || dragging !== null) return;
    const p = imagePoint(event.clientX, event.clientY);
    if (!p || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) return;
    if (photo.corners.length < 4) {
      const corners = [...photo.corners, p];
      useEditorStore.getState().setPhoto({ ...photo, corners, boundary: [] });
      if (validCorners(corners)) {
        useEditorStore.getState().setPhotoBoundaryDraft([]);
        setPointer(null);
      }
    } else if (drawingBoundary) {
      if (draft.length >= 3 && nearStart(p)) { finishBoundary(); return; }
      if (draft.length >= 64) { setError('輪郭は最大64点です。始点につないで確定するか、最後の点を戻してください。'); return; }
      useEditorStore.getState().setPhotoBoundaryDraft([...draft, p]);
      setError('');
    } else if (selectedAssetId && inverse && valid) {
      const ground = inverse(p);
      if (ground.x >= 0 && ground.x <= 1 && ground.y >= 0 && ground.y <= 1 && boundaryValid && pointInPolygon(p, photo.boundary)) {
        const asset = assets.find((entry) => entry.id === selectedAssetId);
        if (asset) useEditorStore.getState().addAssetAt(asset, (ground.x - 0.5) * document.width, (0.5 - ground.y) * document.depth);
      }
    }
  }

  const pixels = (p: ImagePoint) => ({ x: p.x * photo!.imageWidth, y: p.y * photo!.imageHeight });
  const projected = (p: ImagePoint) => pixels(project!(p));
  const boundaryPoints = draft ?? photo?.boundary ?? [];
  const boundary = boundaryPoints.map((p) => pixels(p)).map((p) => `${p.x},${p.y}`).join(' ');
  const corners = photo?.corners.map((p) => pixels(p)).map((p) => `${p.x},${p.y}`).join(' ') ?? '';
  const activePoints = drawingBoundary ? boundaryPoints : photo && photo.corners.length < 4 ? photo.corners : [];
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
      {valid && !drawingBoundary && <button type="button" className="button button-secondary" disabled={disabled} onClick={() => { useEditorStore.getState().setPhotoBoundaryDraft([]); setPointer(null); setError(''); }}>多角形を描く</button>}
      {drawingBoundary && <button type="button" className="button button-secondary" disabled={disabled || !draftValid} onClick={finishBoundary}>輪郭を確定</button>}
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
      <p className="photo-hint" aria-live="polite">{photo.corners.length < 4 ? `投影基準 ${photo.corners.length + 1}/4：${labels[photo.corners.length]}をクリックしてください。庭の輪郭はこの後に描きます。` : !valid ? '白い投影基準点の順序・交差をドラッグで修正してください。' : drawingBoundary ? `庭の輪郭を描画中（${draft.length}/64点）。次の点をクリックし、3点以上で橙色の始点につなぐと確定します。` : !boundaryValid ? '「多角形を描く」で庭の輪郭を指定してください。交差や投影基準の四隅からのはみ出しは確定できません。' : '白い点は投影基準、橙色の点は庭の輪郭です。ドラッグで調整できます。カタログ選択後、輪郭内のクリックで配置します。'}</p>
      <svg ref={svg} className="photo-stage" viewBox={`0 0 ${photo.imageWidth} ${photo.imageHeight}`} onClick={onImageClick}
        onPointerMove={(event) => { if (disabled) return; const p = imagePoint(event.clientX, event.clientY); if (!p) return; if (dragging) updatePoint(dragging.kind, dragging.index, p); else setPointer(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 ? p : null); }}
        onPointerLeave={() => setPointer(null)}
        onPointerUp={() => setDragging(null)} onPointerCancel={() => { setDragging(null); setPointer(null); }}>
        <image href={photo.dataUrl} width={photo.imageWidth} height={photo.imageHeight} />
        {surfaceVisible && <defs><clipPath id="garden-photo-boundary"><polygon points={boundary} /></clipPath></defs>}
        {surfaceVisible && groundVisible && <polygon data-testid="photo-ground" points={boundary} fill="#74b780" fillOpacity="0.16" stroke="#d9ee87" strokeWidth={Math.max(2, photo.imageWidth / 500)} />}
        {valid && surfaceVisible && gridVisible && <g clipPath="url(#garden-photo-boundary)">{grid.map(({ a, b }, i) => <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e9f7be" strokeOpacity="0.85" strokeWidth={Math.max(1, photo.imageWidth / 1100)} />)}</g>}
        {photo.corners.length > 1 && (valid ? <polygon points={corners} fill="none" stroke="white" strokeOpacity="0.6" strokeDasharray="8 6" pointerEvents="none" /> : <polyline points={corners} fill="none" stroke="white" pointerEvents="none" />)}
        {valid && objectsVisible && project && document.objects.map((object) => {
          const p = projected({ x: object.position.x / document.width + 0.5, y: 0.5 - object.position.z / document.depth });
          const onGround = boundaryValid && pointInPolygon({ x: p.x / photo.imageWidth, y: p.y / photo.imageHeight }, photo.boundary);
          return <g key={object.id}><circle cx={p.x} cy={p.y} r={Math.max(8, photo.imageWidth / 100)} fill={onGround ? '#d4793e' : '#bc3131'} stroke="white" strokeWidth="3" /><text x={p.x} y={p.y - 12} textAnchor="middle" fill="white" fontSize={Math.max(14, photo.imageWidth / 75)}>{object.assetId}</text></g>;
        })}
        {boundaryPoints.length > 1 && <polyline points={boundary} fill="none" stroke="#ffbd68" strokeWidth={Math.max(2, photo.imageWidth / 500)} pointerEvents="none" />}
        {previewStart && previewEnd && !dragging && !disabled && <line data-testid="photo-preview-edge" x1={previewStart.x} y1={previewStart.y} x2={previewEnd.x} y2={previewEnd.y} stroke={closing ? '#d9ee87' : '#ffbd68'} strokeWidth={Math.max(2, photo.imageWidth / 500)} strokeDasharray="7 5" pointerEvents="none" />}
        {photo.corners.map((point, index) => { const p = pixels(point); return <g key={`c${index}`} pointerEvents={drawingBoundary ? 'none' : undefined} onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.stopPropagation(); if (disabled) return; setPointer(null); setDragging({ kind: 'corner', index }); event.currentTarget.setPointerCapture(event.pointerId); }}><circle cx={p.x} cy={p.y} r={Math.max(10, photo.imageWidth / 95)} fill="#fff" stroke="#266049" strokeWidth="4" /><text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={Math.max(12, photo.imageWidth / 100)}>{index + 1}</text></g>; })}
        {boundaryPoints.map((point, index) => { const p = pixels(point); const start = drawingBoundary && index === 0; return <g key={`b${index}`}>
          {start && draft.length >= 3 && <circle cx={p.x} cy={p.y} r={Math.max(14, photo.imageWidth / 80)} fill="none" stroke={closing ? '#d9ee87' : '#ffbd68'} strokeWidth="2" pointerEvents="none" />}
          <circle cx={p.x} cy={p.y} r={Math.max(7, photo.imageWidth / 135)} fill="#ffbd68" stroke="#593818" strokeWidth="3"
            role={start ? 'button' : undefined} tabIndex={start ? 0 : undefined} aria-label={start ? '始点につないで輪郭を確定' : undefined}
            onKeyDown={(event) => { if (start && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); finishBoundary(); } }}
            onClick={(event) => { event.stopPropagation(); if (start) finishBoundary(); }}
            onPointerDown={(event) => { event.stopPropagation(); if (disabled || start) return; setPointer(null); setDragging({ kind: 'boundary', index }); event.currentTarget.setPointerCapture(event.pointerId); }} />
        </g>; })}
      </svg>
    </>}
  </div>;
}
