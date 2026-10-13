"""Create an original, deterministic oak asset. Run with Blender --background --python."""
import json
import math
import random
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets" / "blender"
MODELS = ROOT / "frontend" / "public" / "models"
RANDOM = random.Random(29041)


def save_image(name, pixels):
    height, width, channels = pixels.shape
    image = bpy.data.images.new(name, width, height, alpha=channels == 4)
    image.pixels.foreach_set(pixels.astype(np.float32).ravel())
    image.filepath_raw = str(SOURCE / f"{name}.png")
    image.file_format = "PNG"
    image.save()
    image.pack()
    return image


def leaf_texture():
    """One twig with nine serrated leaves, veins, and green padding for mipmaps."""
    size = 512
    yy, xx = np.mgrid[0:size, 0:size] / (size - 1)
    pixels = np.zeros((size, size, 4))
    pixels[:, :, :3] = [0.19, 0.31, 0.075]
    noise = np.random.default_rng(21).random((size, size))
    stem = (abs(xx - (0.49 + 0.025 * yy)) < 0.006) & (yy > 0.04) & (yy < 0.89)
    pixels[stem] = [0.25, 0.31, 0.10, 1]
    leaves = []
    for index, height in enumerate([0.22, 0.39, 0.56, 0.72]):
        for side in [-1, 1]:
            leaves.append((0.49 + 0.025 * height, height, side * (0.76 - 0.07 * index), 0.26))
    leaves.append((0.51, 0.73, 0.03, 0.25))
    for index, (start_x, start_y, dx, dy) in enumerate(leaves):
        length = math.hypot(dx * 0.36, dy)
        angle = math.atan2(dy, dx * 0.36)
        along = (xx - start_x) * math.cos(angle) + (yy - start_y) * math.sin(angle)
        across = -(xx - start_x) * math.sin(angle) + (yy - start_y) * math.cos(angle)
        t = np.clip(along / length, 0, 1)
        width = 0.072 * np.sin(t * math.pi) ** 0.8
        width *= 1 + 0.055 * np.sin(t * math.pi * 20)
        mask = (along > 0) & (along < length) & (abs(across) < width)
        ridge = np.exp(-abs(across) * 210)
        vein_phase = np.mod(t * 8 - abs(across) * 17, 1)
        veins = np.exp(-np.minimum(vein_phase, 1 - vein_phase) * 65)
        shade = 0.69 + 0.23 * np.sin(t * math.pi) + 0.12 * noise
        shade += 0.20 * ridge + 0.10 * veins
        shade -= 0.12 * abs(across) / np.maximum(width, 0.001)
        base = np.array([0.28, 0.43, 0.105]) * (0.88 + index * 0.022)
        for channel in range(3):
            pixels[:, :, channel][mask] = (shade * base[channel])[mask]
        pixels[:, :, 3][mask] = 1
    return save_image("oak-leaves", pixels)


def bark_texture():
    yy, xx = np.mgrid[0:512, 0:256].astype(float)
    yy /= 511
    xx /= 255
    noise = np.random.default_rng(34).random(xx.shape)
    grooves = np.sin(xx * math.tau * 23 + np.sin(yy * 18) * 0.7)
    grain = np.sin(xx * math.tau * 79 + np.cos(yy * 31) * 1.1)
    brightness = 0.78 + grooves * 0.13 + grain * 0.08 + noise * 0.18
    image = np.ones((512, 256, 4))
    for channel, color in enumerate([0.37, 0.30, 0.22]):
        image[:, :, channel] = brightness * color
    return save_image("oak-bark", image)


def material(name, image, leaves=False):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    result.use_backface_culling = not leaves
    nodes = result.node_tree.nodes
    shader = nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = 0.91 if leaves else 0.98
    shader.inputs["Specular IOR Level"].default_value = 0.23
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    result.node_tree.links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    if leaves:
        result.node_tree.links.new(texture.outputs["Alpha"], shader.inputs["Alpha"])
        result.surface_render_method = "DITHERED"
    return result


