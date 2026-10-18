import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terms, lessonTerms} from '../shared/glossary.js';
import {phrases} from '../shared/zh.js';
import {concepts, episodes, termConcepts, relatedTerms, episodesForTerm} from '../shared/term-network.js';

const root = new URL('../', import.meta.url);
const base = process.env.COURSE_URL || 'http://127.0.0.1:8787/';
const catalog = JSON.parse(fs.readFileSync(new URL('course.json', root)));
const out = new URL('.qa/browser/keyword-concepts/', root);
fs.mkdirSync(out, {recursive: true});
const translated = (value, lang) => lang === 'zh' ? phrases[value.replace(/\s+/g, ' ').trim()] ?? value : value;
const home = lang => new URL(`index${lang === 'zh' ? '.zh' : ''}.html#course`, base).href;
const bindings = catalog.flatMap(entry => entry.keywords.map(keyword => ({episode: entry.id, keyword, id: entry.keywordTerms[keyword]})));
assert.equal(bindings.length, 48);
for (const {episode, keyword, id} of bindings) {
  assert.ok(terms[id] && termConcepts[id].length && relatedTerms(id).length, `${keyword}: connected canonical term`);
  assert.ok(episodesForTerm(id).includes(episode), `${keyword}: taught in its card's episode`);
  assert.ok(Object.hasOwn(phrases, keyword), `${keyword}: reviewed Chinese label (including shared acronyms)`);
}
const filmTerms = [...new Map(bindings.filter(({episode, id}) => !lessonTerms[episode][id]).map(binding => [binding.id, binding])).values()];
const browser = await chromium.launch({headless: true});
const errors = [], results = [];
const contexts = new Set();
async function context(width, javaScriptEnabled = true) {
  const ctx = await browser.newContext({viewport: {width, height: 1000}, reducedMotion: 'reduce', javaScriptEnabled});
  contexts.add(ctx);
  ctx.setDefaultTimeout(30000);
  await ctx.route(base + '**', async route => {
    const response = await route.fetch({maxRetries: 2});
    await route.fulfill({response});
  });
  await ctx.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({status: 200, body: ''}));
  const page = await ctx.newPage();
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  return {ctx, page};
}
async function close(ctx) {
  await ctx.unrouteAll({behavior: 'wait'});
  await ctx.close();
  contexts.delete(ctx);
}
async function ready(page, chapter = false) {
  await page.locator(chapter ? '.reader-ready.knowledge-ready' : '.home-terms-ready.knowledge-ready').waitFor();
}
async function noOverflow(page, label) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' page overflow');
  if (await page.locator('#term-panel').isVisible())
    assert.ok(await page.locator('#term-panel').evaluate(panel => panel.scrollWidth <= panel.clientWidth + 1), label + ' explanation overflow');
}
async function reveal(locator) {
  await locator.evaluate(node => {
    for (let parent = node.parentElement; parent; parent = parent.parentElement)
      if (parent.tagName === 'DETAILS') parent.open = true;
  });
  return locator;
}
try {
  for (const lang of ['en', 'zh']) for (const width of [1440, 390]) {
    const {ctx, page} = await context(width);
    await page.goto(home(lang)); await ready(page);
    assert.equal(await page.locator('.course-card').count(), 10);
    assert.equal(await page.locator('a a, .course-card .course-keyword').count(), 0, 'Independent lesson and keyword links');
    const panel = page.locator('#term-panel');
    for (const {episode, keyword, id} of bindings) {
      const label = `${episode} ${id} ${lang} ${width}`;
      const link = page.locator(`[data-episode-card="${episode}"] .course-keyword[data-open-term="${id}"]`);
      assert.equal(await link.textContent(), translated(keyword, lang), label + ' label');
      const fallback = new URL(await link.getAttribute('href'), page.url());
      assert.ok(fallback.pathname.endsWith(`${episodes[episode].slug}/index${lang === 'zh' ? '.zh' : ''}.html`));
      assert.equal(fallback.searchParams.get('term'), id);
      await link.click();
      assert.equal(await panel.getAttribute('data-term'), id);
      assert.equal(await panel.locator('#term-title').textContent(), translated(terms[id].name, lang));
      assert.equal(await panel.locator('#term-definition').textContent(), translated(terms[id].definition, lang));
      assert.equal(await panel.locator('#term-formula').textContent(), translated(terms[id].formula, lang));
      assert.equal(await panel.locator('.term-chapter-context').isVisible(), false, 'Homepage uses general definition');
      assert.equal(await panel.evaluate(node => node.matches(':modal')), true, 'Homepage dialog contains focus at every width');
      assert.equal(new URL(page.url()).searchParams.get('term'), id);
      assert.equal(new URL(page.url()).hash, '#course');
      assert.equal(await link.getAttribute('aria-expanded'), 'true');
      assert.deepEqual(await panel.locator('[data-term-concept]').evaluateAll(nodes => nodes.map(node => node.dataset.termConcept)), termConcepts[id]);
      assert.deepEqual(await panel.locator('[data-open-term]').evaluateAll(nodes => nodes.map(node => node.dataset.openTerm)), relatedTerms(id));
      const destinations = await panel.locator('[data-term-episode]').evaluateAll(nodes => nodes.map(node => ({episode: node.dataset.termEpisode, href: node.href})));
      assert.deepEqual(destinations.map(link => link.episode).sort(), episodesForTerm(id).sort());
      for (const destination of destinations) {
        const url = new URL(destination.href);
        assert.ok(url.pathname.endsWith(`${episodes[destination.episode].slug}/index${lang === 'zh' ? '.zh' : ''}.html`));
        assert.equal(url.searchParams.get('term'), id);
      }
      assert.ok(await panel.locator('.term-related-list > ul > li').count() <= 3);
      assert.ok(await panel.locator('.term-episode-list > ul > li').count() <= 3);
      await noOverflow(page, label);
      await page.keyboard.press('Escape');
      assert.equal(await panel.isVisible(), false);
      assert.ok(await link.evaluate(node => node === document.activeElement), label + ' focus restored');
      assert.equal(await link.getAttribute('aria-expanded'), 'false');
    }
    results.push({lang, width, bindings: bindings.length});
    console.log(`PASS 48 keyword definitions and graph routes: ${lang} ${width}`);

    // Keyboard access, modal focus, connected-term history and language state.
    await page.goto(home(lang)); await ready(page);
    const keyword = page.locator('.course-keyword[data-open-term="spectralBandwidth"]').first();
    await keyword.focus(); await page.keyboard.press('Enter');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      assert.ok(await panel.evaluate(node => node.contains(document.activeElement)), 'Tab remains in the dialog');
    }
    const neighbor = relatedTerms('spectralBandwidth')[0];
    await panel.locator(`[data-open-term="${neighbor}"]`).click();
    assert.equal(await panel.getAttribute('data-term'), neighbor);
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('#term-panel')?.dataset.term === 'spectralBandwidth');
    await page.goBack(); await panel.waitFor({state: 'hidden'});
    assert.equal(new URL(page.url()).searchParams.get('term'), null);
    await page.goForward(); await panel.waitFor({state: 'visible'});
    assert.equal(await panel.getAttribute('data-term'), 'spectralBandwidth');
    await page.reload(); await ready(page);
    assert.equal(await panel.getAttribute('data-term'), 'spectralBandwidth');
    const other = lang === 'en' ? 'zh' : 'en';
    await panel.locator(`[data-language="${other}"]`).click(); await ready(page);
    assert.equal(await page.locator('html').getAttribute('lang'), other === 'zh' ? 'zh-CN' : 'en');
    assert.equal(await panel.getAttribute('data-term'), 'spectralBandwidth');
    assert.equal(await panel.locator('#term-definition').textContent(), translated(terms.spectralBandwidth.definition, other));
    assert.equal(new URL(page.url()).hash, '#course');
    await page.screenshot({path: new URL(`home-${other}-${width}.png`, out).pathname});

    // Keyword → core concept → detailed term uses the same explanation.
    const parent = termConcepts.spectralBandwidth[0];
    await panel.locator(`[data-term-concept="${parent}"]`).click();
    assert.equal(await panel.isVisible(), false);
    assert.equal(new URL(page.url()).searchParams.get('term'), null);
    assert.equal(await page.locator('[data-concept][aria-current]').getAttribute('data-concept'), parent);
    assert.equal(await page.locator('[data-concept]').count(), Object.keys(concepts).length);
    const conceptPanel = page.locator(`#concept-${parent}`);
    assert.ok(await conceptPanel.evaluate(node => {const box = node.getBoundingClientRect(); return box.top >= 0 && box.top < innerHeight;}), 'Core concept scrolled into view');
    await conceptPanel.locator('.concept-term-layer summary').click();
    await conceptPanel.locator('[data-specific-term="spectralBandwidth"]').click();
    assert.equal(await panel.getAttribute('data-term'), 'spectralBandwidth');
    await (await reveal(panel.locator('[data-term-episode="E04"]'))).click(); await ready(page, true);
    assert.equal(await page.locator('body').getAttribute('data-episode'), 'E04');
    assert.equal(await panel.getAttribute('data-term'), 'spectralBandwidth');
    await page.goBack(); await ready(page);
    assert.equal(await panel.getAttribute('data-term'), 'spectralBandwidth');
    await close(ctx);
  }

  // Terms taught in films and optional material have explicit destinations even
  // when the chapter reader has no annotated prose occurrence for that term.
  for (const lang of ['en', 'zh']) {
    const {ctx, page} = await context(390);
    const panel = page.locator('#term-panel');
    for (const {episode, id} of filmTerms) {
      await page.goto(home(lang)); await ready(page);
      await page.locator(`[data-episode-card="${episode}"] [data-open-term="${id}"]`).click();
      await (await reveal(panel.locator(`[data-term-episode="${episode}"]`))).click(); await ready(page, true);
      assert.equal(await page.locator('body').getAttribute('data-episode'), episode);
      assert.equal(await panel.getAttribute('data-term'), id);
      assert.equal(await panel.locator('#term-definition').textContent(), translated(terms[id].definition, lang));
      assert.equal(await panel.locator('.term-chapter-context').isVisible(), false);
      const parent = termConcepts[id][0];
      await panel.locator(`[data-term-concept="${parent}"]`).click();
      const layer = page.locator(`#concept-${parent} .concept-term-layer`);
      await layer.locator('summary').click();
      await layer.locator(`[data-open-term="${id}"]`).click();
      assert.equal(await panel.getAttribute('data-term'), id, 'Chapter map explains its film term locally');
      await panel.locator(`[data-term-episode="${episode}"]`).click();
      assert.equal(await panel.isVisible(), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'video-guide', 'Current chapter link locates the video guide');
      assert.equal(new URL(page.url()).hash, '#video-guide');
      await noOverflow(page, `${id} ${lang} destination`);
    }
    console.log(`PASS ${filmTerms.length} additional concepts, episode destinations and local map links: ${lang}`);
    await close(ctx);
  }

  for (const width of [320, 768, 1024]) for (const lang of ['en', 'zh']) {
    const {ctx, page} = await context(width);
    await page.goto(home(lang)); await ready(page);
    await page.locator('.course-keyword[data-open-term="coherenceLength"]').click();
    for (const summary of await page.locator('#term-panel details summary').all()) await summary.click();
    await noOverflow(page, `Expanded ${lang} ${width}`);
    await page.screenshot({path: new URL(`expanded-${lang}-${width}.png`, out).pathname});
    await page.locator('.term-return').click();
    assert.equal(await page.locator('#term-panel').isVisible(), false);
    await close(ctx);
  }

  for (const lang of ['en', 'zh']) {
    const {ctx, page} = await context(1440);
    await page.goto(home(lang)); await ready(page);
    const opened = ctx.waitForEvent('page');
    await page.locator('.course-keyword[data-open-term="adjointMethod"]').click({modifiers: ['Control']});
    const tab = await opened; await ready(tab, true);
    assert.equal(await tab.locator('body').getAttribute('data-episode'), 'E10');
    assert.equal(await tab.locator('#term-panel').getAttribute('data-term'), 'adjointMethod');
    assert.equal(await page.locator('#term-panel').isVisible(), false);
    await close(ctx);

    const staticPage = await context(390, false);
    await staticPage.page.goto(home(lang));
    assert.equal(await staticPage.page.locator('.course-keyword').count(), 48);
    await staticPage.page.locator('.course-keyword[data-open-term="adjointMethod"]').click();
    assert.equal(await staticPage.page.locator('body').getAttribute('data-episode'), 'E10');
    assert.equal(await staticPage.page.locator('html').getAttribute('lang'), lang === 'zh' ? 'zh-CN' : 'en');
    assert.equal(await staticPage.page.locator('#video-guide').isVisible(), true);
    await close(staticPage.ctx);
  }
  assert.deepEqual(errors, [], 'Keyword concept browser errors');
  fs.writeFileSync(new URL('report.json', out), JSON.stringify({tested_url: base, results, film_terms: filmTerms.map(binding => binding.id), console_errors: errors}, null, 2) + '\n');
  console.log('PASS keyword explanations, chapter routes, graph links, keyboard, history, languages, responsive layouts and static fallbacks.');
} finally {
  for (const ctx of contexts) await close(ctx);
  await browser.close();
}
