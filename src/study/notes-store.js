const PREFIX = "study-hub-v3:note:";
const keyFor = (lessonId, chapterId) => `${PREFIX}${lessonId}:${chapterId}`;

export function createNotesStore(storage = localStorage) {
  return {
    get(lessonId, chapterId) { return storage.getItem(keyFor(lessonId, chapterId)) ?? ""; },
    set(lessonId, chapterId, text) {
      const value = String(text);
      if (!value) storage.removeItem(keyFor(lessonId, chapterId));
      else storage.setItem(keyFor(lessonId, chapterId), value);
      return value;
    },
    remove(lessonId, chapterId) { storage.removeItem(keyFor(lessonId, chapterId)); }
  };
}
