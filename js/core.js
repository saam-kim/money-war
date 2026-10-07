(function (root) {
  'use strict';
  const data = typeof module !== 'undefined' ? require('./data.js') : root.MWData;
  const VERSION = 3;
  const POINTS_PER_ROUND = 6, REVEAL_STEPS = 3;
  // Keep the storage location so existing lessons can be upgraded without losing originals.
  const STORAGE_KEY = 'money-war.lesson.v2';
  const phases = ['rehearsal', 'newsReading', 'individual', 'discussion', 'responseEntry', 'responsesLocked', 'explanation', 'roundFeedback', 'correction', 'individualA', 'individualB', 'individualAnswers', 'final'];
  const durations = { newsReading: 40, individual: 20, discussion: 50, responseEntry: 30, explanation: 60, correction: 30, individualA: 60, individualB: 60 };
  const blankAnswer = () => ({ cause: null, rate: null, missing: false });
  const complete = a => Boolean(a && (a.missing || (data.causes[a.cause] && ['up', 'down'].includes(a.rate))));
  const clone = value => JSON.parse(JSON.stringify(value));
  function create(config = {}) {
    const count = Math.max(2, Math.min(8, Number(config.count) || 5));
    const length = Number(config.length) === 4 ? 4 : 6;
    return {
      version: VERSION,
      config: { length, teams: Array.from({ length: count }, (_, i) => String(config.names?.[i] || `${i + 1}모둠`).trim().slice(0, 8) || `${i + 1}모둠`) },
      phase: 'rehearsal', index: 0, history: [],
      rounds: data.rounds.slice(0, length).map(item => ({ id: item.id, entries: Array.from({ length: count }, blankAnswer), originals: null, corrections: Array.from({ length: count }, blankAnswer), reveal: 0, scored: false })),
      timer: { remaining: 0, deadline: null }, updatedAt: Date.now()
    };
  }
  function score(answer, causeCode) {
    const expected = data.causes[causeCode];
    if (!expected) throw new Error('Unknown answer key');
    const cause = !answer?.missing && data.causes[answer?.cause];
    const parts = [Boolean(cause && cause.market === expected.market), Boolean(cause && cause.change === expected.change), Boolean(!answer?.missing && answer?.rate === expected.rate)];
    return { parts, total: parts.filter(Boolean).length * 2 };
  }
  function totals(state) {
    return state.config.teams.map((name, team) => {
      const records = state.rounds.filter(r => r.scored).map(r => score(r.originals[team], data.rounds.find(d => d.id === r.id).cause));
      return { team, name, total: records.reduce((sum, result) => sum + result.total, 0), parts: [0, 1, 2].map(part => records.filter(result => result.parts[part]).length) };
    });
  }
  function ranking(state) {
    const rows = totals(state).sort((a, b) => b.total - a.total || a.team - b.team);
    return rows.map(row => ({ ...row, rank: 1 + rows.filter(other => other.total > row.total).length, tied: rows.filter(other => other.total === row.total).length > 1 }));
  }
  function remaining(timer, now = Date.now()) { return timer.deadline === null ? timer.remaining : Math.max(0, Math.ceil((timer.deadline - now) / 1000)); }
  function setPhase(state, phase, now, remember = true) {
    if (remember) state.history.push({ phase: state.phase, index: state.index });
    state.phase = phase;
    const seconds = phase === 'responseEntry' && state.config.teams.length > 5 ? 60 : durations[phase] || 0;
    state.timer = { remaining: seconds, deadline: seconds ? now + seconds * 1000 : null };
  }
  function dispatch(source, action, now = Date.now()) {
    const state = clone(source), round = state.rounds[state.index];
    const fail = () => { throw new Error(`Action ${action.type} unavailable in ${state.phase}`); };
    if (action.type === 'answer') {
      if (!['responseEntry', 'correction'].includes(state.phase)) fail();
      const answers = state.phase === 'correction' ? round.corrections : round.entries;
      const answer = answers[action.team];
      if (!answer || !['cause', 'rate'].includes(action.field)) fail();
      if (action.field === 'cause' ? !data.causes[action.value] : !['up', 'down'].includes(action.value)) fail();
      answer[action.field] = action.value; answer.missing = false;
    } else if (action.type === 'missing') {
      if (state.phase !== 'responseEntry' || !round.entries[action.team]) fail();
      round.entries[action.team] = { ...blankAnswer(), missing: !round.entries[action.team].missing };
    } else if (action.type === 'unlock') {
      if (state.phase !== 'responsesLocked' || round.reveal > 0 || round.scored) fail();
      round.originals = null; setPhase(state, 'responseEntry', now);
    } else if (action.type === 'back') {
      const previous = state.history.pop();
      if (!previous) fail();
      state.index = previous.index;
      const target = state.rounds[state.index];
      let phase = previous.phase;
      const preReveal = ['rehearsal', 'newsReading', 'individual', 'discussion', 'responseEntry', 'responsesLocked'];
      if (target.reveal > 0 && preReveal.includes(phase)) phase = target.scored ? 'roundFeedback' : 'explanation';
      else if (target.originals && preReveal.includes(phase)) phase = 'responsesLocked';
      if (state.individualDone && ['individualA', 'individualB'].includes(phase)) phase = 'individualAnswers';
      setPhase(state, phase, now, false);
    } else if (action.type === 'timerToggle') {
      const seconds = remaining(state.timer, now);
      state.timer = { remaining: seconds, deadline: state.timer.deadline === null && seconds > 0 ? now + seconds * 1000 : null };
    } else if (action.type === 'timerAdd') {
      const seconds = remaining(state.timer, now) + 10;
      state.timer = { remaining: seconds, deadline: state.timer.deadline === null ? null : now + seconds * 1000 };
    } else if (action.type === 'next') {
      const next = { rehearsal: 'newsReading', newsReading: 'individual', individual: 'discussion', discussion: 'responseEntry', responsesLocked: 'explanation', roundFeedback: 'correction', individualA: 'individualB', individualB: 'individualAnswers', individualAnswers: 'final' };
      if (state.phase === 'responseEntry') {
        if (!round.entries.every(complete) || round.reveal > 0) fail();
        round.originals = clone(round.entries);
        setPhase(state, 'responsesLocked', now);
      } else if (state.phase === 'responsesLocked') {
        round.reveal = Math.max(1, round.reveal); setPhase(state, 'explanation', now);
      } else if (state.phase === 'explanation') {
        if (round.reveal < REVEAL_STEPS) round.reveal += 1;
        else { round.scored = true; setPhase(state, 'roundFeedback', now); }
      } else if (state.phase === 'correction') {
        state.history.push({ phase: state.phase, index: state.index });
        if (state.index + 1 < state.rounds.length) {
          state.index += 1;
          const target = state.rounds[state.index];
          setPhase(state, target.scored ? 'roundFeedback' : target.reveal ? 'explanation' : target.originals ? 'responsesLocked' : 'newsReading', now, false);
        } else setPhase(state, state.individualDone ? 'individualAnswers' : 'individualA', now, false);
      } else if (next[state.phase]) {
        if (state.phase === 'individualB') state.individualDone = true;
        setPhase(state, next[state.phase], now);
      } else fail();
    } else fail();
    state.updatedAt = now;
    return state;
  }
  function restore(raw) {
    try {
      const state = typeof raw === 'string' ? JSON.parse(raw) : clone(raw);
      if (!state || ![2, VERSION].includes(state.version)) return null;
      const legacy = state.version === 2;
      if (legacy) {
        const aliases = { newsHidden: 'newsReading', simultaneousReveal: 'responseEntry' };
        state.phase = aliases[state.phase] || state.phase;
        if (Array.isArray(state.history)) state.history.forEach(h => { h.phase = aliases[h.phase] || h.phase; });
        if (Array.isArray(state.rounds)) state.rounds.forEach(r => {
          if (Number.isInteger(r.reveal) && r.reveal === 4) r.reveal = REVEAL_STEPS;
        });
        state.version = VERSION; state.migratedFrom = 2;
      }
      // Retired optional screens resume at the current round's correction.
      const wasLife = state.phase === 'life';
      if (wasLife) state.phase = 'correction';
      if (Array.isArray(state.history)) {
        state.history = state.history.filter(h => h.phase !== 'life');
        const previous = state.history.at(-1);
        if (wasLife && previous?.phase === 'correction' && previous.index === state.index) state.history.pop();
      }
      if (!phases.includes(state.phase)) return null;
      const { config } = state;
      if (!config || ![4, 6].includes(config.length) || !Array.isArray(config.teams) || config.teams.length < 2 || config.teams.length > 8 || config.teams.some(n => typeof n !== 'string' || n.length > 8 || !n.trim())) return null;
      if (!Array.isArray(state.rounds) || state.rounds.length !== config.length || !Number.isInteger(state.index) || state.index < 0 || state.index >= config.length || !Array.isArray(state.history)) return null;
      delete config.life;
      const validAnswer = a => a && (a.cause === null || Object.hasOwn(data.causes, a.cause)) && (a.rate === null || ['up', 'down'].includes(a.rate)) && (!Object.hasOwn(a, 'won') || a.won === null || ['up', 'down'].includes(a.won)) && typeof a.missing === 'boolean';
      for (let i = 0; i < state.rounds.length; i++) {
        const r = state.rounds[i];
        delete r.lifeRevealed;
        if (r.id !== data.rounds[i].id || !Number.isInteger(r.reveal) || r.reveal < 0 || r.reveal > REVEAL_STEPS || typeof r.scored !== 'boolean') return null;
        for (const answers of [r.entries, r.corrections]) if (!Array.isArray(answers) || answers.length !== config.teams.length || !answers.every(validAnswer)) return null;
        if (r.originals !== null && (!Array.isArray(r.originals) || r.originals.length !== config.teams.length || !r.originals.every(a => validAnswer(a) && complete(a)))) return null;
        if ((r.reveal || r.scored) && !r.originals || r.scored && r.reveal !== REVEAL_STEPS) return null;
      }
      if (state.history.some(h => !phases.includes(h.phase) || !Number.isInteger(h.index) || h.index < 0 || h.index >= config.length)) return null;
      const r = state.rounds[state.index];
      if (['responsesLocked', 'explanation', 'roundFeedback', 'correction'].includes(state.phase) && !r.originals) return null;
      if (state.phase === 'explanation' && r.reveal < 1 || ['roundFeedback', 'correction'].includes(state.phase) && !r.scored) return null;
      if (['individualA', 'individualB', 'individualAnswers', 'final'].includes(state.phase) && !state.rounds.every(r => r.scored)) return null;
      if (['individualAnswers', 'final'].includes(state.phase) && !state.individualDone) return null;
      if (!state.timer || !Number.isFinite(state.timer.remaining) || state.timer.remaining < 0 || state.timer.deadline !== null && !Number.isFinite(state.timer.deadline)) return null;
      return state;
    } catch (_) { return null; }
  }
  const api = { VERSION, POINTS_PER_ROUND, REVEAL_STEPS, STORAGE_KEY, phases, durations, blankAnswer, complete, create, score, totals, ranking, remaining, dispatch, restore };
  root.MWCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
