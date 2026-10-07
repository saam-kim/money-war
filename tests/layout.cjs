const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const C = require('../js/core.js'), D = require('../js/data.js');
const url = process.env.TEST_URL || 'http://127.0.0.1:8766';
const out = process.env.QA_OUTPUT_DIR || path.join(os.tmpdir(), 'money-war-qa');
fs.mkdirSync(out, { recursive: true });
let browser;
function fixtures() {
  let s = C.create({ count: 8, names: Array(8).fill('가나다라마바사아') });
  const result = [];
  while (s.phase !== 'final') {
    if (s.index === 0 || s.phase.startsWith('individual')) result.push({ name: s.phase + (s.phase === 'explanation' ? s.rounds[0].reveal : ''), state: s });
    if (s.phase === 'responseEntry') {
      for (let team = 0; team < 8; team++) for (const field of ['cause', 'rate']) {
        const code = D.rounds[s.index].cause;
        s = C.dispatch(s, { type: 'answer', team, field, value: field === 'cause' ? code : D.causes[code][field] });
      }
    }
    s = C.dispatch(s, { type: 'next' });
  }
  result.push({ name: 'final', state: s });
  return result;
}
(async () => {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage();
  const errors = [], report = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  for (const width of [360, 390, 768, 1024, 1280, 1366, 1920]) {
    await page.setViewportSize({ width, height: width < 900 ? 844 : width === 1280 ? 720 : 768 });
    for (const { name, state } of fixtures()) {
      await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key: C.STORAGE_KEY, state });
      await page.reload(); await page.locator('[data-action="resume"]').click();
      await page.evaluate(() => document.fonts.ready);
      const measurements = await page.evaluate(() => ({
        viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        overflowElements: [...document.querySelectorAll('#app *')].filter(n => n.getBoundingClientRect().right > innerWidth + 1).slice(0,12).map(n => ({tag:n.tagName,cls:n.className,right:n.getBoundingClientRect().right})),
        footerBottom: document.querySelector('.footer')?.getBoundingClientRect().bottom,
        footerTop: document.querySelector('.footer')?.getBoundingClientRect().top,
        transferBottom: document.querySelector('.individual-answer-grid')?.getBoundingClientRect().bottom,
        inputCountBottom: document.querySelector('.input-summary .input-count')?.getBoundingClientRect().bottom,
        finalBottom: document.querySelector('.final-grid')?.getBoundingClientRect().bottom,
        causeLabelOverflow: [...document.querySelectorAll('.cause-group .option>span')].filter(n => {
          if (!n.getClientRects().length) return false;
          const range = document.createRange(); range.selectNodeContents(n);
          const text = range.getBoundingClientRect(), box = n.getBoundingClientRect();
          return text.left < box.left || text.right > box.right;
        }).map(n => n.textContent),
        visibleTeamRows: (() => {
          const table = document.querySelector('.team-table'); if (!table) return null;
          const area = table.getBoundingClientRect(), header = table.querySelector('.head').getBoundingClientRect();
          return [...table.querySelectorAll('.team-row:not(.head)')].filter(n => {
            const b = n.getBoundingClientRect(); return b.top >= header.bottom - 1 && b.bottom <= area.bottom + 1;
          }).length;
        })(),
        panels: [...document.querySelector('#app').children].map(n => ({ class: n.className, height: Math.round(n.getBoundingClientRect().height) })),
        labels: [...document.querySelectorAll('#market-graph svg text')].map(n => {
          const b = n.getBBox(), svg = n.ownerSVGElement.viewBox.baseVal;
          return { text: n.textContent, clipped: b.x < 0 || b.y < 0 || b.x + b.width > svg.width || b.y + b.height > svg.height };
        })
      }));
      assert.ok(measurements.scrollWidth <= width + 1, `${name} at ${width}: horizontal page overflow ${measurements.scrollWidth} ${JSON.stringify(measurements.overflowElements)}`);
      assert.ok(measurements.labels.every(l => !l.clipped), `${name} at ${width}: clipped graph label`);
      assert.deepEqual(measurements.causeLabelOverflow, [], `${name} at ${width}: cause wording spills outside its button`);
      if (width >= 1200) {
        assert.ok(measurements.footerBottom <= (width === 1280 ? 720 : 768), `${name} at ${width}: projection controls below viewport (${measurements.footerBottom})`);
      }
      if (width === 1280) await page.screenshot({path:path.join(out, `projection-${name}.png`)});
      if (width >= 1200 && name === 'individualAnswers') {
        assert.ok(measurements.transferBottom <= measurements.footerTop, `both transfer examples fit above teacher controls: ${measurements.transferBottom} > ${measurements.footerTop}`);
      }
      if (width >= 1200 && name === 'responseEntry') {
        assert.ok(measurements.inputCountBottom <= measurements.footerTop, 'entry progress count stays above teaching controls');
        assert.ok(measurements.visibleTeamRows >= 5, 'compact entry shows at least five complete team rows on projection screens');
      }
      if (width >= 1200 && name === 'final') assert.ok(measurements.finalBottom <= measurements.footerTop, 'principles and all team results fit together above teaching controls');
      report.push({ width, phase: name, ...measurements });
      if (width === 1366 && name === 'explanation3' || width === 390 && name === 'responseEntry') await page.screenshot({ path: path.join(out, `layout-${width}-${name}.png`), fullPage: true });
    }
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(out, 'layout.json'), JSON.stringify(report, null, 2));
  console.log(`PASS ${report.length} layouts: 360–1920px / 8 long team names / no page overflow or clipped graph labels. ${out}`);
  console.log(JSON.stringify(report.filter(r => r.width === 1366 && ['newsReading', 'responseEntry', 'explanation4'].includes(r.phase)), null, 2));
  await browser.close();
})().catch(async e => { console.error(e); await browser?.close(); process.exitCode = 1; });
