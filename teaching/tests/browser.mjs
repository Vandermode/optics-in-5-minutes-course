import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url),base=process.env.COURSE_URL||'http://127.0.0.1:8787/';
const catalog=JSON.parse(fs.readFileSync(new URL('course.json',root))),out=new URL('.qa/browser/',root);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const report=[],links=new Set(),errors=[];
try{
  for(const width of [1280,390]){
    const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true,permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'});
    // Check the course independently of YouTube's scripts and permission messages.
    // Real video playback is verified separately on the published lesson.
    await context.route('https://www.youtube-nocookie.com/embed/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="en"><title>External video player</title></html>'}));
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await page.goto(base);await page.locator('.course-card').last().waitFor();
    assert.equal(await page.locator('.course-card').count(),10);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Homepage horizontal overflow');
    await page.screenshot({path:new URL(`home-${width}.png`,out).pathname});
    for(const entry of catalog){
      const response=await page.goto(new URL(entry.slug+'/',base).href);assert.equal(response.status(),200);
      await page.locator('#lab canvas').first().waitFor();
      const isOld=entry.id==='E03';
      async function ready(){if(!isOld){await page.waitForFunction(()=>document.getElementById('status')?.textContent==='Calculation complete.',{},{timeout:20000});}}
      await ready();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${entry.id} horizontal overflow at ${width}`);
      assert.equal(await page.locator('h1').count(),1);
      assert.equal(await page.locator('input[type=range]').evaluateAll(inputs=>inputs.filter(i=>!document.querySelector(`label[for="${i.id}"]`)).length),0);
      await page.screenshot({path:new URL(`${entry.id}-hero-${width}.png`,out).pathname});
      await page.locator(isOld?'#image-canvas':'#plots').scrollIntoViewIfNeeded();
      await page.screenshot({path:new URL(`${entry.id}-lab-${width}.png`,out).pathname});
      const canvas=page.locator('#lab canvas').first();
      assert.ok(await canvas.evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let min=255,max=0;for(let i=0;i<data.length;i+=4){min=Math.min(min,data[i]);max=Math.max(max,data[i]);}return max-min>20;}),`${entry.id} blank canvas`);
      const config=isOld?null:await page.locator('#lesson-config').evaluate(el=>JSON.parse(el.textContent));
      if(width===1280){
        // Exercise every range/select, including keyboard input and all named presets.
        const range=page.locator('#lab input[type=range]').first();const before=Number(await range.inputValue());
        await range.focus();await page.keyboard.press('ArrowRight');assert.notEqual(Number(await range.inputValue()),before,`${entry.id} keyboard slider`);
        if(config?.worker)await page.locator('#run').click();await ready();
        if(config)for(const control of config.controls){
          if(control.type==='select')await page.locator('#'+control.id).selectOption(control.options.at(-1).value);
          else await page.locator('#'+control.id).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},control.max);
          if(config.worker)await page.locator('#run').click();
          await ready();
          await page.locator('#reset').click();await ready();
        }
        const presets=page.locator('[data-preset]');
        for(let i=0;i<await presets.count();i++){await presets.nth(i).click();await ready();}
        await page.locator('#reset').click();await ready();
        if(config?.worker){
          await page.locator('#run').click();await page.locator('#cancel').click();
          assert.match(await page.locator('#status').innerText(),/stopped/);
          await page.locator('#reset').click();await ready();
        }
        // All generated concepts must provide feedback for a correct answer.
        if(config){for(let i=0;i<config.quiz.length;i++)await page.locator(`input[name=q${i}][value="${config.quiz[i].answer}"]`).check();}
        else{for(const [name,value] of [['q1','half'],['q2','larger'],['q3','missing']])await page.locator(`input[name=${name}][value=${value}]`).check();}
        await page.locator('#quiz button[type=submit]').click();assert.match(await page.locator('#quiz-status').innerText(),/3/);
        const downloadPromise=page.waitForEvent('download');await page.locator('#download-plot').click();
        const download=await downloadPromise;assert.match(download.suggestedFilename(),/\.png$/);assert.equal(await download.failure(),null);
        await page.locator('#copy-link').click();
        const shared=await page.evaluate(()=>navigator.clipboard.readText());
        assert.ok(shared.startsWith(new URL(entry.slug+'/',base).href));
        await page.goto(shared);await ready();
        if(config)for(const control of config.controls)assert.equal(String(await page.locator('#'+control.id).inputValue()),String(new URL(shared).searchParams.get(control.id)));
      }
      const hrefs=await page.locator('a[href]').evaluateAll(elements=>elements.map(el=>el.href));
      hrefs.filter(u=>u.startsWith(base)&&!u.startsWith('data:')).forEach(u=>links.add(u.split('#')[0].split('?')[0]));
      report.push({episode:entry.id,width,layout:'passed',canvas:'computed',interactions:width===1280?'all controls, presets, quiz, download, share, reset; worker stop where applicable':'mobile layout'});
      console.log(`PASS ${entry.id} ${width}px`);
    }
    await page.goto(base+'?na=0.81&wavelength=620#lab');await page.waitForURL('**/e03-diffraction/?na=0.81&wavelength=620#lab');
    assert.equal(await page.locator('#na').inputValue(),'0.81');assert.equal(await page.locator('#wavelength').inputValue(),'620');
    await page.goto(base+'#frequency-space');await page.waitForURL('**/e03-diffraction/#frequency-space');
    const legacy=await page.request.get(base+'e03_diffraction_limit.ipynb');assert.equal(legacy.status(),200);
    await context.close();
  }
  const context=await browser.newContext();
  for(const url of links){const response=await context.request.get(url);assert.equal(response.status(),200,`Broken course link: ${url}`);}
  await context.close();
  assert.deepEqual(errors,[],`Browser errors: ${errors.join('; ')}`);
  fs.writeFileSync(new URL('validation-browser.json',root),JSON.stringify({tested_url:base,viewports:[1280,390],results:report,internal_links_checked:links.size,legacy_e03_routes:'passed',external_video_playback:'not covered; YouTube iframe stubbed',console_errors:errors},null,2)+'\n');
  console.log(`PASS ${links.size} internal links, all ten lessons at two widths, and legacy E03 routes.`);
}finally{await browser.close();}
