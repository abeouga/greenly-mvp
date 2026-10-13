import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({headless:false});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 await page.goto('http://127.0.0.1:5173/gardens/35f733b6-1944-482f-824e-cefc33ea7d8e');
 await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
 const probe=()=>page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('/@react-three_fiber.js'));const {_roots}=await import(url);const s=_roots.get(document.querySelector('[data-testid="garden-canvas"] canvas')).store.getState();return {camera:s.camera.position.toArray(),enabled:s.controls.enabled,zoom:s.controls.enableZoom,dom:s.controls.domElement.tagName,hovered:s.internal.hovered.size}});
 console.log('before',await probe());
 const b=await page.locator('[data-testid="garden-canvas"] canvas').boundingBox();
 await page.mouse.move(b.x+b.width/2,b.y+b.height*.3);await page.mouse.wheel(0,-650);
 await page.waitForTimeout(700);
 console.log('after',await probe());
}finally{await browser.close();}
