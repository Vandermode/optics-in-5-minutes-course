import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terms, lessonTerms} from '../shared/glossary.js';

const root = new URL('../', import.meta.url);
const base = process.env.COURSE_URL || 'http://127.0.0.1:8787/';
const catalog = JSON.parse(fs.readFileSync(new URL('course.json', root)));
const out = new URL('.qa/browser/reader/', root);
fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({headless: true});
const errors = [], results = [];
try {
  for (const width of [1440, 1280, 1024, 768, 390, 320]) {
    const context = await browser.newContext({viewport: {width, height: 1000}, reducedMotion: 'reduce'});
    await context.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({status: 200, contentType: 'text/html', body: ''}));
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
    for (const entry of catalog) {
      const label = `${entry.id} at ${width}px`;
      const response = await page.goto(new URL(entry.slug + '/', base).href);
      assert.equal(response.status(), 200, label);
      await page.locator('.reader-ready').waitFor();
      if (entry.id !== 'E03') await page.waitForFunction(() => document.getElementById('status')?.textContent === 'Calculation complete.');
      const nav = page.locator('nav[aria-label="Chapter sections"]');
      assert.equal(await nav.locator('a').count(), entry.id === 'E03' ? 11 : 10, label + ' section count');
      assert.ok(await nav.locator('a').evaluateAll(links => links.every(link => link.hash && document.getElementById(link.hash.slice(1)))), label + ' section anchors');
      assert.equal(await page.locator('.chapter-sidebar').isVisible(), width >= 1200, label + ' navigation mode');
      const used = await page.locator('.glossary-term').evaluateAll(nodes => [...new Set(nodes.map(n => n.dataset.term))]);
      assert.deepEqual([...used].sort(), Object.keys(lessonTerms[entry.id]).sort(), label + ' all authored terms are reachable');
      assert.equal(await page.locator('a .glossary-term, form .glossary-term, .controls .glossary-term, code .glossary-term, summary .glossary-term, .equation .glossary-term, .video-caption .glossary-term').count(), 0, label + ' untouched interactive and mathematical content');
      assert.ok(await page.locator('main > section').evaluateAll(sections => sections.every(section => {
        const ids = [...section.querySelectorAll('.glossary-term')].map(t => t.dataset.term);
        return ids.length === new Set(ids).size;
      })), label + ' only first use per section');
      if (width === 1440) {
        // Inserting the buttons must not alter any authored prose or formulas.
        const original = await response.text();
        const preserved = await page.evaluate(html => {
          const before = new DOMParser().parseFromString(html, 'text/html');
          return ['overview', 'motivation', 'preparation', 'idea', 'explain', 'sources'].every(id =>
            before.getElementById(id).textContent === document.getElementById(id).textContent);
        }, original);
        assert.ok(preserved, label + ' prose preserved');
      }
      async function noOverflow(state) {
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label} ${state} horizontal overflow`);
        assert.ok(await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize) >= 18), label + ' body text remains readable');
      }
      await noOverflow('closed');
      if (width < 1200) {
        await page.locator('#chapter-toggle').click();
        assert.equal(await page.locator('#chapter-toggle').getAttribute('aria-expanded'), 'true');
      }
      await nav.locator('a[href="#explain"]').click();
      await page.waitForFunction(() => document.querySelector('nav[aria-label="Chapter sections"] a[aria-current]')?.hash === '#explain');
      assert.equal(new URL(page.url()).hash, '#explain', label + ' navigation updates hash');
      if (width < 1200) assert.equal(await page.locator('.chapter-sidebar').isVisible(), false, label + ' mobile navigation closes after choice');

      const trigger = page.locator('#idea .glossary-term').first();
      await trigger.scrollIntoViewIfNeeded();
      const before = await trigger.boundingBox();
      const id = await trigger.getAttribute('data-term');
      await trigger.focus();
      await page.keyboard.press('Enter');
      const panel = page.locator('#term-panel');
      assert.equal(await panel.isVisible(), true, label + ' keyboard opens explanation');
      assert.equal(await panel.locator('#term-title').textContent(), terms[id].name, label + ' title');
      assert.equal(await panel.locator('#term-context').textContent(), lessonTerms[entry.id][id], label + ' chapter-specific use');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      await page.waitForFunction(() => document.querySelector('nav[aria-label="Chapter sections"] a[aria-current]')?.hash === '#idea');
      assert.equal(await panel.evaluate(el => el.matches(':modal')), width < 1200, label + ' modal only at narrow widths');
      await noOverflow('open');
      if (width >= 1200) {
        const after = await trigger.boundingBox();
        assert.ok(Math.abs(after.y - before.y) < 3, label + ' clicked term stays in view');
        const main = await page.locator('main').boundingBox();
        const side = await page.locator('.chapter-sidebar').boundingBox();
        const explanation = await panel.boundingBox();
        assert.ok(main.x >= side.x + side.width - 1 && main.x + main.width <= explanation.x + 1, label + ' panels do not cover content');
      } else {
        // Native modal semantics keep background controls out of keyboard focus.
        for (let i = 0; i < 4; i++) {
          await page.keyboard.press('Tab');
          assert.ok(await page.evaluate(() => document.activeElement === document.body || document.getElementById('term-panel').contains(document.activeElement)), label + ' modal focus stays inside');
        }
      }
      if (['E03', 'E10'].includes(entry.id) && [1440, 390].includes(width)) {
        await page.screenshot({path: new URL(`${entry.id}-open-${width}.png`, out).pathname});
      }
      await page.keyboard.press('Escape');
      assert.equal(await panel.isVisible(), false, label + ' Escape closes explanation');
      assert.ok(await trigger.evaluate(el => document.activeElement === el), label + ' focus returns to term');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

      if (width === 1440) {
        // Reusing the panel must replace the preceding term's text and formula.
        const formulaId = used.find(key => terms[key].formula);
        const formulaTrigger = page.locator(`.glossary-term[data-term="${formulaId}"]`).first();
        await formulaTrigger.click();
        assert.equal(await panel.locator('#term-formula').textContent(), terms[formulaId].formula);
        assert.equal(await panel.locator('.term-math').isVisible(), true);
        await panel.evaluate(el => { el.scrollTop = el.scrollHeight; });
        const plainId = used.find(key => !terms[key].formula);
        await page.locator(`.glossary-term[data-term="${plainId}"]`).first().click();
        assert.equal(await panel.locator('#term-title').textContent(), terms[plainId].name);
        assert.equal(await panel.locator('.term-math').isVisible(), false, label + ' no stale formula');
        assert.equal(await panel.evaluate(el => el.scrollTop), 0, label + ' next term starts at its title');
        await panel.locator('.term-close').click();
      }
      if (width === 320 && entry.id === 'E03') {
        // Switching to/from a desktop viewport while open must release modal
        // background inertness and keep the same explanation available.
        await trigger.click();
        await page.setViewportSize({width: 1440, height: 1000});
        assert.equal(await panel.evaluate(el => el.matches(':modal')), false);
        assert.equal(await page.locator('.chapter-sidebar').isVisible(), true);
        await page.setViewportSize({width: 320, height: 1000});
        assert.equal(await panel.evaluate(el => el.matches(':modal')), true);
        await panel.locator('.term-return').click();
        await page.locator('#chapter-toggle').click();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.chapter-sidebar').isVisible(), false);
        assert.ok(await page.locator('#chapter-toggle').evaluate(el => document.activeElement === el));
      }
      results.push({episode: entry.id, width, terms: used.length, navigation: 'passed', explanation: 'passed', layout: 'passed'});
      console.log(`PASS reader ${label}: ${used.length} terms, navigation, panel, focus, layout`);
    }
    await context.close();
  }
  const compact = await browser.newContext({viewport: {width: 390, height: 560}, reducedMotion: 'reduce'});
  await compact.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({status: 200, body: ''}));
  const compactPage = await compact.newPage();
  compactPage.on('pageerror', error => errors.push(error.message));
  await compactPage.goto(new URL('e03-diffraction/', base).href);
  await compactPage.locator('.reader-ready').waitFor();
  const compactPanel = compactPage.locator('#term-panel');
  await compactPage.locator('.glossary-term[data-term="cutoff"]').first().click();
  assert.ok(await compactPanel.evaluate(el => el.scrollHeight > el.clientHeight), 'Long explanation scrolls on a short phone screen');
  await compactPanel.locator('.term-return').click();
  await compactPage.locator('.glossary-term[data-term="psf"]').first().click();
  assert.equal(await compactPanel.evaluate(el => el.scrollTop), 0, 'Next explanation starts at the top after scrolling');
  await compactPage.keyboard.press('Escape');
  await compactPage.locator('#chapter-toggle').click();
  await compactPage.locator('.chapter-sidebar a[href="#sources"]').click();
  await compactPage.waitForFunction(() => document.querySelector('.chapter-sidebar a[aria-current]')?.hash === '#sources');
  await compact.close();
  const fallback = await browser.newContext({javaScriptEnabled: false, viewport: {width: 390, height: 900}});
  const page = await fallback.newPage();
  await page.goto(new URL('e03-diffraction/#idea', base).href);
  assert.equal(await page.locator('#idea').isVisible(), true, 'No-JS prose fallback');
  assert.equal(await page.locator('.reader-ready').count(), 0, 'No-JS layout is unchanged');
  await fallback.close();
  assert.deepEqual(errors, [], 'Reader browser errors');
  fs.writeFileSync(new URL('report.json', out), JSON.stringify({tested_url: base, results, external_video_playback: 'not covered; iframe isolated', console_errors: errors}, null, 2) + '\n');
  console.log('PASS reading tools in all ten chapters at six viewport widths.');
} finally { await browser.close(); }
