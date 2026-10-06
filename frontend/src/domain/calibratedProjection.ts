import type { GardenPhoto, ImagePoint, Vector3Value } from '../types/garden';
import { homography, unitCorners } from './photoProjection';

export function projectWorld(photo: GardenPhoto, point: Vector3Value): ImagePoint | null {
  const c = photo.calibration;
  if (!c) return null;
  const r = c.rotation, t = c.translation;
  const camera = [0, 1, 2].map((i) => r[3 * i] * point.x + r[3 * i + 1] * point.y + r[3 * i + 2] * point.z + t[i]);
  if (camera[2] <= 0.01) return null;
  return { x: 0.5 + c.focalLengthPx * camera[0] / camera[2] / photo.imageWidth,
    y: 0.5 + c.focalLengthPx * camera[1] / camera[2] / photo.imageHeight };
}

export function projectionCorners(photo: GardenPhoto, width: number, depth: number): ImagePoint[] {
  if (!photo.calibration) {
    if (!photo.projectionSize) return photo.corners;
    const project = homography(unitCorners, photo.corners);
    const frame = photo.projectionSize;
    return project ? unitCorners.map((p) => project({ x: (p.x - 0.5) * width / frame.width + 0.5, y: (p.y - 0.5) * depth / frame.depth + 0.5 })) : [];
  }
  const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([x, z]) =>
    projectWorld(photo, { x: x * width / 2, y: 0, z: z * depth / 2 }));
  return corners.every((p) => p !== null) ? corners : [];
}

export function groundPoint(photo: GardenPhoto, point: ImagePoint): { x: number; z: number } | null {
  const c = photo.calibration;
  if (!c) return null;
  const ray = [(point.x - 0.5) * photo.imageWidth / c.focalLengthPx,
    (point.y - 0.5) * photo.imageHeight / c.focalLengthPx, 1];
  const origin = [0, 1, 2].map((i) => -[0, 1, 2].reduce((sum, j) => sum + c.rotation[j * 3 + i] * c.translation[j], 0));
  const direction = [0, 1, 2].map((i) => [0, 1, 2].reduce((sum, j) => sum + c.rotation[j * 3 + i] * ray[j], 0));
  if (direction[1] >= -1e-8) return null;
  const distance = -origin[1] / direction[1];
  return { x: origin[0] + direction[0] * distance, z: origin[2] + direction[2] * distance };
}

export function calibratedBoundaryError(photo: GardenPhoto, width: number, depth: number): string | null {
  if (!photo.calibration) return null;
  for (const point of photo.boundary) {
    const ground = groundPoint(photo, point);
    if (!ground) return '庭の輪郭が地平線を越えています。地面上に描き直してください。';
    if (Math.abs(ground.x) > width / 2 + 0.05 || Math.abs(ground.z) > depth / 2 + 0.05)
      return '庭の輪郭が庭の実寸範囲を超えています。輪郭を描き直すか、カメラの基準点を調整してください。';
  }
  return null;
}
