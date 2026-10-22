import {terms} from './glossary.js';
import {phrases, termAliases} from './zh.js';
import {concepts, episodes, termConcepts, episodesForTerm} from './term-network.js';

const chinese = value => phrases[value.replace(/\s+/g, ' ').trim()] || value;
export const termNames = Object.fromEntries(Object.entries(terms).map(([id, term]) =>
  [id, {en: term.name, zh: chinese(term.name)}]));

// Search is independent of the displayed language. Reuse the reviewed names,
// aliases, and episode-card keywords instead of maintaining a second glossary.
export function normalizeSearch(value) {
  return String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
const unique = values => [...new Set(values.filter(Boolean).map(normalizeSearch))];
const index = Object.entries(terms).map(([id, term]) => {
  const keywords = Object.values(episodes).flatMap(episode =>
    Object.entries(episode.keywordTerms).filter(([, target]) => target === id).flatMap(([label]) => [label, chinese(label)]));
  const names = unique([term.name, chinese(term.name), ...term.aliases, ...(termAliases[id] || []), ...keywords]);
  const groups = unique(termConcepts[id].flatMap(concept => [concepts[concept].label, chinese(concepts[concept].label)]));
  return {id, names, groups, episodes: episodesForTerm(id)};
});

function matchRank(query, values) {
  if (values.includes(query)) return 0;
  const compact = query.replaceAll(' ', '');
  if (values.some(value => value.replaceAll(' ', '') === compact)) return 1;
  if (values.some(value => value.startsWith(query))) return 2;
  // Very short Latin queries should match word starts, not arbitrary letters
  // inside another word (for example NA inside "signal").
  const contains = (value, token) => /^[a-z0-9]{1,2}$/.test(token)
    ? value.split(' ').some(word => word.startsWith(token)) : value.includes(token);
  if (values.some(value => contains(value, query))) return 3;
  if (query.split(' ').every(token => values.some(value => contains(value, token)))) return 4;
  return Infinity;
}

export function searchTerms(value) {
  const query = normalizeSearch(value).slice(0, 120);
  if (!query) return [];
  return index.map(entry => {
    const direct = matchRank(query, entry.names);
    const group = matchRank(query, [...entry.groups, ...entry.episodes.map(normalizeSearch)]);
    return {id: entry.id, rank: Math.min(direct, group + 5)};
  }).filter(result => Number.isFinite(result.rank))
    .sort((a, b) => a.rank - b.rank || termNames[a.id].en.localeCompare(termNames[b.id].en, 'en'))
    .map(result => result.id);
}
