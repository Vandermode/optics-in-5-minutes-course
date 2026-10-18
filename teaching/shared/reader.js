import {terms, lessonTerms} from './glossary.js';
import {t, language, languageLinks, termAliases} from './language.js';
import {initializeTermPanel} from './term-panel.js';

const main = document.querySelector('main');
const episode = document.body.dataset.episode;
const contexts = lessonTerms[episode];
if (main && contexts) initializeReader();

function initializeReader() {
  const wide = matchMedia('(min-width: 1200px)');
  const labels = {
    overview: 'Overview', motivation: 'Why learn this?', preparation: 'Before you start',
    video: 'The film', 'video-guide': 'Video logic', idea: 'The idea', lab: 'Experiment',
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

  document.body.append(toggle, toc);
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

  markTerms(main, contexts);
  const termReader = initializeTermPanel({main, episode, onOpen: () => setToc(false)});
  const {panel} = termReader;
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.open && !wide.matches && !toc.hidden) {
      setToc(false); toggle.focus();
    }
  });

  let pending = false;
  function updateCurrent() {
    pending = false;
    let current = sections[0];
    const readingLine = Math.min(260, innerHeight * 0.3);
    for (const section of sections) if (section.getBoundingClientRect().top <= readingLine) current = section;
    const readingTerm = panel.open ? termReader.activeTrigger : document.activeElement.closest('.glossary-term');
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
