import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({headless:false});
const evidence=[];
try {
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 await page.goto('http://127.0.0.1:5186/');
 await page.evaluate(()=>document.fonts.ready);
 const ec=await page.evaluate(()=>({body:getComputedStyle(document.body).fontFamily,heading:getComputedStyle(document.querySelector('h1')).fontFamily}));
 for (const width of [2200,1600,1280,768,390,320]) {
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:5173/');
  await expect(page.getByRole('heading',{name:'保存した庭',exact:true})).toBeVisible();
  await expect(page.getByText('庭のワークスペース',{exact:true})).toHaveCount(0);
  await expect(page.getByText('マイガーデン',{exact:true})).toHaveCount(0);
  await expect(page.getByText('写真と3Dで、庭の形や植栽の配置を編集します。',{exact:true})).toHaveCount(0);
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.page-footer')).toHaveText('kusakari 2026');
  expect(await page.locator('.page-footer').evaluate(e=>getComputedStyle(e).justifyContent)).toBe('center');
  const list=await page.locator('main').boundingBox();
  const listHeader=await page.locator('.kusakari-site-header').boundingBox();
  const fonts=await page.evaluate(()=>({body:getComputedStyle(document.body).fontFamily,heading:getComputedStyle(document.querySelector('h2')).fontFamily,button:getComputedStyle(document.querySelector('button')).fontFamily,input:getComputedStyle(document.querySelector('input')).fontFamily,loaded:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family)}));
  expect(fonts.body).toBe(ec.body); expect(fonts.heading).toBe(ec.heading); expect(fonts.input).toBe(ec.body); expect(fonts.button).toBe(ec.body);
  expect(fonts.loaded).toContain('Noto Sans JP');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if (width===1600||width===390) await page.screenshot({path:`artifacts/e2e/canvas-font-width-list-${width}.png`,fullPage:true});
  await page.goto('http://127.0.0.1:5173/gardens/35f733b6-1944-482f-824e-cefc33ea7d8e');
  await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
  await page.evaluate(()=>document.fonts.ready);
  const editor=await page.locator('.editor-layout').boundingBox();
  const editorHeader=await page.locator('.kusakari-site-header').boundingBox();
  console.log(JSON.stringify({width,list,editor,listHeader,editorHeader}));
  expect(list.width).toBeLessThanOrEqual(1360); expect(Math.abs(list.x+list.width/2-listHeader.x-listHeader.width/2)).toBeLessThan(1);
  expect(Math.abs(listHeader.width-editorHeader.width)).toBeLessThan(1); expect(Math.abs(listHeader.x-editorHeader.x)).toBeLessThan(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width===1600||width===390) await page.screenshot({path:`artifacts/e2e/canvas-font-width-editor-${width}.png`,fullPage:true});
  evidence.push({width,list,editor,fonts});
 }
 await writeFile('artifacts/e2e/canvas-font-width.json',JSON.stringify({ec,evidence},null,2));
 console.log('Fonts loaded and matched EC. Shared header widths and centered list content verified at 2200, 1600, 1280, 768, 390 and 320px. Headings removed and footer centered.');
} finally { await browser.close(); }
