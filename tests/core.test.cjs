const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/core.js');
const D = require('../js/data.js');
const now = 1_000_000;
const step = (s, action = { type: 'next' }) => C.dispatch(s, action, now);
function entry(s) {
  while (s.phase !== 'responseEntry') s = step(s);
  return s;
}
function answer(s, team, code) {
  for (const field of ['cause', 'rate']) s = step(s, { type: 'answer', team, field, value: field === 'cause' ? code : D.causes[code][field] });
  return s;
}

test('cause market, change and rate earn six points; won is excluded', () => {
  for (const code of Object.keys(D.causes)) {
    assert.equal(C.score({ cause: code, ...D.causes[code], missing: false }, code).total, 6);
    assert.equal(C.score({ cause: code, ...D.causes[code], missing: true }, code).total, 0);
  }
  assert.deepEqual(C.score({ cause: 'D', rate: 'up', won: 'up' }, 'A'), { parts: [false, false, true], total: 2 });
  assert.equal(C.score({ cause: 'B', rate: 'up', won: 'down' }, 'A').total, 4);
  assert.equal(C.score({ cause: 'A', rate: 'up', won: 'up' }, 'A').total, 6);
});

test('answer entry remains independent; missing requires a teacher action; locking is reversible only before explanation', () => {
  let s = entry(C.create({ count: 2 }));
  s = step(s, { type: 'answer', team: 0, field: 'rate', value: 'up' });
  assert.equal(s.rounds[0].entries[0].cause, null);
  assert.throws(() => step(s, { type: 'answer', team: 0, field: 'won', value: 'up' }));
  assert.throws(() => step(s));
  s = answer(s, 0, 'A');
  s = step(s, { type: 'missing', team: 1 });
  s = step(s);
  assert.equal(s.phase, 'responsesLocked');
  s = step(s, { type: 'unlock' });
  assert.equal(s.rounds[0].originals, null);
  s = step(step(s));
  assert.throws(() => step(s, { type: 'unlock' }));
  const before = s.rounds[0].originals;
  s = step(s, { type: 'back' });
  assert.equal(s.phase, 'explanation');
  assert.deepEqual(s.rounds[0].originals, before);
});

for (const length of [4, 6]) test(`${length} rounds: staged disclosure, immutable scoring, correction, resume, individual transfer, tied ranking`, () => {
  let s = C.create({ count: 3, length });
  for (let i = 0; i < length; i++) {
    s = entry(s);
    const code = D.rounds[i].cause;
    s = answer(answer(s, 0, code), 1, code);
    s = step(s, { type: 'missing', team: 2 });
    s = step(s);
    assert.equal(s.rounds[i].reveal, 0);
    for (let reveal = 1; reveal <= 3; reveal++) {
      s = step(s);
      assert.equal(s.rounds[i].reveal, reveal);
      assert.equal(C.totals(s)[0].total, i * 6);
      assert.deepEqual(C.restore(JSON.stringify(s)), s);
    }
    s = step(s);
    assert.equal(C.totals(s)[0].total, (i + 1) * 6);
    s = step(step(s, { type: 'back' }));
    assert.equal(C.totals(s)[0].total, (i + 1) * 6);
    s = step(s);
    const originals = JSON.stringify(s.rounds[i].originals);
    s = answer(s, 0, code === 'A' ? 'D' : 'A');
    assert.equal(JSON.stringify(s.rounds[i].originals), originals);
    assert.equal(C.totals(s)[0].total, (i + 1) * 6);
    s = step(s);
  }
  assert.equal(s.phase, 'individualA');
  s = step(s); assert.equal(s.phase, 'individualB');
  s = step(s); assert.equal(s.phase, 'individualAnswers');
  s = step(s, { type: 'back' }); assert.equal(s.phase, 'individualAnswers');
  s = step(s); assert.equal(s.phase, 'final');
  assert.deepEqual(C.ranking(s).map(r => [r.rank, r.total]), [[1, length * 6], [1, length * 6], [3, 0]]);
});

