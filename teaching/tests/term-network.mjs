import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terms, lessonTerms} from '../shared/glossary.js';
import {phrases} from '../shared/zh.js';
import {concepts, episodes, conceptTerms, termConcepts, termRelations, relatedTerms, episodesForTerm, termURL} from '../shared/term-network.js';

const root = new URL('../', import.meta.url);
const base = process.env.COURSE_URL || 'http://127.0.0.1:8787/';
const out = new URL('.qa/browser/term-network/', root);
fs.mkdirSync(out, {recursive: true});
const translated = (text, lang) => lang === 'zh' ? phrases[text.replace(/\s+/g, ' ').trim()] : text;
assert.deepEqual(Object.keys(conceptTerms).sort(), Object.keys(concepts).sort());
assert.deepEqual([...new Set(Object.values(conceptTerms).flat())].sort(), Object.keys(terms).sort(), 'Every term belongs to the fine layer');
assert.equal(new Set(termRelations.map(pair => [...pair].sort().join(':'))).size, termRelations.length, 'No repeated relations');
for (const [a, b] of termRelations) assert.ok(terms[a] && terms[b] && a !== b, 'Known, distinct relation endpoints');
for (const [id, entry] of Object.entries(terms)) {
  assert.ok(relatedTerms(id).length && episodesForTerm(id).length, `${id}: connected and taught`);
  // Mathematical notation is deliberately shared between both languages.
  for (const value of [entry.name, entry.definition, entry.notation].filter(Boolean))
    assert.ok(translated(value, 'zh') || !/[A-Za-z]{2}/.test(value), `${id}: translated content`);
  for (const episode of episodesForTerm(id)) {
    const url = termURL(id, episode, 'zh');
    assert.ok(url.pathname.endsWith(`${episodes[episode].slug}/index.zh.html`));
    assert.ok(termConcepts[id].includes(url.searchParams.get('concept')));
  }
}

const browser = await chromium.launch({headless: true});
const errors = [], results = [];
async function context(width, lang) {
  const ctx = await browser.newContext({viewport: {width, height: width < 500 ? 780 : 1000}, reducedMotion: 'reduce', locale: 'zh-CN'});
  ctx.setDefaultTimeout(30000);
  // Use the actual HTTP responses while avoiding host interface-change errors.
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
async function ready(page) {
  await page.waitForFunction(() => document.body?.classList.contains('reader-ready') && document.body.classList.contains('knowledge-ready'));
}
async function noOverflow(page, label) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' page overflow');
  assert.ok(await page.locator('#term-panel').evaluate(panel => panel.scrollWidth <= panel.clientWidth + 1), label + ' panel overflow');
}
function route(episode, lang, query = '') {
  return new URL(`${episodes[episode].slug}/index${lang === 'zh' ? '.zh' : ''}.html${query}`, base).href;
}
async function triggerFor(page, id) {
  const visible = page.locator(`.glossary-term[data-term="${id}"]:visible`).first();
  if (await visible.count()) return visible;
  const trigger = page.locator(`.glossary-term[data-term="${id}"]`).first();
  await trigger.evaluate(node => {
    for (let parent = node.parentElement; parent; parent = parent.parentElement)
      if (parent.tagName === 'DETAILS') parent.open = true;
  });
  return trigger;
}

