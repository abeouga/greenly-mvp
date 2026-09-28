import { MAX_PLACED_OBJECTS, MAX_OBJECT_SCALE, MIN_OBJECT_SCALE } from './limits';
import type { GardenAsset, GardenDocument, GardenObject, Vector3Value } from '../types/garden';

export type ObjectTransform = Pick<GardenObject, 'position' | 'rotation' | 'scale'>;

export function createPlacedObject(asset: GardenAsset, x: number, z: number): GardenObject {
  return {
    id: crypto.randomUUID(),
    assetId: asset.id,
    position: { x, y: 0, z },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  };
}

export function addObject(document: GardenDocument, object: GardenObject): GardenDocument | null {
  if (document.objects.length >= MAX_PLACED_OBJECTS || object.position.y !== 0) return null;
  if (!Number.isFinite(object.position.x) || !Number.isFinite(object.position.z)) return null;
  if (Math.abs(object.position.x) > document.width / 2 || Math.abs(object.position.z) > document.depth / 2) return null;
  if (document.objects.some((placed) => placed.id === object.id)) return null;
  return { ...document, objects: [...document.objects, object] };
}

export function changeObjectTransform(
  document: GardenDocument,
  objectId: string,
  transform: ObjectTransform,
): GardenDocument | null {
  if (!isValidTransform(document, transform)) return null;
  const exists = document.objects.some((object) => object.id === objectId);
  if (!exists) return null;
  return {
    ...document,
    objects: document.objects.map((object) => object.id === objectId ? { ...object, ...cloneTransform(transform) } : object),
  };
}

export function duplicateObject(document: GardenDocument, objectId: string): GardenDocument | null {
  const original = document.objects.find((object) => object.id === objectId);
  if (!original || document.objects.length >= MAX_PLACED_OBJECTS) return null;
  const halfWidth = document.width / 2;
  const halfDepth = document.depth / 2;
  const copy: GardenObject = {
    ...original,
    id: crypto.randomUUID(),
    position: {
      x: Math.min(halfWidth, Math.max(-halfWidth, original.position.x + 0.5)),
      y: 0,
      z: Math.min(halfDepth, Math.max(-halfDepth, original.position.z + 0.5)),
    },
    rotation: { ...original.rotation },
    scale: { ...original.scale },
  };
  return addObject(document, copy);
}

export function removeObject(document: GardenDocument, objectId: string): GardenDocument | null {
  if (!document.objects.some((object) => object.id === objectId)) return null;
  return { ...document, objects: document.objects.filter((object) => object.id !== objectId) };
}

export function isValidTransform(document: GardenDocument, transform: ObjectTransform): boolean {
  const { position, rotation, scale } = transform;
  const finite = [...Object.values(position), ...Object.values(rotation), ...Object.values(scale)].every(Number.isFinite);
  const halfWidth = document.width / 2;
  const halfDepth = document.depth / 2;
  return finite
    && position.y === 0
    && Math.abs(position.x) <= halfWidth
    && Math.abs(position.z) <= halfDepth
    && rotation.x === 0
    && rotation.z === 0
    && scale.x >= MIN_OBJECT_SCALE
    && scale.x <= MAX_OBJECT_SCALE
    && scale.x === scale.y
    && scale.x === scale.z;
}

export function withPosition(current: ObjectTransform, x: number, z: number): ObjectTransform {
  return { ...cloneTransform(current), position: { x, y: 0, z } };
}

export function withRotation(current: ObjectTransform, radians: number): ObjectTransform {
  return { ...cloneTransform(current), rotation: { x: 0, y: radians, z: 0 } };
}

export function withScale(current: ObjectTransform, value: number): ObjectTransform {
  const scale: Vector3Value = { x: value, y: value, z: value };
  return { ...cloneTransform(current), scale };
}

function cloneTransform(transform: ObjectTransform): ObjectTransform {
  return {
    position: { ...transform.position },
    rotation: { ...transform.rotation },
    scale: { ...transform.scale },
  };
}
