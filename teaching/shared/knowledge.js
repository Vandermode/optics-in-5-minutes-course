import {t, language} from './language.js';
import {terms, lessonTerms} from './glossary.js';
import {conceptTerms, preferredEpisode, termURL} from './term-network.js';

const section = document.getElementById('knowledge-map');
const graph = document.getElementById('concept-graph');
const svg = graph.querySelector('.concept-lines');
const regions = [...graph.querySelectorAll('.concept-region')];
const nodes = new Map([...graph.querySelectorAll('[data-concept]')].map(node => [node.dataset.concept, node]));
const panels = new Map([...section.querySelectorAll('.concept-panel')].map(panel => [panel.id.slice('concept-'.length), panel]));
const edges = JSON.parse(document.getElementById('concept-relations').textContent);
const NS = 'http://www.w3.org/2000/svg';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const stacked = matchMedia('(max-width: 1100px)');
const chapter = Boolean(section.dataset.currentEpisode);
let selected = section.dataset.defaultConcept || 'fourier', hovered = null, layout = new Map();
section.querySelector('.concept-depth-note').hidden = false;

// The overview stays small. A reader explicitly expands one concept's terms;
// none of the detailed vocabulary becomes another node in the overview graph.
for (const [id, panel] of panels) {
  const episode = section.dataset.currentEpisode;
  const details = document.createElement('details');
  details.className = 'concept-term-layer';
  const summary = document.createElement('summary');
  summary.textContent = t('Explore specific terms ({count})', {count: conceptTerms[id].length});
  const hint = document.createElement('p');
  hint.textContent = t('Open a term to see its explanation and nearby ideas.');
  const list = document.createElement('ul');
  const ids = [...conceptTerms[id]].sort((a, b) => Number(Boolean(lessonTerms[episode]?.[b])) - Number(Boolean(lessonTerms[episode]?.[a])));
  for (const term of ids) {
    const inChapter = Boolean(lessonTerms[episode]?.[term]);
    const target = inChapter ? episode : preferredEpisode(term, id);
    const item = document.createElement('li'), link = document.createElement('a');
    link.href = termURL(term, target, language, id).href;
    link.dataset.specificTerm = term;
    const name = document.createElement('span'), location = document.createElement('small');
    name.textContent = t(terms[term].name);
    location.textContent = inChapter ? t('In this episode') : target;
    if (inChapter) {
      link.dataset.openTerm = term;
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', 'term-panel');
    }
    link.append(name, location); item.append(link); list.append(item);
  }
  details.append(summary, hint, list);
  panel.querySelector('.concept-context').before(details);
}

