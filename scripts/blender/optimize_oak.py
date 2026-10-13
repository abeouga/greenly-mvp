"""Pack the Blender oak into a small GLB without an external runtime decoder.

Run with backend/.venv/Scripts/python.exe after create_oak.py.
"""
import io
import json
import math
import struct
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / "frontend" / "public" / "models" / "tree-oak.glb"


def read_glb(path):
    raw = path.read_bytes()
    json_length = struct.unpack_from("<I", raw, 12)[0]
    document = json.loads(raw[20:20 + json_length])
    binary_start = 20 + json_length + 8
    return document, raw[binary_start:], len(raw)


def accessor_values(document, binary, index):
    accessor = document["accessors"][index]
    view = document["bufferViews"][accessor["bufferView"]]
    if accessor["componentType"] != 5126:
        raise ValueError("Run this optimizer only on a fresh Blender export.")
    width = {"VEC2": 2, "VEC3": 3}[accessor["type"]]
    start = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    stride = view.get("byteStride", width * 4)
    return [struct.unpack_from("<" + "f" * width, binary, start + i * stride)
            for i in range(accessor["count"])]


def main():
    document, binary, original_size = read_glb(PATH)
    original_views = document["bufferViews"]
    replacements = {}
    mesh_extents = {}
    maximum_error = 0
    for mesh_index, mesh in enumerate(document["meshes"]):
        primitive = mesh["primitives"][0]
        position_index = primitive["attributes"]["POSITION"]
        position = document["accessors"][position_index]
        values = accessor_values(document, binary, position_index)
        minimum = [min(v[axis] for v in values) for axis in range(3)]
        extent = [max(v[axis] for v in values) - minimum[axis] for axis in range(3)]
        mesh_extents[mesh_index] = (minimum, extent)
        packed = bytearray()
        for value in values:
            quantized = [round((value[axis] - minimum[axis]) / extent[axis] * 65535) for axis in range(3)]
            packed.extend(struct.pack("<4H", *quantized, 0))
            for axis in range(3):
                restored = minimum[axis] + quantized[axis] / 65535 * extent[axis]
                maximum_error = max(maximum_error, abs(value[axis] - restored))
        replacements[position["bufferView"]] = (bytes(packed), 8)
        position.update(componentType=5123, normalized=True, min=[0, 0, 0], max=[65535] * 3)

        normal_index = primitive["attributes"]["NORMAL"]
        normal = document["accessors"][normal_index]
        packed = bytearray()
        for value in accessor_values(document, binary, normal_index):
            # Compensate for the decoding node scale before the renderer's normal matrix.
            adjusted = [value[axis] * extent[axis] for axis in range(3)]
            length = math.sqrt(sum(v * v for v in adjusted))
            packed.extend(struct.pack("<4b", *[round(v / length * 127) for v in adjusted], 0))
        replacements[normal["bufferView"]] = (bytes(packed), 4)
        normal.update(componentType=5120, normalized=True)

        uv_index = primitive["attributes"]["TEXCOORD_0"]
        uv = document["accessors"][uv_index]
        values = accessor_values(document, binary, uv_index)
        if all(0 <= component <= 1 for value in values for component in value):
            packed = b"".join(struct.pack("<2H", *[round(v * 65535) for v in value]) for value in values)
            replacements[uv["bufferView"]] = (packed, 4)
            uv.update(componentType=5123, normalized=True)

    for node in document["nodes"]:
        if "mesh" not in node:
            continue
        if any(key in node for key in ["scale", "translation", "rotation", "matrix"]):
            raise ValueError("Apply Blender transforms before optimizing this asset.")
        minimum, extent = mesh_extents[node["mesh"]]
        node.update(translation=minimum, scale=extent)

    for image in document["images"]:
        view = original_views[image["bufferView"]]
        start = view.get("byteOffset", 0)
        source = Image.open(io.BytesIO(binary[start:start + view["byteLength"]]))
        output = io.BytesIO()
        source.save(output, format="WEBP", quality=88, method=6, alpha_quality=100, exact=True)
        replacements[image["bufferView"]] = (output.getvalue(), None)
        image["mimeType"] = "image/webp"
    for texture in document["textures"]:
        source = texture.pop("source")
        texture.setdefault("extensions", {})["EXT_texture_webp"] = {"source": source}
    for surface in document["materials"]:
        if surface["name"] == "Oak foliage":
            # Cutout leaves write depth. BLEND causes sorting artefacts and extra passes.
            surface.update(alphaMode="MASK", alphaCutoff=0.5, doubleSided=True)

    extensions = ["KHR_mesh_quantization", "EXT_texture_webp"]
    document["extensionsUsed"] = sorted(set(document.get("extensionsUsed", []) + extensions))
    document["extensionsRequired"] = extensions
    packed = bytearray()
    for index, view in enumerate(original_views):
        while len(packed) % 4:
            packed.append(0)
        old_start = view.get("byteOffset", 0)
        data, stride = replacements.get(index, (binary[old_start:old_start + view["byteLength"]], None))
        view.update(byteOffset=len(packed), byteLength=len(data))
        if stride:
            view["byteStride"] = stride
        packed.extend(data)
    while len(packed) % 4:
        packed.append(0)
    document["buffers"][0]["byteLength"] = len(packed)
    document["asset"]["generator"] += " / Kusakari quantization and WebP packing"
    metadata = json.dumps(document, separators=(",", ":")).encode()
    metadata += b" " * (-len(metadata) % 4)
    length = 12 + 8 + len(metadata) + 8 + len(packed)
    PATH.write_bytes(struct.pack("<III", 0x46546C67, 2, length)
                     + struct.pack("<II", len(metadata), 0x4E4F534A) + metadata
                     + struct.pack("<II", len(packed), 0x004E4942) + packed)
    report = {"bytesBefore": original_size, "bytesAfter": length,
              "reductionPercent": round((1 - length / original_size) * 100, 1),
              "maximumPositionErrorMeters": maximum_error,
              "triangles": sum(document["accessors"][p["indices"]]["count"] // 3
                               for m in document["meshes"] for p in m["primitives"]),
              "meshes": len(document["meshes"]), "materials": len(document["materials"]),
              "textures": len(document["textures"]), "dimensionsMeters": [2, 4, 2],
              "requiredExtensions": extensions, "foliageAlphaMode": "MASK"}
    (ROOT / "assets" / "blender" / "tree-oak-metrics.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
