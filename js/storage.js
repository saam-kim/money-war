(function (root) {
  'use strict';
  // Compare the complete saved revision inside one browser-wide write lock.
  // A missed storage event must never make a stale write valid.
  function createSession(key, { storage, locks }) {
    let expected;
    const token = () => root.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    function load() {
      try {
        expected = storage().getItem(key);
        return { raw: expected, available: true };
      } catch (_) { return { raw: null, available: false }; }
    }
    function changed() {
      try { return storage().getItem(key) !== (expected ?? null); }
      catch (_) { return false; }
    }
    async function commit(state) {
      const transaction = () => {
        try {
          const target = storage();
          if (target.getItem(key) !== (expected ?? null)) return { status: 'conflict' };
          const saved = state === null ? null : {
            ...state, lessonId: state.lessonId || token(), storageRevision: token()
          };
          const raw = saved === null ? null : JSON.stringify(saved);
          if (raw === null) target.removeItem(key);
          else target.setItem(key, raw);
          expected = raw;
          return { status: 'saved', state: saved };
        } catch (_) { return { status: 'unavailable', state }; }
      };
      try {
        return locks?.request ? await locks.request(`${key}.write`, transaction) : transaction();
      } catch (_) { return { status: 'unavailable', state }; }
    }
    return { load, changed, commit };
  }
  const api = { createSession };
  root.MWStorage = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