function make(tag, attributes = {}) {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function hashConcept() {
  const id = location.hash.slice('#concept-'.length);
  return location.hash.startsWith('#concept-') && nodes.has(id) ? id : null;
}

function queryConcept() {
  const id = new URL(location.href).searchParams.get('concept');
  return nodes.has(id) ? id : null;
}

function stateConcept() {
  const id = history.state?.opticsConcept;
  return nodes.has(id) ? id : null;
}

function rememberConcept() {
  history.replaceState({...history.state, opticsConcept: selected}, '', location.href);
}

function showConcept(id, announce = false) {
  if (!nodes.has(id)) return;
  selected = id;
  const neighbors = new Set(edges.filter(edge => edge.a === id || edge.b === id).flatMap(edge => [edge.a, edge.b]));
  for (const [key, node] of nodes) {
    if (key === id) node.setAttribute('aria-current', 'true');
    else node.removeAttribute('aria-current');
    node.toggleAttribute('data-neighbor', key !== id && neighbors.has(key));
    panels.get(key).hidden = key !== id;
  }
  if (announce) {
    document.getElementById('concept-status').textContent = t('Selected concept: {name}. {count} related episodes.', {
      name: nodes.get(id).textContent,
      count: panels.get(id).querySelectorAll('[data-episode-link]').length,
    });
  }
  if (layout.size) draw();
  else paintEdges();
  rememberConcept();
}

function scrollToPanel(id, force = false) {
  // Keep the selected concept and its routes together when the two columns stack.
  if (chapter || stacked.matches || force) {
    panels.get(id).scrollIntoView({block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth'});
    panels.get(id).focus({preventScroll: true});
  }
}

document.addEventListener('click', event => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  if (event.target.closest('a.concept-back')) {
    event.preventDefault();
    history.pushState({...history.state, opticsConcept: selected}, '', '#knowledge-map');
    nodes.get(selected).focus({preventScroll: true});
    section.scrollIntoView({block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth'});
    return;
  }
  const link = event.target.closest('a[href^="#concept-"], a[data-term-concept]');
  if (!link) return;
  const id = link.hash.slice('#concept-'.length);
  if (!nodes.has(id)) return;
  event.preventDefault();
  const activePanel = link.closest('.concept-panel');
  if (location.hash !== link.hash) {
    const url = new URL(location.href);
    url.hash = link.hash;
    if (url.searchParams.has('concept')) url.searchParams.set('concept', id);
    history.pushState(null, '', url);
  }
  showConcept(id, true);
  // A connection link may hide its own panel; keep keyboard focus in the map.
  if (activePanel) nodes.get(id).focus({preventScroll: true});
  scrollToPanel(id, Boolean(activePanel));
});

for (const [id, node] of nodes) {
  for (const event of ['pointerenter', 'focus']) node.addEventListener(event, () => {hovered = id; paintEdges();});
  for (const event of ['pointerleave', 'blur']) node.addEventListener(event, () => {hovered = null; paintEdges();});
}

function paintEdges() {
  const active = [];
  svg.querySelectorAll('[data-edge]').forEach(path => {
    const relevant = path.dataset.a === selected || path.dataset.b === selected;
    const focused = relevant && (path.dataset.a === hovered || path.dataset.b === hovered);
    path.setAttribute('stroke', relevant ? 'var(--teal)' : 'var(--ink)');
    path.setAttribute('stroke-width', focused ? 2.2 : relevant ? 1.8 : 1);
    path.setAttribute('opacity', focused ? 1 : relevant ? .85 : .13);
    if (relevant) active.push(path);
  });
  for (const path of active) path.parentElement.append(path);
}

function route(edge, width, height, labels) {
  const a = layout.get(edge.a), b = layout.get(edge.b);
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
  const nx = -dy / length, ny = dx / length;
  let best;
  for (const offset of [0, 50, -50, 100, -100, 160, -160, 220, -220]) {
    const control = {x: (a.x + b.x) / 2 + nx * offset, y: (a.y + b.y) / 2 + ny * offset};
    function clip(point) {
      const vx = control.x - point.x, vy = control.y - point.y;
      const scale = Math.min((point.w / 2 + 5) / Math.max(Math.abs(vx), .001),
        (point.h / 2 + 5) / Math.max(Math.abs(vy), .001));
      return {x: point.x + vx * scale, y: point.y + vy * scale};
    }
    const start = clip(a), end = clip(b);
    let cost = Math.abs(offset) * .12;
    for (let step = 1; step < 32; step++) {
      const t = step / 32, u = 1 - t;
      const x = u * u * start.x + 2 * u * t * control.x + t * t * end.x;
      const y = u * u * start.y + 2 * u * t * control.y + t * t * end.y;
      if (x < 4 || x > width - 4 || y < 42 || y > height - 4) cost += 500;
      for (const [id, node] of layout) {
        if (id !== edge.a && id !== edge.b && Math.abs(x - node.x) < node.w / 2 + 7 && Math.abs(y - node.y) < node.h / 2 + 7) cost += 100;
      }
      for (const label of labels) if (x > label.x - 3 && x < label.x + label.w + 3 && y > label.y - 3 && y < label.y + label.h + 3) cost += 150;
    }
    if (!best || cost < best.cost) best = {cost, d: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`};
  }
  return best.cost >= 100 ? detour(a, b, width, height, labels) || best.d : best.d;
}

function detour(a, b, width, height, labels) {
  // A single curve cannot always pass between the other concepts. Try clear
  // orthogonal lanes, including the outside margin, before drawing the edge.
  const obstacles = [...layout.values()].map(node => ({
    left: node.x - node.w / 2 - 6, right: node.x + node.w / 2 + 6,
    top: node.y - node.h / 2 - 6, bottom: node.y + node.h / 2 + 6,
  })).concat(labels.map(label => ({left: label.x - 5, right: label.x + label.w + 5, top: label.y - 5, bottom: label.y + label.h + 5})));
  const ports = node => [
    {x: node.x, y: node.y - node.h / 2 - 9, dx: 0, dy: -1},
    {x: node.x, y: node.y + node.h / 2 + 9, dx: 0, dy: 1},
    {x: node.x - node.w / 2 - 9, y: node.y, dx: -1, dy: 0},
    {x: node.x + node.w / 2 + 9, y: node.y, dx: 1, dy: 0},
  ];
  const xs = [3, width - 3, ...obstacles.flatMap(box => [box.left - 3, box.right + 3])].filter(x => x >= 3 && x <= width - 3);
  const ys = [42, height - 3, ...obstacles.flatMap(box => [box.top - 3, box.bottom + 3])].filter(y => y >= 42 && y <= height - 3);
  let best;
  function consider(points) {
    points = points.filter((point, index) => !index || point.x !== points[index - 1].x || point.y !== points[index - 1].y);
    if (points.some(point => point.x < 3 || point.x > width - 3 || point.y < 42 || point.y > height - 3)) return;
    let length = 0;
    for (let index = 1; index < points.length; index++) {
      const p = points[index - 1], q = points[index];
      if (obstacles.some(box => p.x === q.x
        ? p.x > box.left && p.x < box.right && Math.max(p.y, q.y) > box.top && Math.min(p.y, q.y) < box.bottom
        : p.y > box.top && p.y < box.bottom && Math.max(p.x, q.x) > box.left && Math.min(p.x, q.x) < box.right)) return;
      length += Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
    }
    const cost = length + points.length * 14;
    if (!best || cost < best.cost) best = {cost, points};
  }
  for (const start of ports(a)) for (const end of ports(b)) {
    // Short outward stubs make both endpoints face their own node. Without
    // these, a clear lane can end sideways beside the intended target.
    // Four pixels also fit the narrow gaps around multiline chapter labels.
    const from = {x: start.x + start.dx * 4, y: start.y + start.dy * 4};
    const to = {x: end.x + end.dx * 4, y: end.y + end.dy * 4};
    consider([start, from, {x: from.x, y: to.y}, to, end]);
    consider([start, from, {x: to.x, y: from.y}, to, end]);
    for (const x of xs) consider([start, from, {x, y: from.y}, {x, y: to.y}, to, end]);
    for (const y of ys) consider([start, from, {x: from.x, y}, {x: to.x, y}, to, end]);
  }
  if (!best) return null;
  // Keep bends inside the clear lanes. The labels and nodes remain at least
  // six pixels away from the path, even with the small corner rounding.
  const points = best.points;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index++) {
    const p = points[index - 1], q = points[index], r = points[index + 1];
    const incoming = Math.hypot(q.x - p.x, q.y - p.y), outgoing = Math.hypot(r.x - q.x, r.y - q.y);
    const radius = Math.min(4, incoming / 2, outgoing / 2);
    const before = {x: q.x + (p.x - q.x) * radius / incoming, y: q.y + (p.y - q.y) * radius / incoming};
    const after = {x: q.x + (r.x - q.x) * radius / outgoing, y: q.y + (r.y - q.y) * radius / outgoing};
    path += ` L ${before.x} ${before.y} Q ${q.x} ${q.y} ${after.x} ${after.y}`;
  }
  return path + ` L ${points.at(-1).x} ${points.at(-1).y}`;
}

function draw() {
  const width = graph.clientWidth;
  if (!width) return;
  const columns = width >= 640 ? 2 : 1;
  const blockWidth = width / columns;
  const blockHeight = columns === 2 ? 250 : 230;
  const height = blockHeight * (regions.length / columns);
  graph.style.height = height + 'px';
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  layout = new Map();
  regions.forEach((region, index) => {
    const gx = index % columns * blockWidth, gy = Math.floor(index / columns) * blockHeight;
    Object.assign(region.style, {left: gx + 'px', top: gy + 'px', width: blockWidth + 'px', height: blockHeight + 'px'});
    [...region.querySelectorAll('[data-concept]')].forEach((node, slot) => {
      const w = slot === 2 ? Math.min(210, blockWidth - 48) : Math.min(186, (blockWidth - 40) / 2);
      const x = blockWidth * (slot === 0 ? .25 : slot === 1 ? .75 : .5);
      const y = slot === 2 ? 180 : 87;
      Object.assign(node.style, {width: w + 'px', left: (x - w / 2) + 'px', top: '0px'});
      const h = node.getBoundingClientRect().height;
      node.style.top = (y - h / 2) + 'px';
      layout.set(node.dataset.concept, {x: gx + x, y: gy + y, w, h});
    });
  });
  const graphBox = graph.getBoundingClientRect();
  const labels = regions.map(region => {
    const box = region.querySelector('h3').getBoundingClientRect();
    return {x: box.left - graphBox.left, y: box.top - graphBox.top, w: box.width, h: box.height};
  });
  svg.replaceChildren();
  const defs = make('defs'), marker = make('marker', {id: 'concept-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto'});
  marker.append(make('path', {d: 'M 1 1 L 9 5 L 1 9 Z', fill: 'context-stroke'}));
  defs.append(marker); svg.append(defs);
  regions.forEach((region, index) => {
    svg.append(make('ellipse', {
      cx: index % columns * blockWidth + blockWidth / 2,
      cy: Math.floor(index / columns) * blockHeight + 120,
      rx: blockWidth / 2 - 5, ry: 105,
      fill: getComputedStyle(region).getPropertyValue('--region-color'), 'fill-opacity': .055,
    }));
  });
  const edgeLayer = make('g');
  svg.append(edgeLayer);
  for (const edge of edges) {
    const path = make('path', {d: route(edge, width, height, labels), fill: 'none', 'stroke-linecap': 'round', 'data-edge': '', 'data-a': edge.a, 'data-b': edge.b});
    if (edge.kind === 'basis') path.setAttribute('marker-end', 'url(#concept-arrow)');
    else path.setAttribute('stroke-dasharray', '5 6');
    edgeLayer.append(path);
  }
  paintEdges();
}

function restoreFromURL() {
  const id = hashConcept() || queryConcept() || stateConcept();
  if (id) showConcept(id);
  else rememberConcept();
}
addEventListener('course:language-change', event => {
  event.detail.url.searchParams.set('concept', selected);
});
const initial = hashConcept() || queryConcept() || stateConcept();
showConcept(initial || selected);
section.classList.add('atlas-ready');
draw();
new ResizeObserver(draw).observe(graph);
document.fonts.ready.then(draw);
addEventListener('hashchange', restoreFromURL);
addEventListener('popstate', restoreFromURL);
if (hashConcept()) requestAnimationFrame(() => scrollToPanel(initial, true));
document.body.classList.add('knowledge-ready');
