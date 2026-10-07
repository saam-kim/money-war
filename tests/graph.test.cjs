const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const D = require('../js/data.js');
const context = { window: {}, MWData: D };
vm.runInNewContext(fs.readFileSync(require.resolve('../js/graph.js'), 'utf8'), context);
function render(code, reveal, width) {
  const container = { getBoundingClientRect: () => ({ width }), innerHTML: '' };
  context.window.MWGraph.render(container, code, reveal);
  return container.innerHTML;
}
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
}
function xAtY(line, y) {
  return +line.x1 + (y - line.y1) * (line.x2 - line.x1) / (line.y2 - line.y1);
}
for (const width of [230, 550]) for (const code of Object.keys(D.causes)) {
  test(`${code}, width ${width}: horizontal shift connects the original and moved curve`, () => {
    const lines = [...render(code, 2, width).matchAll(/<line\b[^>]*>/g)].map(m => attributes(m[0]));
    const original = lines[D.causes[code].market === 'demand' ? 0 : 1];
    const moved = lines[2], arrow = lines[3];
    assert.equal(+arrow.y1, +arrow.y2);
    assert.ok(Math.abs(xAtY(original, +arrow.y1) - arrow.x1) < .01, 'arrow starts on original curve');
    assert.ok(Math.abs(xAtY(moved, +arrow.y2) - arrow.x2) < .01, 'arrow ends on moved curve');
    assert.equal(Math.sign(arrow.x2 - arrow.x1), D.causes[code].change === 'increase' ? 1 : -1);
  });
}
test('equilibrium is hidden until rate reveal and shifts in the correct direction', () => {
  for (const code of Object.keys(D.causes)) {
    assert.ok(!render(code, 2, 550).includes('new-point'));
    const svg = render(code, 3, 550);
    const points = [...svg.matchAll(/<circle\b[^>]*>/g)].map(m => attributes(m[0]));
    assert.equal(Math.sign(points[1].cy - points[0].cy), D.causes[code].rate === 'up' ? -1 : 1);
  }
});
