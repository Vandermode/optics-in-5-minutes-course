import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const base = process.env.COURSE_URL || 'http://127.0.0.1:8787/';
const catalog = JSON.parse(fs.readFileSync(new URL('course.json', root)));
const videos = JSON.parse(fs.readFileSync(new URL('videos.json', root)));
const out = new URL('.qa/browser/video-guides/', root);
fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({headless: true});
const errors = [], results = [], requestFailures = [];
let activeCase = '';
const bridgeCounts = {E01:3,E02:3,E03:3,E04:5,E05:3,E06:3,E07:3,E08:4,E09:4,E10:4};
const endpoint = (entry, language) => new URL(`${entry.slug}/index${language === 'zh' ? '.zh' : ''}.html`, base).href;

async function context(options) {
  const result = await browser.newContext({reducedMotion:'reduce', ...options});
  result.on('requestfailed', request => {
    const message = request.failure()?.errorText;
    if (message !== 'net::ERR_ABORTED') requestFailures.push({url:request.url(),message});
  });
  // Verify embed URLs and controls; external streaming/playback is outside this test.
  await result.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({status:200,contentType:'text/html',body:''}));
  return result;
}
async function noOverflow(page, label) {
  const sizes = await page.evaluate(() => ({width:innerWidth, scroll:document.documentElement.scrollWidth}));
  assert.ok(sizes.scroll <= sizes.width + 1, label + ' no page overflow');
}
try {
  for (const language of ['en','zh']) for (const width of [1440,390]) {
    const ctx = await context({viewport:{width,height:1000}});
    const page = await ctx.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const entry of catalog) {
      const label = `${entry.id} ${language} ${width}`;
      activeCase = label;
      await page.goto(endpoint(entry, language));
      await page.locator('.video-guide-ready').waitFor();
      await page.locator('.reader-ready').waitFor();
      const guide = page.locator('#video-guide');
      const steps = guide.locator('.video-flow > li');
      assert.equal(await steps.count(), entry.id === 'E03' ? 7 : 8, label);
      assert.equal(await guide.locator('.video-bridge').count(), bridgeCounts[entry.id], label);
      assert.equal(await page.locator('.chapter-sections a[href="#video-guide"]').count(), 1);
      const times = await steps.locator('[data-video-seek]').evaluateAll(nodes => nodes.map(n => Number(n.dataset.videoSeek)));
      assert.deepEqual(times, [...times].sort((a,b) => a-b));
      const anchors = await guide.locator('a[data-video-seek]').evaluateAll(nodes => nodes.map(n => ({at:n.dataset.videoSeek, href:n.href})));
      for (const link of anchors) {
        const url = new URL(link.href);
        assert.equal(url.searchParams.get('v'), videos[entry.id].youtubeId, label + ' correct film');
        assert.equal(url.searchParams.get('t'), link.at + 's', label + ' fallback time');
        assert.ok(Number(link.at) < 320);
      }
      if (language === 'zh') {
        assert.match(await guide.locator('h2').innerText(), /[\u3400-\u9fff]/);
        assert.ok(await guide.locator('.video-flow h4, .video-flow p, .video-bridge summary, .video-bridge-body > p:not(.video-replay)').evaluateAll(nodes => nodes.every(n => /[\u3400-\u9fff]/.test(n.textContent))), label + ' bilingual outline and reasoning');
      }
      // Follow every outline → explanation link; native details must open at its anchor.
      for (const id of await guide.locator('.video-bridge-link').evaluateAll(nodes => [...new Set(nodes.map(n => n.hash.slice(1)))])) {
        const link = guide.locator(`.video-bridge-link[href="#${id}"]`).first();
        await link.click();
        await page.waitForFunction(id => document.getElementById(id).open, id);
        assert.equal(new URL(page.url()).hash, '#' + id);
      }
      await noOverflow(page, label);
      // Seek from the guide and confirm that the existing language-aware iframe is cued.
      const seek = guide.locator('.video-flow [data-video-seek]').nth(2);
      const at = await seek.getAttribute('data-video-seek');
      await seek.click();
      const iframeURL = new URL(await page.locator('#video iframe').getAttribute('src'));
      assert.equal(iframeURL.searchParams.get('start'), at);
      assert.equal(iframeURL.searchParams.get('autoplay'), '1');
      assert.equal(iframeURL.searchParams.get('hl'), language === 'zh' ? 'zh-CN' : 'en');
      assert.match(iframeURL.pathname, new RegExp(videos[entry.id].youtubeId + '$'));
      if (entry.id === 'E04') {
        await page.locator('#spectrum-demo').scrollIntoViewIfNeeded();
        await page.screenshot({path:new URL(`${entry.id}-${language}-${width}-spectrum.png`, out).pathname});
      }
      results.push({episode:entry.id,language,width,steps:times.length,explanations:bridgeCounts[entry.id]});
      console.log('PASS ' + label + ': outline, explanations, timestamps, and layout');
    }
    await ctx.close();
  }

  for (const width of [320,768,1024,1280]) {
    const ctx = await context({viewport:{width,height:1000}});
    const page = await ctx.newPage();
    await page.goto(endpoint(catalog.find(e => e.id === 'E04'), 'zh') + '#guide-spectrum');
    await page.locator('.video-guide-ready').waitFor();
    await page.locator('#spectrum-demo').scrollIntoViewIfNeeded();
    await noOverflow(page, `E04 spectrum at ${width}`);
    assert.ok(await page.locator('#spectrum-plot').evaluate(c => c.width > 0));
    await ctx.close();
  }

  // The example is quantitative, and unsaved controls and disclosures follow language changes.
  for (const language of ['en','zh']) {
    const ctx = await context({viewport:{width:1440,height:1000}});
    const page = await ctx.newPage();
    await page.goto(endpoint(catalog.find(e => e.id === 'E04'), language) + '#guide-spectrum');
    await page.locator('.video-guide-ready').waitFor();
    assert.equal(await page.locator('#spectrum-visibility').innerText(), '0.417');
    assert.equal(await page.locator('#spectrum-length').innerText(), '5.34 μm');
    await page.locator('#spectrum-width').evaluate(input => {input.value = '15'; input.dispatchEvent(new Event('input', {bubbles:true}));});
    const narrower = Number(await page.locator('#spectrum-visibility').innerText());
    assert.ok(narrower > 0.8 && narrower < 0.81);
    await page.locator('#spectrum-path').evaluate(input => {input.value = '10'; input.dispatchEvent(new Event('input', {bubbles:true}));});
    assert.equal(await page.locator('#spectrum-visibility').innerText(), '0.417');
    await page.locator('#spectrum-demo').scrollIntoViewIfNeeded();
    const next = language === 'en' ? 'zh' : 'en';
    await page.locator(`.chapter-sidebar [data-language="${next}"]`).click();
    await page.locator('.video-guide-ready').waitFor();
    assert.equal(await page.locator('#spectrum-width').inputValue(), '15');
    assert.equal(await page.locator('#spectrum-path').inputValue(), '10');
    assert.equal(await page.locator('#guide-spectrum').getAttribute('open'), '');
    assert.equal(await page.locator('#spectrum-visibility').innerText(), '0.417');
    await page.reload();
    await page.locator('.video-guide-ready').waitFor();
    assert.equal(await page.locator('#spectrum-width').inputValue(), '15');
    assert.equal(await page.locator('#spectrum-path').inputValue(), '10');
    await ctx.close();
  }

  // Static outlines, details and direct YouTube links remain usable without scripts.
  for (const language of ['en','zh']) {
    const ctx = await context({javaScriptEnabled:false, viewport:{width:390,height:1000}});
    const page = await ctx.newPage();
    for (const entry of catalog) {
      await page.goto(endpoint(entry, language));
      const first = page.locator('.video-bridge').first();
      if (await first.getAttribute('open') === null) await first.locator('summary').click();
      assert.ok(await first.locator('.video-bridge-body').isVisible());
      assert.match(await page.locator('.video-flow [data-video-seek]').first().getAttribute('href'), /youtube\.com\/watch\?v=.+&t=0s/);
      if (entry.id === 'E04') {
        assert.ok(await page.locator('.coherence-fallback').isVisible());
        assert.ok(await page.locator('.coherence-interactive').isHidden());
      }
      await noOverflow(page, `static ${entry.id} ${language}`);
    }
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(new URL('report.json', out), JSON.stringify({results,extraWidths:[320,768,1024,1280],noJavaScript:20,languageState:'passed',externalPlayback:'not tested; iframe isolated',errors}, null, 2) + '\n');
  console.log('PASS video guides: 40 bilingual chapter cases, 4 extra widths, language/reload state, and 20 static routes.');
} catch (error) {
  console.error({activeCase,errors,requestFailures});
  throw error;
} finally { await browser.close(); }
