import { groundPoint, projectWorld } from './calibratedProjection';
import { homography, unitCorners, validSurface } from './photoProjection';
import type { GardenDocument, GardenPhoto, ImagePoint } from '../types/garden';

export function photoGroundPoint(photo: GardenPhoto, width: number, depth: number, point: ImagePoint) {
  if (photo.calibration) return groundPoint(photo, point);
  const inverse = homography(photo.corners, unitCorners);
  if (!inverse) return null;
  const frame = photo.projectionSize ?? { width, depth }, p = inverse(point);
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  return { x: (p.x - 0.5) * frame.width, z: (0.5 - p.y) * frame.depth };
}

export function edgeLength(document: GardenDocument, index: number) {
  const photo = document.photo;
  if (!photo || !photo.boundary.length) return null;
  const a = photoGroundPoint(photo, document.width, document.depth, photo.boundary[index]);
  const b = photoGroundPoint(photo, document.width, document.depth, photo.boundary[(index + 1) % photo.boundary.length]);
  return a && b ? Math.hypot(b.x - a.x, b.z - a.z) : null;
}

export function changeEdgeLength(document: GardenDocument, index: number, length: number): { document?: GardenDocument; error?: string } {
  const photo = document.photo;
  if (!photo || !validSurface(photo) || index < 0 || index >= photo.boundary.length) return { error: '先に庭の輪郭を確定してください。' };
  if (!Number.isFinite(length) || length < 0.1 || length > 70) return { error: '辺の長さは0.1〜70mで指定してください。' };
  const end = (index + 1) % photo.boundary.length;
  const a = photoGroundPoint(photo, document.width, document.depth, photo.boundary[index]);
  const b = photoGroundPoint(photo, document.width, document.depth, photo.boundary[end]);
  if (!a || !b) return { error: '地面上の位置を求められません。カメラ設定を確認してください。' };
  const previous = Math.hypot(b.x - a.x, b.z - a.z);
  if (previous < 0.001) return { error: '辺が短すぎます。頂点を調整してください。' };
  const moved = { x: a.x + (b.x - a.x) * length / previous, y: 0, z: a.z + (b.z - a.z) * length / previous };
  const frame = photo.projectionSize ?? { width: document.width, depth: document.depth };
  const forward = homography(unitCorners, photo.corners);
  const point = photo.calibration ? projectWorld(photo, moved) : forward?.({ x: moved.x / frame.width + 0.5, y: 0.5 - moved.z / frame.depth });
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1)
    return { error: '終点が写真の外に出ます。写真内に収まる長さを指定してください。' };
  const nextPhoto: GardenPhoto = { ...photo, projectionSize: photo.calibration ? photo.projectionSize : frame,
    boundary: photo.boundary.map((p, i) => i === end ? point : p) };
  if (!validSurface(nextPhoto)) return { error: '輪郭が交差するか、頂点が近すぎます。別の長さを指定してください。' };
  const vertices = nextPhoto.boundary.map((p) => photoGroundPoint(nextPhoto, document.width, document.depth, p));
  if (vertices.some((p) => !p)) return { error: '輪郭が地平線を越えています。' };
  const width = Math.max(document.width, Math.ceil(Math.max(...vertices.map((p) => Math.abs(p!.x))) * 20 - 1e-8) / 10);
  const depth = Math.max(document.depth, Math.ceil(Math.max(...vertices.map((p) => Math.abs(p!.z))) * 20 - 1e-8) / 10);
  if (width > 50 || depth > 50) return { error: '土台の対応範囲（幅・奥行き50m）を超えています。' };
  return { document: { ...document, width, depth, photo: nextPhoto } };
}
