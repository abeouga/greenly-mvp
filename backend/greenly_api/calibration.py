"""Metric, planar camera calibration. CV camera axes: right, down, forward."""
import math

import cv2
import numpy as np

from .errors import bad_request
from .schemas import CalibrationRequest, GardenPhoto, PhotoCalibration


def reject(message: str):
    bad_request('INVALID_CALIBRATION', message)


def solve_calibration(request: CalibrationRequest) -> PhotoCalibration:
    points = np.array([[p.x, p.y] for p in request.points], dtype=np.float64)
    if np.any(points < 0) or np.any(points > 1):
        reject('基準点は写真の内側に指定してください。')
    edges = np.roll(points, -1, axis=0) - points
    turns = edges[:, 0] * np.roll(edges[:, 1], -1) - edges[:, 1] * np.roll(edges[:, 0], -1)
    if np.any(turns >= -0.0001):
        reject('基準点は手前左→手前右→奥右→奥左の順で、十分な面積の長方形を指定してください。')
    w, d = request.referenceWidth / 2, request.referenceDepth / 2
    world = np.array([[-w, 0, d], [w, 0, d], [w, 0, -d], [-w, 0, -d]], dtype=np.float64)
    pixels = points * [request.imageWidth, request.imageHeight]
    cx, cy = request.imageWidth / 2, request.imageHeight / 2
    focal = request.focalLengthPx
    if focal is None:
        h, _ = cv2.findHomography(world[:, [0, 2]], pixels, 0)
        if h is None:
            reject('基準点からカメラを推定できません。点を選び直してください。')
        h = np.array([[1, 0, -cx], [0, 1, -cy], [0, 0, 1]]) @ h
        a = np.array([h[2, 0] * h[2, 1], h[2, 0] ** 2 - h[2, 1] ** 2])
        b = -np.array([h[:2, 0] @ h[:2, 1], h[:2, 0] @ h[:2, 0] - h[:2, 1] @ h[:2, 1]])
        if float(a @ a) < 1e-12:
            reject('この角度では画角を自動推定できません。「画角を手動指定」を使用してください。')
        squared = float(a @ b / (a @ a))
        if squared <= 0:
            reject('画角を推定できません。実際の長方形と寸法を確認するか、画角を手動指定してください。')
        focal = math.sqrt(squared)
    fov = math.degrees(2 * math.atan(cy / focal))
    if not 15 <= fov <= 110:
        reject('推定画角が対応範囲（縦15〜110度）を外れています。基準点・寸法・画角を確認してください。')
    intrinsic = np.array([[focal, 0, cx], [0, focal, cy], [0, 0, 1]], dtype=np.float64)
    try:
        result = cv2.solvePnPGeneric(world, pixels, intrinsic, None, flags=cv2.SOLVEPNP_IPPE)
        candidates = []
        for rvec, tvec in zip(result[1], result[2], strict=True):
            rvec, tvec = cv2.solvePnPRefineLM(world, pixels, intrinsic, None, rvec, tvec)
            rotation, _ = cv2.Rodrigues(rvec)
            location = -rotation.T @ tvec
            depths = (world @ rotation.T + tvec.reshape(1, 3))[:, 2]
            if location[1, 0] <= 0.05 or np.min(depths) <= 0.05:
                continue
            projected, _ = cv2.projectPoints(world, rvec, tvec, intrinsic, None)
            error = float(np.sqrt(np.mean(np.sum((projected.reshape(-1, 2) - pixels) ** 2, axis=1))))
            candidates.append((error, rotation, tvec))
    except cv2.error:
        reject('カメラを推定できません。基準点と実寸を確認してください。')
    if not candidates:
        reject('地面より上のカメラを推定できません。基準点の順序を確認してください。')
    error, rotation, translation = min(candidates, key=lambda item: item[0])
    if not math.isfinite(error) or error > max(3, min(request.imageWidth, request.imageHeight) * 0.006):
        reject('基準点と長方形の一致が不十分です。点・実寸・画角を調整してください。')
    return PhotoCalibration(
        points=request.points, referenceWidth=request.referenceWidth, referenceDepth=request.referenceDepth,
        focalLengthPx=focal, focalSource='manual' if request.focalLengthPx is not None else 'estimated',
        rotation=rotation.flatten().tolist(), translation=translation.flatten().tolist(),
        reprojectionErrorPx=error,
    )


def validate_calibrated_photo(photo: GardenPhoto, width: float, depth: float) -> None:
    calibration = photo.calibration
    if calibration is None:
        return
    # Recompute on save: never accept an arbitrary client-supplied camera matrix.
    calibration = solve_calibration(CalibrationRequest(
        imageWidth=photo.imageWidth, imageHeight=photo.imageHeight, points=calibration.points,
        referenceWidth=calibration.referenceWidth, referenceDepth=calibration.referenceDepth,
        focalLengthPx=calibration.focalLengthPx if calibration.focalSource == 'manual' else None,
    ))
    r = np.array(calibration.rotation).reshape(3, 3)
    t = np.array(calibration.translation)
    f = calibration.focalLengthPx
    origin = -r.T @ t
    for point in photo.boundary:
        ray = r.T @ np.array([(point.x - 0.5) * photo.imageWidth / f,
                              (point.y - 0.5) * photo.imageHeight / f, 1])
        if ray[1] >= -1e-8:
            reject('庭の輪郭が地平線を越えています。地面上に描き直してください。')
        ground = origin - ray * origin[1] / ray[1]
        if abs(ground[0]) > width / 2 + 0.05 or abs(ground[2]) > depth / 2 + 0.05:
            reject('庭の輪郭が庭の実寸範囲を超えています。写真上の輪郭または基準点を調整してください。')
    photo.calibration = calibration
