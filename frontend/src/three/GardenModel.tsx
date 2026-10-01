import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { BoxGeometry, EdgesGeometry } from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import type { GardenAsset, GardenObject } from '../types/garden';

export function GardenModel({ object, asset, onModelLoaded, onModelFailed }: {
  object: GardenObject;
  asset: GardenAsset;
  onModelLoaded: (id: string) => void;
  onModelFailed: (id: string) => void;
}) {
  return <AssetLoadBoundary fallback={<BrokenPlaceholder dimensions={asset.baseDimensions} />} onError={() => onModelFailed(object.id)}>
    <Suspense fallback={<LoadingPlaceholder dimensions={asset.baseDimensions} />}>
      <LoadedAsset asset={asset} objectId={object.id} onLoaded={onModelLoaded} />
    </Suspense>
  </AssetLoadBoundary>;
}

function LoadedAsset({ asset, objectId, onLoaded }: { asset: GardenAsset; objectId: string; onLoaded: (id: string) => void }) {
  const { scene } = useGLTF(asset.modelUrl);
  const clone = useMemo(() => cloneSkeleton(scene), [scene]);
  useEffect(() => onLoaded(objectId), [objectId, onLoaded]);
  return <primitive object={clone} />;
}

export function SelectionOutline({ asset }: { asset: GardenAsset }) {
  const dimensions = asset.baseDimensions;
  const geometry = useMemo(() => {
    const box = new BoxGeometry(dimensions.width, dimensions.height, dimensions.depth);
    const edges = new EdgesGeometry(box);
    box.dispose();
    return edges;
  }, [dimensions.depth, dimensions.height, dimensions.width]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry} position={[0, dimensions.height / 2, 0]}>
      <lineBasicMaterial color="#bf7831" depthTest={false} />
    </lineSegments>
  );
}

function LoadingPlaceholder({ dimensions }: { dimensions: GardenAsset['baseDimensions'] }) {
  return (
    <mesh position={[0, dimensions.height / 2, 0]}>
      <boxGeometry args={[dimensions.width * 0.7, dimensions.height * 0.7, dimensions.depth * 0.7]} />
      <meshStandardMaterial color="#d6ba83" wireframe />
    </mesh>
  );
}

function BrokenPlaceholder({ dimensions }: { dimensions: GardenAsset['baseDimensions'] }) {
  return (
    <mesh position={[0, dimensions.height / 2, 0]}>
      <boxGeometry args={[dimensions.width * 0.7, dimensions.height * 0.7, dimensions.depth * 0.7]} />
      <meshStandardMaterial color="#bd554a" wireframe />
    </mesh>
  );
}

export function BrokenObject({ object }: { object: GardenObject }) {
  return (
    <group position={[object.position.x, 0, object.position.z]}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshStandardMaterial color="#bd554a" wireframe />
      </mesh>
    </group>
  );
}

interface BoundaryProps {
  fallback: ReactNode;
  onError: () => void;
  children: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

class AssetLoadBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
