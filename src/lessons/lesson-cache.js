const PREFIX = "study-hub-v3:lesson:";

export function createLessonCache(storage = globalThis.localStorage, now = Date.now) {
  return {
    get(lessonId) {
      try {
        const value = JSON.parse(storage.getItem(PREFIX + lessonId));
        return value?.document && typeof value.cachedAt === "number" ? value : null;
      } catch {
        return null;
      }
    },
    set(lessonId, document, revision = null) {
      storage.setItem(PREFIX + lessonId, JSON.stringify({ document, revision, cachedAt: now() }));
    },
    clear(lessonId) {
      storage.removeItem(PREFIX + lessonId);
    }
  };
}
