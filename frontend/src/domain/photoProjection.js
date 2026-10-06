// A projective transform maps the metric ground plane to the four image corners.
// It aligns only points on y=0; a single photograph cannot locate tall objects in 3D.
export function homography(from, to) {
    const h = homographyMatrix(from, to);
    if (!h)
        return null;
    return ({ x, y }) => {
        const w = h[6] * x + h[7] * y + 1;
        return { x: (h[0] * x + h[1] * y + h[2]) / w, y: (h[3] * x + h[4] * y + h[5]) / w };
    };
}
export function homographyMatrix(from, to) {
    if (from.length !== 4 || to.length !== 4)
        return null;
    const rows = from.map(({ x, y }, i) => [
        [x, y, 1, 0, 0, 0, -x * to[i].x, -y * to[i].x, to[i].x],
        [0, 0, 0, x, y, 1, -x * to[i].y, -y * to[i].y, to[i].y],
    ]).flat();
    for (let col = 0; col < 8; col++) {
        let pivot = col;
        for (let row = col + 1; row < 8; row++)
            if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col]))
                pivot = row;
        if (Math.abs(rows[pivot][col]) < 1e-10)
            return null;
        [rows[pivot], rows[col]] = [rows[col], rows[pivot]];
        const divisor = rows[col][col];
        for (let k = col; k < 9; k++)
            rows[col][k] /= divisor;
        for (let row = 0; row < 8; row++) {
            if (row === col)
                continue;
            const factor = rows[row][col];
            for (let k = col; k < 9; k++)
                rows[row][k] -= factor * rows[col][k];
        }
    }
    return [...rows.map((row) => row[8]), 1];
}
export const unitCorners = [
    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 },
];
export function validCorners(points) {
    if (points.length !== 4 || points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1))
        return false;
    const cross = points.map((a, i) => {
        const b = points[(i + 1) % 4];
        const c = points[(i + 2) % 4];
        return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    });
    return cross.every((value) => value < -0.0001) && homography(unitCorners, points) !== null;
}
function orientation(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
function onSegment(a, b, p) {
    return Math.abs(orientation(a, b, p)) < 1e-9
        && p.x >= Math.min(a.x, b.x) - 1e-9 && p.x <= Math.max(a.x, b.x) + 1e-9
        && p.y >= Math.min(a.y, b.y) - 1e-9 && p.y <= Math.max(a.y, b.y) + 1e-9;
}
function segmentsCross(a, b, c, d) {
    const abC = orientation(a, b, c), abD = orientation(a, b, d);
    const cdA = orientation(c, d, a), cdB = orientation(c, d, b);
    return (abC * abD < 0 && cdA * cdB < 0)
        || onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
}
export function validBoundary(points) {
    if (points.length < 3 || points.length > 64 || points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1))
        return false;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        if (Math.hypot(a.x - b.x, a.y - b.y) < 0.001)
            return false;
        area += a.x * b.y - b.x * a.y;
        for (let j = i + 1; j < points.length; j++) {
            if (j === i + 1 || (i === 0 && j === points.length - 1))
                continue;
            const c = points[j], d = points[(j + 1) % points.length];
            if (segmentsCross(a, b, c, d))
                return false;
        }
    }
    return Math.abs(area) >= 0.0002;
}
export function validSurface(photo) {
    if (!validCorners(photo.corners) || !validBoundary(photo.boundary))
        return false;
    if (photo.projectionSize || photo.calibration)
        return true;
    return photo.boundary.every((point) => photo.corners.every((a, index) => orientation(a, photo.corners[(index + 1) % 4], point) <= 0.000001));
}
// Map the drawn outline's image bounds to the garden's width/depth.
// The four transform anchors are derived data, not four user clicks.
export function withPhotoBoundary(photo, boundary) {
    if (photo.projectionSize)
        return { ...photo, boundary };
    if (boundary.length === 0)
        return { ...photo, corners: [], boundary };
    const left = Math.min(...boundary.map((p) => p.x)), right = Math.max(...boundary.map((p) => p.x));
    const top = Math.min(...boundary.map((p) => p.y)), bottom = Math.max(...boundary.map((p) => p.y));
    return { ...photo, boundary, corners: [
            { x: left, y: bottom }, { x: right, y: bottom }, { x: right, y: top }, { x: left, y: top },
        ] };
}
export function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i], b = polygon[j];
        if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x)
            inside = !inside;
    }
    return inside;
}
