import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/http';
import { gardenApi } from '../api/gardens';
import { GardenHeader } from '../components/GardenHeader';
import { CatalogPanel } from '../components/CatalogPanel';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { clearGardenModelCache, GardenCanvas } from '../three/GardenCanvas';
import { useEditorStore } from '../stores/editorStore';
import { PhotoOverlay } from '../components/PhotoOverlay';
import { validSurface } from '../domain/photoProjection';

interface EditorPageProps {
  gardenId: string;
}

function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 409) return '別の保存結果と競合しました。表示中の編集内容は保持されています。庭を再読み込みして状態を確認してください。';
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function EditorPage({ gardenId }: EditorPageProps) {
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
  const [retryRequest, setRetryRequest] = useState<{ objectId: string; sequence: number } | null>(null);
  const [viewMode, setViewMode] = useState<'photo' | '3d'>('3d');
  const [catalogCollapsed, setCatalogCollapsed] = useState(false);
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);

  useEffect(() => {
    if (gardenQuery.data) {
      useEditorStore.getState().hydrate(gardenQuery.data);
      if (gardenQuery.data.photo) setViewMode('photo');
    }
  }, [gardenQuery.data]);

  useEffect(() => {
    if (!isDirty && !hasBoundaryDraft) return;
    const confirmUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', confirmUnload);
    return () => window.removeEventListener('beforeunload', confirmUnload);
  }, [isDirty, hasBoundaryDraft]);

  useEffect(() => {
    function handleDeleteKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
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
    if (!state.document || !state.isDirty || state.isSaving || state.isTransformDragging) return;
    if (state.photoBoundaryDraft !== null) {
      state.setSaveError('描画中の輪郭を確定または取消してから保存してください。'); return;
    }
    if (state.document.photo && !validSurface(state.document.photo)) {
      state.setSaveError('四隅と輪郭を確定してから保存してください。'); return;
    }
    const snapshot = structuredClone(state.document);
    state.setSaving(true);
    state.setSaveError(null);
    saveGarden.mutate(snapshot);
  }

  function goToList() {
    const state = useEditorStore.getState();
    if ((state.isDirty || state.photoBoundaryDraft !== null) && !window.confirm('保存していない変更を破棄して庭一覧へ戻りますか？')) return;
    window.location.assign('/');
  }

  function retryModel(objectId: string) {
    const object = document?.objects.find((placed) => placed.id === objectId);
    const modelUrl = assetQuery.data?.find((asset) => asset.id === object?.assetId)?.modelUrl;
    if (modelUrl) clearGardenModelCache(modelUrl);
    clearModelFailure(objectId);
    setRetryRequest((previous) => ({ objectId, sequence: previous?.objectId === objectId ? previous.sequence + 1 : 1 }));
  }

  if (gardenQuery.isLoading || !document || document.id !== gardenId) {
    return (
      <div className="page-shell loading-shell">
        <GardenHeader title="庭を開いています" />
        {gardenQuery.isLoading && <p className="notice" role="status">保存した庭をAPIから読み込んでいます…</p>}
        {gardenQuery.isError && (
          <div className="panel load-error">
            <p className="notice notice-error" role="alert">庭を取得できませんでした。庭ID、API、MySQLの状態を確認してください。</p>
            <button className="button button-secondary" onClick={() => gardenQuery.refetch()}>再試行</button>
            <button className="button button-secondary" onClick={() => window.location.assign('/')}>庭一覧へ戻る</button>
          </div>
        )}
      </div>
    );
  }

  const assets = assetQuery.data ?? [];
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  const selectedObject = document.objects.find((object) => object.id === selectedObjectId) ?? null;
  const selectedAsset = selectedObject ? assetMap.get(selectedObject.assetId) ?? null : null;
  const canvasHint = hasBoundaryDraft ? '庭の輪郭をクリックで描き、始点につないで確定'
    : selectedAssetId
    ? '地面をクリックして配置'
    : selectedObject && tool === 'rotate'
      ? '円形ハンドルをドラッグして角度を調整'
      : 'オブジェクトを選択して編集';
  const statusText = isSaving ? '保存中…' : hasBoundaryDraft ? '輪郭を描画中' : isDirty ? '未保存の変更' : '保存済み';
  const isEditingDisabled = isSaving || isTransformDragging;
  const photoReady = !hasBoundaryDraft && (!document.photo || validSurface(document.photo));

  return (
    <div className="editor-shell">
      <GardenHeader title={document.name} subtitle={`${document.width} × ${document.depth} m · 中心原点 · 1目盛り = 1m`} />
      <div className="editor-toolbar">
        <button className="button button-secondary list-button" onClick={goToList} disabled={isEditingDisabled}>← 庭一覧</button>
        <div className="toolbar-status" aria-live="polite">
          <span className={`status-dot${isDirty || hasBoundaryDraft ? ' status-dirty' : ''}`} />
          <span data-testid="save-status">{statusText}</span>
        </div>
        <button className="button button-primary save-button" data-testid="save-garden" onClick={save} disabled={!isDirty || isSaving || isTransformDragging || !photoReady}>
          {isSaving ? '保存中…' : saveError ? '再試行して保存' : '保存'}
        </button>
      </div>

      {saveError && (
        <div className="editor-alert notice-error" role="alert">
          <span>{saveError}</span>
          <button type="button" onClick={save} disabled={isSaving || isTransformDragging}>再試行</button>
        </div>
      )}
      {!photoReady && <div className="editor-alert" role="status">{hasBoundaryDraft ? '庭の輪郭を描画中です。始点につないで確定するか、描画を取消してください。' : '写真の投影基準4点と庭の輪郭を指定してから保存してください。'}</div>}
      {assetQuery.isError && (
        <div className="editor-alert notice-error" role="alert">
          <span>オブジェクトカタログを読み込めませんでした。</span>
          <button type="button" onClick={() => assetQuery.refetch()}>再試行</button>
        </div>
      )}
      {failedModelIds.length > 0 && (
        <div className="editor-alert notice-error" role="alert">
          <span>{failedModelIds.length}個のモデルを読み込めません。配置一覧から削除するか再試行してください。</span>
          {failedModelIds.map((id) => (
            <button key={id} type="button" onClick={() => retryModel(id)}>モデルを再試行</button>
          ))}
        </div>
      )}

      <main className={`editor-layout${catalogCollapsed ? ' editor-layout-catalog-collapsed' : ''}${propertiesCollapsed ? ' editor-layout-properties-collapsed' : ''}`}>
        <CatalogPanel
          assets={assets}
          selectedAssetId={selectedAssetId}
          disabled={isEditingDisabled || hasBoundaryDraft || assetQuery.isError}
          collapsed={catalogCollapsed}
          onSelect={selectAsset}
          onToggle={() => setCatalogCollapsed((collapsed) => !collapsed)}
        />
        <section className="canvas-column" aria-label="庭の3D編集エリア">
          <div className="canvas-tools">
            <span className="canvas-tool-hint">{canvasHint}</span>
            <div className="view-mode-actions">
              <button type="button" aria-pressed={viewMode === 'photo'} onClick={() => setViewMode('photo')}>写真＋設計</button>
              <button type="button" aria-pressed={viewMode === '3d'} disabled={hasBoundaryDraft} onClick={() => setViewMode('3d')}>3D庭</button>
            </div>
            <div className="camera-actions">
              {viewMode === '3d' && <button type="button" onClick={() => commandCamera('top')} disabled={isEditingDisabled}>上から見る</button>}
              {viewMode === '3d' && <button type="button" onClick={() => commandCamera('home')} disabled={isEditingDisabled}>初期視点</button>}
            </div>
          </div>
          {viewMode === 'photo' ? <PhotoOverlay document={document} assets={assets} selectedAssetId={selectedAssetId} disabled={isEditingDisabled} /> : assetQuery.isLoading ? (
            <div className="canvas-loading" role="status">アセット一覧を読み込んでいます…</div>
          ) : (
            <GardenCanvas
              document={document}
              assets={assets}
              selectedAssetId={selectedAssetId}
              disabled={isSaving}
              retryRequest={retryRequest}
              onModelLoaded={markModelLoaded}
              onModelFailed={markModelFailed}
            />
          )}
          <div className="canvas-footer">
            <span>1 Three.js unit = 1m</span>
            <span data-testid="model-loaded">読み込み済み: {loadedModelIds.length} / {document.objects.length}</span>
            <span>配置数 {document.objects.length} / 200</span>
          </div>
        </section>
        <PropertiesPanel
          document={document}
          assets={assets}
          selectedObject={selectedObject}
          selectedAsset={selectedAsset}
          tool={tool}
          disabled={isEditingDisabled}
          collapsed={propertiesCollapsed}
          onSelectObject={selectObject}
          onSetTool={setTool}
          onDuplicate={duplicateSelected}
          onDelete={deleteSelected}
          onToggle={() => setPropertiesCollapsed((collapsed) => !collapsed)}
        />
      </main>
    </div>
  );
}
