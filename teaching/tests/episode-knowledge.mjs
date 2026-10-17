import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {geometry} from './knowledge-geometry.mjs';

const root = new URL('../', import.meta.url);
const base = process.env.COURSE_URL || 'http://127.0.0.1:8787/';
const catalog = JSON.parse(fs.readFileSync(new URL('course.json', root)));
const out = new URL('.qa/browser/episode-knowledge/', root);
fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({headless: true});
const errors = [], results = [];
let memberships, edges;

async function context(options = {}) {
  const ctx = await browser.newContext({reducedMotion: 'reduce', ...options});
  ctx.setDefaultTimeout(20000);
  // Keep long local runs stable when Chromium observes a host network change.
  // Assets still come from the served course and execute in the real browser.
  await ctx.route(new URL(base).href + '**', async route => {
    try {
      const response = await route.fetch({maxRetries: 2});
      await route.fulfill({response});
    } catch (error) {
      if (!error.message.includes('closed')) throw error;
    }
  });
  await ctx.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({status: 200, body: ''}));
  ctx.on('page', page => {
    page.on('pageerror', error => errors.push(error.stack || error.message));
    page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  });
  return ctx;
}

async function ready(page, episode, language) {
  await page.waitForFunction(({episode, language}) => document.body && document.documentElement.lang === (language === 'zh' ? 'zh-CN' : 'en')
    && (document.body.dataset.episode || null) === episode, {episode, language});
  await page.locator('.knowledge-ready').waitFor();
  if (episode) await page.locator('.reader-ready').waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('html').getAttribute('lang'), language === 'zh' ? 'zh-CN' : 'en');
  if (episode) assert.equal(await page.locator('#knowledge-map').getAttribute('data-current-episode'), episode);
}

async function current(page) {
  return page.locator('.concept-node[aria-current]').getAttribute('data-concept');
}

