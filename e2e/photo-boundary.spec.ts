import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page, type APIRequestContext } from '@playwright/test';
import type { GardenDocument } from '../frontend/src/types/garden.js';

const apiBase = 'http://127.0.0.1:18080/api';
const artifactDirectory = resolve('artifacts/e2e');
const corners = [[0.1, 0.85], [0.9, 0.85], [0.8, 0.2], [0.2, 0.2]];
const outline = [[0.15, 0.8], [0.8, 0.8], [0.75, 0.55], [0.65, 0.55], [0.6, 0.25], [0.25, 0.25]];
let createdGardenIds: string[] = [];

test.beforeEach(() => { createdGardenIds = []; });
test.afterEach(async ({ request }) => {
  for (const id of createdGardenIds) {
    expect([204, 404]).toContain((await request.delete(`${apiBase}/gardens/${id}`)).status());
  }
});

async function preparePhoto(page: Page) {
  await page.goto('/');
  await page.getByLabel('庭の名前').fill(`E2E photo boundary ${Date.now()}`);
  await page.getByRole('button', { name: '庭を作成' }).click();
  await page.waitForURL(/\/gardens\//);
  const id = new URL(page.url()).pathname.split('/').at(-1)!;
  createdGardenIds.push(id);
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await page.getByRole('button', { name: '写真＋設計' }).click();
  const imageDataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 600;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#708e91'; context.fillRect(0, 0, 800, 600);
    context.fillStyle = '#647744';
    context.beginPath(); context.moveTo(80, 520); context.lineTo(720, 520); context.lineTo(640, 100); context.lineTo(160, 100); context.fill();
    return canvas.toDataURL('image/png');
  });
  await page.getByLabel('庭の写真を選択').setInputFiles({ name: 'garden.png', mimeType: 'image/png', buffer: Buffer.from(imageDataUrl.split(',')[1], 'base64') });
  await expect(page.locator('.photo-stage image')).toBeVisible();
  return { id, imageDataUrl };
}

async function screenPoint(page: Page, x: number, y: number) {
  return page.locator('.photo-stage').evaluate((element, coords) => {
    const screen = new DOMPoint(coords.x * 800, coords.y * 600).matrixTransform((element as SVGSVGElement).getScreenCTM()!);
    return { x: screen.x, y: screen.y };
  }, { x, y });
}

async function clickImage(page: Page, x: number, y: number) {
  const point = await screenPoint(page, x, y);
  await page.mouse.click(point.x, point.y);
}

async function moveImage(page: Page, x: number, y: number) {
  const point = await screenPoint(page, x, y);
  await page.mouse.move(point.x, point.y);
  await expect.poll(async () => page.getByTestId('photo-preview-edge').evaluate((element, target) => {
    const line = element as SVGLineElement;
    const end = new DOMPoint(line.x2.baseVal.value, line.y2.baseVal.value).matrixTransform(line.getScreenCTM()!);
    return Math.hypot(end.x - target.x, end.y - target.y);
  }, point)).toBeLessThan(2);
}

async function gardenJson(request: APIRequestContext, id: string): Promise<GardenDocument> {
  const response = await request.get(`${apiBase}/gardens/${id}`);
  expect(response.ok()).toBeTruthy();
  return await response.json() as GardenDocument;
}

