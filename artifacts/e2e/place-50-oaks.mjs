import { chromium, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const saved=JSON.parse(await readFile('artifacts/e2e/blender-demo-garden.json','utf8'));
const browser=await chromium.launch({headless:false});
const errors=[];
try {
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(saved.url);
 await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 1 / 1');
 await page.getByRole('button',{name:'土台設定',exact:true}).click();
 await page.getByLabel('幅 (m)',{exact:true}).fill('26');
 await page.getByLabel('奥行き (m)',{exact:true}).fill('14');
 await page.getByRole('button',{name:'土台に適用',exact:true}).click();
 await page.getByRole('button',{name:'土台設定を閉じる',exact:true}).click();
 await page.getByRole('button',{name:'数量・施工範囲',exact:true}).click();
 await page.getByLabel('木の配置個数',{exact:true}).fill('50');
 await page.getByRole('dialog').getByRole('button',{name:'閉じる',exact:true}).click();
 await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
 for(let i=0;i<50;i++){
  await page.locator('.placed-row').nth(i).click();
  await page.getByTestId('position-x').fill(String(Math.round((-10.8+(i%10)*2.4)*100)/100));
  await page.getByTestId('position-z').fill(String(Math.round((-4.8+Math.floor(i/10)*2.4)*100)/100));
  await page.getByTestId('rotation-y').fill(String(Math.round(i*137.508)%360));
  if(i%10===9)console.log(`Arranged ${i+1} trees`);
 }
 await page.getByRole('button',{name:'保存',exact:true}).click();
 await expect(page.getByTestId('save-status')).toHaveText('保存済み');
 await page.reload();
 await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
 await page.getByRole('button',{name:'初期視点',exact:true}).click();
 const report=await page.evaluate(async()=>{
  const url=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('/@react-three_fiber.js'));
  const {_roots}=await import(url);
  const state=_roots.get(document.querySelector('[data-testid="garden-canvas"] canvas')).store.getState();
  const meshes=[];state.scene.traverse(n=>{if(n.isMesh && n.name.startsWith('Oak'))meshes.push(n);});
  const geometries=new Set(meshes.map(n=>n.geometry));
  const materials=new Set(meshes.map(n=>n.material));
  const textures=new Set(meshes.map(n=>n.material.map));
  const frames=[];let previous=performance.now();
  for(let i=0;i<240;i++){
   await new Promise(requestAnimationFrame);
   const now=performance.now();frames.push(now-previous);previous=now;
   state.controls.setAzimuthalAngle(state.controls.getAzimuthalAngle()+0.003);
   state.controls.update();
  }
  const sorted=[...frames.slice(10)].sort((a,b)=>a-b);
  const average=sorted.reduce((a,b)=>a+b,0)/sorted.length;
  const context=state.gl.getContext();const ext=context.getExtension('WEBGL_debug_renderer_info');
  return {treeMeshCount:meshes.length,sharedGeometries:geometries.size,sharedMaterials:materials.size,sharedTextures:textures.size,
   render:state.gl.info.render,memory:state.gl.info.memory,
   averageFrameMs:average,estimatedFps:1000/average,p95FrameMs:sorted[Math.floor(sorted.length*0.95)],
   renderer:ext?context.getParameter(ext.UNMASKED_RENDERER_WEBGL):context.getParameter(context.RENDERER),
   modelDownloads:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('/models/tree-oak.glb')).map(r=>({transfer:r.transferSize,encoded:r.encodedBodySize}))};
 });
 expect(report.treeMeshCount).toBe(100);expect(report.sharedGeometries).toBe(2);expect(report.sharedTextures).toBe(2);expect(errors).toEqual([]);
 await page.getByRole('button',{name:'初期視点',exact:true}).click();
 const canvas=page.locator('[data-testid="garden-canvas"] canvas');const b=await canvas.boundingBox();
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.wheel(0,-280);
 await page.screenshot({path:'artifacts/e2e/blender-oak-50.png'});
 const id=new URL(saved.url).pathname.split('/').at(-1);
 const garden=await(await page.request.get(`http://127.0.0.1:8080/api/gardens/${id}`)).json();
 await writeFile('artifacts/e2e/blender-oak-50-garden.json',JSON.stringify(garden,null,2));
 await writeFile('artifacts/e2e/blender-oak-50-performance.json',JSON.stringify({...report,url:saved.url,errors},null,2));
 console.log(JSON.stringify(report));
}finally{await browser.close();}
