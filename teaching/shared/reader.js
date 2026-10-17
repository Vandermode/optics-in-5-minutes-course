import {terms, lessonTerms} from './glossary.js';
import {t, language, languageLinks, termAliases} from './language.js';

const main = document.querySelector('main');
const episode = document.body.dataset.episode;
const contexts = lessonTerms[episode];
if (main && contexts) initializeReader();

function initializeReader() {
  const wide = matchMedia('(min-width: 1200px)');
  const labels = {
    overview: 'Overview', motivation: 'Why learn this?', preparation: 'Before you start',
    video: 'The film', idea: 'The idea', lab: 'Experiment',
    explain: episode === 'E03' ? 'Two resolution limits' : 'How it works',
    'frequency-space': 'Frequency space', check: 'Check yourself',
    notebook: 'Python notebook', sources: 'Model & sources', 'knowledge-map': 'Concept map',
  };
  const sections = [...main.querySelectorAll(':scope > section[id]')].filter(s => labels[s.id]);
  const toc = document.createElement('aside');
  toc.className = 'chapter-sidebar';
  toc.id = 'chapter-sidebar';
  toc.setAttribute('aria-label', t('Current chapter'));
  toc.innerHTML = `<p class="reader-kicker">${episode} / ${t('ON THIS PAGE')}</p><nav aria-label="${t('Chapter sections')}"></nav><p class="term-hint">${t('Select a')} <span>${t('marked term')}</span> ${t('in the text to see its explanation.')}</p>`;
  const nav = toc.querySelector('nav');
  nav.className = 'chapter-sections';
  toc.prepend(languageLinks());
  for (const section of sections) {
    const a = document.createElement('a');
    a.href = '#' + section.id;
    a.textContent = t(labels[section.id]);
    nav.append(a);
  }
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'chapter-toggle';
  toggle.id = 'chapter-toggle';
  toggle.textContent = t('☰  On this page');
  toggle.setAttribute('aria-controls', toc.id);
  toggle.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('dialog');
  panel.id = 'term-panel';
  panel.className = 'term-panel';
  panel.setAttribute('aria-labelledby', 'term-title');
  panel.innerHTML = `<div class="term-panel-top"><p class="reader-kicker">${episode} / ${t('TERM EXPLAINED')}</p><button type="button" class="term-close" aria-label="${t('Close explanation')}">×</button></div><h2 id="term-title" tabindex="-1"></h2><p id="term-definition"></p><h3>${t('In this chapter')}</h3><p id="term-context"></p><div class="term-math" hidden><p id="term-formula"></p><p id="term-notation"></p></div><button type="button" class="term-return">${t('Back to reading →')}</button>`;
  document.body.append(toggle, toc, panel);
  document.body.classList.add('reader-ready');

  function setToc(open) {
    toc.hidden = !wide.matches && !open;
    toggle.setAttribute('aria-expanded', String(!toc.hidden));
  }
  setToc(false);
  toggle.addEventListener('click', () => setToc(toc.hidden));
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const section = document.getElementById(link.hash.slice(1));
    setToc(false);
    section.tabIndex = -1;
    section.focus({preventScroll: true});
  });
  document.addEventListener('click', event => {
    if (!wide.matches && !toc.hidden && !toc.contains(event.target) && !toggle.contains(event.target)) setToc(false);
  });

  let activeTrigger = null;
  function keepReadingPosition(change, anchor) {
    if (!anchor) {
      const bounds = main.getBoundingClientRect();
      const visible = document.elementFromPoint(bounds.left + bounds.width / 2, Math.min(180, innerHeight / 3));
      if (main.contains(visible)) anchor = visible.closest('p, li, h2, h3, figure, section');
    }
    const before = anchor?.getBoundingClientRect().top;
    change();
    if (anchor) scrollBy({top: anchor.getBoundingClientRect().top - before, behavior: 'instant'});
    // The original plot renderers observe window resizing. A side panel also
    // changes their available width, so redraw at that width and device scale.
    dispatchEvent(new Event('resize'));
  }
  function closeTerm(restoreFocus = true) {
    if (!panel.open) return;
    keepReadingPosition(() => {
      panel.close();
      document.body.classList.remove('term-panel-open');
    });
    activeTrigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) activeTrigger?.focus({preventScroll: true});
  }
  function openTerm(trigger) {
    const id = trigger.dataset.term;
    const entry = terms[id];
    activeTrigger?.setAttribute('aria-expanded', 'false');
    activeTrigger = trigger;
    panel.querySelector('#term-title').textContent = t(entry.name);
    panel.querySelector('#term-definition').textContent = t(entry.definition);
    panel.querySelector('#term-context').textContent = t(contexts[id]);
    panel.querySelector('.term-math').hidden = !entry.formula;
    panel.querySelector('#term-formula').textContent = t(entry.formula);
    panel.querySelector('#term-notation').textContent = t(entry.notation);
    setToc(false);
    keepReadingPosition(() => {
      document.body.classList.add('term-panel-open');
      if (!panel.open) wide.matches ? panel.show() : panel.showModal();
    }, trigger);
    trigger.setAttribute('aria-expanded', 'true');
    panel.scrollTop = 0;
    panel.querySelector('#term-title').focus({preventScroll: true});
  }
  panel.querySelector('.term-close').addEventListener('click', () => closeTerm());
  panel.querySelector('.term-return').addEventListener('click', () => closeTerm());
  panel.addEventListener('cancel', event => { event.preventDefault(); closeTerm(); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (panel.open) { event.preventDefault(); closeTerm(); }
    else if (!wide.matches && !toc.hidden) { setToc(false); toggle.focus(); }
  });
  wide.addEventListener('change', () => {
    setToc(false);
    if (panel.open) {
      panel.close();
      wide.matches ? panel.show() : panel.showModal();
      panel.querySelector('#term-title').focus({preventScroll: true});
    }
  });
  markTerms(main, contexts);
  main.addEventListener('click', event => {
    const trigger = event.target.closest('.glossary-term');
    if (trigger) openTerm(trigger);
  });

  let pending = false;
  function updateCurrent() {
    pending = false;
    let current = sections[0];
    const readingLine = Math.min(260, innerHeight * 0.3);
    for (const section of sections) if (section.getBoundingClientRect().top <= readingLine) current = section;
    const readingTerm = panel.open ? activeTrigger : document.activeElement.closest('.glossary-term');
    if (readingTerm) {
      const bounds = readingTerm.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < innerHeight) current = readingTerm.closest('section');
    }
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) current = sections.at(-1);
    for (const link of nav.children) {
      if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  function scheduleCurrent() {
    if (!pending) { pending = true; requestAnimationFrame(updateCurrent); }
  }
  addEventListener('scroll', scheduleCurrent, {passive: true});
  addEventListener('resize', scheduleCurrent);
  addEventListener('hashchange', scheduleCurrent);
  new ResizeObserver(scheduleCurrent).observe(main);
  updateCurrent();
}

