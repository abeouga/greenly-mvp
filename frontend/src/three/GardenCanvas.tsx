import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, useGLTF } from '@react-three/drei';
import { MathUtils, Plane, Vector3, type Group } from 'three';
import { useEditorStore } from '../stores/editorStore';
import type { GardenAsset, GardenDocument, GardenObject } from '../types/garden';
import { RotationRing } from './RotationRing';
import { GardenGround } from './GardenGround';
import { BrokenObject, GardenModel, SelectionOutline } from './GardenModel';
import { detectWebgl } from './webgl';

interface RetryRequest {
  objectId: string;
  sequence: number;
}

interface GardenCanvasProps {
  document: GardenDocument;
  assets: GardenAsset[];
  selectedAssetId: string | null;
  disabled: boolean;
  retryRequest: RetryRequest | null;
  onModelLoaded: (id: string) => void;
  onModelFailed: (id: string) => void;
}

export function GardenCanvas({ document, assets, selectedAssetId, disabled, retryRequest, onModelLoaded, onModelFailed }: GardenCanvasProps) {
  const webglSupported = useMemo(() => detectWebgl(), []);
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  if (!webglSupported) {
    return <div className="canvas-unavailable" role="alert">このブラウザーではWebGLを利用できません。WebGL対応ブラウザーで開き直してください。</div>;
  }

  return (
    <div className="garden-canvas" data-testid="garden-canvas">
      <Canvas camera={{ position: [13, 14, 15], fov: 42, near: 0.1, far: 300 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
        <color attach="background" args={['#eef1e7']} />
        <ambientLight intensity={1.7} />
        <directionalLight position={[7, 12, 5]} intensity={2.1} />
        <CameraRig width={document.width} depth={document.depth} />
        <OrbitControls makeDefault enabled={!useEditorStore((state) => state.isTransformDragging)} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2 + 0.08} minDistance={2} maxDistance={100} />
        <GardenGround document={document} selectedAsset={assets.find((asset) => asset.id === selectedAssetId) ?? null} disabled={disabled} />
        {document.objects.map((object) => {
          const asset = assetMap.get(object.assetId);
          if (!asset) return <BrokenObject key={object.id} object={object} />;
          const retry = retryRequest?.objectId === object.id ? retryRequest.sequence : 0;
            return (
              <PlacedObject
              key={`${object.id}:${retry}`}
              object={object}
              asset={asset}
              disabled={disabled}
              onModelLoaded={onModelLoaded}
              onModelFailed={onModelFailed}
            />
          );
        })}
      </Canvas>
      <div className="canvas-corner-label" aria-hidden="true">N</div>
    </div>
  );
}

export function clearGardenModelCache(url: string) {
  useGLTF.clear(url);
}

function CameraRig({ width, depth }: { width: number; depth: number }) {
  const cameraCommand = useEditorStore((state) => state.cameraCommand);
  const { camera, controls } = useThree();

  useEffect(() => {
    const orbit = controls as unknown as { target: { set: (x: number, y: number, z: number) => void }; update: () => void } | null;
    if (!orbit?.target) return;
    orbit.target.set(0, 0, 0);
    if (cameraCommand.view === 'top') {
      camera.up.set(0, 0, -1);
      camera.position.set(0, Math.max(width, depth) * 1.8, 0.001);
    } else {
      camera.up.set(0, 1, 0);
      camera.position.set(width * 0.85 + depth * 0.35, Math.max(width, depth) * 1.15, depth * 0.95 + width * 0.25);
    }
    camera.lookAt(0, 0, 0);
    orbit.update();
  }, [camera, cameraCommand.sequence, cameraCommand.view, controls, depth, width]);

  return null;
}

function PlacedObject({ object, asset, disabled, onModelLoaded, onModelFailed }: {
  object: GardenObject;
  asset: GardenAsset;
  disabled: boolean;
  onModelLoaded: (id: string) => void;
  onModelFailed: (id: string) => void;
}) {
  const group = useRef<Group>(null!);
  const activePointerId = useRef<number | null>(null);
  const [controlEpoch, setControlEpoch] = useState(0);
  const tool = useEditorStore((state) => state.tool);
  const selected = useEditorStore((state) => state.selectedObjectId === object.id);
  const setDragging = useEditorStore((state) => state.setTransformDragging);
  const horizontalPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const intersection = useMemo(() => new Vector3(), []);
  const commit = () => {
    const node = group.current;
    if (!node) return;
    const next = {
      position: { x: node.position.x, y: 0, z: node.position.z },
      rotation: { x: 0, y: node.rotation.y, z: 0 },
      scale: { x: node.scale.x, y: node.scale.y, z: node.scale.z },
    };
    const previous = useEditorStore.getState().document?.objects.find((placed) => placed.id === object.id);
    const unchanged = previous
      && Math.abs(previous.position.x - next.position.x) < 0.0001
      && Math.abs(previous.position.z - next.position.z) < 0.0001
      && Math.abs(previous.rotation.y - next.rotation.y) < 0.0001
      && Math.abs(previous.scale.x - next.scale.x) < 0.0001;
    if (!unchanged) {
      const accepted = useEditorStore.getState().transformObject(object.id, next);
      if (!accepted && previous) {
        node.position.set(previous.position.x, 0, previous.position.z);
        node.rotation.set(0, previous.rotation.y, 0);
        node.scale.set(previous.scale.x, previous.scale.y, previous.scale.z);
      }
    }
    setDragging(false);
  };

  function constrainTransform() {
    const node = group.current;
    const document = useEditorStore.getState().document;
    if (!node || !document) return;
    node.position.x = MathUtils.clamp(node.position.x, -document.width / 2, document.width / 2);
    node.position.y = 0;
    node.position.z = MathUtils.clamp(node.position.z, -document.depth / 2, document.depth / 2);
    node.rotation.x = 0;
    node.rotation.z = 0;
    if (tool === 'scale') {
      const size = MathUtils.clamp(node.scale.x, 0.25, 3);
      node.scale.set(size, size, size);
    }
  }

  function beginObjectDrag(event: { pointerId: number; stopPropagation: () => void; target: { setPointerCapture: (pointerId: number) => void } }) {
    event.stopPropagation();
    if (useEditorStore.getState().isTransformDragging) return;
    useEditorStore.getState().selectObject(object.id);
    if (tool !== 'move' || disabled) return;
    activePointerId.current = event.pointerId;
    event.target.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function moveObjectOnGround(event: { pointerId: number; stopPropagation: () => void; ray: { intersectPlane: (plane: Plane, target: Vector3) => Vector3 | null } }) {
    if (activePointerId.current !== event.pointerId || !group.current) return;
    event.stopPropagation();
    const document = useEditorStore.getState().document;
    if (!document || !event.ray.intersectPlane(horizontalPlane, intersection)) return;
    group.current.position.set(
      MathUtils.clamp(intersection.x, -document.width / 2, document.width / 2),
      0,
      MathUtils.clamp(intersection.z, -document.depth / 2, document.depth / 2),
    );
  }

  function finishObjectDrag(event: { pointerId: number; target: { releasePointerCapture: (pointerId: number) => void } }) {
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;
    try {
      event.target.releasePointerCapture(event.pointerId);
    } catch {
      // Capture may already be released by the browser when a pointer leaves the window.
    }
    commit();
  }

  function cancelObjectDrag(event: { pointerId: number }) {
    if (activePointerId.current !== event.pointerId) return;
    activePointerId.current = null;
    const previous = useEditorStore.getState().document?.objects.find((placed) => placed.id === object.id);
    if (previous && group.current) {
      group.current.position.set(previous.position.x, 0, previous.position.z);
      group.current.rotation.set(0, previous.rotation.y, 0);
      group.current.scale.set(previous.scale.x, previous.scale.y, previous.scale.z);
    }
    setDragging(false);
  }

  useEffect(() => {
    if (!selected) return;
    function cancelTransform() {
      if (!useEditorStore.getState().isTransformDragging) return;
      const previous = useEditorStore.getState().document?.objects.find((placed) => placed.id === object.id);
      if (previous && group.current) {
        group.current.position.set(previous.position.x, 0, previous.position.z);
        group.current.rotation.set(0, previous.rotation.y, 0);
        group.current.scale.set(previous.scale.x, previous.scale.y, previous.scale.z);
      }
      activePointerId.current = null;
      setDragging(false);
      // The control has no pointercancel handler; remounting releases its document listeners.
      setControlEpoch((epoch) => epoch + 1);
    }
    function cancelWithEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !useEditorStore.getState().isTransformDragging) return;
      event.preventDefault();
      cancelTransform();
    }
    window.addEventListener('pointercancel', cancelTransform);
    window.addEventListener('blur', cancelTransform);
    window.addEventListener('keydown', cancelWithEscape);
    return () => {
      window.removeEventListener('pointercancel', cancelTransform);
      window.removeEventListener('blur', cancelTransform);
      window.removeEventListener('keydown', cancelWithEscape);
    };
  }, [object.id, selected, setDragging]);

  const content = (
    <group
      ref={group}
      position={[object.position.x, 0, object.position.z]}
      rotation={[0, object.rotation.y, 0]}
      scale={[object.scale.x, object.scale.y, object.scale.z]}
      onPointerDown={beginObjectDrag}
      onPointerMove={moveObjectOnGround}
      onPointerUp={finishObjectDrag}
      onPointerCancel={cancelObjectDrag}
    >
        <GardenModel object={object} asset={asset} onModelLoaded={onModelLoaded} onModelFailed={onModelFailed} />
        {selected && <SelectionOutline asset={asset} />}
    </group>
  );

  return (
    <>
      {content}
      {/* Drei reattaches when children change; reattaching during a drag clears the active axis. */}
      {tool === 'rotate' ? (selected && !disabled && <RotationRing target={group}
        position={object.position}
        radius={Math.max(1.4, Math.hypot(asset.baseDimensions.width, asset.baseDimensions.depth) * object.scale.x / 2 + 0.4)}
        onCommit={commit} />) : <TransformControls
        key={controlEpoch}
        object={group}
        enabled={selected && !disabled}
        axis={selected ? undefined : null}
        mode={tool === 'move' ? 'translate' : 'scale'}
        space="local"
        size={1}
        showX={selected}
        showY={false}
        showZ={selected && tool === 'move'}
        onMouseDown={() => setDragging(true)}
        onObjectChange={constrainTransform}
        onMouseUp={commit}
      />}
    </>
  );
}
