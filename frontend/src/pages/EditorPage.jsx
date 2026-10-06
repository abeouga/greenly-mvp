import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/http';
import { gardenApi } from '../api/gardens';
import { GardenHeader } from '../components/GardenHeader';
import { GreenlyIcon } from '../components/GreenlyIcon';
import { CatalogPanel } from '../components/CatalogPanel';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { GardenDimensions } from '../components/GardenDimensions';
import { clearGardenModelCache, GardenCanvas } from '../three/GardenCanvas';
import { useEditorStore } from '../stores/editorStore';
import { PhotoOverlay } from '../components/PhotoOverlay';
import { validSurface } from '../domain/photoProjection';
import { calibratedBoundaryError } from '../domain/calibratedProjection';
import { Dialog } from '../components/Dialog';
import { UiIcon } from '../components/UiIcon';
function errorText(error, fallback) {
    if (error instanceof ApiError && error.status === 409)
        return '別の保存結果と競合しました。表示中の編集内容は保持されています。庭を再読み込みして状態を確認してください。';
    if (error instanceof ApiError)
        return error.message;
    return fallback;
}
export function EditorPage({ gardenId }) {
    const queryClient = useQueryClient();
    const gardenQuery = useQuery({ queryKey: ['garden', gardenId], queryFn: () => gardenApi.getGarden(gardenId), staleTime: Infinity });
    const assetQuery = useQuery({ queryKey: ['assets'], queryFn: gardenApi.listAssets, staleTime: Infinity });
    const document = useEditorStore((state) => state.document);
    const selectedObjectId = useEditorStore((state) => state.selectedObjectId);
    const selectedAssetId = useEditorStore((state) => state.selectedAssetId);
    const tool = useEditorStore((state) => state.tool);
    const isDirty = useEditorStore((state) => state.isDirty);
    const isSaving = useEditorStore((state) => state.isSaving);
    const isTransformDragging = useEditorStore((state) => state.isTransformDragging);
    const photoBoundaryDraft = useEditorStore((state) => state.photoBoundaryDraft);
    const isCalibrating = useEditorStore((state) => state.isCalibrating);
    const hasBoundaryDraft = photoBoundaryDraft !== null;
    const saveError = useEditorStore((state) => state.saveError);
    const failedModelIds = useEditorStore((state) => state.failedModelIds);
    const loadedModelIds = useEditorStore((state) => state.loadedModelIds);
    const markModelLoaded = useEditorStore((state) => state.markModelLoaded);
    const markModelFailed = useEditorStore((state) => state.markModelFailed);
    const clearModelFailure = useEditorStore((state) => state.clearModelFailure);
    const commandCamera = useEditorStore((state) => state.commandCamera);
    const setTool = useEditorStore((state) => state.setTool);
    const selectObject = useEditorStore((state) => state.selectObject);
    const selectAsset = useEditorStore((state) => state.selectAsset);
    const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
    const deleteSelected = useEditorStore((state) => state.deleteSelected);
    const [retryRequest, setRetryRequest] = useState(null);
    const [viewMode, setViewMode] = useState('3d');
    const [catalogCollapsed, setCatalogCollapsed] = useState(false);
    const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
    const [dimensionsOpen, setDimensionsOpen] = useState(false);
    const [leaveOpen, setLeaveOpen] = useState(false);
    const allowNavigation = useRef(false);
    useEffect(() => {
        if (gardenQuery.data) {
            useEditorStore.getState().hydrate(gardenQuery.data);
            if (gardenQuery.data.photo)
                setViewMode('photo');
        }
    }, [gardenQuery.data]);
    useEffect(() => {
        if (!isDirty && !hasBoundaryDraft && !isCalibrating)
            return;
        const confirmUnload = (event) => {
            if (allowNavigation.current)
                return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', confirmUnload);
        return () => window.removeEventListener('beforeunload', confirmUnload);
    }, [isDirty, hasBoundaryDraft, isCalibrating]);
    useEffect(() => {
        function handleDeleteKey(event) {
            const target = event.target;
            if (useEditorStore.getState().isCalibrating)
                return;
            if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)))
                return;
            if (event.key === 'Escape' && useEditorStore.getState().selectedAssetId) {
                useEditorStore.getState().selectAsset(null);
                return;
            }
            if ((event.key === 'Delete' || event.key === 'Backspace') && useEditorStore.getState().selectedObjectId && !useEditorStore.getState().isSaving && !useEditorStore.getState().isTransformDragging) {
                event.preventDefault();
                useEditorStore.getState().deleteSelected();
            }
        }
        window.addEventListener('keydown', handleDeleteKey);
        return () => window.removeEventListener('keydown', handleDeleteKey);
    }, []);
    const saveGarden = useMutation({
        mutationFn: gardenApi.saveGarden,
        onSuccess: async (savedDocument) => {
            useEditorStore.getState().markSaved(savedDocument);
            await queryClient.invalidateQueries({ queryKey: ['gardens'] });
        },
        onError: (error) => {
            useEditorStore.getState().setSaving(false);
            useEditorStore.getState().setSaveError(errorText(error, 'サーバーへ接続できませんでした。編集内容は保持されています。確認後に再試行してください。'));
        },
    });
    function save() {
        const state = useEditorStore.getState();
        if (!state.document || !state.isDirty || state.isSaving || state.isTransformDragging)
            return;
        if (state.isCalibrating)
            return;
        if (state.photoBoundaryDraft !== null) {
            state.setSaveError('描画中の輪郭を確定または取消してから保存してください。');
            return;
        }
        if (state.document.photo && !validSurface(state.document.photo)) {
            state.setSaveError('庭の輪郭を始点につないで確定してから保存してください。');
            return;
        }
        if (state.document.photo) {
            const error = calibratedBoundaryError(state.document.photo, state.document.width, state.document.depth);
            if (error) {
                state.setSaveError(error);
                return;
            }
        }
        const snapshot = structuredClone(state.document);
        state.setSaving(true);
        state.setSaveError(null);
        saveGarden.mutate(snapshot);
    }
    function goToList() {
        const state = useEditorStore.getState();
        if (state.isDirty || state.photoBoundaryDraft !== null || state.isCalibrating) {
            setLeaveOpen(true);
            return;
        }
        window.location.assign('/');
    }
    function retryModel(objectId) {
        const object = document?.objects.find((placed) => placed.id === objectId);
        const modelUrl = assetQuery.data?.find((asset) => asset.id === object?.assetId)?.modelUrl;
        if (modelUrl)
            clearGardenModelCache(modelUrl);
        clearModelFailure(objectId);
        setRetryRequest((previous) => ({ objectId, sequence: previous?.objectId === objectId ? previous.sequence + 1 : 1 }));
    }
    if (gardenQuery.isLoading || !document || document.id !== gardenId) {
        return (<div className="page-shell loading-shell">
        <GardenHeader title="庭を開いています"/>
        {gardenQuery.isLoading && <p className="notice" role="status">保存した庭をAPIから読み込んでいます…</p>}
        {gardenQuery.isError && (<div className="panel load-error">
            <p className="notice notice-error" role="alert">庭を取得できませんでした。庭ID、API、MySQLの状態を確認してください。</p>
            <button className="button button-secondary" onClick={() => gardenQuery.refetch()}>再試行</button>
            <button className="button button-secondary" onClick={() => window.location.assign('/')}>庭一覧へ戻る</button>
          </div>)}
      </div>);
    }
    const assets = assetQuery.data ?? [];
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
    const selectedObject = document.objects.find((object) => object.id === selectedObjectId) ?? null;
    const selectedAsset = selectedObject ? assetMap.get(selectedObject.assetId) ?? null : null;
    const canvasHint = hasBoundaryDraft ? '庭の輪郭をクリックで描き、始点につないで確定'
        : selectedAssetId
            ? `${assetMap.get(selectedAssetId)?.name ?? '素材'}を配置中 · 地面をクリック / Escで終了`
            : selectedObject && viewMode === 'photo' ? '位置・回転・倍率は右の数値で調整'
                : selectedObject && tool === 'rotate'
                    ? '円形ハンドルをドラッグして角度を調整'
                    : 'オブジェクトを選択して編集';
    const statusText = isSaving ? '保存中…' : isCalibrating ? 'カメラを設定中' : hasBoundaryDraft ? '輪郭を描画中' : isDirty ? '未保存の変更' : '保存済み';
    const isEditingDisabled = isSaving || isTransformDragging || isCalibrating;
    const photoReady = !hasBoundaryDraft && !isCalibrating && (!document.photo || (validSurface(document.photo) && !calibratedBoundaryError(document.photo, document.width, document.depth)));
    return (<div className="editor-shell">
      <header className="document-bar">
        <button className="brand-mark editor-brand" aria-label="Greenly 庭一覧へ" onClick={goToList} disabled={isEditingDisabled}><GreenlyIcon/><span>Greenly</span></button>
        <button className="icon-button list-button" aria-label="← 庭一覧" title="庭一覧に戻る" onClick={goToList} disabled={isEditingDisabled}><UiIcon name="back"/></button>
        <div className="document-title"><h1>{document.name}</h1><span>{document.photo && document.photo.boundary.length >= 3
            ? `${document.photo.boundary.length}辺の庭` : `${document.width} × ${document.depth} m`}</span></div>
        <div className="toolbar-status" aria-live="polite">
          <span className={`status-dot${isDirty || hasBoundaryDraft ? ' status-dirty' : ''}`}/>
          <span data-testid="save-status">{statusText}</span>
        </div>
        <button className="button button-primary save-button" data-testid="save-garden" onClick={save} disabled={!isDirty || isSaving || isTransformDragging || !photoReady}>
          {isSaving ? '保存中…' : saveError ? '再試行して保存' : '保存'}
        </button>
      </header>

      {saveError && (<div className="editor-alert notice-error" role="alert">
          <span>{saveError}</span>
          <button type="button" onClick={save} disabled={isSaving || isTransformDragging}>再試行</button>
        </div>)}
      {!photoReady && !hasBoundaryDraft && !isCalibrating && <div className="editor-alert photo-progress" role="status">写真上の庭の輪郭と実寸範囲を確認してから保存してください。</div>}
      {assetQuery.isError && (<div className="editor-alert notice-error" role="alert">
          <span>オブジェクトカタログを読み込めませんでした。</span>
          <button type="button" onClick={() => assetQuery.refetch()}>再試行</button>
        </div>)}
      {failedModelIds.length > 0 && (<div className="editor-alert notice-error" role="alert">
          <span>{failedModelIds.length}個のモデルを読み込めません。配置一覧から削除するか再試行してください。</span>
          {failedModelIds.map((id) => (<button key={id} type="button" onClick={() => retryModel(id)}>モデルを再試行</button>))}
        </div>)}

      <main className={`editor-layout${propertiesCollapsed ? ' inspector-hidden' : ''}`}>
        <section className="canvas-column" aria-label="庭の3D編集エリア">
          <div className="canvas-tools">
            <div className="view-mode-actions" role="group" aria-label="表示モード">
              <button type="button" aria-pressed={viewMode === 'photo'} disabled={isCalibrating} onClick={() => setViewMode('photo')}><UiIcon name="photo"/>写真＋設計</button>
              <button type="button" aria-pressed={viewMode === '3d'} disabled={hasBoundaryDraft || isCalibrating} onClick={() => setViewMode('3d')}><UiIcon name="cube"/>3D庭</button>
            </div>
            <div className="camera-actions">
              {viewMode === '3d' && !document.photo && <button type="button" aria-haspopup="dialog" onClick={() => setDimensionsOpen(true)} disabled={isEditingDisabled}><UiIcon name="ruler"/>土台設定</button>}
              {viewMode === '3d' && <button type="button" onClick={() => commandCamera('top')} disabled={isEditingDisabled}><UiIcon name="top"/>上から見る</button>}
              {viewMode === '3d' && <button type="button" onClick={() => commandCamera('home')} disabled={isEditingDisabled}><UiIcon name="home"/>初期視点</button>}
              <button type="button" className="inspector-toggle" aria-label={propertiesCollapsed ? '配置済み・プロパティパネルを表示' : '配置済み・プロパティパネルを隠す'} aria-expanded={!propertiesCollapsed} aria-controls="properties-panel" onClick={() => setPropertiesCollapsed(!propertiesCollapsed)}><UiIcon name="panel"/><span>配置・編集</span></button>
            </div>
          </div>
          {dimensionsOpen && viewMode === '3d' && !document.photo && <Dialog title="土台のサイズ" description="庭の中心を基準に、幅と奥行きを変更します。" closeLabel="土台設定を閉じる" onClose={() => setDimensionsOpen(false)}>
            <GardenDimensions key={`${document.id}:${document.width}:${document.depth}`} document={document} disabled={isEditingDisabled || hasBoundaryDraft}/>
          </Dialog>}
          {viewMode === 'photo' ? <PhotoOverlay document={document} assets={assets} selectedAssetId={selectedAssetId} disabled={isEditingDisabled} retryRequest={retryRequest} onModelLoaded={markModelLoaded} onModelFailed={markModelFailed}/> : assetQuery.isLoading ? (<div className="canvas-loading" role="status">アセット一覧を読み込んでいます…</div>) : (<GardenCanvas document={document} assets={assets} selectedAssetId={selectedAssetId} disabled={isSaving} retryRequest={retryRequest} onModelLoaded={markModelLoaded} onModelFailed={markModelFailed}/>)}
          <div className="canvas-footer">
            <span className="canvas-tool-hint" aria-live="polite">{canvasHint}</span>
            <span data-testid="model-loaded">読み込み済み: {loadedModelIds.length} / {document.objects.length}</span>
            <span>1目盛り = 1m</span>
          </div>
        </section>
        {!propertiesCollapsed && <PropertiesPanel document={document} assets={assets} selectedObject={selectedObject} selectedAsset={selectedAsset} tool={tool} photoMode={viewMode === 'photo'} disabled={isEditingDisabled} collapsed={propertiesCollapsed} onSelectObject={selectObject} onSetTool={setTool} onDuplicate={duplicateSelected} onDelete={deleteSelected} onToggle={() => setPropertiesCollapsed((collapsed) => !collapsed)}/>}
        <CatalogPanel assets={assets} selectedAssetId={selectedAssetId} disabled={isEditingDisabled || hasBoundaryDraft || assetQuery.isError} collapsed={catalogCollapsed} onSelect={selectAsset} onToggle={() => setCatalogCollapsed((collapsed) => !collapsed)}/>
      </main>
      {leaveOpen && <Dialog title="変更を保存せずに戻りますか？" description="保存していない編集内容は破棄されます。" onClose={() => setLeaveOpen(false)} footer={<>
        <button type="button" className="button button-secondary" data-dialog-autofocus onClick={() => setLeaveOpen(false)}>編集を続ける</button>
        <button type="button" className="button button-danger" onClick={() => { allowNavigation.current = true; window.location.assign('/'); }}>変更を破棄して戻る</button>
      </>}><p>「{document.name}」の最後に保存した状態は残ります。</p></Dialog>}
    </div>);
}
