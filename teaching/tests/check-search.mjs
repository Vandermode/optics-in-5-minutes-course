import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terms} from '../shared/glossary.js';
import {phrases, termAliases} from '../shared/zh.js';
import {episodesForTerm} from '../shared/term-network.js';
import {searchTerms, termNames} from '../shared/search-index.js';

let checked = 0;
for (const [id, term] of Object.entries(terms)) {
  for (const name of Object.values(termNames[id])) {
    assert.equal(searchTerms(name)[0], id, `Canonical name: ${name}`); checked++;
  }
  for (const alias of [...term.aliases, ...termAliases[id]]) {
    assert.ok(searchTerms(alias).includes(id), `${id}: searchable alias ${alias}`); checked++;
  }
}
const catalog = JSON.parse(fs.readFileSync(new URL('../course.json', import.meta.url)));
for (const episode of catalog) for (const [keyword, id] of Object.entries(episode.keywordTerms)) {
  for (const label of [keyword, phrases[keyword]]) {
    assert.equal(searchTerms(label)[0], id, `${episode.id}: keyword ${label}`); checked++;
  }
}
for (const [query, expected] of [
  ['ＰＳＦ', 'psf'], ['  cOhErEnCe\tlength  ', 'coherenceLength'],
  ['相干 长度', 'coherenceLength'], ['相干 length', 'coherenceLength'],
  ['spectral 带宽', 'spectralBandwidth'], ['phase-contrast', 'phaseContrast'],
  ['Gerchberg—Saxton', 'gerchberg'], ['na', 'na'], ['PML', 'pml'],
  ['adjoint method', 'adjointMethod'], ['伴随法', 'adjointMethod'],
]) assert.equal(searchTerms(query)[0], expected, query);
for (const query of ['', '  ', '---', 'unmatchedxyzterm', '<script>alert(1)</script>'])
  assert.deepEqual(searchTerms(query), [], `No matches: ${query}`);
assert.ok(searchTerms('phase').length > 6, 'Broad searches can reveal more than the initial results');
assert.ok(searchTerms('波动传播').includes('angularSpectrum'), 'Core-concept vocabulary also finds its terms');
assert.ok(searchTerms('E04').length > 1);
assert.ok(searchTerms('E04').every(id => episodesForTerm(id).includes('E04')), 'Episode search uses exact destinations');
assert.equal(new Set(searchTerms('phase')).size, searchTerms('phase').length, 'No duplicate concepts');
console.log(`PASS bilingual search: ${checked} names, aliases and card keywords; ranking, mixed queries, normalization, groups and empty states.`);
