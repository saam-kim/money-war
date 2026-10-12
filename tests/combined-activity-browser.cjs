const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const C = require('../js/core.js'), D = require('../js/data.js');
const url = process.env.TEST_URL || 'http://127.0.0.1:8767';
const out = process.env.QA_OUTPUT_DIR || path.join(os.tmpdir(), 'money-war-qa');
let browser;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  let checked = 0;
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' }), page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install();
    await page.goto(url);
    const settled = () => page.waitForFunction(() => !document.querySelector('#app').hasAttribute('aria-busy'));
    const load = async s => {
      await page.evaluate(({ key, s }) => localStorage.setItem(key, JSON.stringify(s)), { key: C.STORAGE_KEY, s });
      await page.reload(); await page.locator('[data-action="resume"]').click(); await settled(); await page.evaluate(() => document.fonts.ready);
    };
    const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), C.STORAGE_KEY);
    for (let index = 0; index < 8; index++) {
      let s = C.dispatch(C.create({ count: 2, length: 6 }), { type: 'next' });
      const personal = index >= 6, news = personal ? D.individual[index - 6] : D.rounds[index];
      if (personal) {
        s.rounds.forEach((r, i) => {
          r.originals = r.entries.map(() => ({ cause: D.rounds[i].cause, rate: D.causes[D.rounds[i].cause].rate, missing: false }));
          r.reveal = 3; r.scored = true;
        });
        s.phase = index === 6 ? 'individualA' : 'individualB'; s.index = 5;
      } else s.index = index;
      // Use a running timer on the browser's clock.
      s.timer = { remaining: personal ? 60 : 110, deadline: await page.evaluate(seconds => Date.now() + seconds * 1000, personal ? 60 : 110) };
      await load(s);
      assert.equal(await page.locator('.reason-rail,.reason-template').count(), 0, 'onscreen sentence templates are removed');
      assert.equal(await page.locator('.activity').count(), 0, 'no large secondary instruction panel');
      assert.equal(await page.locator('.news-paragraph').count(), 2);
      assert.equal((await page.locator('.news-paragraph').allTextContents()).join('\n\n'), news.text, 'high-school articles stay complete');
      assert.equal(await page.locator('#market-graph,.result-table').count(), 0, 'activity reveals no solution or scores');
      if (!personal) {
        assert.equal(await page.locator('.activity-order li').count(), 3, 'individual judgment stays before discussion and simultaneous boards');
        assert.match(await page.locator('.discussion-prompt').innerText(), /누가 달러/);
        assert.match(await page.locator('.footer [data-action="next"]').innerText(), /모둠 답안 입력/);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
      if (viewport.width >= 1200) {
        assert.ok(await page.locator('.news-paragraph').first().evaluate(n => parseFloat(getComputedStyle(n).fontSize) >= 24), 'projection article type remains readable');
        assert.ok(await page.locator('.news').evaluate(n => n.getBoundingClientRect().bottom <= document.querySelector('.footer').getBoundingClientRect().top), 'complete article remains above controls');
        assert.ok(await page.locator('.footer .primary').evaluate(n => n.getBoundingClientRect().bottom <= innerHeight), 'primary action fits the screen');
      }
      if ([0, 4, 6].includes(index)) await page.screenshot({ path: path.join(out, `activity-${viewport.width}-${index}.png`), fullPage: true });
      if (index === 0) {
        await page.clock.fastForward(111000);
        assert.equal(await page.locator('#timer-value').innerText(), '00:00');
        assert.equal((await stored()).phase, 'newsReading', 'time expiry does not submit or advance');
        await page.keyboard.press('n'); await settled();
        assert.equal((await stored()).phase, 'responseEntry', 'one N moves from the activity to teacher entry');
        assert.equal((await stored()).rounds[0].originals, null);
        await page.keyboard.press('p'); await settled(); assert.equal((await stored()).phase, 'newsReading');
        await page.locator('[data-action="next"]').click(); await settled(); assert.equal((await stored()).phase, 'responseEntry');
        await page.keyboard.press('n'); await settled(); assert.equal((await stored()).phase, 'responseEntry', 'incomplete entry cannot reveal answers');
      }
      checked++;
    }
    for (const phase of ['individual', 'discussion']) {
      const legacy = C.create({ count: 2 }); legacy.phase = phase; legacy.timer = { remaining: 17, deadline: null };
      legacy.history = [{ phase: 'rehearsal', index: 0 }, { phase: 'newsReading', index: 0 }, { phase: 'individual', index: 0 }];
      await load(legacy);
      assert.equal(await page.locator('#app').getAttribute('data-phase'), 'newsReading');
      assert.equal(await page.locator('#timer-value').innerText(), '00:17');
      await page.keyboard.press('n'); await settled(); assert.equal((await stored()).phase, 'responseEntry');
    }
    await page.evaluate(() => { window.print = () => {}; });
    await page.locator('#menu').click(); await page.locator('[data-tool="worksheet"]').click();
    assert.equal(await page.locator('#print-root .print-worksheet').count(), 2, 'worksheet remains one sheet front and back');
    assert.match(await page.locator('#print-root').innerText(), /수요 \/ 공급/);
    assert.match(await page.locator('#print-root').innerText(), /먼저 혼자 고르세요/);
    assert.deepEqual(errors, []); await context.close();
  }
  await browser.close();
  console.log(`PASS ${checked} article layouts, one-click/N entry, P return, advisory timer, legacy activity resume and unchanged worksheet choices`);
})().catch(async e => { console.error(e); await browser?.close(); process.exit(1); });
