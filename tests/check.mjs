import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require=createRequire('D:/Yandex.Disk/lep-labs/30-products/1-porydok/Poryadok/package.json');
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/zahar/AppData/Local/Chromium/Application/chrome.exe'});
const origin=process.env.SITE_URL||'http://127.0.0.1:8770/';
const full=process.argv.includes('--full');
fs.mkdirSync('tmp/check',{recursive:true});
for(const width of [360,390,430,768,1024,1440,1920]){
  const ctx=await browser.newContext({viewport:{width,height:900}});
  await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin});
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>m.type()==='error'&&errors.push(m.text()));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push(r.status()+' '+r.url())});
  await page.goto(origin,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('.tile').count(),25);
  // product tabs
  await page.locator('#tab-id').click();
  assert.equal(await page.locator('#panel-id').isVisible(),true);
  assert.equal(await page.locator('#panel-sp').isVisible(),false);
  await page.locator('#tab-id').press('ArrowLeft');
  assert.equal(await page.locator('#tab-sp').getAttribute('aria-selected'),'true');
  // services: exclusive
  await page.locator('.service').nth(2).locator('summary').click();
  assert.equal(await page.locator('.service[open]').count(),1);
  assert.match(await page.locator('.service[open] p').textContent(),/системное администрирование/);
  // stack highlight
  if(width>=1024){await page.locator('.stack-col li',{hasText:'HTML5'}).first().hover();assert.equal(await page.locator('.stack-col li.hit').count(),2)}
  // project dialog
  await page.locator('.case').nth(2).click();
  assert.equal(await page.locator('#case-dialog').isVisible(),true);
  assert.match(await page.locator('#cd-text').textContent(),/Ярославской/);
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#cd-title').textContent(),'Электронный офис руководителя');
  await page.waitForFunction(()=>{const i=document.querySelector('#cd-img');return i.complete&&i.naturalWidth});
  await page.waitForTimeout(600);
  if(width===1440||width===390)await page.screenshot({path:`tmp/check/dialog-${width}.png`});
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#case-dialog').isVisible(),false);
  // topic preselect + validation + copy
  await page.locator('.hire a[data-topic="team"]').click();
  assert.equal(await page.locator('input[value="team"]').isChecked(),true);
  assert.equal(await page.locator('#f-msg-label').textContent(),'Какие разработчики и компетенции нужны');
  await page.locator('#copy-brief').click();
  assert.equal(await page.locator('#e-name').isVisible(),true);
  await page.locator('#f-name').fill('Анна, ООО Ромашка');await page.locator('#f-contact').fill('anna@example.com');await page.locator('#f-msg').fill('Два backend-разработчика на .NET');
  await page.locator('#copy-brief').click();
  assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/Разработчики в команду[\s\S]*Анна[\s\S]*\.NET/);
  assert.equal(await page.locator('#gift a[href="https://primexai.ru/"]').count(),1);
  assert.equal(await page.locator('a[href*="ultraZahar"], a[href*="ultraValet"]').count(),0);
  // mobile menu
  if(width<=1020){await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(300);await page.locator('.menu-toggle').click();assert.equal(await page.locator('#mobile-nav').isVisible(),true);await page.locator('#mobile-nav a[href="#work"]').click();assert.equal(await page.locator('#mobile-nav').isVisible(),false)}
  // full scroll
  await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=300){scrollTo(0,y);await new Promise(r=>setTimeout(r,40))}});
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('.js .reveal:not(.in):not([hidden])').count(),0,'unrevealed blocks');
  await page.waitForFunction(()=>[...document.images].filter(i=>i.id!=='cd-img'&&!i.closest('[hidden]')).every(i=>i.complete&&i.naturalWidth),null,{timeout:10000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${width}`);
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1500);
  await page.screenshot({path:`tmp/check/${width}.png`,fullPage:full&&(width===1440||width===390)});
  assert.deepEqual(errors,[]);
  await ctx.close();console.log('ok',width);
}
const ctx=await browser.newContext({javaScriptEnabled:false});const p=await ctx.newPage();await p.goto(origin);
assert.equal(await p.locator('.case-list').isVisible(),true);
assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('.reveal')).opacity),'1');
console.log('ok no-js');await browser.close();
