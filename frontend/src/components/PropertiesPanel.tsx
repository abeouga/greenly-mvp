import { MAX_OBJECT_SCALE, MIN_OBJECT_SCALE } from '../domain/limits';
import { useEditorStore } from '../stores/editorStore';
import type { GardenAsset, GardenDocument, GardenObject, TransformTool } from '../types/garden';

interface PropertiesPanelProps {
  document: GardenDocument;
  assets: GardenAsset[];
  selectedObject: GardenObject | null;
  selectedAsset: GardenAsset | null;
  tool: TransformTool;
  disabled: boolean;
  collapsed: boolean;
  onSelectObject: (id: string) => void;
  onSetTool: (tool: TransformTool) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

export function PropertiesPanel({
  document,
  assets,
  selectedObject,
  selectedAsset,
  tool,
  disabled,
  collapsed,
  onSelectObject,
  onSetTool,
  onDuplicate,
  onDelete,
  onToggle,
}: PropertiesPanelProps) {
  const editError = useEditorStore((state) => state.editError);
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  function updatePosition(axis: 'x' | 'z', raw: string) {
    if (!selectedObject) return;
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const current = selectedObject.position;
    const transform = {
      position: { x: axis === 'x' ? value : current.x, y: 0, z: axis === 'z' ? value : current.z },
      rotation: { ...selectedObject.rotation },
      scale: { ...selectedObject.scale },
    };
    useEditorStore.getState().transformObject(selectedObject.id, transform);
  }

  function updateRotation(raw: string) {
    if (!selectedObject) return;
    const degrees = Number(raw);
    if (!Number.isFinite(degrees)) return;
    useEditorStore.getState().transformObject(selectedObject.id, {
      position: { ...selectedObject.position },
      rotation: { x: 0, y: degrees * Math.PI / 180, z: 0 },
      scale: { ...selectedObject.scale },
    });
  }

  function resetRotation() {
    updateRotation('0');
  }

  function updateScale(raw: string) {
    if (!selectedObject) return;
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    useEditorStore.getState().transformObject(selectedObject.id, {
      position: { ...selectedObject.position },
      rotation: { ...selectedObject.rotation },
      scale: { x: value, y: value, z: value },
    });
  }

  return (
    <aside id="properties-panel" className={`editor-panel side-panel properties-panel${collapsed ? ' is-collapsed' : ''}`}>
      <div className="side-panel-controls">
        <button
          className="side-panel-toggle"
          type="button"
          aria-label={collapsed ? '配置済み・プロパティパネルを表示' : '配置済み・プロパティパネルを隠す'}
          aria-expanded={!collapsed}
          aria-controls="properties-panel-content"
          onClick={onToggle}
        >
          <span aria-hidden="true">{collapsed ? '‹' : '›'}</span>
        </button>
      </div>
      <div id="properties-panel-content" className="side-panel-content" aria-hidden={collapsed}>
      <section className="placed-section">
        <div className="panel-heading panel-heading-row">
          <div>
            <span className="eyebrow">IN YOUR GARDEN</span>
            <h2>配置済み</h2>
          </div>
          <span className="count-tag">{document.objects.length} / 200</span>
        </div>
        {document.objects.length === 0 ? (
          <p className="panel-empty">カタログから種類を選び、地面をクリックしてください。</p>
        ) : (
          <ul className="placed-list">
            {document.objects.map((object, index) => {
              const asset = assetMap.get(object.assetId);
              return (
                <li key={object.id}>
                  <button
                    type="button"
                    className={`placed-row${selectedObject?.id === object.id ? ' is-active' : ''}`}
                    aria-pressed={selectedObject?.id === object.id}
                    disabled={disabled}
                    data-testid={`object-row-${index}`}
                    data-object-id={object.id}
                    onClick={() => onSelectObject(object.id)}
                  >
                    <span className="placed-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="placed-copy">
                      <strong>{asset?.name ?? '不明なアセット'}</strong>
                      <small>X {object.position.x.toFixed(1)} · Z {object.position.z.toFixed(1)}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="transform-section">
        <div className="panel-heading">
          <span className="eyebrow">TRANSFORM</span>
          <h2>プロパティ</h2>
        </div>
        {!selectedObject ? (
          <p className="panel-empty">オブジェクトを選択すると編集できます。</p>
        ) : (
          <>
            <div className="selection-name">
              <span className="selection-dot" />
              <strong>{selectedAsset?.name ?? '不明なアセット'}</strong>
            </div>
            <div className="transform-tools" role="group" aria-label="変形ツール">
              <button type="button" data-testid="tool-move" aria-pressed={tool === 'move'} disabled={disabled} onClick={() => onSetTool('move')}>移動</button>
              <button type="button" data-testid="tool-rotate" aria-pressed={tool === 'rotate'} disabled={disabled} onClick={() => onSetTool('rotate')}>回転</button>
              <button type="button" data-testid="tool-scale" aria-pressed={tool === 'scale'} disabled={disabled} onClick={() => onSetTool('scale')}>拡縮</button>
            </div>
            <div className="property-fields">
              <label htmlFor="position-x">X座標 (m)
                <input id="position-x" data-testid="position-x" type="number" step="0.1" min={-document.width / 2} max={document.width / 2} value={Number(selectedObject.position.x.toFixed(2))} disabled={disabled} onChange={(event) => updatePosition('x', event.target.value)} />
              </label>
              <label htmlFor="position-z">Z座標 (m)
                <input id="position-z" data-testid="position-z" type="number" step="0.1" min={-document.depth / 2} max={document.depth / 2} value={Number(selectedObject.position.z.toFixed(2))} disabled={disabled} onChange={(event) => updatePosition('z', event.target.value)} />
              </label>
              <div className="rotation-field">
                <label htmlFor="rotation-y">Y回転 (度)
                  <input id="rotation-y" data-testid="rotation-y" type="number" step="1" value={Number((selectedObject.rotation.y * 180 / Math.PI).toFixed(1))} disabled={disabled} onChange={(event) => updateRotation(event.target.value)} />
                </label>
                <button className="angle-reset" type="button" aria-label="角度を0度に戻す" disabled={disabled || selectedObject.rotation.y === 0} onClick={resetRotation}>0°へ戻す</button>
              </div>
              <label htmlFor="uniform-scale">倍率 (一様)
                <input id="uniform-scale" data-testid="uniform-scale" type="number" min={MIN_OBJECT_SCALE} max={MAX_OBJECT_SCALE} step="0.05" value={Number(selectedObject.scale.x.toFixed(2))} disabled={disabled} onChange={(event) => updateScale(event.target.value)} />
              </label>
            </div>
            <p className="form-hint">円形ハンドルをドラッグして回転できます。倍率 {MIN_OBJECT_SCALE}〜{MAX_OBJECT_SCALE}。Y座標とX/Z回転は固定です。</p>
            {editError && <p className="notice notice-error" role="alert">{editError}</p>}
            <div className="object-actions">
              <button className="button button-secondary" type="button" disabled={disabled || document.objects.length >= 200} onClick={onDuplicate}>複製</button>
              <button className="button button-danger" type="button" disabled={disabled} onClick={onDelete}>削除</button>
            </div>
          </>
        )}
      </section>
      </div>
    </aside>
  );
}
