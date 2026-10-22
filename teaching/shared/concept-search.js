import {t, language} from './language.js';
import {searchTerms, termNames} from './search-index.js';
import {episodes, episodesForTerm, preferredEpisode, termURL} from './term-network.js';

export function initializeConceptSearch(section) {
  const search = section.querySelector('.concept-search');
  if (!search) return;
  const form = search.querySelector('form');
  const input = search.querySelector('input');
  const clear = search.querySelector('.concept-search-clear');
  const status = search.querySelector('[role="status"]');
  const list = search.querySelector('.concept-search-results');
  const more = search.querySelector('.concept-search-more');
  const episode = section.dataset.currentEpisode;
  let matches = [], expanded = false, composing = false;

  function remember() {
    const url = new URL(location.href);
    const query = input.value.trim();
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    url.hash = 'knowledge-map';
    if (url.href !== location.href) history.replaceState(history.state, '', url);
  }
  function render() {
    matches = searchTerms(input.value);
    clear.hidden = !input.value;
    const visible = expanded ? matches : matches.slice(0, 6);
    list.replaceChildren();
    for (const id of visible) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      const destinations = episodesForTerm(id);
      const target = destinations.includes(episode) ? episode : preferredEpisode(id);
      link.href = termURL(id, target, language).href;
      link.dataset.openTerm = link.dataset.searchTerm = id;
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', 'term-panel');
      link.setAttribute('aria-expanded', 'false');
      link.className = 'concept-search-term';
      const name = document.createElement('strong'), alternate = document.createElement('span');
      name.textContent = termNames[id][language];
      alternate.textContent = termNames[id][language === 'en' ? 'zh' : 'en'];
      alternate.lang = language === 'en' ? 'zh-CN' : 'en';
      link.append(name, alternate);
      const routes = document.createElement('div'), label = document.createElement('span');
      routes.className = 'concept-search-episodes';
      label.textContent = t('Related episodes');
      routes.append(label);
      for (const destination of destinations) {
        const route = document.createElement('a');
        route.href = termURL(id, destination, language).href;
        route.dataset.searchEpisode = destination;
        route.textContent = destination;
        route.setAttribute('aria-label', `${destination}: ${t(episodes[destination].title)}`);
        routes.append(route);
      }
      item.append(link, routes); list.append(item);
    }
    const hasQuery = Boolean(input.value.trim());
    list.hidden = !matches.length;
    more.hidden = matches.length <= visible.length;
    more.textContent = t('Show all {count} results', {count: matches.length});
    status.textContent = !hasQuery ? '' : matches.length
      ? t('Matching concepts: {count}. Showing {shown}.', {count: matches.length, shown: visible.length})
      : t('No matching concepts. Try a shorter keyword.');
  }
  function update() {
    expanded = false;
    render(); remember();
  }
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; update(); });
  input.addEventListener('input', event => { if (!composing && !event.isComposing) update(); });
  input.addEventListener('search', () => { if (!composing) update(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (composing) return;
    const first = list.querySelector('[data-search-term]');
    if (first) first.click();
    else input.focus();
  });
  clear.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  more.addEventListener('click', () => {
    const next = matches[6];
    expanded = true; render();
    list.querySelector(`[data-search-term="${next}"]`)?.focus();
  });
  search.addEventListener('keydown', event => {
    if (composing || event.isComposing || event.keyCode === 229) {
      if (event.key === 'Enter') event.preventDefault();
      return;
    }
    const links = [...list.querySelectorAll('[data-search-term]')];
    const current = links.indexOf(event.target);
    if (event.key === 'ArrowDown' && (event.target === input || current >= 0)) {
      if (links.length) { event.preventDefault(); links[Math.min(current + 1, links.length - 1)].focus(); }
    } else if (event.key === 'ArrowUp' && current >= 0) {
      event.preventDefault(); (links[current - 1] || input).focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (event.target === input) { input.value = ''; update(); }
      input.focus();
    }
  });
  function restore() {
    input.value = (new URL(location.href).searchParams.get('q') || '').slice(0, 120);
    expanded = false; render();
  }
  addEventListener('popstate', restore);
  addEventListener('course:language-change', event => {
    const query = input.value.trim();
    if (query) event.detail.url.searchParams.set('q', query);
    else event.detail.url.searchParams.delete('q');
  });
  restore();
  search.hidden = false;
  search.classList.add('concept-search-ready');
}
