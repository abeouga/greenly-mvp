import { chromium } from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:2200,height:1000}});
for(const path of ['/','/gardens/35f733b6-1944-482f-824e-cefc33ea7d8e']){await p.goto('http://127.0.0.1:5173'+path);await p.waitForTimeout(900);console.log(await p.evaluate(()=>[...document.querySelectorAll('.canvas-shell,.page-shell,main,.kusakari-site-header')].map(e=>({class:e.className,box:e.getBoundingClientRect().toJSON(),width:getComputedStyle(e).width,padding:getComputedStyle(e).padding,margin:getComputedStyle(e).margin}))))}await b.close();
