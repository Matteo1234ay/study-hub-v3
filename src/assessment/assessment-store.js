const DRAFTS_KEY = "study-hub-v3:assessment:drafts";
const ATTEMPTS_KEY = "study-hub-v3:assessment:attempts";
const MAX_ATTEMPTS = 100;

function read(storage, key, fallback) {
  try {
    const value = JSON.parse(storage.getItem(key));
    return value && typeof value === "object" ? value : fallback;
  } catch {
    return fallback;
  }
}

export function createAssessmentStore(storage = localStorage, now = () => new Date().toISOString()) {
  const draftId = (lessonId, version) => `${lessonId}@${version}`;
  return {
    getDraft(lessonId, version) {
      const draft = read(storage, DRAFTS_KEY, {})[draftId(lessonId, version)];
      return draft ? structuredClone(draft) : null;
    },
    saveDraft(lessonId, version, answers) {
      const drafts = read(storage, DRAFTS_KEY, {});
      drafts[draftId(lessonId, version)] = { lessonId, version, answers: structuredClone(answers), updatedAt: now() };
      storage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      return structuredClone(drafts[draftId(lessonId, version)]);
    },
    clearDraft(lessonId, version) {
      const drafts = read(storage, DRAFTS_KEY, {});
      delete drafts[draftId(lessonId, version)];
      storage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    },
    recordAttempt(attempt) {
      const all = read(storage, ATTEMPTS_KEY, {});
      const current = Array.isArray(all[attempt.lessonId]) ? all[attempt.lessonId] : [];
      const saved = { ...structuredClone(attempt), submittedAt: attempt.submittedAt ?? now() };
      all[attempt.lessonId] = [...current, saved].slice(-MAX_ATTEMPTS);
      storage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
      return structuredClone(saved);
    },
    getAttempts(lessonId) {
      const attempts = read(storage, ATTEMPTS_KEY, {})[lessonId];
      return Array.isArray(attempts) ? structuredClone(attempts) : [];
    },
    clearAssessments(lessonId = null) {
      if (!lessonId) {
        storage.removeItem(DRAFTS_KEY);
        storage.removeItem(ATTEMPTS_KEY);
        return;
      }
      const drafts = read(storage, DRAFTS_KEY, {});
      for (const key of Object.keys(drafts)) if (key.startsWith(`${lessonId}@`)) delete drafts[key];
      const attempts = read(storage, ATTEMPTS_KEY, {});
      delete attempts[lessonId];
      storage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      storage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
    }
  };
}
