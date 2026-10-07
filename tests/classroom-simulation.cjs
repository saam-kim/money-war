// Two creator-operated classroom rehearsals; no real students or lesson-time claims.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const C = require('../js/core.js'), D = require('../js/data.js');
const url = process.env.TEST_URL || 'http://127.0.0.1:8766';
const out = process.env.QA_OUTPUT_DIR || path.join(require('node:os').tmpdir(), 'money-war-simulation');
fs.mkdirSync(out, { recursive: true });
const profiles = [
  { id: 'lesson1', count: 5, length: 6, width: 1366, height: 768, expected: [36,36,12,24,30] },
  { id: 'lesson2', count: 8, length: 4, width: 1280, height: 720, expected: [24,24,8,16,18,0,16,0] }
];
let browser;
(async () => {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const report = { date: '2026-10-07', url, browser: browser.version(), profiles: [] };
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height } });
    const page = await context.newPage(); page.setDefaultTimeout(12000);
    const record = { ...profile, nextClicks: 0, answerClicks: 0, exceptionalActions: [], screens: [], errors: [], inputScrolls: [] };
    page.on('pageerror', e => record.errors.push(e.message));
    await page.clock.install({ time: new Date('2026-10-06T09:00:00+09:00') });
    const settled = () => page.waitForFunction(() => !document.querySelector('#app').hasAttribute('aria-busy'));
    const state = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), C.STORAGE_KEY);
    const next = async () => { await settled(); await page.locator('[data-action="next"]').click(); await settled(); record.nextClicks++; };
    const choose = async (team, field, value) => {
      await settled();
      await page.locator(`.team-row[data-row="${team}"] input[data-field="${field}"][value="${value}"]`).locator('..').click();
      await settled(); record.answerClicks++;
    };
    async function observe(label, screenshot = false) {
      await settled(); await page.evaluate(() => { scrollTo(0,0); document.querySelector('.lesson-content')?.scrollTo(0,0); });
      const metrics = await page.evaluate(() => {
        const info = selector => [...document.querySelectorAll(selector)].filter(n => n.getClientRects().length).map(n => {
          const s = getComputedStyle(n), b = n.getBoundingClientRect();
          return { text: n.textContent.trim(), size: parseFloat(s.fontSize), lineHeight: s.lineHeight, color: s.color, top:b.top, bottom:b.bottom, width:b.width, height:b.height };
        });
        const footer = document.querySelector('.footer'), f = footer?.getBoundingClientRect();
        const primary = document.querySelector('.footer .primary'), p = primary?.getBoundingClientRect();
        const region = document.querySelector('.team-table'), r = region?.getBoundingClientRect();
        const detail = document.querySelector('.feedback-detail');
        const result = document.querySelector('.results-region>.result-scroll');
        return { phase: document.querySelector('#app').dataset.phase, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, pageHeight: document.documentElement.scrollHeight,
          footerBottom:f?.bottom, primaryVisible: !p || p.bottom <= innerHeight, primaryText:primary?.textContent,
          input:region ? { top:r.top, bottom:r.bottom, height:region.clientHeight, content:region.scrollHeight, scrollTop:region.scrollTop } : null,
          detail:detail ? { height:detail.clientHeight, content:detail.scrollHeight } : null,
          result:result ? { width:result.clientWidth, contentWidth:result.scrollWidth, height:result.clientHeight, contentHeight:result.scrollHeight } : null,
          text:info('.news .news-title,.news>p,.activity h2,.activity>p,.cause-legend,.reason,.chain-step h2,.chain-step p,.chart-panel text,.chart-note,.feedback-detail h2,.feedback-detail p,.locked-list li,.view-heading h1,.result-table th,.result-table td,.sentence-template summary,.sentence-template[open]>p') };
      });
      record.screens.push({ label, ...metrics });
      if (screenshot) await page.screenshot({ path: path.join(out, `${profile.id}-${label}.png`), fullPage: false });
      assert.equal(metrics.horizontalOverflow, false, label + ' page overflow');
      assert.equal(metrics.primaryVisible, true, label + ' progress action off screen');
      if (label==='personal-answers') assert.ok(await page.locator('.individual-answer-grid').evaluate(n=>n.getBoundingClientRect().bottom<=document.querySelector('.footer').getBoundingClientRect().top),'both cases fully visible');
      if (label==='correction-editor') {
        assert.equal(await page.locator('.results-region').isVisible(),false,'editing must have a separate space');
        assert.equal(await page.locator('.correction-editor .team-table').isVisible(),true);
      }
      if (label==='discussion-open') assert.ok(await page.locator('.sentence-template p').evaluate(n=>n.getBoundingClientRect().bottom<=document.querySelector('.footer').getBoundingClientRect().top),'discussion template fully visible');
      if (label.endsWith('feedback') || label==='correction') assert.ok(!metrics.detail || metrics.detail.content<=metrics.detail.height+1,'feedback must not have inner scrolling');
    }
    await page.goto(url); await page.evaluate(() => document.fonts.ready);
    await observe('landing', true);
    await page.locator('[data-action="setup"]').click(); await page.selectOption('#team-count', String(profile.count));
    await page.locator(`input[name="length"][value="${profile.length}"]`).check();
    for (let team=0; team<profile.count; team++) await page.locator(`[name="name-${team}"]`).fill(profile.count===8 ? ['환율을읽는경제','달러거래분석팀','근거를찾는모둠','원화를살핀경제','함께판단하는조','세계뉴스분석팀','경제원리탐구팀','다시생각하는조'][team] : `${team+1}모둠`);
    await observe('setup', false);
    await page.locator('#setup-form button[type="submit"]').click(); await settled();
    await observe('rehearsal', true); await next();
    for (let round=0; round<profile.length; round++) {
      assert.equal((await state()).phase, 'newsReading');
      await observe(`r${round+1}-news`, round===0 || round===4);
      await next(); if (round===0) await observe('individual', true);
      await next();
      if (round===0) {
        await page.locator('.sentence-template summary').click(); await observe('discussion-open', true);
        if (profile.id==='lesson2') {
          await page.clock.fastForward(51000);
          assert.equal((await state()).phase, 'discussion');
          assert.equal(await page.locator('#timer-value').innerText(), '00:00');
          await observe('discussion-expired', false); record.exceptionalActions.push('timer expiry remained teacher-controlled');
        }
      }
      await next(); if (round===0) await observe('input-empty', false);
      const code = D.rounds[round].cause, key = D.causes[code], wrongCode = {A:'D',B:'C',C:'B',D:'A'}[code];
      for (let team=0; team<profile.count; team++) {
        if (team===7 || team===4 && round===0) {
          await page.locator(`[data-missing="${team}"]`).click(); await settled(); continue;
        }
        const cause = team===2 || team===5 ? wrongCode : code;
        const rate = team===3 || team===5 || team===6 || profile.id==='lesson2' && team===0 && round===0 ? (key.rate==='up'?'down':'up') : key.rate;
        await choose(team,'cause',cause); await choose(team,'rate',rate);
        const scroll = await page.locator('.team-table').evaluate(n=>n.scrollTop); if (scroll>0) record.inputScrolls.push({round:round+1,team:team+1,scroll});
      }
      if (round===0) await observe('input-complete', true);
      await next(); if (round===0) await observe('locked', true);
      if (profile.id==='lesson2' && round===0) {
        await page.locator('[data-action="unlock"]').click(); await settled(); await choose(0,'rate',key.rate); await next();
        record.exceptionalActions.push('teacher entry corrected before reveal');
      }
      for (let reveal=1; reveal<=3; reveal++) {
        await next(); assert.equal((await state()).rounds[round].scored,false);
        if (round===0 && reveal===1) await observe('explanation1', false);
        if (profile.id==='lesson2' && round===1 && reveal===2) {
          const before = await state(); await page.reload(); await page.locator('[data-action="resume"]').click();
          assert.equal((await state()).rounds[round].reveal,before.rounds[round].reveal); record.exceptionalActions.push('reload restored explanation step 2');
        }
        if (reveal===3) await observe(`r${round+1}-explanation3`, round===0 || round===3);
      }
      await next(); await page.locator(`[data-team-detail="${profile.id==='lesson2'?5:1}"]`).click();
      await observe(`r${round+1}-feedback`, round===0);
      await next(); if (round===0) await observe('correction', true);
      if (round===0 && profile.id==='lesson2') {
        await page.locator('[data-action="correctionToggle"]').click();
        await observe('correction-editor', true);
        const originals = JSON.stringify((await state()).rounds[round].originals);
        await choose(5,'cause',code); await choose(5,'rate',key.rate);
        assert.equal(JSON.stringify((await state()).rounds[round].originals),originals);
      }
      await next();
    }
    await observe('personalA', false); await next(); await observe('personalB', true);
    assert.equal(await page.locator('.chain').count(),0);
    await next(); await observe('personal-answers', true); await next(); await observe('final', true);
    assert.deepEqual(C.totals(await state()).map(t=>t.total),profile.expected);
    assert.deepEqual(record.errors,[]);
    record.actualScores = C.totals(await state()).map(t=>t.total);
    report.profiles.push(record);
    fs.writeFileSync(path.join(out,'simulation.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({id:profile.id,completed:true,nextClicks:record.nextClicks,answerClicks:record.answerClicks,scores:record.actualScores,offscreenActions:record.screens.filter(s=>!s.primaryVisible).map(s=>s.label),extraActions:record.exceptionalActions}));
    await context.close();
  }
  await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
