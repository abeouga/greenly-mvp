import { isValidGardenSize } from './limits';
import { calibratedBoundaryError } from './calibratedProjection';
import { photoGroundPoint } from './polygonEdges';
export function dimensionError(document, width, depth) {
    if (!isValidGardenSize(width, depth))
        return '幅・奥行きはそれぞれ1〜50mで入力してください。';
    if (document.objects.some((object) => Math.abs(object.position.x) > width / 2 || Math.abs(object.position.z) > depth / 2))
        return '配置済みの物体が土台の外に出るため変更できません。物体を内側へ移動するか、辺の長さを大きくしてください。';
    if (document.photo?.projectionSize && !document.photo.calibration) {
        const photo = document.photo;
        if (photo.boundary.some((p) => { const q = photoGroundPoint(photo, width, depth, p); return !q || Math.abs(q.x) > width / 2 + 0.05 || Math.abs(q.z) > depth / 2 + 0.05; }))
            return '多角形の輪郭が範囲外になります。写真上の辺を編集してください。';
    }
    return document.photo ? calibratedBoundaryError(document.photo, width, depth) : null;
}
