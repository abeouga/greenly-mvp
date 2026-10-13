import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ headless: false });
try {
 const page = await browser.newPage();
 const errors = [];
 page.on('pageerror', e => errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/gardens/35f733b6-1944-482f-824e-cefc33ea7d8e');
 await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50', {timeout:30000});
 const evidence = [];
 for (const width of [1920, 1440, 1280, 1100, 1024, 768, 390, 320]) {
  await page.setViewportSize({ width, height: 960 });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.document-bar .plan-actions button')).toHaveCount(5);
  await expect(page.locator('.editor-shell > .plan-actions')).toHaveCount(0);
  const header = await page.locator('.document-bar').boundingBox();
  for (const button of await page.locator('.document-bar button').all()) {
   const box = await button.boundingBox();
   expect(box.x).toBeGreaterThanOrEqual(header.x);
   expect(box.x + box.width).toBeLessThanOrEqual(header.x + header.width + 1);
  }
  console.log({width,header,overflow:await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,width:innerWidth}))});
  await page.screenshot({ path:`artifacts/e2e/editor-toolbar-check-${width}.png`, fullPage:true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (width >=1280) expect(header.height).toBeLessThanOrEqual(70);
  const canvas = await page.locator('[data-testid="garden-canvas"] canvas').boundingBox();
  evidence.push({ width, headerHeight:header.height, canvasHeight:canvas.height });
  await page.screenshot({ path:`artifacts/e2e/editor-toolbar-normal-${width}.png`, fullPage:width<=768 });
 }
 await page.setViewportSize({width:1440,height:960});
 await page.getByRole('button',{name:'数量・施工範囲',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'配置数量・施工範囲'}).getByLabel('木の配置個数')).toHaveValue('50');
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'植物候補を相談',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'条件に合う植物候補'})).toBeVisible();
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'完成イメージを確認',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'庭の完成イメージ'})).toBeVisible({timeout:30000});
 await expect(page.getByRole('dialog').locator('img')).toBeVisible();
 await page.keyboard.press('Escape');
 expect(errors).toEqual([]);
 await writeFile('artifacts/e2e/editor-toolbar-normal-browser.json',JSON.stringify({evidence,loadedModels:50,errors},null,2));
 console.log(JSON.stringify({evidence,loadedModels:50,errors}));
} finally {await browser.close();}
