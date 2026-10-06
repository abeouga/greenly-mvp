import type { OrthographicCamera, PerspectiveCamera } from 'three';
import type { GardenPhoto } from '../types/garden.js';

export function createPhotoCamera(photo: GardenPhoto, width: number, depth: number): PerspectiveCamera | OrthographicCamera | null;