async function saveArtifact(request: APIRequestContext, id: string, name: string) {
  const document = await gardenJson(request, id);
  await mkdir(artifactDirectory, { recursive: true });
  await writeFile(resolve(artifactDirectory, name), `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return document;
}

test('I. 仮線追従・始点で6点輪郭確定・配置・保存復元・3D切替', async ({ page, request }) => {
  const { id, imageDataUrl } = await preparePhoto(page);
  await clickImage(page, ...corners[0] as [number, number]);
  await moveImage(page, 0.5, 0.75);
  await expect(page.locator('.photo-stage circle[fill="#fff"]')).toHaveCount(1);
  for (const [x, y] of corners.slice(1)) await clickImage(page, x, y);
  await expect(page.getByTestId('photo-ground')).toHaveCount(0);
  await expect(page.getByTestId('save-garden')).toBeDisabled();
  await expect(page.getByRole('button', { name: '3D庭', exact: true })).toBeDisabled();
  await expect(page.getByTestId('save-status')).toHaveText('輪郭を描画中');
  await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(0);
  await clickImage(page, ...outline[0] as [number, number]);
  await moveImage(page, 0.5, 0.72);
  const previousEnd = await page.getByTestId('photo-preview-edge').getAttribute('x2');
  await moveImage(page, 0.7, 0.65);
  expect(await page.getByTestId('photo-preview-edge').getAttribute('x2')).not.toBe(previousEnd);
  await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(1);
  for (const [index, [x, y]] of outline.slice(1).entries()) {
    await clickImage(page, x, y);
    if (index === 2) {
      await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(4);
      await expect(page.getByTestId('photo-ground')).toHaveCount(0);
      await expect(page.getByTestId('save-garden')).toBeDisabled();
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await moveImage(page, 0.45, 0.45);
  await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-boundary-draft.png'), fullPage: true });
  expect((await gardenJson(request, id)).photo).toBeNull();
  const start = page.getByRole('button', { name: '始点につないで輪郭を確定' });
  await start.hover();
  const firstX = await start.getAttribute('cx');
  await expect(page.getByTestId('photo-preview-edge')).toHaveAttribute('x2', firstX!);
  await start.click();
  await expect(page.getByTestId('photo-ground')).toBeVisible();
  await expect(page.getByTestId('photo-preview-edge')).toHaveCount(0);
  await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(6);
  await expect(page.getByRole('button', { name: '輪郭を確定', exact: true })).toHaveCount(0);
  await page.getByTestId('asset-tree_oak').click();
  await clickImage(page, 0.5, 0.65);
  await expect(page.getByTestId('object-row-0')).toBeVisible();
  await page.getByTestId('save-garden').click();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  const stored = await saveArtifact(request, id, 'garden-photo-polygon.json');
  expect(stored.photo?.corners).toHaveLength(4);
  expect(stored.photo?.boundary).toHaveLength(6);
  expect(stored.photo?.dataUrl).toBe(imageDataUrl);
  expect(stored.objects).toHaveLength(1);
  await page.reload();
  await expect(page.getByRole('button', { name: '写真＋設計' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.photo-stage image')).toBeVisible();
  await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(6);
  await expect(page.getByTestId('photo-ground')).toBeVisible();
  await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-polygon.png'), fullPage: true });
  await page.getByRole('button', { name: '3D庭', exact: true }).click();
  await expect(page.locator('.photo-stage')).toHaveCount(0);
  await expect(page.getByTestId('garden-canvas')).toBeVisible();
  await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
  const canvas = page.locator('[data-testid="garden-canvas"] canvas');
  const beforeOrbit = await canvas.screenshot();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('3Dキャンバスが表示されていません。');
  await page.mouse.move(bounds.x + bounds.width * 0.75, bounds.y + bounds.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.55, bounds.y + bounds.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await canvas.screenshot()).equals(beforeOrbit)).toBe(false);
  await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-polygon-3d.png'), fullPage: true });
  const invalid = structuredClone(stored);
  invalid.photo!.boundary = [{ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.8 }, { x: 0.2, y: 0.8 }, { x: 0.8, y: 0.2 }];
  expect((await request.put(`${apiBase}/gardens/${id}`, { data: invalid })).status()).toBe(400);
  const wrongOrder = structuredClone(stored);
  [wrongOrder.photo!.corners[1], wrongOrder.photo!.corners[2]] = [wrongOrder.photo!.corners[2], wrongOrder.photo!.corners[1]];
  expect((await request.put(`${apiBase}/gardens/${id}`, { data: wrongOrder })).status()).toBe(400);
  expect((await gardenJson(request, id)).revision).toBe(stored.revision);
});

test('J. 未完成・交差輪郭を拒否し、戻す・ボタン確定・取消で保存済み輪郭を維持', async ({ page, request }) => {
  const { id, imageDataUrl } = await preparePhoto(page);
  for (const [x, y] of corners) await clickImage(page, x, y);
  await clickImage(page, 0.25, 0.7);
  await clickImage(page, 0.65, 0.3);
  const finish = page.getByRole('button', { name: '輪郭を確定', exact: true });
  const start = page.getByRole('button', { name: '始点につないで輪郭を確定' });
  await expect(finish).toBeDisabled();
  await start.click();
  await expect(page.getByRole('alert')).toContainText('3〜64点');
  await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(2);
  await clickImage(page, 0.25, 0.3);
  await clickImage(page, 0.65, 0.7);
  await expect(finish).toBeDisabled();
  await start.click();
  await expect(page.getByRole('alert')).toContainText('線の交差');
  await expect(page.getByTestId('photo-ground')).toHaveCount(0);
  await expect(page.getByTestId('save-garden')).toBeDisabled();
  await page.getByRole('button', { name: '最後の点を戻す' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect(page.getByTestId('photo-ground')).toBeVisible();
  await page.getByTestId('save-garden').click();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  const saved = await saveArtifact(request, id, 'garden-photo-triangle.json');
  expect(saved.photo?.boundary).toHaveLength(3);
  await page.reload();
  await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(3);
  await page.getByRole('button', { name: '多角形を描く' }).click();
  for (const [x, y] of outline.slice(0, 4)) await clickImage(page, x, y);
  await expect(finish).toBeEnabled();
  await expect(page.getByTestId('save-garden')).toBeDisabled();
  await expect(page.getByRole('button', { name: '3D庭', exact: true })).toBeDisabled();
  await expect(page.getByTestId('photo-ground')).toHaveCount(0);
  expect(await gardenJson(request, id)).toEqual(saved);
  await page.getByRole('button', { name: '輪郭の描画を取消' }).click();
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(3);
  await expect(page.getByTestId('photo-ground')).toBeVisible();
  await expect(page.getByTestId('photo-preview-edge')).toHaveCount(0);
  expect(await gardenJson(request, id)).toEqual(saved);
  await page.getByRole('button', { name: '多角形を描く' }).click();
  for (const [x, y] of outline.slice(0, 4)) await clickImage(page, x, y);
  let unloadDialog = false;
  page.once('dialog', async (dialog) => { unloadDialog = dialog.type() === 'beforeunload'; await dialog.accept(); });
  await page.reload();
  expect(unloadDialog).toBe(true);
  await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(3);
  await expect(page.getByTestId('save-status')).toHaveText('保存済み');
  expect(await gardenJson(request, id)).toEqual(saved);
  await page.screenshot({ path: resolve(artifactDirectory, 'garden-photo-triangle.png'), fullPage: true });
  await page.getByRole('button', { name: '多角形を描く' }).click();
  await clickImage(page, ...outline[0] as [number, number]);
  await page.getByLabel('庭の写真を選択').setInputFiles({ name: 'garden.png', mimeType: 'image/png', buffer: Buffer.from(imageDataUrl.split(',')[1], 'base64') });
  await expect(page.locator('.photo-stage circle[fill="#fff"]')).toHaveCount(0);
  await expect(page.locator('.photo-stage circle[fill="#ffbd68"]')).toHaveCount(0);
  await expect(finish).toHaveCount(0);
  await expect(page.locator('.photo-hint')).toContainText('投影基準 1/4');
  expect(await gardenJson(request, id)).toEqual(saved);
});
