const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const C = require('../js/core.js'), D = require('../js/data.js');
const url = process.env.TEST_URL || 'http://127.0.0.1:8768';
const out = process.env.QA_OUTPUT_DIR || path.join(os.tmpdir(), 'money-war-qa');
let browser;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  let layouts = 0;
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' }), page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    const settled = () => page.waitForFunction(() => !document.querySelector('#app').hasAttribute('aria-busy'));
    const key = async k => { await page.keyboard.press(k); await settled(); };
    const state = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), C.STORAGE_KEY);
    const load = async s => {
      await page.evaluate(({ k, s }) => localStorage.setItem(k, JSON.stringify(s)), { k: C.STORAGE_KEY, s });
      await page.reload(); await page.locator('[data-action="resume"]').click(); await settled(); await page.evaluate(() => document.fonts.ready);
    };
    const check = async count => {
      assert.equal(await page.locator('.team-row:visible .option').count(), 6, 'only the selected group exposes answer controls');
      assert.equal(await page.locator('[data-entry-team]').count(), count, 'all group answers remain accessible');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal page overflow');
      if (viewport.width >= 900) {
        const bounds = await page.locator('.answer-console').evaluate(n => ({bottom:n.getBoundingClientRect().bottom,footer:document.querySelector('.footer').getBoundingClientRect().top,phase:document.querySelector('#app').dataset.phase}));
        if (bounds.bottom > bounds.footer) await page.screenshot({path:path.join(out,`console-failure-${viewport.width}-${count}-${bounds.phase}.png`),fullPage:true});
        assert.ok(bounds.bottom <= bounds.footer, `input and overview fit above teacher controls: ${JSON.stringify({viewport,count,...bounds})}`);
        assert.ok(await page.locator('.footer .primary').evaluate(n => n.getBoundingClientRect().bottom <= innerHeight), 'next action remains visible');
      }
      layouts++;
    };
    for (const count of [2, 5, 8]) {
      let s = C.create({ count, length: 4, names: Array(count).fill('달러거래분석모둠') });
      s = C.dispatch(C.dispatch(s, { type: 'next' }), { type: 'next' });
      await load(s); await check(count);
      const before = JSON.stringify((await state()).rounds[0].entries);
      await page.locator(`[data-entry-team="${count - 1}"]`).click();
      assert.equal(await page.locator('.team-row:visible').getAttribute('data-row'), String(count - 1));
      assert.equal(JSON.stringify((await state()).rounds[0].entries), before, 'selecting a group does not change any answer');
      await key('1');
      assert.match(await page.locator(`[data-entry-team="${count - 1}"]`).innerText(), /달러 수요 증가/);
      await key('5');
      assert.match(await page.locator(`[data-entry-team="${count - 1}"]`).innerText(), /상승/);
      assert.match(await page.locator(`[data-entry-team="${count - 1}"]`).innerText(), /입력 완료/);
      await key('ArrowUp');
      assert.equal(await page.locator('.team-row:visible').getAttribute('data-row'), String(count - 2));
      await key('ArrowDown'); await key('0');
      assert.match(await page.locator(`[data-entry-team="${count - 1}"]`).innerText(), /미제출/);
      assert.equal(await page.locator('.team-row:visible input:disabled').count(), 6);
      await key('0');
      for (let team = 0; team < count; team++) {
        await page.locator(`[data-entry-team="${team}"]`).click(); await key('1'); await key('5');
      }
      await check(count);
      assert.equal(await page.locator('[data-action="next"]').isDisabled(), false);
      await page.screenshot({ path: path.join(out, `console-${viewport.width}-${count}.png`), fullPage: true });
      await key('n');
      assert.equal(await page.locator('[data-action="back"]').count(),0,'confirmation offers explicit input correction instead of a back action that repeats the same screen');
      assert.ok(await page.locator('[data-action="unlock"]').isVisible(),'first answers remain editable before explanation');
      const originals = JSON.stringify((await state()).rounds[0].originals);
      for (let i = 0; i < 5; i++) await key('n');
      assert.equal((await state()).phase, 'correction');
      await page.locator('[data-action="correctionToggle"]').click();
      await check(count);
      await page.locator(`[data-entry-team="${count - 1}"]`).click(); await key('4'); await key('6');
      assert.match(await page.locator(`[data-entry-team="${count - 1}"]`).innerText(), /달러 공급 감소/);
      assert.equal(JSON.stringify((await state()).rounds[0].originals), originals, 'correction preserves first answers');
      assert.ok(C.totals(await state()).every(row => row.total === 6), 'correction preserves scores');
      await page.reload(); await page.locator('[data-action="resume"]').click(); await settled();
      await page.locator('[data-action="correctionToggle"]').click();
      assert.match(await page.locator(`[data-entry-team="${count - 1}"]`).innerText(), /달러 공급 감소/, 'saved corrections survive refresh');
    }
    assert.deepEqual(errors, []); await context.close();
  }
  await browser.close();
  console.log(`PASS ${layouts} entry/correction layouts: six visible options, all group summaries, click/arrow selection, live updates, missing, save and immutable scoring`);
})().catch(async e => { console.error(e); await browser?.close(); process.exit(1); });
