import {terms, lessonTerms} from './glossary.js';
import {t, language, languageLinks, termAliases} from './language.js';
import {concepts, episodes, termConcepts, relatedTerms, episodesForTerm, termURL} from './term-network.js';

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

  const panel = document.createElement('dialog');
  panel.id = 'term-panel';
  panel.className = 'term-panel';
  panel.setAttribute('aria-labelledby', 'term-title');
  panel.innerHTML = `<div class="term-panel-top"><p class="reader-kicker">${t('TERM EXPLAINED')}</p><button type="button" class="term-close" aria-label="${t('Close explanation')}">×</button></div><h2 id="term-title" tabindex="-1"></h2><nav class="term-core-concepts" aria-label="${t('Core concepts')}"></nav><p id="term-definition"></p><div class="term-chapter-context"><h3>${t('In this chapter')}</h3><p id="term-context"></p></div><div class="term-math" hidden><p id="term-formula"></p><p id="term-notation"></p></div><section class="term-neighborhood" aria-labelledby="term-connections-title"><h3 id="term-connections-title">${t('Connected terms')}</h3><p class="term-network-hint">${t('Follow one connection at a time.')}</p><div class="term-related-list"></div></section><section aria-labelledby="term-episodes-title"><h3 id="term-episodes-title">${t('Read this term in context')}</h3><div class="term-episode-list"></div></section><button type="button" class="term-return">${t('Back to reading →')}</button>`;
  panel.querySelector('.term-panel-top').after(languageLinks());
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

  let activeTrigger = null, selectedTerm = null;
  const plainClick = event => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
  function localTermURL(id) {
    const url = new URL(location.href);
    if (id) url.searchParams.set('term', id);
    else url.searchParams.delete('term');
    return url;
  }
  function rememberTerm(id, mode = 'pushState') {
    const url = localTermURL(id);
    if (url.href !== location.href) history[mode](history.state, '', url);
  }
  function termTrigger(id) {
    const selector = `.glossary-term[data-term="${id}"]`;
    const candidates = [main.querySelector(`#idea ${selector}`), main.querySelector(`#explain ${selector}`),
      ...main.querySelectorAll(selector)].filter(Boolean);
    return candidates.find(node => node.getClientRects().length) || candidates[0];
  }
  function fillConnections(id) {
    const parents = panel.querySelector('.term-core-concepts');
    parents.replaceChildren();
    const label = document.createElement('span');
    label.textContent = t('Core concepts'); parents.append(label);
    for (const concept of termConcepts[id]) {
      const link = document.createElement('a');
      const url = localTermURL(null);
      url.searchParams.set('concept', concept);
      url.hash = `concept-${concept}`;
      link.href = url.href;
      link.dataset.termConcept = concept;
      link.textContent = t(concepts[concept].label);
      parents.append(link);
    }
    function fillList(container, entries, create, moreLabel) {
      container.replaceChildren();
      const list = document.createElement('ul');
      for (const entry of entries.slice(0, 3)) list.append(create(entry));
      container.append(list);
      if (entries.length > 3) {
        const extra = document.createElement('details'), summary = document.createElement('summary');
        summary.textContent = t(moreLabel, {count: entries.length - 3});
        const rest = document.createElement('ul');
        for (const entry of entries.slice(3)) rest.append(create(entry));
        extra.append(summary, rest); container.append(extra);
      }
    }
    fillList(panel.querySelector('.term-related-list'), relatedTerms(id, episode), other => {
      const item = document.createElement('li'), link = document.createElement('a');
      link.href = localTermURL(other).href;
      link.dataset.openTerm = other;
      link.textContent = t(terms[other].name);
      item.append(link);
      return item;
    }, 'More connections ({count})');
    const destinations = episodesForTerm(id).sort((a, b) => Number(b === episode) - Number(a === episode));
    fillList(panel.querySelector('.term-episode-list'), destinations, destination => {
      const item = document.createElement('li'), link = document.createElement('a');
      link.href = termURL(id, destination, language).href;
      link.dataset.termEpisode = destination;
      const number = document.createElement('small'), name = document.createElement('span');
      number.textContent = destination === episode ? `${destination} · ${t('In this episode')}` : destination;
      name.textContent = destination === episode ? t('Find in this chapter →') : t(episodes[destination].title);
      link.append(number, name); item.append(link);
      return item;
    }, 'More episodes ({count})');
  }
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
  function closeTerm(restoreFocus = true, updateURL = true) {
    if (!panel.open) return;
    keepReadingPosition(() => {
      panel.close();
      document.body.classList.remove('term-panel-open');
    });
    activeTrigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) activeTrigger?.focus({preventScroll: true});
    selectedTerm = null;
    if (updateURL) rememberTerm(null, 'replaceState');
  }
  function openTerm(id, trigger = null, updateURL = true) {
    const entry = terms[id];
    if (!entry) return;
    if (trigger || !panel.open) {
      activeTrigger?.setAttribute('aria-expanded', 'false');
      activeTrigger = trigger || termTrigger(id);
    }
    selectedTerm = id;
    panel.dataset.term = id;
    panel.querySelector('#term-title').textContent = t(entry.name);
    panel.querySelector('#term-definition').textContent = t(entry.definition);
    panel.querySelector('.term-chapter-context').hidden = !contexts[id];
    panel.querySelector('#term-context').textContent = t(contexts[id] || '');
    panel.querySelector('.term-math').hidden = !entry.formula;
    panel.querySelector('#term-formula').textContent = t(entry.formula);
    panel.querySelector('#term-notation').textContent = t(entry.notation);
    fillConnections(id);
    setToc(false);
    keepReadingPosition(() => {
      document.body.classList.add('term-panel-open');
      if (!panel.open) wide.matches ? panel.show() : panel.showModal();
    }, trigger);
    activeTrigger?.setAttribute('aria-expanded', 'true');
    panel.scrollTop = 0;
    panel.querySelector('#term-title').focus({preventScroll: true});
    if (updateURL) rememberTerm(id);
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
    if (trigger) openTerm(trigger.dataset.term, trigger);
  });
  document.addEventListener('click', event => {
    if (!plainClick(event)) return;
    const related = event.target.closest('a[data-open-term]');
    if (related) {
      event.preventDefault();
      openTerm(related.dataset.openTerm, panel.contains(related) ? null : related);
      return;
    }
    if (event.target.closest('a[data-term-concept]')) closeTerm(false);
    const here = event.target.closest(`a[data-term-episode="${episode}"]`);
    if (here) {
      event.preventDefault();
      const trigger = termTrigger(selectedTerm);
      closeTerm(false);
      if (trigger) {
        // Some terms first appear inside an optional reading disclosure.
        for (let parent = trigger.parentElement; parent; parent = parent.parentElement)
          if (parent.tagName === 'DETAILS') parent.open = true;
        const url = new URL(location.href);
        url.hash = trigger.closest('section').id;
        history.pushState(history.state, '', url);
        trigger.scrollIntoView({block: 'center'});
        trigger.focus({preventScroll: true});
      }
    }
  });
  function restoreTerm() {
    const id = new URL(location.href).searchParams.get('term');
    if (Object.hasOwn(terms, id)) openTerm(id, null, false);
    else closeTerm(false, false);
  }
  addEventListener('popstate', restoreTerm);
  addEventListener('course:language-change', event => {
    if (selectedTerm) event.detail.url.searchParams.set('term', selectedTerm);
  });
  restoreTerm();

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
