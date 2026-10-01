export interface Vector3Value {
  x: number;
  y: number;
  z: number;
}

export interface GardenObject {
  id: string;
  assetId: string;
  position: Vector3Value;
  rotation: Vector3Value;
  scale: Vector3Value;
}

export interface GardenDocument {
  schemaVersion: 1;
  id: string;
  revision: number;
  name: string;
  width: number;
  depth: number;
  objects: GardenObject[];
  photo: GardenPhoto | null;
}

export interface ImagePoint { x: number; y: number }

export interface GardenPhoto {
  dataUrl: string;
  imageWidth: number;
  imageHeight: number;
  // Internal transform anchors (bottom left/right, top right/left).
  // Derived from the outline bounds when drawing; preserved for older saved photos.
  corners: ImagePoint[];
  boundary: ImagePoint[];
}

export interface GardenSummary {
  id: string;
  name: string;
  width: number;
  depth: number;
  revision: number;
  updatedAt: string;
}

export interface BaseDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface GardenAsset {
  id: string;
  name: string;
  category: string;
  modelUrl: string;
  baseDimensions: BaseDimensions;
}

export type TransformTool = 'move' | 'rotate' | 'scale';

export interface GardenCreateRequest {
  name: string;
  width: number;
  depth: number;
}
