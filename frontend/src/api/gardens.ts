import { requestJson } from './http';
import type { GardenAsset, GardenCreateRequest, GardenDocument, GardenSummary } from '../types/garden';

export const gardenApi = {
  listAssets: () => requestJson<GardenAsset[]>('/api/assets'),
  listGardens: () => requestJson<GardenSummary[]>('/api/gardens'),
  getGarden: (id: string) => requestJson<GardenDocument>(`/api/gardens/${encodeURIComponent(id)}`),
  createGarden: (request: GardenCreateRequest) => requestJson<GardenDocument>('/api/gardens', {
    method: 'POST',
    body: JSON.stringify(request),
  }),
  saveGarden: (document: GardenDocument) => requestJson<GardenDocument>(`/api/gardens/${encodeURIComponent(document.id)}`, {
    method: 'PUT',
    body: JSON.stringify(document),
  }),
  deleteGarden: (id: string) => requestJson<void>(`/api/gardens/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
