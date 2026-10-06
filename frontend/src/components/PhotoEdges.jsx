import { useLayoutEffect, useRef, useState } from 'react';
import { edgeLength } from '../domain/polygonEdges';
import { UiIcon } from './UiIcon';
export function PhotoEdges({ document, selected, disabled, onSelect }) {
    const photo = document.photo;
    return <g className="photo-edges">{photo.boundary.map((a, index) => {
            const b = photo.boundary[(index + 1) % photo.boundary.length];
            const length = edgeLength(document, index);
            const x = (a.x + b.x) * photo.imageWidth / 2, y = (a.y + b.y) * photo.imageHeight / 2;
            const dx = (b.x - a.x) * photo.imageWidth, dy = (b.y - a.y) * photo.imageHeight;
            const size = Math.max(1, Math.hypot(dx, dy)), nx = -dy / size * 7, ny = dx / size * 7;
            const hit = [[a.x * photo.imageWidth + nx, a.y * photo.imageHeight + ny], [b.x * photo.imageWidth + nx, b.y * photo.imageHeight + ny],
                [b.x * photo.imageWidth - nx, b.y * photo.imageHeight - ny], [a.x * photo.imageWidth - nx, a.y * photo.imageHeight - ny]].map((p) => p.join(',')).join(' ');
            function select(element) {
                if (disabled)
                    return;
                const svg = element.ownerSVGElement, matrix = svg.getScreenCTM();
                if (!matrix)
                    return;
                const point = new DOMPoint(x, y).matrixTransform(matrix), bounds = svg.getBoundingClientRect();
                onSelect({ index, left: Math.max(12, Math.min(point.x - bounds.left - 140, bounds.width - 292)),
                    top: Math.max(12, Math.min(point.y - bounds.top + 18, bounds.height - 330)) });
            }
            return <g key={index} className={`photo-edge${selected === index ? ' selected' : ''}`}>
      <line className="edge-visible" x1={a.x * photo.imageWidth} y1={a.y * photo.imageHeight} x2={b.x * photo.imageWidth} y2={b.y * photo.imageHeight} vectorEffect="non-scaling-stroke" pointerEvents="none"/>
      <polygon points={hit} data-testid={`photo-edge-${index}`} className="edge-hit" role="button" tabIndex={disabled ? -1 : 0} aria-label={`辺${index + 1}の長さを確認`} aria-disabled={disabled} aria-pressed={selected === index} vectorEffect="non-scaling-stroke" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); select(e.currentTarget); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                select(e.currentTarget);
            } }}/>
      <g className="edge-label" pointerEvents="none" transform={`translate(${x},${y - 14})`}>
        <rect x="-39" y="-15" width="78" height="27" rx="5"/>
        <text textAnchor="middle" y="3">{length?.toFixed(2) ?? '—'} m</text>
      </g>
      {selected === index && <circle cx={a.x * photo.imageWidth} cy={a.y * photo.imageHeight} r="9" fill="#fff" stroke="#225f51" strokeWidth="3" pointerEvents="none"/>}
    </g>;
        })}</g>;
}
export function EdgeMeasurementPopover({ document, selection, onClose }) {
    const length = edgeLength(document, selection.index);
    const panel = useRef(null);
    const [position, setPosition] = useState({ left: selection.left, top: selection.top });
    useLayoutEffect(() => {
        const element = panel.current, container = element.parentElement;
        const svg = container.querySelector('svg.photo-stage');
        const photo = document.photo;
        const a = photo.boundary[selection.index], b = photo.boundary[(selection.index + 1) % photo.boundary.length];
        function place() {
            const matrix = svg.getScreenCTM();
            if (!matrix)
                return;
            const bounds = container.getBoundingClientRect();
            const anchor = new DOMPoint((a.x + b.x) * photo.imageWidth / 2, (a.y + b.y) * photo.imageHeight / 2).matrixTransform(matrix);
            const x = anchor.x - bounds.left, y = anchor.y - bounds.top;
            const left = x < bounds.width / 2 ? x + 20 : x - element.offsetWidth - 20;
            setPosition({ left: Math.max(12, Math.min(left, bounds.width - element.offsetWidth - 12)),
                top: Math.max(12, Math.min(y - element.offsetHeight / 2, bounds.height - element.offsetHeight - 12)) });
        }
        const observer = new ResizeObserver(place);
        observer.observe(container);
        observer.observe(element);
        place();
        element.querySelector('button').focus();
        return () => observer.disconnect();
    }, [document.photo, selection.index]);
    function close() {
        onClose();
        requestAnimationFrame(() => window.document.querySelector(`[data-testid="photo-edge-${selection.index}"]`)?.focus());
    }
    return <section ref={panel} className="edge-popover" role="dialog" aria-label="選択した辺の長さ" style={position} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape')
        close(); }}>
    <header><div><span className="popover-caption"><UiIcon name="ruler" size={14}/>長さを確認</span><h3>辺の長さ</h3></div>
      <button type="button" className="icon-button" aria-label="辺の計測を閉じる" onClick={close}><UiIcon name="close" size={17}/></button></header>
    <div className="edge-measurement"><span>{document.photo.calibration ? '現在の実寸' : '現在の概算'}</span>
      <output data-testid="edge-measurement" aria-label="辺の計測値">{length === null ? '計測できません' : `${length.toFixed(2)} m`}</output></div>
    <p>実測値は「写真のカメラを設定」の基準幅・奥行きに入力してください。カメラを計算・適用しても、写真上の輪郭はその位置を保ちます。</p>
    {!document.photo.calibration && <p className="edge-warning">カメラ未設定のため、長さは現在の土台に基づく概算です。</p>}
    {length === null && <p className="notice-error">地面上の位置を求められません。カメラ設定を確認してください。</p>}
    <footer><button type="button" className="button button-secondary" onClick={close}>閉じる</button></footer>
  </section>;
}
