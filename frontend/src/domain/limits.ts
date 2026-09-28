export const GARDEN_MIN_SIDE = 1;
export const GARDEN_MAX_SIDE = 50;
export const MAX_PLACED_OBJECTS = 200;
export const MIN_OBJECT_SCALE = 0.25;
export const MAX_OBJECT_SCALE = 3;
export const MAX_GARDEN_NAME_LENGTH = 60;

export function isValidGardenSize(width: number, depth: number): boolean {
  return [width, depth].every((side) => Number.isFinite(side) && side >= GARDEN_MIN_SIDE && side <= GARDEN_MAX_SIDE);
}
