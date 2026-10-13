import { chromium, expect } from '@playwright/test';
const browser=await chromium.launch({headless:false});
try {
 const page=await browser.newPage();
 for(const width of [1600,1280,390]) {
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:5186/');
  await page.evaluate(()=>document.fonts.ready);
  const nav=page.getByRole('navigation',{name:'メインナビゲーション'});
  const link=nav.getByRole('link',{name:'Canvas',exact:true});
  await expect(link).toHaveAttribute('href','http://127.0.0.1:5173/');
  expect(await nav.locator('a,button').allTextContents()).toEqual(['植物を探す','店舗を探す','Canvas','Kusakariについて','出店者']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`artifacts/e2e/ec-canvas-header-link-${width}.png`});
  await link.click();
  await expect(page).toHaveURL('http://127.0.0.1:5173/');
  await expect(page.getByRole('heading',{name:'保存した庭',exact:true})).toBeVisible();
 }
 console.log('EC header Canvas link position, navigation and 1600/1280/390px layout passed.');
}finally{await browser.close();}