class MeshBuilder:
    def __init__(self, name):
        self.name = name
        self.vertices = []
        self.faces = []
        self.uvs = []

    def branch(self, points, radius, sides):
        first = len(self.vertices)
        rings = len(points)
        for index, point in enumerate(points):
            tangent = points[min(index + 1, rings - 1)] - points[max(index - 1, 0)]
            tangent.normalize()
            right = tangent.cross(Vector((0, 1, 0)))
            if right.length < 0.01:
                right = tangent.cross(Vector((1, 0, 0)))
            right.normalize()
            forward = tangent.cross(right).normalized()
            thickness = max(radius * (1 - index / (rings - 1)) ** 0.8, radius * 0.10)
            for side in range(sides + 1):
                angle = side / sides * math.tau
                offset = right * math.cos(angle) + forward * math.sin(angle)
                self.vertices.append(tuple(point + offset * thickness))
        for ring in range(rings - 1):
            for side in range(sides):
                a = first + ring * (sides + 1) + side
                b = a + sides + 1
                self.faces.append((a, a + 1, b + 1, b))
                u1, u2 = side / sides, (side + 1) / sides
                v1, v2 = ring / (rings - 1) * 2, (ring + 1) / (rings - 1) * 2
                self.uvs.append(((u1, v1), (u2, v1), (u2, v2), (u1, v2)))

    def foliage(self, base, direction, length, twist):
        up = direction.normalized()
        side = up.cross(Vector((0, 0, 1)))
        if side.length < 0.01:
            side = Vector((1, 0, 0))
        side.normalize()
        normal = up.cross(side).normalized()
        right = side * math.cos(twist) + normal * math.sin(twist)
        normal = up.cross(right).normalized()
        first = len(self.vertices)
        for height in [0, 1]:
            for x in [-0.5, 0, 0.5]:
                bend = 0.025 if x == 0 else 0
                self.vertices.append(tuple(base + up * length * height + right * length * x + normal * bend))
        for side in range(2):
            self.faces.append((first + side, first + side + 1, first + side + 4, first + side + 3))
            u1, u2 = side / 2, (side + 1) / 2
            self.uvs.append(((u1, 0), (u2, 0), (u2, 1), (u1, 1)))

    def create(self, surface):
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        uv = mesh.uv_layers.new(name="UVMap")
        for polygon, coordinates in zip(mesh.polygons, self.uvs, strict=True):
            polygon.use_smooth = True
            for loop, coordinate in zip(polygon.loop_indices, coordinates, strict=True):
                uv.data[loop].uv = coordinate
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.collection.objects.link(obj)
        obj.data.materials.append(surface)
        return obj


def make_tree():
    wood = MeshBuilder("Oak trunk and branches")
    leaves = MeshBuilder("Oak leaf clusters")
    trunk = [Vector((0.035 * math.sin(i * 0.7), 0.025 * math.sin(i), i * 3.95 / 15)) for i in range(16)]
    wood.branch(trunk, 0.105, 9)
    for index in range(23):
        height = 1.25 + index / 22 * 2.17
        angle = index * 2.39996 + RANDOM.uniform(-0.23, 0.23)
        reach = 1.15 * math.sin((height - 0.7) / 3.4 * math.pi) ** 0.7
        reach *= RANDOM.uniform(0.85, 1.10)
        start = Vector((0, 0, height))
        radial = Vector((math.cos(angle), math.sin(angle), 0))
        points = [start + radial * reach * t + Vector((0, 0, 0.48 * t * t)) for t in [0, 0.25, 0.5, 0.75, 1]]
        wood.branch(points, 0.031 * (1 - index / 40), 6)
        for branch_index in range(4):
            origin = points[branch_index + 1]
            turn = angle + (-1 if branch_index % 2 else 1) * RANDOM.uniform(0.5, 1.25)
            direction = Vector((math.cos(turn), math.sin(turn), RANDOM.uniform(0.6, 1.1)))
            direction.normalize()
            extent = RANDOM.uniform(0.25, 0.40)
            tip = origin + direction * extent
            wood.branch([origin, origin.lerp(tip, 0.5), tip], 0.009, 4)
            for leaf_index in range(7):
                spread = Vector((RANDOM.uniform(-0.14, 0.14), RANDOM.uniform(-0.14, 0.14), RANDOM.uniform(-0.08, 0.10)))
                base = origin.lerp(tip, 0.35 + leaf_index / 10) + spread
                leaf_direction = direction + Vector((RANDOM.uniform(-0.65, 0.65), RANDOM.uniform(-0.65, 0.65), RANDOM.uniform(-0.5, 0.6)))
                leaves.foliage(base, leaf_direction, RANDOM.uniform(0.30, 0.43), RANDOM.uniform(-math.pi, math.pi))
    objects = [wood.create(material("Oak bark", bark_texture())), leaves.create(material("Oak foliage", leaf_texture(), True))]
    all_vertices = [v.co for obj in objects for v in obj.data.vertices]
    minimum = Vector(tuple(min(v[axis] for v in all_vertices) for axis in range(3)))
    maximum = Vector(tuple(max(v[axis] for v in all_vertices) for axis in range(3)))
    # Keep the existing tree_oak catalogue meaning: 2m x 4m x 2m and ground-centred origin.
    for obj in objects:
        for vertex in obj.data.vertices:
            vertex.co.x = (vertex.co.x - (minimum.x + maximum.x) / 2) * 2 / (maximum.x - minimum.x)
            vertex.co.y = (vertex.co.y - (minimum.y + maximum.y) / 2) * 2 / (maximum.y - minimum.y)
            vertex.co.z = (vertex.co.z - minimum.z) * 4 / (maximum.z - minimum.z)
        obj.select_set(True)
    return objects


def main():
    SOURCE.mkdir(parents=True, exist_ok=True)
    MODELS.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    objects = make_tree()
    bpy.context.view_layer.objects.active = objects[0]
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "tree-oak.blend"), compress=True)
    path = MODELS / "tree-oak.glb"
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
                              export_texcoords=True, export_normals=True, export_materials="EXPORT",
                              export_cameras=False, export_lights=False, export_animations=False,
                              export_yup=True, export_image_format="AUTO")
    triangles = sum(sum(len(p.vertices) - 2 for p in obj.data.polygons) for obj in objects)
    print(json.dumps({"file": str(path), "bytes": path.stat().st_size, "triangles": triangles,
                      "meshes": len(objects), "leaf_clusters": 23 * 4 * 7}, indent=2))


if __name__ == "__main__":
    main()
