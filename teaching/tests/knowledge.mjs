import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const base = process.env.COURSE_URL || 'http://127.0.0.1:8787/';
const catalog = JSON.parse(fs.readFileSync(new URL('course.json', root)));
const out = new URL('.qa/browser/knowledge/', root);
fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({headless: true});
const results = [], errors = [], internalLinks = new Set(), mappings = new Map();

async function ready(page, language) {
  await page.locator('.knowledge-ready').waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('html').getAttribute('lang'), language === 'zh' ? 'zh-CN' : 'en');
}

async function geometry(page, label) {
  const problems = await page.evaluate(() => {
    const issues = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('Horizontal overflow');
    const graph = document.getElementById('concept-graph'), box = graph.getBoundingClientRect();
    const nodes = [...graph.querySelectorAll('[data-concept]')].map(node => {
      const r = node.getBoundingClientRect();
      if (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1) issues.push('Clipped label: ' + node.dataset.concept);
      if (r.height < 44 || r.width < 44) issues.push('Small touch target: ' + node.dataset.concept);
      return {id: node.dataset.concept, l: r.left - box.left, r: r.right - box.left, t: r.top - box.top, b: r.bottom - box.top};
    });
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      if (a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t) issues.push('Overlapping nodes: ' + a.id + ', ' + b.id);
    }
    for (const path of graph.querySelectorAll('[data-edge]')) {
      const total = path.getTotalLength();
      if (!Number.isFinite(total) || total === 0) {issues.push('Empty connection'); continue;}
      for (let length = 0; length <= total; length += 3) {
        const p = path.getPointAtLength(length);
        const obstacle = nodes.find(n => n.id !== path.dataset.a && n.id !== path.dataset.b && p.x > n.l + 1 && p.x < n.r - 1 && p.y > n.t + 1 && p.y < n.b - 1);
        if (obstacle) {issues.push(`${path.dataset.a} → ${path.dataset.b} crosses ${obstacle.id}`); break;}
      }
    }
    return issues;
  });
  assert.deepEqual(problems, [], label);
}

