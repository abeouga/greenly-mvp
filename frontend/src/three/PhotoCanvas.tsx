import { useMemo } from 'react';
import { Canvas, events, type DomEvent, type RootState, type RootStore } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useEditorStore } from '../stores/editorStore';
import type { GardenAsset, GardenDocument, GardenObject } from '../types/garden';
import { GardenGround } from './GardenGround';
import { BrokenObject, GardenModel, SelectionOutline } from './GardenModel';
import { createPhotoCamera } from './photoCamera';
import { detectWebgl } from './webgl';

interface PhotoCanvasProps {
  document: GardenDocument;
  assets: GardenAsset[];
  selectedAssetId: string | null;
  disabled: boolean;
  objectsVisible: boolean;
  retryRequest: { objectId: string; sequence: number } | null;
  onModelLoaded: (id: string) => void;
  onModelFailed: (id: string) => void;
}

// SVG scaling changes the CSS size, so derive rays from the visible canvas bounds.
function photoEvents(store: RootStore) {
  const farPoint = new Vector3();
  return { ...events(store), compute: (event: DomEvent, root: RootState) => {
    const bounds = root.gl.domElement.getBoundingClientRect();
    root.pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    // Sample near the depth centre so a legacy projective transform cannot put
    // the two samples on opposite sides of infinity. Standard orthographic
    // rays assume an unmodified projection matrix and would miss the ground.
    root.raycaster.ray.origin.set(root.pointer.x, root.pointer.y, 0).unproject(root.camera);
    farPoint.set(root.pointer.x, root.pointer.y, 0.0001).unproject(root.camera);
    root.raycaster.ray.direction.copy(farPoint).sub(root.raycaster.ray.origin).normalize();
    root.raycaster.ray.origin.addScaledVector(root.raycaster.ray.direction, -root.camera.far);
    root.raycaster.camera = root.camera;
  } };
}

export function PhotoCanvas({ document, assets, selectedAssetId, disabled, objectsVisible, retryRequest, onModelLoaded, onModelFailed }: PhotoCanvasProps) {
  const supported = useMemo(detectWebgl, []);
  const camera = useMemo(() => document.photo ? createPhotoCamera(document.photo, document.width, document.depth) : null,
    [document.photo, document.width, document.depth]);
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  if (!supported || !camera) return <div role="alert">写真上の木の表示にはWebGLが必要です。</div>;

  return <div className="photo-models" data-testid="photo-model-canvas" data-object-count={objectsVisible ? document.objects.length : 0}>
    <Canvas camera={camera} dpr={[1, 1.5]} events={photoEvents} gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => gl.setClearColor(0, 0)}>
      <ambientLight intensity={1.7} />
      <directionalLight position={[7, 12, 5]} intensity={2.1} />
      <GardenGround document={document} selectedAsset={assets.find((asset) => asset.id === selectedAssetId) ?? null} disabled={disabled} invisible />
      {objectsVisible && document.objects.map((object) => {
        const asset = assetMap.get(object.assetId);
        if (!asset) return <BrokenObject key={object.id} object={object} />;
        const retry = retryRequest?.objectId === object.id ? retryRequest.sequence : 0;
        return <PhotoObject key={object.id + ':' + retry} object={object} asset={asset} disabled={disabled}
          onModelLoaded={onModelLoaded} onModelFailed={onModelFailed} />;
      })}
    </Canvas>
  </div>;
}

function PhotoObject({ object, asset, disabled, onModelLoaded, onModelFailed }: {
  object: GardenObject;
  asset: GardenAsset;
  disabled: boolean;
  onModelLoaded: (id: string) => void;
  onModelFailed: (id: string) => void;
}) {
  const selected = useEditorStore((state) => state.selectedObjectId === object.id);
  return <group position={[object.position.x, 0, object.position.z]} rotation={[0, object.rotation.y, 0]}
    scale={[object.scale.x, object.scale.y, object.scale.z]}
    onPointerDown={(event) => { event.stopPropagation(); if (!disabled) useEditorStore.getState().selectObject(object.id); }}
    onPointerUp={(event) => event.stopPropagation()}>
    <GardenModel object={object} asset={asset} onModelLoaded={onModelLoaded} onModelFailed={onModelFailed} />
    {selected && <SelectionOutline asset={asset} />}
  </group>;
}
