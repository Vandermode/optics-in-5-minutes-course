import assert from 'node:assert/strict';

export async function geometry(page, label) {
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
      const end = path.getPointAtLength(total), before = path.getPointAtLength(Math.max(0, total - 1));
      const target = nodes.find(node => node.id === path.dataset.b);
      const dx = end.x - before.x, dy = end.y - before.y;
      const tx = (target.l + target.r) / 2 - end.x, ty = (target.t + target.b) / 2 - end.y;
      if ((dx * tx + dy * ty) / (Math.hypot(dx, dy) * Math.hypot(tx, ty)) < .9) issues.push(`${path.dataset.a} → ${path.dataset.b} does not point toward its target`);
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
