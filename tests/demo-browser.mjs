import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
let browser;
try{
 for(let i=0;i<30;i++){try{await fetch('http://127.0.0.1:8765');break}catch{await new Promise(r=>setTimeout(r,200))}}
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:8765/';
 await mkdir('screenshots',{recursive:true});
 await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 await page.locator('.cover-tile img').last().waitFor();
 await page.screenshot({path:'screenshots/visitors-desktop.png',fullPage:true});
 assert.equal(await page.locator('.inspiration-card').count(),6);
 await page.getByRole('button',{name:'Moda',exact:true}).click();
 assert.equal(await page.locator('.inspiration-card').count(),1);
 await page.locator('[data-idea="editorial"]').click();
 await page.waitForURL('**/studio.html?idea=editorial');
 assert.match(await page.locator('#prompt').inputValue(),/Retrato editorial/);
 await page.screenshot({path:'screenshots/create-desktop.png',fullPage:true});
 const balance=await page.locator('#sidebar-balance').innerText();
 await page.locator('#generate').click();await page.waitForTimeout(2700);
 assert.notEqual(await page.locator('#sidebar-balance').innerText(),balance);
 await page.locator('aside [data-page="explore"]').click();
 await page.screenshot({path:'screenshots/explore-desktop.png',fullPage:true});
 await page.locator('[data-idea="film"]').click();
 assert.equal(await page.locator('[data-mode="video"]').getAttribute('class'),'selected');
 const video=page.locator('.sample-video');await video.evaluate(v=>v.play());
 await page.waitForTimeout(300);assert.ok(await video.evaluate(v=>v.currentTime>0));
 await page.locator('aside [data-page="plans"]').click();
 await page.locator('#custom-nt').fill('2750');await page.locator('#buy-custom').click();
 await page.locator('#confirm-pack').click();
 await page.locator('aside [data-page="tokens"]').click();
 assert.match(await page.locator('#main').innerText(),/personalizada/);
 await page.goto(base);await page.locator('[data-register]').first().click();
 await page.locator('[name="name"]').fill('PM de prueba');await page.locator('[name="email"]').fill('pm@example.com');
 await page.locator('[name="consent"]').check();await page.locator('.register-submit').click();
 await page.locator('#auth a').click();await page.waitForURL('**/studio.html');
 assert.match(await page.locator('#breadcrumb').innerText(),/Explorar/);
 for(const width of [390,360]){
  await page.setViewportSize({width,height:844});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'Visitor horizontal overflow '+width);
  await page.screenshot({path:'screenshots/visitors-mobile-'+width+'.png',fullPage:true});
  await page.goto(base+'studio.html');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'Studio horizontal overflow '+width);
  await page.screenshot({path:'screenshots/explore-mobile-'+width+'.png',fullPage:true});
  await page.locator('[data-idea="product"]').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Create horizontal overflow '+width);
  await page.screenshot({path:'screenshots/create-mobile-'+width+'.png',fullPage:true});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: filters, preset handoff, generation debit, video playback, custom recharge, registration, desktop/mobile layouts.');
}finally{await browser?.close();server.kill()}