test('timer expiry does not submit or advance; pausing and extending survive restore', () => {
  let s = step(C.create({ count: 8 }));
  assert.equal(s.phase, 'newsReading');
  assert.equal(C.remaining(s.timer, now + 30_000), 0);
  assert.equal(s.phase, 'newsReading');
  s = C.dispatch(s, { type: 'timerToggle' }, now + 5_000);
  assert.equal(C.remaining(s.timer, now + 100_000), 15);
  s = C.dispatch(s, { type: 'timerAdd' }, now + 100_000);
  assert.equal(C.remaining(C.restore(s).timer), 25);
  s = entry(s);
  assert.equal(s.timer.remaining, 60);
  assert.ok(s.rounds[0].entries.every(a => !C.complete(a)));
});

test('news opens directly and simultaneous boards lead directly to teacher entry', () => {
  let s = step(C.create());
  assert.equal(s.phase, 'newsReading');
  s = step(s); assert.equal(s.phase, 'individual');
  s = step(s); assert.equal(s.phase, 'discussion');
  s = step(s); assert.equal(s.phase, 'responseEntry');
});

test('v2 records keep original answers while adopting the explicit six-point contract', () => {
  const legacy = C.create({ count: 2 });
  legacy.version = 2;
  legacy.phase = 'explanation'; legacy.rounds[0].reveal = 4;
  legacy.rounds[0].entries = [{cause:'A',rate:'up',won:'down',missing:false},{cause:'D',rate:'up',won:'up',missing:false}];
  legacy.rounds[0].originals = JSON.parse(JSON.stringify(legacy.rounds[0].entries));
  const original = JSON.stringify(legacy.rounds[0].originals);
  const restored = C.restore(legacy);
  assert.equal(restored.version, 3);
  assert.equal(restored.rounds[0].reveal, 3);
  assert.equal(restored.migratedFrom, 2);
  assert.equal(JSON.stringify(restored.rounds[0].originals), original);
  const scored = step(restored);
  assert.deepEqual(C.totals(scored).map(t=>t.total), [6, 2]);
  assert.deepEqual(C.restore(scored), scored);
  for (const [oldPhase, newPhase] of [['newsHidden','newsReading'],['simultaneousReveal','responseEntry']]) {
    const draft = C.create(); draft.version=2; draft.phase=oldPhase;
    assert.equal(C.restore(draft).phase, newPhase);
  }
});

test('invalid or incompatible stored records fail safely', () => {
  assert.equal(C.restore('{bad'), null);
  for (const mutate of [s => s.version = 1, s => s.index = 10, s => s.rounds[0].scored = true,
    s => s.phase = 'final', s => s.rounds[0].entries.pop(), s => s.timer.deadline = 'bad']) {
    const s = C.create(); mutate(s); assert.equal(C.restore(s), null);
  }
});

test('life application is removed from new lessons and dispatch', () => {
  const s=C.create({life:true});
  assert.equal(Object.hasOwn(s.config,'life'),false);
  assert.equal(C.phases.includes('life'),false);
  assert.ok(s.rounds.every(r=>!Object.hasOwn(r,'lifeRevealed')));
  assert.throws(()=>step(s,{type:'life'}));
  assert.throws(()=>step(s,{type:'lifeReveal'}));
});

test('old life screens resume at correction, preserve answers and scores, and never return to life', () => {
  let s=entry(C.create({count:2,length:4}));
  s=answer(answer(s,0,'A'),1,'A');
  for(let i=0;i<6;i++)s=step(s);
  assert.equal(s.phase,'correction');
  const legacy=JSON.parse(JSON.stringify(s));
  legacy.config.life=true; legacy.phase='life';
  legacy.history.push({phase:'correction',index:0});
  legacy.rounds[0].lifeRevealed=true;
  const original=JSON.stringify(legacy.rounds[0].originals);
  for(const version of [2,3]) {
    legacy.version=version;
    const raw=JSON.stringify(legacy), restored=C.restore(raw);
    assert.equal(restored.phase,'correction');
    assert.equal(JSON.stringify(restored.rounds[0].originals),original);
    assert.deepEqual(C.totals(restored).map(r=>r.total),[6,6]);
    assert.equal(Object.hasOwn(restored.config,'life'),false);
    assert.equal(Object.hasOwn(restored.rounds[0],'lifeRevealed'),false);
    assert.equal(step(restored,{type:'back'}).phase,'roundFeedback');
    const next=step(restored);
    assert.equal(next.phase,'newsReading'); assert.equal(next.index,1);
    next.history.push({phase:'life',index:0});
    assert.equal(step(C.restore(next),{type:'back'}).phase,'correction');
    assert.equal(JSON.stringify(legacy),raw,'reading old state does not mutate its source');
  }
});
