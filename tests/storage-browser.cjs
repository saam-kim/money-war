// Regression: stale tabs must not erase revealed answers or resurrect a reset lesson.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const C = require('../js/core.js');
const url = process.env.TEST_URL || 'http://127.0.0.1:8766';
let browser;
async function start(page) {
  await page.goto(url);
  await page.locator('[data-action="setup"]').click();
  await page.selectOption('#team-count', '2');
  await page.locator('#setup-form button[type="submit"]').click();
  await next(page);
}
const stored = page => page.evaluate(key => localStorage.getItem(key), C.STORAGE_KEY);
const settled = page => page.waitForFunction(() => !document.querySelector('#app').hasAttribute('aria-busy'));
const next = async page => {
  await settled(page);
  try { await page.locator('[data-action="next"]').click(); }
  catch (error) {
    console.error('Progress click diagnostics', await page.evaluate(() => ({
      phase:document.querySelector('#app').dataset.phase,
      busy:document.querySelector('#app').hasAttribute('aria-busy'),
      notice:document.querySelector('#notice').textContent,
      buttons:[...document.querySelectorAll('.footer button')].map(n=>({text:n.textContent,rect:n.getBoundingClientRect().toJSON()}))
    })));
    throw error;
  }
  await settled(page);
};
async function originalAnswers(page) {
  for (let i = 0; i < 3; i++) await next(page);
  for (const team of [0, 1]) for (const [field, value] of [['cause', 'A'], ['rate', 'up']]) {
    await page.locator(`input[data-team="${team}"][data-field="${field}"][value="${value}"]`).locator('..').click();
    await settled(page);
  }
  await next(page); await next(page);
}
async function oldTab(context) {
  const page = await context.newPage();
  // A suspended tab can miss events; the write check must protect storage too.
  await page.addInitScript(() => {
    const add = window.addEventListener.bind(window);
    window.addEventListener = (type, ...args) => type === 'storage' ? undefined : add(type, ...args);
  });
  await page.goto(url); await page.locator('[data-action="resume"]').click();
  return page;
}
(async () => {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const errors = [];
  // Missing storage events must not let an obsolete phase replace original answers.
  let context = await browser.newContext();
  let a = await context.newPage(); a.on('pageerror', e => errors.push(e.message));
  await start(a);
  let b = await oldTab(context); b.on('pageerror', e => errors.push(e.message));
  await originalAnswers(a);
  const revealed = await stored(a);
  assert.equal(JSON.parse(revealed).phase, 'explanation');
  await next(b);
  assert.equal(await stored(a), revealed, 'stale tab must preserve revealed original answers');
  await b.locator('[data-action="reloadLatest"]').waitFor();
  for (const width of [360, 1366]) {
    await b.setViewportSize({ width, height: 768 });
    assert.ok(await b.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'conflict screen fits viewport');
    assert.ok(await b.locator('[data-action="reloadLatest"]').evaluate(n => n.getBoundingClientRect().bottom <= innerHeight), 'latest-recovery action is visible');
  }
  await b.locator('[data-action="reloadLatest"]').click();
  assert.equal(await b.locator('#app').getAttribute('data-phase'), 'explanation');
  assert.equal(await stored(a), revealed, 'loading latest is read-only');
  await next(b);
  assert.equal(JSON.parse(await stored(a)).rounds[0].reveal, 2);
  await a.locator('[data-action="reloadLatest"]').waitFor();
  await context.close();
  console.log('PASS missed-event conflict: originals survive, latest reload is read-only, progress resumes');

  // Reset deletes storage; no stale next/new lesson/reset operation may restore it.
  for (const action of ['next', 'start', 'reset']) {
    context = await browser.newContext(); a = await context.newPage(); await start(a); b = await oldTab(context);
    if (action === 'start') { await b.locator('#home').click(); await b.locator('[data-action="setup"]').click(); }
    await a.locator('#menu').click(); a.once('dialog', d => d.accept()); await a.locator('[data-tool="reset"]').click();
    await settled(a);
    assert.equal(await stored(a), null);
    if (action === 'next') await next(b);
    if (action === 'start') { b.once('dialog', d => d.accept()); await b.locator('#setup-form button[type="submit"]').click(); }
    if (action === 'reset') { await b.locator('#menu').click(); b.once('dialog', d => d.accept()); await b.locator('[data-tool="reset"]').click(); }
    await settled(b);
    await b.locator('[data-action="reloadLatest"]').waitFor();
    assert.equal(await stored(a), null, 'obsolete tab must not resurrect deleted storage');
    await b.locator('[data-action="reloadLatest"]').click();
    assert.equal(await b.locator('[data-action="resume"]').count(), 0);
    assert.ok((await b.locator('#notice').innerText()).includes('초기화'));
    await context.close();
  }
  console.log('PASS reset conflicts: stale next / new lesson / reset cannot resurrect deleted data');

  // Queued competing writes are serialised. Only one tab can advance a revision.
  context = await browser.newContext(); a = await context.newPage(); await start(a); b = await oldTab(context);
  assert.ok(await a.evaluate(() => Boolean(navigator.locks)), 'this concurrency run uses Web Locks');
  // Hold the shared lock until both clicks queue writes. Otherwise one tab can
  // receive the other tab's storage event before Playwright completes its click.
  await a.evaluate(key => {
    window.testLockReady = new Promise(ready => {
      window.testLockHeld = navigator.locks.request(`${key}.write`, async () => {
        ready(); await new Promise(resolve => { window.releaseTestLock = resolve; });
      });
    });
    return window.testLockReady;
  }, C.STORAGE_KEY);
  const clicks = Promise.all([
    a.locator('[data-action="next"]').evaluate(button => button.click()),
    b.locator('[data-action="next"]').evaluate(button => button.click())
  ]);
  await a.waitForFunction(async key => (await navigator.locks.query()).pending.filter(l => l.name === `${key}.write`).length === 2, C.STORAGE_KEY);
  await a.evaluate(async () => { window.releaseTestLock(); await window.testLockHeld; });
  await clicks;
  await Promise.all([settled(a), settled(b)]);
  assert.equal(JSON.parse(await stored(a)).phase, 'individual');
  await context.close();
  console.log('PASS simultaneous progress: exactly one revision wins');

  // Events notify the teacher, including replacement by a different lesson.
  context = await browser.newContext(); a = await context.newPage(); await start(a);
  b = await context.newPage(); await b.goto(url); await b.locator('[data-action="resume"]').click();
  await next(a);
  await b.locator('[data-action="reloadLatest"]').waitFor();
  await b.locator('[data-action="reloadLatest"]').click();
  assert.equal(await b.locator('#app').getAttribute('data-phase'), 'individual');
  const oldId = JSON.parse(await stored(a)).lessonId;
  await a.locator('#home').click(); await a.locator('[data-action="setup"]').click();
  a.once('dialog', d => d.accept()); await a.locator('#setup-form button[type="submit"]').click(); await settled(a);
  assert.notEqual(JSON.parse(await stored(a)).lessonId, oldId);
  await b.locator('[data-action="reloadLatest"]').waitFor();
  await b.locator('[data-action="reloadLatest"]').click();
  assert.equal(await b.locator('#app').getAttribute('data-phase'), 'rehearsal');
  await context.close();
  console.log('PASS passive notification / new-lesson identity / latest lesson recovery');

  // Answer input uses the same protection as stage buttons, even without an event.
  context = await browser.newContext(); a = await context.newPage(); await start(a);
  for (let i = 0; i < 3; i++) await next(a);
  b = await oldTab(context);
  await a.locator('input[data-team="0"][data-field="cause"][value="A"]').locator('..').click(); await settled(a);
  const entered = await stored(a);
  await b.locator('input[data-team="0"][data-field="cause"][value="D"]').locator('..').click(); await settled(b);
  await b.locator('[data-action="reloadLatest"]').waitFor();
  assert.equal(await stored(a), entered, 'old radio input must not overwrite a newer team answer');
  await context.close();
  console.log('PASS stale radio input: newer teacher entry stays intact');

  // Prior v2 records lack storage metadata. They remain valid and get metadata on write.
  let legacy = C.create({ count: 2 });
  while (legacy.phase !== 'responseEntry') legacy = C.dispatch(legacy, {type:'next'});
  for (const team of [0, 1]) for (const [field, value] of [['cause', 'A'], ['rate', 'up']]) {
    legacy = C.dispatch(legacy, { type: 'answer', team, field, value });
  }
  while (legacy.phase !== 'roundFeedback') legacy = C.dispatch(legacy, {type:'next'});
  legacy.version=2; legacy.rounds[0].reveal=4;
  for (const list of [legacy.rounds[0].entries,legacy.rounds[0].originals]) list.forEach(a=>a.won='down');
  context = await browser.newContext(); a = await context.newPage();
  await a.goto(url);
  await a.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: C.STORAGE_KEY, value: legacy });
  await a.reload(); await a.locator('[data-action="resume"]').click();
  assert.equal(await a.locator('#app').getAttribute('data-phase'), 'roundFeedback');
  assert.ok((await a.locator('#notice').innerText()).includes('6점 기준'));
  await next(a);
  const migrated = JSON.parse(await stored(a));
  assert.deepEqual(migrated.rounds[0].originals, legacy.rounds[0].originals);
  assert.equal(C.totals(migrated)[0].total, 6);
  assert.equal(migrated.version,3);
  assert.ok(migrated.lessonId && migrated.storageRevision);
  await context.close();
  console.log('PASS legacy v2 recovery: original answers preserved / six-point score / metadata upgrade');

  // Synchronous guarded fallback still rejects old writes if Web Locks are absent.
  context = await browser.newContext();
  await context.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined }));
  a = await context.newPage(); await start(a); b = await oldTab(context);
  await next(a); const fallbackRecord = await stored(a); await next(b);
  await b.locator('[data-action="reloadLatest"]').waitFor();
  assert.equal(await stored(a), fallbackRecord);
  await context.close();
  console.log('PASS guarded fallback without Web Locks: stale progress rejected');

  // The documented direct-file launch remains usable without a server.
  context = await browser.newContext(); a = await context.newPage();
  await a.goto(require('node:url').pathToFileURL(require('node:path').resolve(__dirname, '../index.html')).href);
  await a.locator('[data-action="setup"]').click();
  await a.locator('#setup-form button[type="submit"]').click(); await settled(a); await next(a);
  assert.equal(JSON.parse(await stored(a)).phase, 'newsReading');
  await context.close();
  console.log('PASS direct-file launch: lesson progress saved without a server');

  // A tab's own delayed storage events never invalidate its latest successful write.
  context = await browser.newContext(); a = await context.newPage(); await start(a);
  for (let i = 0; i < 3; i++) await next(a);
  assert.equal(await a.locator('[data-action="reloadLatest"]').count(), 0);
  assert.equal(JSON.parse(await stored(a)).phase, 'responseEntry');
  await context.close();
  assert.deepEqual(errors, []);
  await browser.close();
})().catch(async e => { console.error(e); await browser?.close(); process.exitCode = 1; });
