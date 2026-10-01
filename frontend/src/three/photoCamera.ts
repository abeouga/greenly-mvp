import { Matrix4, OrthographicCamera } from 'three';
import { homographyMatrix, unitCorners } from '../domain/photoProjection';
import type { GardenPhoto } from '../types/garden';

// Preserve ground correspondence and keep world-up vertical in the photo.
// Photo contours do not determine a physical camera pose or a vertical vanishing point.
export function createPhotoCamera(photo: GardenPhoto, width: number, depth: number) {
  const transform = homographyMatrix(unitCorners, photo.corners);
  if (!transform) return null;
  const range = Math.max(12, width, depth) * 32;
  const camera = Object.assign(new OrthographicCamera(-1, 1, 1, -1, 0.1, range * 2), { manual: true });
  camera.position.set(0, range / 2, range / 2);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  // Height never changes the horizontal numerator or homogeneous denominator.
  // This prevents upright trees from leaning outward at the edges of the image.
  const rows = [0, 3, 6].map((index) => {
    const a = transform[index], b = transform[index + 1], c = transform[index + 2];
    return [a / width, 0, -b / depth, (a + b) / 2 + c];
  });
  const w = rows[2][3];
  const pixelsPerMetre = Math.hypot(
    (rows[0][0] * w - rows[0][3] * rows[2][0]) * photo.imageWidth,
    (rows[1][0] * w - rows[1][3] * rows[2][0]) * photo.imageHeight,
  ) / (w * w);
  rows[1][1] = -pixelsPerMetre * w / photo.imageHeight;
  const x = rows[0].map((value, index) => 2 * value - rows[2][index]);
  const y = rows[2].map((value, index) => value - 2 * rows[1][index]);
  const worldProjection = new Matrix4().set(
    x[0], x[1], x[2], x[3],
    y[0], y[1], y[2], y[3],
    0, -1 / range, -1 / range, 0,
    rows[2][0], rows[2][1], rows[2][2], rows[2][3],
  );
  camera.projectionMatrix.copy(worldProjection).multiply(camera.matrixWorld);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  return camera;
}
