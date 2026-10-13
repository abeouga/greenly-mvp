import { chromium, expect } from '@playwright/test';
const browser=await chromium.launch({headless:false});
try {
 const page=await browser.newPage();
 for (const width of [1600,390]) {
  await page.setViewportSize({width,height:1000});
  for (const path of ['/','/gardens/35f733b6-1944-482f-824e-cefc33ea7d8e']) {
   await page.goto('http://127.0.0.1:5173'+path);
   const header=page.locator('.kusakari-site-header');
   await expect(header.locator('.kusakari-feature-name')).toHaveCount(0);
   await expect(header.getByRole('link',{name:'Canvas',exact:true})).toBeVisible();
   await page.evaluate(()=>document.fonts.ready);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.locator('.kusakari-site-header').screenshot({path:`artifacts/e2e/header-without-subtitle-${width}.png`});
 }
 console.log('List/editor, desktop/mobile: small Canvas removed; navigation Canvas retained; no horizontal overflow.');
}finally{await browser.close();}
