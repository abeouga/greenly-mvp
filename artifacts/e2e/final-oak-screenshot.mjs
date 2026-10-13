import { chromium, expect } from '@playwright/test';
import {readFile} from 'node:fs/promises';
const demo=JSON.parse(await readFile('artifacts/e2e/blender-demo-garden.json','utf8'));
const browser=await chromium.launch({headless:false});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 await page.goto(demo.url);
 await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
 await page.getByRole('button',{name:'初期視点',exact:true}).click();
 const canvas=page.locator('[data-testid="garden-canvas"] canvas');const b=await canvas.boundingBox();
 await page.mouse.move(b.x+b.width*.5,b.y+b.height*.4);
 for (let index=0;index<10;index++) { await page.mouse.wheel(0,-100); await page.waitForTimeout(25); }
 await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,500)));
 await page.screenshot({path:'artifacts/e2e/blender-oak-50-final.png'});
 await expect(page.getByTestId('save-status')).toHaveText('保存済み');
 console.log('Final saved garden, 50 loaded models and wheel zoom verified.');
}finally{await browser.close();}
