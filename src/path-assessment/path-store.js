const SESSION_KEY = "study-hub-v3:path-assessment:sessions";
const ATTEMPT_KEY = "study-hub-v3:path-assessment:attempts";

function read(storage, key, fallback) {
  try { const value = JSON.parse(storage.getItem(key)); return value && typeof value === "object" ? value : fallback; }
  catch { return fallback; }
}

export function createPathAssessmentStore(storage = localStorage, now = () => new Date().toISOString(), randomSeed = () => Math.floor(Math.random() * 1e9)) {
  const sessions = () => read(storage, SESSION_KEY, {});
  const attempts = () => read(storage, ATTEMPT_KEY, {});
  return {
    createSession(input) {
      const all = sessions();
      const id = `${input.pathId}-${randomSeed()}`;
      const session = { id, ...structuredClone(input), questionIds: [...input.questionIds], answers: {}, createdAt: now(), updatedAt: now() };
      all[id] = session; storage.setItem(SESSION_KEY, JSON.stringify(all)); return structuredClone(session);
    },
    getSession(id) { return structuredClone(sessions()[id] ?? null); },
    saveAnswers(id, answers) {
      const all = sessions(); if (!all[id]) return null;
      all[id].answers = structuredClone(answers); all[id].updatedAt = now();
      storage.setItem(SESSION_KEY, JSON.stringify(all)); return structuredClone(all[id]);
    },
    submitSession(id, result) {
      const all = sessions(); if (!all[id]) return null;
      all[id].submittedAt = now(); all[id].result = structuredClone(result); storage.setItem(SESSION_KEY, JSON.stringify(all));
      const history = attempts(); const pathAttempts = history[all[id].pathId] ?? [];
      pathAttempts.unshift({ ...structuredClone(all[id]), result: structuredClone(result) });
      history[all[id].pathId] = pathAttempts.slice(0, 100); storage.setItem(ATTEMPT_KEY, JSON.stringify(history));
      return structuredClone(all[id]);
    },
    getAttempts(pathId) { return structuredClone(attempts()[pathId] ?? []); },
    getRecentQuestionIds(pathId, limit = 2) { return [...new Set(this.getAttempts(pathId).slice(0, limit).flatMap(item => item.questionIds ?? []))]; },
    clearPath(pathId) {
      const history = attempts(); delete history[pathId]; storage.setItem(ATTEMPT_KEY, JSON.stringify(history));
      const allSessions = sessions();
      for (const [id, session] of Object.entries(allSessions)) if (session.pathId === pathId) delete allSessions[id];
      storage.setItem(SESSION_KEY, JSON.stringify(allSessions));
    }
  };
}
