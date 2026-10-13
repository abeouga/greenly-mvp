import { chromium, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const demo=JSON.parse(await readFile('artifacts/e2e/blender-demo-garden.json','utf8'));
const browser=await chromium.launch({headless:false});
try {
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(demo.url);
 await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
 await page.getByRole('button',{name:'初期視点',exact:true}).click();
 const canvas=page.locator('[data-testid="garden-canvas"] canvas');const bounds=await canvas.boundingBox();
 await page.mouse.move(bounds.x+bounds.width*0.7,bounds.y+bounds.height*0.3);
 await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*0.7+65,bounds.y+bounds.height*0.3+5,{steps:12});await page.mouse.up();
 const report=await page.evaluate(async()=>{
  const url=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('/@react-three_fiber.js'));
  const {_roots}=await import(url);const state=_roots.get(document.querySelector('[data-testid="garden-canvas"] canvas')).store.getState();
  const meshes=[];state.scene.traverse(n=>{if(n.isMesh&&n.name.startsWith('Oak'))meshes.push(n);});
  const intervals=[];let last=performance.now();
  for(let i=0;i<240;i++){
   await new Promise(requestAnimationFrame);const now=performance.now();intervals.push(now-last);last=now;
   state.controls.setAzimuthalAngle(state.controls.getAzimuthalAngle()+0.003);state.controls.update();
  }
  const sorted=intervals.slice(10).sort((a,b)=>a-b);const average=sorted.reduce((a,b)=>a+b,0)/sorted.length;
  const ctx=state.gl.getContext();const ext=ctx.getExtension('WEBGL_debug_renderer_info');
  return {treeMeshCount:meshes.length,sharedGeometries:new Set(meshes.map(m=>m.geometry)).size,
   sharedMaterials:new Set(meshes.map(m=>m.material)).size,sharedTextures:new Set(meshes.map(m=>m.material.map)).size,
   render:state.gl.info.render,memory:state.gl.info.memory,averageFrameMs:average,estimatedFps:1000/average,
   p95FrameMs:sorted[Math.floor(sorted.length*.95)],renderer:ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL),
   modelDownloads:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('/models/tree-oak.glb')).length};
 });
 await page.getByRole('button',{name:'初期視点',exact:true}).click();
 await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.wheel(0,-650);
 await page.screenshot({path:'artifacts/e2e/blender-oak-50-final.png'});
 await page.getByRole('button',{name:'完成イメージを確認',exact:true}).click();
 await expect(page.getByAltText('現在の庭の完成イメージ')).toBeVisible();
 await page.getByAltText('現在の庭の完成イメージ').screenshot({path:'artifacts/e2e/blender-oak-50-completion.png'});
 await page.getByRole('dialog').getByRole('button',{name:'閉じる',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/e2e/blender-oak-50-mobile.png',fullPage:true});
 expect(report.treeMeshCount).toBe(100);expect(report.sharedGeometries).toBe(2);expect(errors).toEqual([]);
 await writeFile('artifacts/e2e/blender-oak-50-performance-final.json',JSON.stringify({...report,url:demo.url,errors},null,2));
 console.log(JSON.stringify(report));
}finally{await browser.close();}
