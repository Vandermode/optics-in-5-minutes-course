import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terms, lessonTerms} from '../shared/glossary.js';
import {phrases, termAliases} from '../shared/zh.js';

const root = new URL('../', import.meta.url);
const base = process.env.COURSE_URL || 'http://127.0.0.1:8787/';
const catalog = JSON.parse(fs.readFileSync(new URL('course.json', root)));
const out = new URL('.qa/browser/languages/', root);
fs.mkdirSync(out, {recursive: true});
const translated = value => phrases[value.replace(/\s+/g, ' ').trim()] ?? value;
for (const [id, term] of Object.entries(terms)) {
  assert.ok(termAliases[id]?.length, `${id}: Chinese aliases`);
  for (const key of ['name', 'definition', 'notation']) {
    if (term[key]) assert.notEqual(translated(term[key]), term[key], `${id}: translated ${key}`);
  }
}
for (const contexts of Object.values(lessonTerms)) {
  for (const value of Object.values(contexts)) assert.notEqual(translated(value), value, 'Translated chapter context');
}

const browser = await chromium.launch({headless: true});
const errors = [], results = [];
async function context(options = {}) {
  const ctx = await browser.newContext({reducedMotion: 'reduce', ...options});
  ctx.setDefaultTimeout(30000);
  await ctx.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({status: 200, body: ''}));
  return ctx;
}
async function ready(page, episode, language) {
  await page.waitForFunction(lang => document.documentElement.lang === lang, language === 'zh' ? 'zh-CN' : 'en');
  if (episode) await page.locator('.reader-ready').waitFor();
  if (episode && episode !== 'E03') {
    await page.waitForFunction(expected => document.getElementById('status')?.textContent === expected,
      language === 'zh' ? '计算完成。' : 'Calculation complete.');
  }
}
async function noOverflow(page, label) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' horizontal overflow');
}
async function switchLanguage(page, code, width) {
  if (width < 1200) await page.locator('#chapter-toggle').click();
  await page.locator(`.chapter-sidebar [data-language="${code}"]`).click();
  await page.waitForURL(url => code === 'zh' ? url.pathname.endsWith('/index.zh.html') : !url.pathname.endsWith('/index.zh.html'));
}
try {
  for (const width of [1440, 390, 320]) {
    // Browser locale must not change the English default on a first visit.
    const ctx = await context({viewport: {width, height: 1000}, locale: 'zh-CN', permissions: ['clipboard-read', 'clipboard-write']});
    const page = await ctx.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(base);
    await page.locator('.language-ready').waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en', 'Fresh visit defaults to English');
    await page.locator('header [data-language="zh"]').click();
    await ready(page, null, 'zh');
    assert.equal(await page.locator('.course-card').count(), 10);
    assert.ok(await page.locator('.course-card').evaluateAll(cards => cards.every(card => card.href.endsWith('/index.zh.html'))), 'Chinese course links');
    await noOverflow(page, `Chinese home ${width}`);
    if (width === 1440) {
      const opened = ctx.waitForEvent('page');
      await page.locator('header [data-language="en"]').click({modifiers: ['Control']});
      const tab = await opened;
      await tab.waitForLoadState('domcontentloaded');
      await ready(tab, null, 'en');
      assert.ok(new URL(tab.url()).pathname.endsWith('/index.html'), 'Explicit English choice works in a new tab');
      await tab.close();
    }
    await page.goto(new URL('preparation/index.zh.html', base).href);
    await ready(page, null, 'zh');
    await noOverflow(page, `Chinese preparation ${width}`);

    for (const entry of catalog) {
      const label = `${entry.id} ${width}px`;
      // The saved choice is also honored when an English route is opened.
      await page.goto(new URL(entry.slug + '/', base).href);
      await ready(page, entry.id, 'zh');
      assert.ok(new URL(page.url()).pathname.endsWith('/index.zh.html'), label + ' saved preference');
      const used = await page.locator('.glossary-term').evaluateAll(nodes => [...new Set(nodes.map(node => node.dataset.term))]);
      assert.deepEqual(used.sort(), Object.keys(lessonTerms[entry.id]).sort(), label + ' Chinese terms reachable');
      await noOverflow(page, label);

      if (width === 1440) {
        const english = fs.readFileSync(new URL(entry.slug + '/index.html', root), 'utf8');
        assert.ok(await page.evaluate(html => {
          const original = new DOMParser().parseFromString(html, 'text/html');
          const text = (doc, selector) => [...doc.querySelectorAll(selector)].map(node => node.textContent);
          return JSON.stringify(text(original, '.equation, .inline-equation, pre, code')) === JSON.stringify(text(document, '.equation, .inline-equation, pre, code'))
            && original.getElementById('lesson-config')?.textContent === document.getElementById('lesson-config')?.textContent;
        }, english), label + ' equations, code, and model configuration preserved');
        for (const preset of await page.locator('[data-preset]').all()) {
          await preset.click();
          await ready(page, entry.id, 'zh');
        }
        await page.locator('#reset').click();
        await ready(page, entry.id, 'zh');
      }

      const trigger = page.locator('#idea .glossary-term').first();
      const termId = await trigger.getAttribute('data-term');
      await trigger.click();
      assert.equal(await page.locator('#term-definition').textContent(), translated(terms[termId].definition), label + ' Chinese definition');
      assert.equal(await page.locator('#term-context').textContent(), translated(lessonTerms[entry.id][termId]), label + ' Chinese explanation');
      await noOverflow(page, label + ' explanation');
      await page.keyboard.press('Escape');

      const range = page.locator('#lab input[type="range"]').first();
      await range.evaluate(el => { el.value = Number(el.value) + Number(el.step); el.dispatchEvent(new Event('input', {bubbles: true})); });
      const select = page.locator('#lab select').first();
      if (await select.count()) await select.selectOption(await select.locator('option').last().getAttribute('value'));
      if (entry.id === 'E03') {
        await page.locator('#rings').uncheck();
        await page.locator('#frequency').evaluate(el => { el.value = 0.7; el.dispatchEvent(new Event('input', {bubbles: true})); });
      }
      const selected = await page.locator('#lab input[type="range"], #lab select').evaluateAll(inputs =>
        Object.fromEntries(inputs.map(input => [input.id, input.value])));
      if (width < 1200) await page.locator('#chapter-toggle').click();
      await page.locator('.chapter-sections a[href="#lab"]').click();
      await page.waitForFunction(() => document.querySelector('.chapter-sections a[aria-current]')?.hash === '#lab');
      await switchLanguage(page, 'en', width);
      await ready(page, entry.id, 'en');
      assert.equal(new URL(page.url()).hash, '#lab', label + ' reading section retained');
      for (const [id, value] of Object.entries(selected)) assert.equal(await page.locator('#' + id).inputValue(), value, label + ' control ' + id);
      if (entry.id === 'E03') assert.equal(await page.locator('#rings').isChecked(), false, label + ' rings retained');
      await page.waitForFunction(() => document.querySelector('.chapter-sections a[aria-current]')?.hash === '#lab');
      await switchLanguage(page, 'zh', width);
      await ready(page, entry.id, 'zh');
      for (const [id, value] of Object.entries(selected)) assert.equal(await page.locator('#' + id).inputValue(), value, label + ' round-trip control ' + id);

      const config = entry.id === 'E03' ? null : await page.locator('#lesson-config').evaluate(el => JSON.parse(el.textContent));
      if (config) {
        for (let i = 0; i < config.quiz.length; i++) await page.locator(`input[name=q${i}][value="${config.quiz[i].answer}"]`).check();
      } else {
        for (const [name, value] of [['q1', 'half'], ['q2', 'larger'], ['q3', 'missing']]) await page.locator(`input[name=${name}][value=${value}]`).check();
      }
      await page.locator('#quiz button[type="submit"]').click();
      assert.match(await page.locator('#quiz-status').innerText(), /答对 3 \/ 3 题/, label + ' Chinese quiz feedback');
      const untranslated = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), found = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (node.parentElement.closest('script, style, pre, code, .equation, .inline-equation, #term-formula')) continue;
          if (/[A-Za-z]{3,}(?:[ ,:-]+[a-z]{2,}){2,}/.test(node.textContent)) found.push(node.textContent.trim());
        }
        return found;
      });
      assert.deepEqual(untranslated, [], label + ' no untranslated prose or runtime feedback');
      if (width === 1440) {
        await page.locator('#copy-link').click();
        const shared = await page.evaluate(() => navigator.clipboard.readText());
        assert.ok(new URL(shared).pathname.endsWith('/index.zh.html'), label + ' Chinese share link');
        for (const [id, value] of Object.entries(selected)) assert.equal(new URL(shared).searchParams.get(id), value, label + ' shared control ' + id);
      }
      if (['E03', 'E10'].includes(entry.id) && width !== 320) {
        await page.locator('#lab').scrollIntoViewIfNeeded();
        await page.screenshot({path: new URL(`${entry.id}-zh-${width}.png`, out).pathname});
      }
      results.push({episode: entry.id, width, language_switch: 'passed', parameters: 'preserved', glossary: 'translated', quiz: 'translated', layout: 'passed'});
      console.log('PASS bilingual ' + label);
    }
    await ctx.close();
  }

  const noScript = await context({javaScriptEnabled: false, viewport: {width: 320, height: 900}});
  const fallback = await noScript.newPage();
  for (const path of ['', 'preparation/', 'e03-diffraction/']) {
    await fallback.goto(new URL(path + 'index.zh.html', base).href);
    assert.equal(await fallback.locator('html').getAttribute('lang'), 'zh-CN');
    assert.match(await fallback.locator('h1').innerText(), /\p{Script=Han}/u);
    await noOverflow(fallback, 'No-JavaScript Chinese ' + path);
    await fallback.locator('header [data-language="en"]').click();
    assert.equal(await fallback.locator('html').getAttribute('lang'), 'en', 'Language links work without JavaScript');
  }
  await noScript.close();

  const blockedStorage = await context({viewport: {width: 390, height: 900}});
  await blockedStorage.addInitScript(() => {
    Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new DOMException('Storage is unavailable', 'SecurityError'); };
  });
  const privatePage = await blockedStorage.newPage();
  privatePage.on('pageerror', error => errors.push(error.message));
  await privatePage.goto(base);
  await privatePage.locator('.language-ready').waitFor();
  await privatePage.locator('header [data-language="zh"]').click();
  await ready(privatePage, null, 'zh');
  await privatePage.locator('.course-card').first().click();
  await ready(privatePage, 'E01', 'zh');
  await blockedStorage.close();
  assert.deepEqual(errors, [], 'Bilingual browser errors');
  fs.writeFileSync(new URL('report.json', out), JSON.stringify({tested_url: base, results, default_language: 'English', no_javascript: 'passed', blocked_storage: 'passed', external_video_playback: 'not covered; iframe isolated', errors}, null, 2) + '\n');
} finally { await browser.close(); }