function markTerms(main, contexts) {
  const aliases = new Map();
  for (const id of Object.keys(contexts)) {
    for (const alias of (language === 'zh' ? termAliases[id] : terms[id].aliases)) aliases.set(alias.toLowerCase(), id);
  }
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Chinese terms do not have whitespace boundaries. Latin abbreviations still
  // need boundaries so, for example, PML does not match inside CPML.
  const pattern = [...aliases.keys()].sort((a, b) => b.length - a.length).map(alias => {
    const escaped = escape(alias);
    if (language === 'zh') return /\p{Script=Han}/u.test(alias) ? escaped : `(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`;
    return `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`;
  }).join('|');
  const matcher = new RegExp(pattern, 'giu');
  // Annotate prose only. Never change controls, code, equations, quiz choices,
  // links, or elements that the numerical demonstrations update themselves.
  const excluded = 'a, button, label, summary, form, pre, code, script, style, h1, h2, h3, h4, figcaption, .video-caption, .equation, .inline-equation, .section-label, .eyebrow, .meta, .lesson-meta, .prep-kicker, .motivation-kicker, .controls, .plots, .metrics, .frequency-stats, .knowledge-section, [aria-live], [role="status"]';
  for (const section of main.querySelectorAll(':scope > section')) {
    const seen = new Set();
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement.closest('p, li, dd') && !node.parentElement.closest(excluded)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      let end = 0;
      for (const match of node.textContent.matchAll(matcher)) {
        const id = aliases.get(match[0].toLowerCase());
        if (seen.has(id)) continue;
        seen.add(id);
        fragment.append(node.textContent.slice(end, match.index));
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'glossary-term';
        button.dataset.term = id;
        button.textContent = match[0];
        button.setAttribute('aria-label', t('Explain {term}', {term: match[0]}));
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-controls', 'term-panel');
        button.setAttribute('aria-expanded', 'false');
        fragment.append(button);
        end = match.index + match[0].length;
      }
      if (end) { fragment.append(node.textContent.slice(end)); node.replaceWith(fragment); }
    }
  }
}
