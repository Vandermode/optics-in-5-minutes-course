import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terms, lessonTerms} from '../shared/glossary.js';
import {phrases} from '../shared/zh.js';
import {episodes, episodesForTerm} from '../shared/term-network.js';
import {searchTerms, termNames} from '../shared/search-index.js';

const root = new URL('../', import.meta.url);
const base = process.env.COURSE_URL || 'http://127.0.0.1:8787/';
const out = new URL('.qa/browser/concept-search/', root);
fs.mkdirSync(out, {recursive: true});
const translated = (value, lang) => lang === 'zh' ? phrases[value.replace(/\s+/g, ' ').trim()] ?? value : value;
const home = lang => new URL(`index${lang === 'zh' ? '.zh' : ''}.html#knowledge-map`, base).href;
const route = (episode, lang) => new URL(`${episodes[episode].slug}/index${lang === 'zh' ? '.zh' : ''}.html#knowledge-map`, base).href;
const browser = await chromium.launch({headless: true});
const contexts = new Set(), errors = [], results = [];
async function context(width, options = {}) {
  const ctx = await browser.newContext({viewport: {width, height: 1000}, reducedMotion: 'reduce', ...options});
  contexts.add(ctx); ctx.setDefaultTimeout(30000);
  await ctx.route(base + '**', async route => {
    const response = await route.fetch({maxRetries: 2}); await route.fulfill({response});
  });
  await ctx.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({status: 200, body: ''}));
  const page = await ctx.newPage();
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  return {ctx, page};
}
async function close(ctx) {
  await ctx.unrouteAll({behavior: 'wait'}); await ctx.close(); contexts.delete(ctx);
}
async function ready(page) {
  await page.locator('.knowledge-ready .concept-search-ready').waitFor();
}
async function noOverflow(page, label) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' page overflow');
  for (const selector of ['.concept-search', '#term-panel:visible'])
    for (const node of await page.locator(selector).all())
      assert.ok(await node.evaluate(node => node.scrollWidth <= node.clientWidth + 1), label + ' ' + selector + ' overflow');
}
const samples = [
  ['相干长度', 'coherenceLength'], ['coherence length', 'coherenceLength'],
  ['PSF', 'psf'], ['点扩散函数', 'psf'], ['伴随法', 'adjointMethod'], ['Adjoint method', 'adjointMethod'],
  ['phase-contrast', 'phaseContrast'], ['光谱带宽', 'spectralBandwidth'], ['ＮＡ', 'na'],
  ['Gerchberg Saxton', 'gerchberg'], ['spectral 带宽', 'spectralBandwidth'], ['quAlity FACTOR', 'qualityFactor'],
];
try {
  for (const lang of ['en', 'zh']) for (const width of [1440, 390]) {
    const {ctx, page} = await context(width);
    await page.goto(home(lang)); await ready(page);
    const input = page.locator('#concept-search-input'), list = page.locator('#concept-search-results');
    const panel = page.locator('#term-panel');
    assert.equal(await list.isVisible(), false, 'Empty search leaves the overview uncluttered');
    assert.equal(await page.locator('[data-concept]').count(), 12);
    assert.equal(await page.locator('form form').count(), 0);
    for (const [query, id] of samples) {
      await input.fill(query);
      const first = list.locator('[data-search-term]').first();
      assert.equal(await first.getAttribute('data-search-term'), id, `${lang} ${width}: ${query}`);
      assert.equal(await first.locator('strong').textContent(), termNames[id][lang]);
      assert.equal(await first.locator('span').textContent(), termNames[id][lang === 'en' ? 'zh' : 'en']);
      const destinations = await first.locator('..').locator('[data-search-episode]').evaluateAll(nodes => nodes.map(node => ({id: node.dataset.searchEpisode, href: node.href})));
      assert.deepEqual(destinations.map(node => node.id), episodesForTerm(id));
      for (const destination of destinations) {
        const url = new URL(destination.href);
        assert.equal(url.searchParams.get('term'), id);
        assert.ok(url.pathname.endsWith(`${episodes[destination.id].slug}/index${lang === 'zh' ? '.zh' : ''}.html`));
      }
      await first.click();
      assert.equal(await panel.getAttribute('data-term'), id);
      assert.equal(await panel.locator('#term-definition').textContent(), translated(terms[id].definition, lang));
      assert.equal(new URL(page.url()).searchParams.get('q'), query);
      assert.equal(new URL(page.url()).hash, '#knowledge-map');
      await noOverflow(page, `${lang} ${width} ${id}`);
      await page.keyboard.press('Escape');
      assert.equal(await panel.isVisible(), false);
      assert.equal(await input.inputValue(), query);
      assert.ok(await first.evaluate(node => node === document.activeElement), 'Return to the search result');
    }
    // Native links support Tab; arrow keys offer a shortcut between concepts.
    await input.fill('phase');
    const expected = searchTerms('phase');
    assert.equal(await list.locator('[data-search-term]').count(), 6);
    await input.press('ArrowDown');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.searchTerm), expected[0]);
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.searchTerm), expected[1]);
    await page.keyboard.press('Enter');
    assert.equal(await panel.getAttribute('data-term'), expected[1]);
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp');
    assert.ok(await input.evaluate(node => node === document.activeElement));
    await input.press('Enter');
    assert.equal(await panel.getAttribute('data-term'), expected[0], 'Enter from the input opens the first match');
    await page.keyboard.press('Escape');
    await page.locator('.concept-search-more').click();
    assert.equal(await list.locator('[data-search-term]').count(), expected.length);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.searchTerm), expected[6]);
    await input.fill('no-such-optical-term');
    assert.equal(await list.isVisible(), false);
    assert.equal(await page.locator('.concept-search-status').textContent(), translated('No matching concepts. Try a shorter keyword.', lang));
    await input.press('Enter');
    assert.equal(await panel.isVisible(), false);
    await input.fill('<img src=x onerror=alert(1)>');
    assert.equal(await page.locator('.concept-search img').count(), 0, 'Query is never inserted as markup');
    await page.locator('.concept-search-clear').click();
    assert.equal(await input.inputValue(), '');
    assert.equal(new URL(page.url()).searchParams.get('q'), null);
    assert.ok(await input.evaluate(node => node === document.activeElement));
    // Committing Chinese composition must not submit a partially entered word.
    await input.dispatchEvent('compositionstart');
    await input.evaluate(node => { node.value = '相干长度'; node.dispatchEvent(new InputEvent('input', {bubbles: true, isComposing: true})); });
    await input.dispatchEvent('keydown', {key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true});
    assert.equal(await panel.isVisible(), false);
    assert.equal(await list.isVisible(), false);
    await input.dispatchEvent('compositionend');
    assert.equal(await list.locator('[data-search-term]').first().getAttribute('data-search-term'), 'coherenceLength');
    await page.locator('.concept-search-submit').click();
    assert.equal(await panel.getAttribute('data-term'), 'coherenceLength');
    await page.goBack(); await panel.waitFor({state: 'hidden'});
    assert.equal(await input.inputValue(), '相干长度');
    await page.goForward(); await panel.waitFor({state: 'visible'});
    await page.reload(); await ready(page);
    assert.equal(await panel.getAttribute('data-term'), 'coherenceLength');
    const other = lang === 'en' ? 'zh' : 'en';
    await panel.locator(`[data-language="${other}"]`).click(); await ready(page);
    assert.equal(await input.inputValue(), '相干长度');
    assert.equal(await panel.getAttribute('data-term'), 'coherenceLength');
    assert.equal(await panel.locator('#term-definition').textContent(), translated(terms.coherenceLength.definition, other));
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.searchTerm), 'coherenceLength', 'Reloaded search restores result focus');
    await page.screenshot({path: new URL(`home-${other}-${width}.png`, out).pathname});
    await list.locator('[data-search-episode="E04"]').click(); await ready(page);
    assert.equal(await page.locator('body').getAttribute('data-episode'), 'E04');
    assert.equal(await panel.getAttribute('data-term'), 'coherenceLength');
    await page.goBack(); await ready(page);
    assert.equal(await input.inputValue(), '相干长度', 'Returning from an episode retains the search');
    results.push({lang, width, queries: samples.length});
    console.log(`PASS bilingual search, explanation, episode route, keyboard, IME, history and language: ${lang} ${width}`);
    await close(ctx);
  }
  for (const lang of ['en', 'zh']) for (const width of [1440, 390]) {
    const {ctx, page} = await context(width);
    const input = page.locator('#concept-search-input'), panel = page.locator('#term-panel');
    for (const [episode, entry] of Object.entries(episodes)) {
      await page.goto(route(episode, lang)); await ready(page);
      const id = Object.values(entry.keywordTerms)[0];
      await input.fill(termNames[id][lang === 'en' ? 'zh' : 'en']);
      await input.press('Enter');
      assert.equal(await panel.getAttribute('data-term'), id);
      assert.equal(await page.locator('body').getAttribute('data-episode'), episode, 'Search explains within the current chapter');
      assert.equal(await panel.locator('.term-chapter-context').isVisible(), Boolean(lessonTerms[episode][id]));
      await noOverflow(page, `${episode} ${lang} ${width}`);
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.searchTerm), id);
      const inline = page.locator('#idea .glossary-term').first();
      await inline.click(); await page.keyboard.press('Escape');
      assert.ok(await inline.evaluate(node => node === document.activeElement), 'A retained query does not steal prose focus');
      // Every chapter can also search the rest of the course.
      await input.fill('coherence length'); await input.press('Enter');
      assert.equal(await panel.getAttribute('data-term'), 'coherenceLength');
      assert.equal(await panel.locator('.term-chapter-context').isVisible(), false);
      if (width === 1440) {
        await input.fill('PSF');
        await panel.locator('.term-close').click();
        assert.ok(await input.evaluate(node => node === document.activeElement), 'Return safely after results changed behind a desktop panel');
        assert.equal(await input.inputValue(), 'PSF');
      } else await page.keyboard.press('Escape');
      if (episode === 'E04') {
        const range = page.locator('#lab input[type="range"]').first();
        const value = await range.evaluate(node => {
          node.value = String(Number(node.min) + 2 * Number(node.step));
          node.dispatchEvent(new Event('input', {bubbles: true})); return node.value;
        });
        await input.fill('相干长度'); await input.press('Enter');
        const other = lang === 'en' ? 'zh' : 'en';
        await panel.locator(`[data-language="${other}"]`).click(); await ready(page);
        assert.equal(await input.inputValue(), '相干长度');
        assert.equal(await panel.getAttribute('data-term'), 'coherenceLength');
        assert.equal(await panel.locator('#term-title').textContent(), termNames.coherenceLength[other]);
        assert.equal(await range.inputValue(), value, 'Language change retains experiment settings alongside the search');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.activeElement.dataset.searchTerm), 'coherenceLength');
      }
    }
    results.push({lang, width, chapters: 10});
    console.log(`PASS search in all ten chapter maps: ${lang} ${width}`);
    await close(ctx);
  }

  for (const lang of ['en', 'zh']) for (const width of [320, 768, 1024]) {
    const {ctx, page} = await context(width);
    const url = new URL(home(lang)); url.searchParams.set('q', 'phase');
    await page.goto(url.href); await ready(page);
    assert.equal(await page.locator('#concept-search-input').inputValue(), 'phase', 'Search deep link');
    await page.locator('.concept-search-more').click();
    await noOverflow(page, `Expanded search ${lang} ${width}`);
    await page.locator('#concept-search-input').fill('Automatic differentiation');
    await page.locator('.concept-search').scrollIntoViewIfNeeded();
    await page.screenshot({path: new URL(`narrow-${lang}-${width}.png`, out).pathname});
    await page.locator('[data-search-term="automaticDifferentiation"]').click();
    await noOverflow(page, `Long term ${lang} ${width}`);
    await page.keyboard.press('Escape');
    await page.locator('#concept-search-input').press('Escape');
    assert.equal(await page.locator('#concept-search-input').inputValue(), '');
    await close(ctx);
  }

  for (const lang of ['en', 'zh']) {
    const {ctx, page} = await context(1440);
    await page.goto(home(lang)); await ready(page);
    await page.locator('#concept-search-input').fill('相干长度');
    const opened = ctx.waitForEvent('page');
    await page.locator('[data-search-term="coherenceLength"]').click({modifiers: ['Control']});
    const tab = await opened; await ready(tab);
    assert.equal(await tab.locator('body').getAttribute('data-episode'), 'E04');
    assert.equal(await tab.locator('#term-panel').getAttribute('data-term'), 'coherenceLength');
    assert.equal(await tab.locator('html').getAttribute('lang'), lang === 'zh' ? 'zh-CN' : 'en');
    assert.equal(await page.locator('#term-panel').isVisible(), false);
    await close(ctx);
    const fallback = await context(390, {javaScriptEnabled: false});
    await fallback.page.goto(home(lang));
    assert.equal(await fallback.page.locator('.concept-search').isVisible(), false, 'No inert search when JavaScript is disabled');
    assert.equal(await fallback.page.locator('[data-concept]').count(), 12);
    await fallback.page.locator('[data-concept="coherence"]').click();
    assert.equal(new URL(fallback.page.url()).hash, '#concept-coherence');
    assert.ok(await fallback.page.locator('#concept-coherence [data-episode-link="E04"]').isVisible());
    await close(fallback.ctx);
  }
  assert.deepEqual(errors, [], 'Search browser errors');
  fs.writeFileSync(new URL('report.json', out), JSON.stringify({tested_url: base, results, console_errors: errors}, null, 2) + '\n');
} finally {
  for (const ctx of contexts) await close(ctx);
  await browser.close();
}
