import { MAX_OBJECT_SCALE, MIN_OBJECT_SCALE } from '../domain/limits';
import { useEditorStore } from '../stores/editorStore';
import { UiIcon } from './UiIcon';
export function PropertiesPanel({ document, assets, selectedObject, selectedAsset, tool, photoMode, disabled, collapsed, onSelectObject, onSetTool, onDuplicate, onDelete, onToggle, }) {
    const editError = useEditorStore((state) => state.editError);
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
    function updatePosition(axis, raw) {
        if (!selectedObject)
            return;
        const value = Number(raw);
        if (!Number.isFinite(value))
            return;
        const current = selectedObject.position;
        const transform = {
            position: { x: axis === 'x' ? value : current.x, y: 0, z: axis === 'z' ? value : current.z },
            rotation: { ...selectedObject.rotation },
            scale: { ...selectedObject.scale },
        };
        useEditorStore.getState().transformObject(selectedObject.id, transform);
    }
    function updateRotation(raw) {
        if (!selectedObject)
            return;
        const degrees = Number(raw);
        if (!Number.isFinite(degrees))
            return;
        useEditorStore.getState().transformObject(selectedObject.id, {
            position: { ...selectedObject.position },
            rotation: { x: 0, y: degrees * Math.PI / 180, z: 0 },
            scale: { ...selectedObject.scale },
        });
    }
    function resetRotation() {
        updateRotation('0');
    }
    function updateScale(raw) {
        if (!selectedObject)
            return;
        const value = Number(raw);
        if (!Number.isFinite(value))
            return;
        useEditorStore.getState().transformObject(selectedObject.id, {
            position: { ...selectedObject.position },
            rotation: { ...selectedObject.rotation },
            scale: { x: value, y: value, z: value },
        });
    }
    return (<aside id="properties-panel" className={`editor-panel side-panel properties-panel${collapsed ? ' is-collapsed' : ''}`}>
      <div className="side-panel-controls">
        <h2>配置と編集</h2>
        <button className="icon-button" type="button" aria-label="編集パネルを閉じる" aria-expanded={!collapsed} aria-controls="properties-panel-content" onClick={onToggle}>
          <UiIcon name="close" size={17}/>
        </button>
      </div>
      <div id="properties-panel-content" className="side-panel-content" aria-hidden={collapsed}>
      <section className="placed-section">
        <div className="panel-heading panel-heading-row">
          <div>
            <h3>配置したもの</h3>
          </div>
          <span className="count-tag">{document.objects.length} / 200</span>
        </div>
        {document.objects.length === 0 ? (<div className="inspector-empty"><UiIcon name="leaf" size={30}/><strong>最初の素材を置く</strong><p>下のカタログで素材を選び、<br />庭の好きな場所をクリックします。</p></div>) : (<ul className="placed-list">
            {document.objects.map((object, index) => {
                const asset = assetMap.get(object.assetId);
                return (<li key={object.id}>
                  <button type="button" className={`placed-row${selectedObject?.id === object.id ? ' is-active' : ''}`} aria-pressed={selectedObject?.id === object.id} disabled={disabled} data-testid={`object-row-${index}`} data-object-id={object.id} onClick={() => onSelectObject(object.id)}>
                    <span className="placed-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="placed-copy">
                      <strong>{asset?.name ?? '不明なアセット'}</strong>
                      <small>X {object.position.x.toFixed(1)} · Z {object.position.z.toFixed(1)}</small>
                    </span>
                  </button>
                </li>);
            })}
          </ul>)}
      </section>

      <section className="transform-section">
        {!selectedObject ? (document.objects.length > 0 && <p className="panel-empty">庭や一覧から配置物を選択して編集します。</p>) : (<>
            <div className="selection-name">
              <span className="selection-dot"/>
              <strong>{selectedAsset?.name ?? '不明なアセット'}</strong>
              <span className="selection-caption">選択中</span>
            </div>
            {!photoMode && <div className="transform-tools" role="group" aria-label="変形ツール">
              <button type="button" data-testid="tool-move" aria-pressed={tool === 'move'} disabled={disabled} onClick={() => onSetTool('move')}><UiIcon name="move" size={15}/>移動</button>
              <button type="button" data-testid="tool-rotate" aria-pressed={tool === 'rotate'} disabled={disabled} onClick={() => onSetTool('rotate')}><UiIcon name="rotate" size={15}/>回転</button>
              <button type="button" data-testid="tool-scale" aria-pressed={tool === 'scale'} disabled={disabled} onClick={() => onSetTool('scale')}><UiIcon name="scale" size={15}/>拡縮</button>
            </div>}
            <div className="property-fields">
              <label htmlFor="position-x">X座標 (m)
                <input id="position-x" data-testid="position-x" type="number" step="0.1" min={-document.width / 2} max={document.width / 2} value={Number(selectedObject.position.x.toFixed(2))} disabled={disabled} onChange={(event) => updatePosition('x', event.target.value)}/>
              </label>
              <label htmlFor="position-z">Z座標 (m)
                <input id="position-z" data-testid="position-z" type="number" step="0.1" min={-document.depth / 2} max={document.depth / 2} value={Number(selectedObject.position.z.toFixed(2))} disabled={disabled} onChange={(event) => updatePosition('z', event.target.value)}/>
              </label>
              <div className="rotation-field">
                <label htmlFor="rotation-y">Y回転 (度)
                  <input id="rotation-y" data-testid="rotation-y" type="number" step="1" value={Number((selectedObject.rotation.y * 180 / Math.PI).toFixed(1))} disabled={disabled} onChange={(event) => updateRotation(event.target.value)}/>
                </label>
                <button className="angle-reset" type="button" aria-label="角度を0度に戻す" disabled={disabled || selectedObject.rotation.y === 0} onClick={resetRotation}>0°へ戻す</button>
              </div>
              <label htmlFor="uniform-scale">倍率 (一様)
                <input id="uniform-scale" data-testid="uniform-scale" type="number" min={MIN_OBJECT_SCALE} max={MAX_OBJECT_SCALE} step="0.05" value={Number(selectedObject.scale.x.toFixed(2))} disabled={disabled} onChange={(event) => updateScale(event.target.value)}/>
              </label>
            </div>
            <p className="form-hint">{photoMode ? '数値で位置・回転・倍率を調整します。' : tool === 'rotate' ? '円形ハンドルをドラッグして回転します。' : tool === 'move' ? '配置物をドラッグして位置を調整します。' : `倍率は ${MIN_OBJECT_SCALE}〜${MAX_OBJECT_SCALE} の範囲で変更できます。`}</p>
            {editError && <p className="notice notice-error" role="alert">{editError}</p>}
            <div className="object-actions">
              <button className="button button-secondary" type="button" disabled={disabled || document.objects.length >= 200} onClick={onDuplicate}><UiIcon name="copy" size={15}/>複製</button>
              <button className="button button-danger-subtle" type="button" disabled={disabled} onClick={onDelete}><UiIcon name="trash" size={15}/>削除</button>
            </div>
          </>)}
      </section>
      </div>
    </aside>);
}
