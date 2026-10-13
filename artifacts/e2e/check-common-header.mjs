import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({headless:false});
const results=[];
try {
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5186/');
  await expect(page.locator('.site-header')).toBeVisible();
  await page.screenshot({path:'artifacts/e2e/common-header-ec.png'});
  await page.goto('http://127.0.0.1:5173/gardens/35f733b6-1944-482f-824e-cefc33ea7d8e');
  await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
  const header=page.locator('.kusakari-site-header');
  await expect(header.getByText('Canvas',{exact:true})).toBeVisible();
  await page.screenshot({path:'artifacts/e2e/common-header-canvas-desktop.png'});
  const targets=[['植物を探す',null],['店舗を探す','店舗'],['Kusakariについて','Kusakariについて'],['出店者',null],['アカウント',null],['管理者画面',null],['注文履歴','注文履歴'],['カート',null]];
  const links=[];
  for (const [name,title] of targets) links.push({name,title,href:await header.getByRole('link',{name,exact:true}).getAttribute('href')});
  for (const link of links) {
    await page.goto(link.href);
    if (link.title) await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible();
    results.push({name:link.name,url:page.url(),dialog:await page.getByRole('dialog').count()});
  }
  await page.goto('http://127.0.0.1:5173/');
  await expect(page.getByRole('heading',{name:'マイガーデン',exact:true})).toBeVisible();
  await page.screenshot({path:'artifacts/e2e/common-header-canvas-list.png'});
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:5173/gardens/35f733b6-1944-482f-824e-cefc33ea7d8e');
  await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'artifacts/e2e/common-header-canvas-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
  await writeFile('artifacts/e2e/common-header-browser.json',JSON.stringify({results,errors,mobileOverflow:false},null,2));
  console.log(JSON.stringify({checked:results.length,errors}));
} finally { await browser.close(); }
