import { chromium, expect } from '@playwright/test';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const browser=await chromium.launch({headless:false});
const evidence=[];
function hash(buffer) {return createHash('sha256').update(buffer).digest('hex');}
const source='C:/Users/t_abe/Desktop/kusakari-ec/packages/site-header/';
const installed='node_modules/@kusakari/site-header/';
for (const file of ['KusakariHeader.jsx','style.css']) expect(hash(await readFile(source+file))).toBe(hash(await readFile(installed+file)));
try {
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for (const width of [1600,1280,768,390,320]) {
  await page.setViewportSize({width,height:1000});
  const metrics=[];
  for (const app of ['ec','canvas']) {
   await page.goto(app==='ec'?'http://127.0.0.1:5186/':'http://127.0.0.1:5173/gardens/35f733b6-1944-482f-824e-cefc33ea7d8e');
   await expect(page.locator('.kusakari-site-chrome')).toHaveAttribute('data-header-version','0.1.4');
   await page.evaluate(()=>document.fonts.ready);
   const chrome=page.locator('.kusakari-site-chrome');
   await expect(chrome.locator('.announcement')).toContainText('ひと鉢からはじまる、緑のある暮らし。');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   const style=await page.evaluate(()=>{
    const result={};
    for(const selector of ['.announcement','.site-header','.brand','nav','.account-entry','.history-button']) {
     const e=document.querySelector('.kusakari-site-chrome '+selector);const s=getComputedStyle(e);
     result[selector]={font:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,color:s.color,background:s.backgroundColor,padding:s.padding,gap:s.gap,height:e.getBoundingClientRect().height};
    }return result;
   });
   metrics.push({app,style});
   if(width===1600||width===390) await chrome.screenshot({path:`artifacts/e2e/shared-package-header-${app}-${width}.png`});
   if (app==='canvas' && width===1600) await page.screenshot({path:'artifacts/e2e/shared-package-header-canvas-editor.png'});
  }
  for(const selector of ['.announcement','.site-header','.brand','nav','.account-entry','.history-button']) {
   expect(metrics[0].style[selector]).toEqual(metrics[1].style[selector]);
  }
  evidence.push({width,metrics});
 }
 expect(errors).toEqual([]);
 await writeFile('artifacts/e2e/shared-package-header-browser.json',JSON.stringify({samePackageFiles:true,evidence,errors},null,2));
 console.log('Identical shared source/CSS and computed header styles verified at 1600,1280,768,390,320px. Band visible; no page overflow or JS errors.');
}finally{await browser.close();}
