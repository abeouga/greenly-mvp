import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = resolve(root, 'frontend/public/models');
await mkdir(output, { recursive: true });

const box = (color, translation, scale) => ({ shape: 'box', color, translation, scale });
const sphere = (color, translation, scale) => ({ shape: 'sphere', color, translation, scale });
const cylinder = (color, translation, scale) => ({ shape: 'cylinder', color, translation, scale });

const assets = [
  {
    file: 'tree-oak.glb',
    parts: [
      cylinder('#80603b', [0, 1.35, 0], [0.36, 2.7, 0.36]),
      sphere('#4f7f45', [0, 3, 0], [2, 2, 2]),
    ],
  },
  {
    file: 'shrub-boxwood.glb',
    parts: [
      sphere('#5f8b4e', [0, 0.6, 0], [1.2, 1.2, 1.2]),
      sphere('#70995b', [-0.2, 0.55, 0.08], [0.38, 0.38, 0.38]),
      sphere('#4e7843', [0.22, 0.52, -0.06], [0.36, 0.36, 0.36]),
    ],
  },
  {
    file: 'brick-paver.glb',
    parts: [box('#aa7252', [0, 0.075, 0], [0.6, 0.15, 0.2])],
  },
  {
    file: 'bench-wood.glb',
    parts: [
      box('#8c6545', [0, 0.47, 0], [1.6, 0.12, 0.62]),
      box('#8c6545', [0, 0.625, -0.27], [1.6, 0.45, 0.1]),
      box('#574536', [-0.62, 0.23, -0.22], [0.09, 0.46, 0.09]),
      box('#574536', [0.62, 0.23, -0.22], [0.09, 0.46, 0.09]),
      box('#574536', [-0.62, 0.23, 0.22], [0.09, 0.46, 0.09]),
      box('#574536', [0.62, 0.23, 0.22], [0.09, 0.46, 0.09]),
      box('#574536', [-0.62, 0.625, -0.27], [0.09, 0.45, 0.09]),
      box('#574536', [0.62, 0.625, -0.27], [0.09, 0.45, 0.09]),
    ],
  },
];

function meshData(shape) {
  if (shape === 'box') {
    return {
      positions: [
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
        -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
      ],
      indices: [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 2, 3, 7, 2, 7, 6, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5],
    };
  }

  const positions = [];
  const indices = [];
  const latitudes = shape === 'sphere' ? 10 : 1;
  const longitudes = 16;
  for (let y = 0; y <= latitudes; y += 1) {
    const v = y / latitudes;
    const phi = Math.PI * v;
    for (let x = 0; x <= longitudes; x += 1) {
      const u = x / longitudes;
      const theta = u * Math.PI * 2;
      const radius = shape === 'sphere' ? Math.sin(phi) * 0.5 : 0.5;
      const vertical = shape === 'sphere' ? Math.cos(phi) * 0.5 : v - 0.5;
      positions.push(Math.cos(theta) * radius, vertical, Math.sin(theta) * radius);
    }
  }
  for (let y = 0; y < latitudes; y += 1) {
    for (let x = 0; x < longitudes; x += 1) {
      const current = y * (longitudes + 1) + x;
      const next = current + longitudes + 1;
      indices.push(current, next, current + 1, next, next + 1, current + 1);
    }
  }
  if (shape === 'cylinder') {
    const topStart = positions.length / 3;
    positions.push(0, 0.5, 0);
    const bottomStart = positions.length / 3;
    positions.push(0, -0.5, 0);
    for (let x = 0; x < longitudes; x += 1) {
      const a = x;
      const b = x + 1;
      const c = latitudes * (longitudes + 1) + x;
      const d = c + 1;
      indices.push(a, c, b, b, c, d, topStart, c, d, bottomStart, b, a);
    }
  }
  return { positions, indices };
}

function makeGlb(parts) {
  const binaryChunks = [];
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const materials = [];
  const nodes = [];
  let binaryLength = 0;

  const append = (bytes, target) => {
    const padding = (4 - (binaryLength % 4)) % 4;
    if (padding) {
      binaryChunks.push(Buffer.alloc(padding));
      binaryLength += padding;
    }
    const offset = binaryLength;
    binaryChunks.push(bytes);
    binaryLength += bytes.length;
    const view = { buffer: 0, byteOffset: offset, byteLength: bytes.length };
    if (target) view.target = target;
    bufferViews.push(view);
    return bufferViews.length - 1;
  };

  for (const [index, part] of parts.entries()) {
    const { positions, indices } = meshData(part.shape);
    const positionBytes = Buffer.from(new Float32Array(positions).buffer);
    const indexBytes = Buffer.from(new Uint16Array(indices).buffer);
    const positionView = append(positionBytes, 34962);
    const indexView = append(indexBytes, 34963);
    const triples = Array.from({ length: positions.length / 3 }, (_, point) => positions.slice(point * 3, point * 3 + 3));
    const bounds = [0, 1, 2].map((axis) => ({
      min: Math.min(...triples.map((point) => point[axis])),
      max: Math.max(...triples.map((point) => point[axis])),
    }));
    accessors.push({ bufferView: positionView, componentType: 5126, count: positions.length / 3, type: 'VEC3', min: bounds.map((item) => item.min), max: bounds.map((item) => item.max) });
    accessors.push({ bufferView: indexView, componentType: 5123, count: indices.length, type: 'SCALAR' });
    materials.push({ name: `Development material ${index + 1}`, pbrMetallicRoughness: { baseColorFactor: [...colorToRgb(part.color), 1], metallicFactor: 0, roughnessFactor: 1 } });
    meshes.push({ name: `Development shape ${index + 1}`, primitives: [{ attributes: { POSITION: index * 2 }, indices: index * 2 + 1, material: index, mode: 4 }] });
    nodes.push({ mesh: index, translation: part.translation, scale: part.scale });
  }

  const binary = Buffer.concat(binaryChunks);
  const document = {
    asset: { version: '2.0', generator: 'Greenly basic-shape asset generator' },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, index) => index) }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binary.length }],
  };
  const json = Buffer.from(JSON.stringify(document));
  const jsonPadding = (4 - (json.length % 4)) % 4;
  const paddedJson = Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (binary.length % 4)) % 4;
  const paddedBinary = Buffer.concat([binary, Buffer.alloc(binPadding)]);
  const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBinary.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(paddedBinary.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binHeader, paddedBinary]);
}

function colorToRgb(hex) {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
}

for (const asset of assets) {
  await writeFile(resolve(output, asset.file), makeGlb(asset.parts));
  process.stdout.write(`Generated ${asset.file}\n`);
}
