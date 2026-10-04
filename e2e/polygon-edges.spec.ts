import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import type { GardenDocument } from '../frontend/src/types/garden.js';

const api = 'http://127.0.0.1:18080/api';
const directory = resolve('artifacts/e2e');
const boundary = [{ x: .2, y: .8 }, { x: .8, y: .8 }, { x: .8, y: .5 }, { x: .55, y: .5 }, { x: .55, y: .2 }, { x: .2, y: .2 }];

test('R. 6辺の写真輪郭を直接編集・閉じ辺・自己交差拒否・保存復元', async ({ page, request }) => {
  await mkdir(directory, { recursive: true });
  const initial = await (await request.post(`${api}/gardens`, { data: { name: `E2E polygon edges ${Date.now()}` } })).json() as GardenDocument;
  try {
    await page.goto(`/gardens/${initial.id}`);
    const dataUrl = await page.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 750;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#a3af93'; ctx.fillRect(0, 0, 1000, 750);
      ctx.fillStyle = '#d9d6c8'; ctx.fillRect(500, 80, 350, 250);
      ctx.fillStyle = '#68765b'; ctx.fillRect(60, 70, 100, 610);
      ctx.fillStyle = '#e6e1d2'; ctx.font = '22px sans-serif'; ctx.fillText('POLYGON / SYNTHETIC IMAGE', 200, 80);
      return canvas.toDataURL('image/png');
    });
    const photo = { dataUrl, imageWidth: 1000, imageHeight: 750, boundary,
      corners: [{ x: .2, y: .8 }, { x: .8, y: .8 }, { x: .8, y: .2 }, { x: .2, y: .2 }] };
    expect((await request.put(`${api}/gardens/${initial.id}`, { data: { ...initial, photo } })).status()).toBe(200);
    await page.reload();
    await expect(page.getByTestId('photo-edge-5')).toBeVisible();
    await expect(page.locator('#properties-panel').getByText('土台の辺の長さ')).toHaveCount(0);
    // An edge beyond the original mapping rectangle must remain editable in metres.
    await page.getByTestId('photo-edge-0').click();
    await expect(page.getByRole('dialog', { name: '選択した辺の長さ' })).toBeVisible();
    await page.getByLabel('長さ (m)', { exact: true }).fill('12');
    await page.getByRole('button', { name: '長さを適用' }).click();
    await page.getByTestId('photo-edge-0').click();
    await expect(page.getByLabel('長さ (m)', { exact: true })).toHaveValue('12.00');
    await page.getByRole('button', { name: '辺の編集を閉じる' }).click();
    await page.getByTestId('photo-edge-5').click();
    await page.getByLabel('長さ (m)', { exact: true }).fill('6');
    await page.getByRole('button', { name: '長さを適用' }).click();
    await page.getByTestId('save-garden').click();
    await expect(page.getByTestId('save-status')).toHaveText('保存済み');
    const saved = await (await request.get(`${api}/gardens/${initial.id}`)).json() as GardenDocument;
    expect(saved.photo!.boundary).toHaveLength(6);
    expect(saved.photo!.projectionSize).toEqual({ width: 10, depth: 8 });
    expect(saved.width).toBeCloseTo(14, 2);
    expect(saved.photo!.boundary[1].x).toBeCloseTo(.92, 5);
    expect(saved.photo!.boundary[0].y).toBeCloseTo(.65, 5);
    expect(saved.photo!.boundary.slice(2)).toEqual(boundary.slice(2));
    await page.reload();
    await page.getByTestId('photo-edge-5').click();
    await expect(page.getByLabel('長さ (m)', { exact: true })).toHaveValue('6.00');
    await page.getByLabel('長さ (m)', { exact: true }).fill('70');
    await expect(page.getByRole('button', { name: '長さを適用' })).toBeDisabled();
    await expect(page.getByRole('alert')).toContainText('写真の外');
    await page.getByRole('button', { name: '取消', exact: true }).click();
    await page.getByTestId('photo-edge-2').click();
    await page.getByLabel('長さ (m)', { exact: true }).fill('11');
    await expect(page.getByRole('alert')).toContainText('交差');
    await expect(page.getByRole('button', { name: '長さを適用' })).toBeDisabled();
    await page.getByRole('button', { name: '取消', exact: true }).click();
    await expect(page.getByTestId('save-status')).toHaveText('保存済み');
    expect(await (await request.get(`${api}/gardens/${initial.id}`)).json()).toEqual(saved);
    await page.getByTestId('photo-edge-4').click();
    await page.screenshot({ path: resolve(directory, 'polygon-edge-editor.png'), fullPage: true });
    await writeFile(resolve(directory, 'polygon-edges.json'), JSON.stringify(saved, null, 2));
    await page.setViewportSize({ width: 1024, height: 768 });
    const popup = page.getByRole('dialog', { name: '選択した辺の長さ' });
    await expect.poll(async () => {
      const box = (await popup.boundingBox())!, stage = (await page.locator('.photo-stage-shell').boundingBox())!;
      return box.x >= stage.x && box.y >= stage.y && box.x + box.width <= stage.x + stage.width && box.y + box.height <= stage.y + stage.height;
    }).toBe(true);
    await page.screenshot({ path: resolve(directory, 'workspace-edge-1024.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('photo-edge-4')).toBeFocused();
    await expect(popup).toHaveCount(0);
    const camera = page.getByRole('button', { name: '写真のカメラを設定' });
    await camera.click();
    await expect(page.getByRole('dialog', { name: '写真のカメラを合わせる' })).toBeVisible();
    await page.getByLabel('基準の幅（m）').fill('3');
    await page.screenshot({ path: resolve(directory, 'workspace-camera-dialog.png'), fullPage: true });
    await page.keyboard.press('Escape');
    await expect(camera).toBeFocused();
    await expect(page.getByTestId('save-status')).toHaveText('保存済み');
    expect(await (await request.get(`${api}/gardens/${initial.id}`)).json()).toEqual(saved);
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.getByRole('button', { name: '3D庭', exact: true }).click();
    await expect(page.getByTestId('garden-canvas')).toBeVisible();
    await page.screenshot({ path: resolve(directory, 'polygon-edges-3d.png'), fullPage: true });
  } finally { expect((await request.delete(`${api}/gardens/${initial.id}`)).status()).toBe(204); }
});
