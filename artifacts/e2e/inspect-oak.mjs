import { chromium, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const saved=JSON.parse(await readFile('artifacts/e2e/blender-demo-garden.json','utf8'));
const browser=await chromium.launch({headless:false});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 await page.goto(saved.url);
 await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
 const result=await page.evaluate(async()=>{
  const url=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('/@react-three_fiber.js'));
  const {_roots}=await import(url);
  const state=_roots.get(document.querySelector('[data-testid="garden-canvas"] canvas')).store.getState();
  const gl=state.gl.getContext(); const ext=gl.getExtension('WEBGL_debug_renderer_info');
  return {render:state.gl.info.render,memory:state.gl.info.memory,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
 });
 await page.screenshot({path:'artifacts/e2e/blender-oak-single.png'});
 console.log(JSON.stringify(result));
}finally{await browser.close();}
