// Run against the repository's static server; see README for environment options.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const C = require('../js/core.js');
const D = require('../js/data.js');
const url = process.env.TEST_URL || 'http://127.0.0.1:8766';
const out = process.env.QA_OUTPUT_DIR || path.join(os.tmpdir(), 'money-war-qa');
fs.mkdirSync(out, { recursive: true });
let browser;

(async () => {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  const settled = () => page.waitForFunction(() => !document.querySelector('#app').hasAttribute('aria-busy'));
  const next = async () => { await settled(); await page.locator('[data-action="next"]').click(); await settled(); };
  const shot = name => page.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
  const choose = async (team, field, value) => {
    const input = page.locator(`.team-row[data-row="${team}"] input[data-field="${field}"][value="${value}"]`);
    await input.locator('..').click();
    await settled();
    assert.equal(await input.isChecked(), true);
  };
  const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), C.STORAGE_KEY);
  await page.goto(url); await page.evaluate(() => document.fonts.ready);
  assert.ok(await page.evaluate(() => [...document.fonts].some(f => f.family === 'Pretendard' && f.status === 'loaded')), 'local Pretendard loaded');
  await shot('landing');
  await page.locator('[data-action="setup"]').click();
  await page.selectOption('#team-count', '8');
  await page.locator('#setup-form button[type="submit"]').click();
  await next();
  for (let i = 0; i < 6; i++) {
    assert.equal((await stored()).phase, 'newsReading');
    assert.equal(await page.locator('.news').count(), 1);
    for (let step = 0; step < 3; step++) {
      await next();
      assert.equal(await page.locator('#market-graph').count(), 0);
      assert.equal(await page.locator('.result-table').count(), 0);
      if (i === 0 && step === 0) await shot('news-desktop');
    }
    assert.equal(await page.locator('[data-action="next"]').isDisabled(), true);
    if (i === 0) {
      const table = page.locator('.team-table');
      await table.evaluate(n => n.scrollTop = 200);
      const scroll = await table.evaluate(n => n.scrollTop);
      const add = page.locator('[data-action="timerAdd"]');
      await add.focus(); await page.keyboard.press('Enter');
      await settled();
      assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'timerAdd');
      assert.equal(await table.evaluate(n => n.scrollTop), scroll);
      await page.locator('#menu').click(); await page.keyboard.press('Escape');
      assert.equal(await page.locator('#menu').getAttribute('aria-expanded'), 'false');
      await page.locator('#menu').click(); await page.locator('[data-tool="settings"]').click();
      assert.equal(await page.locator('dialog').getAttribute('aria-labelledby'), 'dialog-title');
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'menu');
      // News dialog can be closed by keyboard without losing entry state.
      await page.locator('[data-action="news"]').click();
      assert.equal(await page.locator('dialog').isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('dialog').isVisible(), false);
      assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'news');
    }
    const code = D.rounds[i].cause, key = D.causes[code];
    for (let team = 0; team < 8; team++) {
      await choose(team, 'cause', code); await choose(team, 'rate', key.rate);
      assert.equal(await page.locator('[data-field="won"]').count(), 0);
    }
    if (i === 0) await shot('entry-desktop');
    await next(); assert.equal(await page.locator('#market-graph').count(), 0);
    for (let reveal = 1; reveal <= 3; reveal++) {
      await next();
      assert.equal(await page.locator('.result-table').count(), 0);
      assert.equal((await stored()).rounds[i].scored, false);
      if (reveal === 2) {
        assert.equal(await page.locator('#market-graph').count(), 1);
        assert.equal(await page.locator('#market-graph .new-point').count(), 0);
        await page.reload(); await page.locator('[data-action="resume"]').click();
        assert.equal((await stored()).rounds[i].reveal, 2);
      }
      if (reveal === 3 && i < 4) await shot('graph-' + code);
    }
    await next(); assert.equal(await page.locator('.result-table tbody tr').count(), 8);
    if (i === 0) {
      assert.equal(await page.locator('#team-detail .feedback-detail').isVisible(), true, 'feedback is available without an extra team click');
      assert.equal(await page.locator('[data-team-detail="0"]').getAttribute('aria-pressed'), 'true', 'an all-correct round starts with the first team');
      await page.locator('[data-team-detail="7"]').click();
      assert.equal(await page.locator('[data-team-detail="7"]').getAttribute('aria-pressed'), 'true');
      assert.ok(await page.locator('.footer').evaluate(n => n.getBoundingClientRect().bottom <= innerHeight), 'next action visible with selected feedback');
      assert.ok(await page.locator('[data-team-detail="7"]').evaluate(n => {
        const panel = n.closest('.result-scroll'), b = n.getBoundingClientRect(), p = panel.getBoundingClientRect();
        return b.top >= p.top + panel.querySelector('thead').getBoundingClientRect().height - 1 && b.bottom <= p.bottom + 1;
      }), 'selected team stays visible after feedback pane changes table height');
    }
    await next();
    if (i === 0) assert.equal(await page.locator('[data-team-detail="7"]').getAttribute('aria-pressed'), 'true', 'chosen feedback stays selected when correcting personal notes');
    await next();
  }
  assert.equal((await stored()).phase, 'individualA');
  assert.equal(await page.locator('.news-meta').innerText().then(s => s.includes('NEWS A')), true);
  await next(); assert.equal((await stored()).phase, 'individualB');
  assert.equal(await page.locator('.chain').count(), 0);
  await next(); await next();
  assert.equal((await stored()).phase, 'final');
  const rows = await page.locator('.result-table tbody tr').allTextContents();
  assert.equal(rows.length, 8);
  assert.ok(rows.every(t => t.includes('36/36') && t.includes('공동 1위')));
  await shot('final-desktop');
  // Browser print CSS, fonts and pagination are exercised by Chromium's A4 PDF output.
  await page.evaluate(() => { window.print = () => {}; });
  await page.locator('[data-action="printResult"]').click();
  assert.equal(await page.locator('#print-root').innerText().then(t=>t.includes('원화 가치')),false);
  assert.ok((await page.locator('#print-root').innerText()).includes('36점 만점'));
  await page.pdf({ path: path.join(out, 'results.pdf'), printBackground: true, preferCSSPageSize: true });
  await page.locator('#menu').click(); await page.locator('[data-tool="worksheet"]').click();
  assert.equal(await page.locator('#print-root').innerText().then(t=>t.includes('원화 ____')),false);
  await page.pdf({ path: path.join(out, 'worksheet.pdf'), printBackground: true, preferCSSPageSize: true });
  console.log('PASS desktop: 8 teams / 6 rounds / 3-stage reveal / restore every round / all 36/36 tied / personal A+B / print');

  // Short course is traversed using actual mobile controls, including missing and corrected answers.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#home').click(); await page.locator('[data-action="setup"]').click();
  await page.selectOption('#team-count', '2');
  await page.locator('input[name="length"][value="4"]').check();
  assert.equal(await page.locator('input[name="life"]').count(),0);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#setup-form button[type="submit"]').click(); await next();
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) { await next(); if (i === 0 && j === 0) await shot('news-mobile'); }
    const code = D.rounds[i].cause, key = D.causes[code];
    const cause = page.locator(`.team-row[data-row="0"] [data-field="cause"][value="${code}"]`);
    await cause.focus(); await page.keyboard.press('Space'); assert.equal(await cause.isChecked(), true);
    await settled();
    await choose(0, 'rate', key.rate);
    await page.locator('[data-action="teamNext"]').click();
    await page.locator('[data-missing="1"]').click();
    await settled();
    if (i === 0) {
      await page.locator('[data-missing="1"]').click();
      await settled();
      assert.equal(await page.locator('[data-action="next"]').isDisabled(), true);
      await page.locator('[data-missing="1"]').click(); await shot('entry-mobile');
      await settled();
    }
    await next();
    if (i === 0) { await page.locator('[data-action="unlock"]').click(); await next(); }
    for (let j = 0; j < 4; j++) await next();
    if (i === 0) {
      await page.locator('[data-action="back"]').click(); await next();
      assert.equal(C.totals(await stored())[0].total, 6);
    }
    await next();
    if (i === 0) {
      const first = JSON.stringify((await stored()).rounds[0].originals);
      await page.locator('[data-action="correctionToggle"]').click();
      await choose(0, 'cause', 'D'); await choose(0, 'rate', 'down');
      assert.equal(JSON.stringify((await stored()).rounds[0].originals), first);
      assert.equal(C.totals(await stored())[0].total, 6);
      assert.equal(await page.locator('[data-action="life"]').count(),0);
    }
    await next();
  }
  await next(); await next(); await next();
  assert.deepEqual(C.ranking(await stored()).map(r => r.total), [24, 0]);
  await shot('final-mobile');
  await page.locator('#menu').click();
  page.once('dialog', dialog => dialog.dismiss()); await page.locator('[data-tool="reset"]').click();
  assert.equal((await stored()).phase, 'final');
  await page.locator('#menu').click();
  page.once('dialog', dialog => dialog.accept()); await page.locator('[data-tool="reset"]').click();
  await settled();
  assert.equal(await stored(), null); assert.equal(await page.locator('[data-action="resume"]').count(), 0);
  await page.locator('#fullscreen').click();
  await page.waitForFunction(() => document.fullscreenElement !== null);
  await page.locator('#fullscreen').click();
  await page.waitForFunction(() => document.fullscreenElement === null);
  console.log('PASS mobile: 2 teams / 4 rounds / keyboard / missing toggle / unlock / corrections / core flow / 24+0 / reset cancel+confirm / fullscreen enter+exit');

  // A saved retired screen returns to the same round without rewriting on load.
  let oldLesson=C.create({count:2,length:4});
  for(let i=0;i<4;i++)oldLesson=C.dispatch(oldLesson,{type:'next'});
  for(const team of [0,1])for(const [field,value] of [['cause','A'],['rate','up']])oldLesson=C.dispatch(oldLesson,{type:'answer',team,field,value});
  for(let i=0;i<6;i++)oldLesson=C.dispatch(oldLesson,{type:'next'});
  oldLesson.config.life=true;oldLesson.phase='life';oldLesson.rounds[0].lifeRevealed=true;
  oldLesson.history.push({phase:'correction',index:0});
  const oldRaw=JSON.stringify(oldLesson), oldOriginals=JSON.stringify(oldLesson.rounds[0].originals);
  await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:C.STORAGE_KEY,raw:oldRaw});
  await page.reload();await page.locator('[data-action="resume"]').click();
  assert.equal(await page.locator('#app').getAttribute('data-phase'),'correction');
  assert.equal(await page.locator('[data-action="life"]').count(),0);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),C.STORAGE_KEY),oldRaw);
  await next();
  assert.equal((await stored()).phase,'newsReading');assert.equal((await stored()).index,1);
  assert.equal(JSON.stringify((await stored()).rounds[0].originals),oldOriginals);
  assert.deepEqual(C.totals(await stored()).map(t=>t.total),[6,6]);
  assert.equal(Object.hasOwn((await stored()).config,'life'),false);
  console.log('PASS retired screen recovery: correction / next news / original answers and scores preserved / load is read-only');

  // Corrupted records and disabled storage show a usable start screen.
  await page.evaluate(key => localStorage.setItem(key, '{bad'), C.STORAGE_KEY); await page.reload();
  assert.equal(await page.locator('#notice').innerText().then(s => s.includes('읽을 수 없습니다')), true);
  const blocked = await browser.newPage(); blocked.on('pageerror', e => errors.push(e.message));
  await blocked.addInitScript(() => {
    Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new Error('Storage blocked'); };
  });
  await blocked.goto(url); await blocked.locator('[data-action="setup"]').click();
  await blocked.locator('#setup-form button[type="submit"]').click();
  await blocked.waitForFunction(() => !document.querySelector('#app').hasAttribute('aria-busy'));
  assert.equal(await blocked.locator('#save-status').innerText().then(s => s.includes('자동 저장을 사용할 수 없습니다')), true);
  await blocked.close();
  assert.deepEqual(errors, []);
  console.log(`PASS fail-safe: corrupted and unavailable storage; no page or resource errors. Artifacts: ${out}`);
  await browser.close();
})().catch(async e => { console.error(e); await browser?.close(); process.exitCode = 1; });