try {
  for (const lang of ['en', 'zh']) for (const width of [1440, 390]) {
    const {ctx, page} = await context(width, lang);
    for (const [episode, contexts] of Object.entries(lessonTerms)) {
      const label = `${episode} ${lang} ${width}`;
      await page.goto(route(episode, lang)); await ready(page);
      assert.equal(await page.locator('[data-concept]').count(), 12, label + ' overview stays small');
      assert.equal(await page.locator('.concept-term-layer[open]').count(), 0, label + ' detailed vocabulary starts collapsed');
      const ids = width === 1440 ? Object.keys(contexts) : [Object.keys(contexts)[0]];
      const panel = page.locator('#term-panel');
      for (const id of ids) {
        const trigger = await triggerFor(page, id);
        await trigger.click();
        assert.equal(await panel.getAttribute('data-term'), id);
        assert.equal(await panel.locator('#term-title').textContent(), translated(terms[id].name, lang));
        assert.equal(await panel.locator('#term-context').textContent(), translated(contexts[id], lang));
        assert.equal(new URL(page.url()).searchParams.get('term'), id, label + ' shareable explanation');
        assert.deepEqual(await panel.locator('[data-term-concept]').evaluateAll(nodes => nodes.map(node => node.dataset.termConcept)), termConcepts[id]);
        const neighbors = await panel.locator('[data-open-term]').evaluateAll(nodes => nodes.map(node => node.dataset.openTerm));
        assert.deepEqual(neighbors, relatedTerms(id, episode));
        assert.ok(await panel.locator('.term-related-list > ul > li').count() <= 3, label + ' bounded initial neighborhood');
        assert.ok(await panel.locator('.term-episode-list > ul > li').count() <= 3, label + ' bounded initial destinations');
        const destinations = await panel.locator('[data-term-episode]').evaluateAll(nodes => nodes.map(node => ({episode: node.dataset.termEpisode, href: node.href})));
        assert.deepEqual(destinations.map(entry => entry.episode).sort(), episodesForTerm(id).sort(), label + ' exact-term chapters');
        for (const destination of destinations) {
          const url = new URL(destination.href);
          assert.equal(url.searchParams.get('term'), id);
          assert.ok(url.pathname.endsWith(`${episodes[destination.episode].slug}/index${lang === 'zh' ? '.zh' : ''}.html`));
        }
        await noOverflow(page, label + ' ' + id);
        await page.keyboard.press('Escape');
        assert.ok(await trigger.evaluate(node => node === document.activeElement), label + ' focus restored');
      }
      // Following a local relationship keeps the reader in the same chapter;
      // browser Back returns to the preceding definition without reloading.
      const id = Object.keys(contexts)[0];
      await (await triggerFor(page, id)).click();
      const neighbor = relatedTerms(id, episode)[0];
      await panel.locator('[data-open-term]').first().click();
      assert.equal(await panel.getAttribute('data-term'), neighbor);
      assert.equal(await panel.locator('.term-chapter-context').isVisible(), Boolean(contexts[neighbor]));
      if (!contexts[neighbor]) assert.equal(await panel.locator('#term-context').textContent(), '');
      await page.goBack();
      await page.waitForFunction(id => document.querySelector('#term-panel')?.dataset.term === id, id);
      const parent = termConcepts[id][0];
      await panel.locator('[data-term-concept]').first().click();
      assert.equal(await panel.isVisible(), false, label + ' core link releases modal');
      assert.equal(await page.locator('[data-concept][aria-current]').getAttribute('data-concept'), parent);
      assert.equal(new URL(page.url()).searchParams.get('term'), null);
      const layer = page.locator(`#concept-${parent} .concept-term-layer`);
      await layer.locator('summary').click();
      assert.deepEqual((await layer.locator('[data-specific-term]').evaluateAll(nodes => nodes.map(node => node.dataset.specificTerm))).sort(), [...conceptTerms[parent]].sort());
      await layer.locator(`[data-open-term="${id}"]`).click();
      assert.equal(await panel.getAttribute('data-term'), id, label + ' map-to-term path');
      await panel.locator(`[data-term-episode="${episode}"]`).click();
      assert.equal(await panel.isVisible(), false, label + ' locate in text closes panel');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.term), id);
      const bounds = await page.locator(`.glossary-term[data-term="${id}"]:focus`).boundingBox();
      assert.ok(bounds.y >= 0 && bounds.y < 1000, label + ' term located in reading area');
      results.push({episode, lang, width, contexts: ids.length});
      console.log('PASS term layer ' + label);
    }
    await ctx.close();
  }

  for (const width of [320, 768, 1024, 1280]) for (const lang of ['en', 'zh']) {
    const {ctx, page} = await context(width, lang);
    await page.goto(route('E10', lang, '?concept=adjoint&term=adjoint#idea')); await ready(page);
    await noOverflow(page, `deep link ${width} ${lang}`);
    assert.equal(await page.locator('#term-panel').getAttribute('data-term'), 'adjoint');
    assert.equal(await page.locator('#term-panel').evaluate(panel => panel.matches(':modal')), width < 1200);
    // A term outside this chapter must not borrow the previous local context.
    await page.locator('.term-related-list details summary').click();
    await page.locator('[data-open-term="hermitian"]').click();
    assert.equal(await page.locator('.term-chapter-context').isVisible(), false);
    await page.reload(); await ready(page);
    assert.equal(await page.locator('#term-panel').getAttribute('data-term'), 'hermitian');
    if (width < 1200) {
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        assert.ok(await page.evaluate(() => document.getElementById('term-panel').contains(document.activeElement)), 'modal focus contained');
      }
    }
    await page.screenshot({path: new URL(`E10-${lang}-${width}.png`, out).pathname});
    await ctx.close();
  }

  for (const lang of ['en', 'zh']) {
    const {ctx, page} = await context(390, lang);
    const panel = page.locator('#term-panel');
    // The homepage's collapsed detail layer leads to a chapter and its term.
    await page.goto(new URL(`index${lang === 'zh' ? '.zh' : ''}.html#concept-imaging`, base).href);
    await page.locator('.knowledge-ready').waitFor();
    await page.locator('#concept-imaging .concept-term-layer summary').click();
    await page.locator('#concept-imaging [data-specific-term="psf"]').click(); await ready(page);
    assert.equal(await panel.getAttribute('data-term'), 'psf');
    assert.equal(await page.locator('body').getAttribute('data-episode'), 'E03');
    // Core links also work as ordinary links in a new tab, without reopening
    // the source term over the requested map.
    const core = await panel.locator('[data-term-concept]').first().getAttribute('href');
    assert.equal(new URL(core).searchParams.get('term'), null);
    const tab = await ctx.newPage();
    await tab.goto(core); await ready(tab);
    assert.equal(await tab.locator('#term-panel').isVisible(), false);
    assert.equal(await tab.locator('[data-concept][aria-current]').getAttribute('data-concept'), 'imaging');
    await tab.close();
    await panel.locator('[data-open-term="pupil"]').click();
    await panel.locator('[data-term-episode="E04"]').click(); await ready(page);
    assert.equal(await page.locator('body').getAttribute('data-episode'), 'E04');
    assert.equal(await panel.getAttribute('data-term'), 'pupil');
    await page.goBack(); await ready(page);
    assert.equal(await panel.getAttribute('data-term'), 'pupil');
    assert.equal(await page.locator('body').getAttribute('data-episode'), 'E03');
    await page.keyboard.press('Escape');
    const slider = page.locator('input[type="range"]').first();
    const value = await slider.evaluate(input => {
      input.value = String(Number(input.min) + Number(input.step) * 3);
      input.dispatchEvent(new Event('input', {bubbles: true})); return input.value;
    });
    await page.locator('.glossary-term[data-term="psf"]').first().click();
    const other = lang === 'en' ? 'zh' : 'en';
    await panel.locator(`[data-language="${other}"]`).click(); await ready(page);
    assert.equal(await panel.getAttribute('data-term'), 'psf', 'open explanation retained across languages');
    assert.equal(await panel.locator('#term-title').textContent(), translated(terms.psf.name, other));
    assert.equal(await page.locator('input[type="range"]').first().inputValue(), value, 'experiment controls retained');
    await page.screenshot({path: new URL(`E03-${other}-390.png`, out).pathname});
    // Opening all disclosures still fits the narrow panel and allows return.
    for (const summary of await panel.locator('details summary').all()) await summary.click();
    await panel.locator('.term-return').click();
    assert.equal(await panel.isVisible(), false);
    await ctx.close();
  }
  assert.deepEqual(errors, [], 'Term network browser errors');
  fs.writeFileSync(new URL('report.json', out), JSON.stringify({tested_url: base, results, terms: Object.keys(terms).length, relations: termRelations.length, console_errors: errors}, null, 2) + '\n');
  console.log('PASS all terms, both languages, layered map, exact destinations, history, modal focus and experiment preservation.');
} finally { await browser.close(); }
