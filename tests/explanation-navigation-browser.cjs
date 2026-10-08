const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const C = require('../js/core.js');
const url = process.env.TEST_URL || 'http://127.0.0.1:8766';
const out = process.env.QA_OUTPUT_DIR || path.join(os.tmpdir(), 'money-war-qa');
let browser;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    let fixture = C.create({ count: 2, length: 4 });
    while (fixture.phase !== 'responseEntry') fixture = C.dispatch(fixture, { type: 'next' });
    for (let team = 0; team < 2; team++) {
      fixture = C.dispatch(fixture, { type: 'answer', team, field: 'cause', value: 'A' });
      fixture = C.dispatch(fixture, { type: 'answer', team, field: 'rate', value: 'up' });
    }
    for (let i = 0; i < 4; i++) fixture = C.dispatch(fixture, { type: 'next' });
    delete fixture.rounds[0].viewStep; // A lesson saved before this navigation fix.
    const originals = JSON.stringify(fixture.rounds[0].originals);
    const settled = () => page.waitForFunction(() => !document.querySelector('#app').hasAttribute('aria-busy'));
    const click = async action => { await page.locator(`[data-action="${action}"]`).click(); await settled(); };
    const key = async value => { await page.keyboard.press(value); await settled(); };
    const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), C.STORAGE_KEY);
    const visible = async n => {
      assert.match(await page.locator('.reveal-heading').innerText(), new RegExp(`${n}/3단계`));
      assert.equal(await page.locator('.chain-step:not(.pending)').count(), n, 'the explanation text follows the selected step');
      assert.equal(await page.locator('#market-graph').count(), n >= 2 ? 1 : 0, 'the graphic follows the selected step');
      assert.equal(await page.locator('#market-graph .new-point').count(), n === 3 ? 1 : 0, 'equilibrium appears only at the rate step');
      assert.equal(JSON.stringify((await stored()).rounds[0].originals), originals);
      assert.equal((await stored()).rounds[0].reveal, 3);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
    };
    await page.goto(url);
    await page.evaluate(({ key, s }) => localStorage.setItem(key, JSON.stringify(s)), { key: C.STORAGE_KEY, s: fixture });
    await page.reload(); await click('resume'); await visible(3);
    await click('back'); await visible(2);
    await page.setViewportSize({ width: viewport.width + 1, height: viewport.height });
    await page.waitForFunction(() => !document.querySelector('#market-graph .new-point'));
    await page.setViewportSize(viewport); await visible(2);
    await page.reload(); await click('resume'); await visible(2);
    await page.screenshot({ path: path.join(out, `explanation-back-${viewport.width}.png`), fullPage: true });
    await key('p'); await visible(1);
    await click('back');
    assert.equal(await page.locator('#app').getAttribute('data-phase'), 'responsesLocked');
    assert.equal(await page.locator('[data-action="unlock"]').count(), 0, 'reviewing first answers cannot unlock them');
    assert.equal(await page.locator('[data-action="back"]').count(), 0, 'a protected boundary has no dead previous button');
    await key('p'); assert.equal(await page.locator('#app').getAttribute('data-phase'), 'responsesLocked');
    for (const n of [1, 2, 3]) { await key('n'); await visible(n); assert.deepEqual(C.totals(await stored()).map(r => r.total), [0, 0]); }
    await click('next'); assert.deepEqual(C.totals(await stored()).map(r => r.total), [6, 6]);
    await key('p'); await visible(3);
    await key('p'); await visible(2);
    assert.deepEqual(C.totals(await stored()).map(r => r.total), [6, 6]);
    await key('n'); await key('n');
    assert.equal(await page.locator('#app').getAttribute('data-phase'), 'roundFeedback');
    assert.deepEqual(C.totals(await stored()).map(r => r.total), [6, 6], 'reviewing does not score a second time');
    await click('next'); assert.equal(await page.locator('#app').getAttribute('data-phase'), 'correction');
    await click('next'); assert.equal((await stored()).index, 1);
    assert.deepEqual(errors, []);
    await context.close();
  }
  await browser.close();
  console.log('PASS explanation previous/next, click/P/N, legacy resume, read-only originals, stable scoring: desktop and mobile');
})().catch(async e => { console.error(e); await browser?.close(); process.exit(1); });
