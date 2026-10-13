import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({headless:false});
try {
 const page = await browser.newPage({viewport:{width:1600,height:1000}});
 const errors=[]; page.on('pageerror', e=>errors.push(e.message)); page.on('console', m=>{if(m.type()==='error') console.log(m.text());});
 await page.goto('http://127.0.0.1:5173/');
 await page.getByLabel('庭の名前').fill('Blender コナラ50本・軽量モデル確認');
 await page.getByRole('button',{name:'庭を作成',exact:true}).click();
 await page.waitForURL(/\/gardens\//);
 await page.getByRole('button',{name:'上から見る'}).click();
 await page.getByTestId('asset-tree_oak').click();
 const b=await page.locator('[data-testid="garden-canvas"] canvas').boundingBox();
 await page.mouse.click(b.x+b.width/2,b.y+b.height/2);
 await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
 await page.getByRole('button',{name:'初期視点',exact:true}).click();
 await page.getByRole('button',{name:'保存',exact:true}).click();
 await expect(page.getByTestId('save-status')).toHaveText('保存済み');
 await page.screenshot({path:'artifacts/e2e/blender-oak-single.png'});
 const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(n=>n.includes('react-three_fiber')));
 console.log(JSON.stringify({url:page.url(),errors,resources}));
 await writeFile('artifacts/e2e/blender-demo-garden.json',JSON.stringify({url:page.url(),errors,resources},null,2));
} finally {await browser.close();}