try {
  // The homepage is the public contract for the concepts in each episode.
  const home = await context();
  const page = await home.newPage();
  await page.goto(new URL('index.html', base).href);
  await ready(page, null, 'en');
  memberships = await page.locator('.concept-panel').evaluateAll(panels => Object.fromEntries(panels.map(panel => [
    panel.id.slice('concept-'.length), [...panel.querySelectorAll('[data-episode-link]')].map(a => a.dataset.episodeLink),
  ])));
  edges = await page.locator('#concept-relations').evaluate(node => JSON.parse(node.textContent));
  await home.close();

  for (const width of [1440, 390]) for (const language of ['en', 'zh']) {
    const ctx = await context({viewport: {width, height: 1000}, locale: 'zh-CN'});
    const page = await ctx.newPage();
    for (const entry of catalog) {
      const label = `${entry.id} ${language} ${width}px`;
      const path = entry.slug + (language === 'zh' ? '/index.zh.html' : '/index.html');
      await page.goto(new URL(path + '#knowledge-map', base).href);
      await ready(page, entry.id, language);
      const expected = Object.keys(memberships).filter(id => memberships[id].includes(entry.id));
      const marked = () => page.locator('.concept-node[data-in-episode]').evaluateAll(nodes => nodes.map(node => node.dataset.concept));
      assert.deepEqual(await marked(), expected, label + ' highlights agree with the course map');
      assert.deepEqual(await page.locator('[data-chapter-concept]').evaluateAll(nodes => nodes.map(node => node.dataset.chapterConcept)), expected, label + ' opening concepts');
      assert.ok(expected.includes(await current(page)), label + ' starts with a concept used here');
      assert.equal(await current(page), await page.locator('#knowledge-map').getAttribute('data-default-concept'));
      assert.equal(await page.locator('#knowledge-map .glossary-term').count(), 0, 'Exploration cards do not acquire glossary controls');
      assert.equal(await page.locator('.chapter-sections a[href="#knowledge-map"]').count(), 1, label + ' sidebar map entry');
      assert.equal(await page.locator('.next-prev,[aria-label="Course sequence"],[aria-label="课程顺序"]').count(), 0, 'Connections replace ordered chapter navigation');
      await geometry(page, label);

      // Every recommendation must have a real shared concept or one explicit
      // map connection, and must open another chapter in the current language.
      const routes = await page.locator('.concept-panel').evaluateAll(panels => panels.map(panel => ({
        concept: panel.id.slice('concept-'.length),
        links: [...panel.querySelectorAll('[data-episode-link]')].map(a => ({episode: a.dataset.episodeLink, via: a.dataset.viaConcept, href: a.href})),
      })));
      for (const {concept, links} of routes) {
        assert.ok(links.length > 0, label + ' no dead-end concept: ' + concept);
        assert.equal(new Set(links.map(a => a.episode)).size, links.length, 'Recommendations do not repeat chapters');
        for (const link of links) {
          assert.notEqual(link.episode, entry.id, 'No links back to the current chapter');
          const via = link.via || concept;
          if (link.via) assert.ok(edges.some(edge => [edge.a, edge.b].includes(concept) && [edge.a, edge.b].includes(via)), 'Explained connection exists');
          assert.ok(memberships[via].includes(link.episode), 'Destination really uses the linked concept');
          const url = new URL(link.href), destination = catalog.find(item => item.id === link.episode);
          assert.equal(url.origin, new URL(base).origin);
          assert.ok(url.pathname.includes('/' + destination.slug + '/'));
          assert.equal(url.pathname.endsWith('/index.zh.html'), language === 'zh');
          assert.equal(url.searchParams.get('concept'), via, 'Carry the connecting concept to the next chapter');
          assert.equal(url.hash, '#idea', 'Open the destination at its explanation');
        }
      }

      // Opening concepts, map nodes, back links, and history share one state.
      const chosen = expected[0];
      await page.locator(`[data-chapter-concept="${chosen}"]`).click();
      assert.equal(await current(page), chosen);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'concept-' + chosen);
      await page.locator(`#concept-${chosen} .concept-back`).click();
      assert.equal(await page.evaluate(() => document.activeElement.dataset.concept), chosen);
      const outside = Object.keys(memberships).find(id => !expected.includes(id));
      await page.locator(`[data-concept="${outside}"]`).focus();
      await page.keyboard.press('Enter');
      assert.equal(await current(page), outside);
      assert.deepEqual(await marked(), expected, 'Chapter highlights remain when exploring another concept');
      await page.goBack();
      assert.equal(await current(page), chosen);
      await page.reload();
      await ready(page, entry.id, language);
      assert.equal(await current(page), chosen, 'Reload keeps the chosen concept');

      const route = page.locator(`#concept-${chosen} [data-episode-link]`).first();
      const destination = await route.getAttribute('data-episode-link');
      const connecting = new URL(await route.getAttribute('href'), page.url()).searchParams.get('concept');
      await route.click();
      await ready(page, destination, language);
      assert.equal(await current(page), connecting, 'Chapter-to-chapter navigation keeps the connecting idea');
      assert.ok(await page.locator(`[data-concept="${connecting}"]`).evaluate(node => node.hasAttribute('data-in-episode')));
      await page.goBack();
      await ready(page, entry.id, language);
      assert.equal(await current(page), chosen);

      // Language switches keep map focus and also retain the experiment state.
      const range = page.locator('input[type="range"]').first();
      await range.evaluate(input => {input.value = Number(input.value) + Number(input.step); input.dispatchEvent(new Event('input', {bubbles: true}));});
      const rangeId = await range.getAttribute('id'), value = await range.inputValue();
      await page.locator(`#concept-${chosen} .concept-back`).click();
      await page.waitForFunction(() => document.querySelector('.chapter-sections a[aria-current]')?.hash === '#knowledge-map');
      const other = language === 'en' ? 'zh' : 'en';
      if (width < 1200) await page.locator('#chapter-toggle').click();
      await page.locator(`.chapter-sidebar [data-language="${other}"]`).click();
      await ready(page, entry.id, other);
      assert.equal(await current(page), chosen, 'Language switch retains selected concept');
      assert.equal(await page.locator('#' + rangeId).inputValue(), value, 'Language switch retains experiment controls');
      assert.deepEqual(await marked(), expected, 'Both editions highlight the same concepts');
      await page.locator(`[data-concept="${chosen}"]`).click();
      await page.locator(`#concept-${chosen} .concept-home`).click();
      await ready(page, null, other);
      assert.equal(await current(page), chosen, 'Full course map opens at the same concept');
      await page.locator(`#concept-${chosen} [data-episode-link="${entry.id}"]`).click();
      await ready(page, entry.id, other);
      assert.equal(await current(page), chosen, 'Homepage-to-chapter navigation keeps the chosen concept');

      if (['E03', 'E09', 'E10'].includes(entry.id)) {
        await page.locator(`[data-concept="${await page.locator('#knowledge-map').getAttribute('data-default-concept')}"]`).click();
        await page.locator('#knowledge-map').screenshot({path: new URL(`${entry.id}-${other}-${width}-map.png`, out).pathname});
      }
      await geometry(page, label + ' after navigation');
      results.push({episode: entry.id, language, width, concepts: expected, links: routes.reduce((n, panel) => n + panel.links.length, 0)});
      console.log('PASS episode concept navigation ' + label);
    }
    await ctx.close();
  }

  // The original E03 layout and the generated layout must both adapt to the
  // space left by reading panels, including narrow desktop windows.
  for (const width of [1280, 1024, 768, 320]) for (const language of ['en', 'zh']) {
    const ctx = await context({viewport: {width, height: 1000}});
    const page = await ctx.newPage();
    for (const id of ['E03', 'E10']) {
      const entry = catalog.find(item => item.id === id);
      await page.goto(new URL(entry.slug + (language === 'zh' ? '/index.zh.html' : '/index.html') + '#knowledge-map', base).href);
      await ready(page, id, language);
      await geometry(page, `${id} ${language} ${width}px`);
      if (width === 1280) {
        await page.locator('#idea .glossary-term').first().click();
        await geometry(page, `${id} ${language} with reading panel`);
        await page.keyboard.press('Escape');
      }
    }
    await ctx.close();
  }

  for (const language of ['en', 'zh']) {
    const ctx = await context({javaScriptEnabled: false, viewport: {width: 320, height: 900}});
    const page = await ctx.newPage();
    for (const entry of catalog) {
      await page.goto(new URL(entry.slug + (language === 'zh' ? '/index.zh.html' : '/index.html'), base).href);
      assert.equal(await page.locator('.concept-panel:visible').count(), 12, 'Static concept routes remain available');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.locator('[data-chapter-concept]').first().click();
      const selected = new URL(page.url()).hash;
      const route = page.locator(selected + ' [data-episode-link]').first();
      const next = await route.getAttribute('data-episode-link');
      await route.click();
      assert.equal(await page.locator('body').getAttribute('data-episode'), next);
      assert.equal(await page.locator('html').getAttribute('lang'), language === 'zh' ? 'zh-CN' : 'en');
    }
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(new URL('report.json', out), JSON.stringify({results, responsive_layouts: 'passed', static_navigation: 'passed', errors}, null, 2) + '\n');
  console.log('PASS chapter highlights, explained routes, history, bilingual state, reading-panel layouts, and static navigation.');
} catch (error) {
  console.error('Browser errors before failure:', errors);
  throw error;
} finally {
  await browser.close();
}
