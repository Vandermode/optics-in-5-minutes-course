import {terms, lessonTerms} from './glossary.js';
import {t, language, languageLinks} from './language.js';
import {concepts, episodes, termConcepts, relatedTerms, episodesForTerm, termURL} from './term-network.js';

// The homepage and chapter reader share definitions, graph links, URL state,
// keyboard behavior, and language handling through the same explanation panel.
export function initializeTermPanel({main, episode = null, onOpen = () => {}, modal = false}) {
  const contexts = lessonTerms[episode] || {};
  const wide = matchMedia('(min-width: 1200px)');
  const modalMode = () => modal || !wide.matches;
  const panel = document.createElement('dialog');
  panel.id = 'term-panel';
  panel.className = 'term-panel';
  panel.setAttribute('aria-labelledby', 'term-title');
  panel.innerHTML = `<div class="term-panel-top"><p class="reader-kicker">${t('TERM EXPLAINED')}</p><button type="button" class="term-close" aria-label="${t('Close explanation')}">×</button></div><h2 id="term-title" tabindex="-1"></h2><nav class="term-core-concepts" aria-label="${t('Core concepts')}"></nav><p id="term-definition"></p><div class="term-chapter-context"><h3>${t('In this chapter')}</h3><p id="term-context"></p></div><div class="term-math" hidden><p id="term-formula"></p><p id="term-notation"></p></div><section class="term-neighborhood" aria-labelledby="term-connections-title"><h3 id="term-connections-title">${t('Connected terms')}</h3><p class="term-network-hint">${t('Follow one connection at a time.')}</p><div class="term-related-list"></div></section><section aria-labelledby="term-episodes-title"><h3 id="term-episodes-title">${t('Read this term in context')}</h3><div class="term-episode-list"></div></section><button type="button" class="term-return">${t('Back to reading →')}</button>`;
  panel.querySelector('.term-panel-top').after(languageLinks());
  document.body.append(panel);

  let activeTrigger = null, selectedTerm = null, searchOrigin = false;
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
  function termTrigger(id, inlineOnly = false) {
    const selector = `.glossary-term[data-term="${id}"]`;
    const searchResult = !inlineOnly && new URL(location.href).searchParams.has('q')
      ? main.querySelector(`[data-search-term="${id}"]`) : null;
    const candidates = [searchResult, main.querySelector(`#idea ${selector}`), main.querySelector(`#explain ${selector}`),
      ...main.querySelectorAll(selector),
      ...(!inlineOnly ? [main.querySelector(`.course-keywords [data-open-term="${id}"]`),
        ...main.querySelectorAll(`[data-open-term="${id}"]`)] : [])].filter(Boolean);
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
      name.textContent = destination === episode ? t(contexts[id] ? 'Find in this chapter →' : 'Read this episode →') : t(episodes[destination].title);
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
    if (restoreFocus) {
      const target = searchOrigin
        ? activeTrigger?.isConnected && activeTrigger.matches('[data-search-term]') ? activeTrigger
          : main.querySelector(`[data-search-term="${selectedTerm}"]`) || main.querySelector('#concept-search-input')
        : activeTrigger?.isConnected ? activeTrigger : termTrigger(selectedTerm);
      target?.focus({preventScroll: true});
    }
    selectedTerm = null;
    if (updateURL) rememberTerm(null, 'replaceState');
  }
  function openTerm(id, trigger = null, updateURL = true) {
    const entry = terms[id];
    if (!entry) return;
    if (trigger || !panel.open) {
      activeTrigger?.setAttribute('aria-expanded', 'false');
      activeTrigger = trigger || termTrigger(id);
      searchOrigin = trigger ? trigger.matches('[data-search-term]') : new URL(location.href).searchParams.has('q');
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
    onOpen();
    keepReadingPosition(() => {
      document.body.classList.add('term-panel-open');
      if (!panel.open) modalMode() ? panel.showModal() : panel.show();
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
  });
  wide.addEventListener('change', () => {
    onOpen();
    if (!modal && panel.open) {
      panel.close();
      modalMode() ? panel.showModal() : panel.show();
      panel.querySelector('#term-title').focus({preventScroll: true});
    }
  });
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
      const trigger = termTrigger(selectedTerm, true);
      const target = trigger || document.getElementById('video-guide') || document.getElementById('idea');
      closeTerm(false);
      if (target) {
        // Some terms first appear inside an optional reading disclosure.
        for (let parent = target.parentElement; parent; parent = parent.parentElement)
          if (parent.tagName === 'DETAILS') parent.open = true;
        const url = new URL(location.href);
        url.hash = target.closest('section').id;
        history.pushState(history.state, '', url);
        if (!trigger) target.tabIndex = -1;
        target.scrollIntoView({block: 'center'});
        target.focus({preventScroll: true});
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
  return {panel, get activeTrigger() { return activeTrigger; }};
}
