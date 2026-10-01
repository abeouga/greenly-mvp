import { create } from 'zustand';
import { addObject, changeObjectTransform, createPlacedObject, duplicateObject, removeObject } from '../domain/gardenEditing';
import { validSurface } from '../domain/photoProjection';
import type { GardenAsset, GardenDocument, GardenPhoto, ImagePoint, TransformTool } from '../types/garden';

interface EditorState {
  document: GardenDocument | null;
  selectedObjectId: string | null;
  selectedAssetId: string | null;
  tool: TransformTool;
  isDirty: boolean;
  isSaving: boolean;
  isTransformDragging: boolean;
  photoBoundaryDraft: ImagePoint[] | null;
  saveError: string | null;
  editError: string | null;
  cameraCommand: { view: 'home' | 'top'; sequence: number };
  loadedModelIds: string[];
  failedModelIds: string[];
  hydrate: (document: GardenDocument) => void;
  setPhoto: (photo: GardenPhoto | null) => void;
  setPhotoBoundaryDraft: (points: ImagePoint[] | null) => void;
  confirmPhotoBoundary: () => boolean;
  addAssetAt: (asset: GardenAsset, x: number, z: number) => void;
  selectObject: (id: string | null) => void;
  selectAsset: (id: string | null) => void;
  setTool: (tool: TransformTool) => void;
  transformObject: (id: string, transform: Parameters<typeof changeObjectTransform>[2]) => boolean;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  setSaving: (saving: boolean) => void;
  setTransformDragging: (dragging: boolean) => void;
  setSaveError: (message: string | null) => void;
  setEditError: (message: string | null) => void;
  markSaved: (document: GardenDocument) => void;
  commandCamera: (view: 'home' | 'top') => void;
  markModelLoaded: (id: string) => void;
  markModelFailed: (id: string) => void;
  clearModelFailure: (id: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  document: null,
  selectedObjectId: null,
  selectedAssetId: null,
  tool: 'move',
  isDirty: false,
  isSaving: false,
  isTransformDragging: false,
  photoBoundaryDraft: null,
  saveError: null,
  editError: null,
  cameraCommand: { view: 'home', sequence: 0 },
  loadedModelIds: [],
  failedModelIds: [],
  hydrate: (document) => {
    const current = get().document;
    if (current?.id === document.id) return;
    set({
      document: structuredClone(document),
      selectedObjectId: document.objects[0]?.id ?? null,
      selectedAssetId: null,
      isDirty: false,
      isSaving: false,
      isTransformDragging: false,
      photoBoundaryDraft: null,
      saveError: null,
      editError: null,
      loadedModelIds: [],
      failedModelIds: [],
    });
  },
  setPhoto: (photo) => {
    const state = get();
    if (!state.document || state.isSaving) return;
    set({ document: { ...state.document, photo }, isDirty: true, saveError: null,
      photoBoundaryDraft: !photo || photo.dataUrl !== state.document.photo?.dataUrl ? null : state.photoBoundaryDraft });
  },
  setPhotoBoundaryDraft: (photoBoundaryDraft) => {
    const state = get();
    if (!state.document?.photo || state.isSaving) return;
    set({ photoBoundaryDraft, saveError: null });
  },
  confirmPhotoBoundary: () => {
    const state = get();
    const photo = state.document?.photo;
    if (!state.document || !photo || state.photoBoundaryDraft === null || state.isSaving) return false;
    const next = { ...photo, boundary: state.photoBoundaryDraft };
    if (!validSurface(next)) return false;
    set({ document: { ...state.document, photo: next }, photoBoundaryDraft: null, isDirty: true, saveError: null });
    return true;
  },
  addAssetAt: (asset, x, z) => {
    const state = get();
    if (!state.document || state.isSaving) return;
    const next = addObject(state.document, createPlacedObject(asset, x, z));
    if (!next) {
      set({ editError: '配置数の上限に達したか、配置位置が範囲外です。' });
      return;
    }
    const selectedObjectId = next.objects[next.objects.length - 1].id;
    set({ document: next, selectedObjectId, isDirty: true, editError: null, saveError: null });
  },
  selectObject: (id) => set({ selectedObjectId: id }),
  selectAsset: (id) => set({ selectedAssetId: id, editError: null }),
  setTool: (tool) => set({ tool }),
  transformObject: (id, transform) => {
    const state = get();
    if (!state.document || state.isSaving) return false;
    const next = changeObjectTransform(state.document, id, transform);
    if (!next) {
      set({ editError: '庭の範囲、回転軸、拡大縮小の制限内で入力してください。' });
      return false;
    }
    set({ document: next, isDirty: true, editError: null, saveError: null });
    return true;
  },
  duplicateSelected: () => {
    const state = get();
    if (!state.document || !state.selectedObjectId || state.isSaving) return;
    const next = duplicateObject(state.document, state.selectedObjectId);
    if (!next) {
      set({ editError: '複製できません。配置数の上限を確認してください。' });
      return;
    }
    set({ document: next, selectedObjectId: next.objects[next.objects.length - 1].id, isDirty: true, editError: null, saveError: null });
  },
  deleteSelected: () => {
    const state = get();
    if (!state.document || !state.selectedObjectId || state.isSaving) return;
    const next = removeObject(state.document, state.selectedObjectId);
    if (!next) return;
    const selectedObjectId = next.objects[0]?.id ?? null;
    set({
      document: next,
      selectedObjectId,
      loadedModelIds: state.loadedModelIds.filter((id) => id !== state.selectedObjectId),
      failedModelIds: state.failedModelIds.filter((id) => id !== state.selectedObjectId),
      isDirty: true,
      editError: null,
      saveError: null,
    });
  },
  setSaving: (isSaving) => set({ isSaving }),
  setTransformDragging: (isTransformDragging) => set({ isTransformDragging }),
  setSaveError: (saveError) => set({ saveError }),
  setEditError: (editError) => set({ editError }),
  markSaved: (document) => set({ document: structuredClone(document), isDirty: false, isSaving: false, isTransformDragging: false, saveError: null, editError: null }),
  commandCamera: (view) => set((state) => ({ cameraCommand: { view, sequence: state.cameraCommand.sequence + 1 } })),
  markModelLoaded: (id) => set((state) => ({
    loadedModelIds: state.loadedModelIds.includes(id) ? state.loadedModelIds : [...state.loadedModelIds, id],
    failedModelIds: state.failedModelIds.filter((failedId) => failedId !== id),
  })),
  markModelFailed: (id) => set((state) => ({
    failedModelIds: state.failedModelIds.includes(id) ? state.failedModelIds : [...state.failedModelIds, id],
    loadedModelIds: state.loadedModelIds.filter((loadedId) => loadedId !== id),
  })),
  clearModelFailure: (id) => set((state) => ({ failedModelIds: state.failedModelIds.filter((failedId) => failedId !== id) })),
}));