try {
  for (const width of [1440, 1280, 1024, 768, 390, 320]) for (const language of ['en', 'zh']) {
    const context = await browser.newContext({viewport: {width, height: 1000}, reducedMotion: 'reduce', locale: 'zh-CN'});
    context.setDefaultTimeout(20000);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
    await page.goto(base + (language === 'zh' ? 'index.zh.html' : ''));
    await ready(page, language);
    const label = `${language} ${width}px`;
    assert.equal(await page.locator('.concept-node').count(), 12, label);
    assert.equal(await page.locator('.concept-region').count(), 4, label);
    assert.equal(await page.locator('.concept-node[aria-current]').getAttribute('data-concept'), 'fourier');
    assert.ok(await page.locator('#knowledge-map').evaluate(map => Boolean(map.compareDocumentPosition(document.getElementById('course')) & Node.DOCUMENT_POSITION_FOLLOWING)), 'Map precedes episode index');
    assert.equal(await page.locator('.course-card').count(), 10, 'Episode index remains available');
    await geometry(page, label);
    const episodes = new Set();
    for (const node of await page.locator('.concept-node').all()) {
      const id = await node.getAttribute('data-concept');
      await node.click();
      const panel = page.locator('#concept-' + id);
      assert.equal(new URL(page.url()).hash, '#concept-' + id);
      assert.equal(await page.locator('.concept-panel:visible').count(), 1);
      assert.equal(await node.getAttribute('aria-current'), 'true');
      assert.equal(await panel.locator('h3').innerText(), await node.innerText());
      const associated = await panel.locator('[data-episode-link]').evaluateAll(links => links.map(link => link.dataset.episodeLink));
      assert.ok(associated.length > 0, label + ' reachable episodes');
      for (const episode of associated) episodes.add(episode);
      if (mappings.has(id)) assert.deepEqual(associated, mappings.get(id), 'Same concept mappings across languages and widths');
      else mappings.set(id, associated);
      for (const link of await panel.locator('a[href]').all()) {
        const url = new URL(await link.getAttribute('href'), page.url());
        if (url.hash.startsWith('#concept-') || url.hash === '#knowledge-map') continue;
        assert.equal(url.origin, new URL(base).origin);
        if (language === 'zh') assert.ok(url.pathname.endsWith('/index.zh.html'), 'Chinese graph destinations');
        internalLinks.add(url.href);
      }
      if (width <= 1100) {
        assert.equal(await page.evaluate(() => document.activeElement.id), 'concept-' + id, 'Mobile focus follows episode routes');
        assert.ok(await panel.evaluate(el => el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().top < 100), 'Mobile routes brought into view');
      }
    }
    assert.deepEqual([...episodes].sort(), catalog.map(item => item.id), 'All ten episodes reachable');
    await geometry(page, label + ' after selections');

    // Native keyboard activation and browser history preserve the concept.
    await page.locator('[data-concept=field]').focus();
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, '#concept-field');
    await page.goBack();
    assert.equal(await page.locator('.concept-node[aria-current]').getAttribute('data-concept'), 'adjoint');
    await page.goForward();
    assert.equal(await page.locator('.concept-node[aria-current]').getAttribute('data-concept'), 'field');
    await page.locator('#concept-field summary').click();
    await page.locator('#concept-field .concept-connections a[href="#concept-coherence"]').click();
    assert.equal(await page.locator('.concept-node[aria-current]').getAttribute('data-concept'), 'coherence');

    const otherLanguage = language === 'en' ? 'zh' : 'en';
    if (width <= 1100) await page.locator('#concept-coherence .concept-back').click();
    else await page.locator('header a[href="#knowledge-map"]').click();
    await page.locator('[data-concept=field]').click();
    await page.goBack();
    assert.equal(new URL(page.url()).hash, '#knowledge-map');
    assert.equal(await page.locator('.concept-node[aria-current]').getAttribute('data-concept'), 'coherence', 'Back to the map restores its earlier selection');
    await page.locator(`header [data-language="${otherLanguage}"]`).click();
    await ready(page, otherLanguage);
    assert.equal(await page.locator('.concept-node[aria-current]').getAttribute('data-concept'), 'coherence', 'Language switch keeps selected concept');
    await page.locator(`header [data-language="${language}"]`).click();
    await ready(page, language);
    assert.equal(await page.locator('.concept-node[aria-current]').getAttribute('data-concept'), 'coherence');

    await page.goto(base + (language === 'zh' ? 'index.zh.html' : 'index.html') + '#concept-adjoint');
    await ready(page, language);
    assert.equal(await page.locator('.concept-node[aria-current]').getAttribute('data-concept'), 'adjoint', 'Direct concept link');
    assert.deepEqual(await page.locator('#concept-adjoint [data-episode-link]').evaluateAll(links => links.map(link => link.dataset.episodeLink)), ['E10']);
    await page.goto(base + (language === 'zh' ? 'index.zh.html' : 'index.html') + '?concept=not-a-concept#knowledge-map');
    await ready(page, language);
    assert.equal(await page.locator('.concept-node[aria-current]').getAttribute('data-concept'), 'fourier', 'Unknown concept safely falls back');
    await geometry(page, label + ' after navigation');
    await page.screenshot({path: new URL(`${language}-${width}-home.png`, out).pathname});
    await page.locator('#knowledge-map').screenshot({path: new URL(`${language}-${width}-map.png`, out).pathname});
    results.push({language, width, concepts: 12, reachable_episodes: 10, geometry: 'passed', navigation: 'passed'});
    console.log('PASS knowledge map ' + label);
    await context.close();
  }

  // Static concept links work without JavaScript, in either edition.
  for (const language of ['en', 'zh']) {
    const context = await browser.newContext({javaScriptEnabled: false, viewport: {width: 320, height: 900}, reducedMotion: 'reduce'});
    context.setDefaultTimeout(20000);
    await context.route('https://www.youtube-nocookie.com/embed/**', route => route.fulfill({status: 200, body: ''}));
    const page = await context.newPage();
    await page.goto(base + (language === 'zh' ? 'index.zh.html' : 'index.html'));
    assert.equal(await page.locator('.concept-panel:visible').count(), 12);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Static map fits a phone');
    await page.locator('[data-concept=adjoint]').click();
    assert.equal(new URL(page.url()).hash, '#concept-adjoint');
    await page.locator('#concept-adjoint [data-episode-link=E10]').click();
    assert.ok(new URL(page.url()).pathname.includes('/e10-adjoint-design/'));
    assert.equal(await page.locator('html').getAttribute('lang'), language === 'zh' ? 'zh-CN' : 'en');
    console.log('PASS static concept navigation ' + language);
    await context.close();
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  for (const href of internalLinks) {
    const response = await context.request.get(href);
    assert.equal(response.status(), 200, href);
    const id = new URL(href).hash.slice(1);
    const html = await response.text();
    assert.ok(await page.evaluate(({html, id}) => Boolean(new DOMParser().parseFromString(html, 'text/html').getElementById(id)), {html, id}), 'Destination anchor: ' + href);
  }
  await context.close();
  assert.deepEqual(errors, []);
  fs.writeFileSync(new URL('report.json', out), JSON.stringify({results, checked_links: internalLinks.size, no_javascript: 'passed', errors}, null, 2) + '\n');
  console.log(`PASS concept navigation, bilingual state, no-JavaScript routes, and ${internalLinks.size} destination anchors.`);
} finally {
  await browser.close();
}
