import { edgeLength } from './polygonEdges';
import { dimensionError } from './gardenDimensions';
import { isValidGardenSize } from './limits';

// 写真座標を変えず、メートルで表す寸法・位置だけを一括で変更します。
export function scalePhotoFromEdge(document, edgeIndex, requestedLength) {
  const currentLength = edgeLength(document, edgeIndex);
  if (!Number.isFinite(currentLength) || currentLength <= 0.000001) {
    return { error: 'この辺を計測できません。写真のカメラ設定を確認してください。' };
  }
  if (!Number.isFinite(requestedLength) || requestedLength <= 0) {
    return { error: '辺の長さは0より大きい数値で入力してください。' };
  }
  const ratio = requestedLength / currentLength;
  if (Math.abs(ratio - 1) < 1e-10) return { document };

  const next = structuredClone(document);
  next.width *= ratio;
  next.depth *= ratio;
  if (!isValidGardenSize(next.width, next.depth)) {
    return { error: '変更後の庭の幅・奥行きが1〜50mに収まる長さを指定してください。' };
  }
  const frame = next.photo.projectionSize;
  if (frame) {
    frame.width *= ratio;
    frame.depth *= ratio;
    if (!isValidGardenSize(frame.width, frame.depth)) {
      return { error: '変更後の写真投影の幅・奥行きが1〜50mに収まる長さを指定してください。' };
    }
  }
  const calibration = next.photo.calibration;
  if (calibration) {
    calibration.referenceWidth *= ratio;
    calibration.referenceDepth *= ratio;
    if ([calibration.referenceWidth, calibration.referenceDepth].some((value) => !Number.isFinite(value) || value < 0.1 || value > 50)) {
      return { error: '変更後のカメラ基準の幅・奥行きが0.1〜50mに収まる長さを指定してください。' };
    }
    calibration.translation = calibration.translation.map((value) => value * ratio);
  }
  for (const object of next.objects) {
    object.position.x *= ratio;
    object.position.z *= ratio;
  }
  const error = dimensionError(next, next.width, next.depth);
  if (error) return { error };
  return { document: next };
}
