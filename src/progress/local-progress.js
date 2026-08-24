const PREFIX = "study-hub-v3:progress:";

function emptyProgress() {
  return { completed: [], updatedAt: null };
}

export function calculateLessonProgress(chapters, completedChapterIds) {
  if (!chapters.length) return 0;
  const validIds = new Set(chapters.map((chapter) => chapter.id));
  const completed = [...completedChapterIds].filter((id) => validIds.has(id)).length;
  return Math.round((completed / chapters.length) * 100);
}

export function createProgressStore(storage = localStorage, now = Date.now) {
  function get(lessonId) {
    try {
      const value = JSON.parse(storage.getItem(`${PREFIX}${lessonId}`));
      if (!value || !Array.isArray(value.completed)) return emptyProgress();
      return {
        completed: [...new Set(value.completed.filter((id) => typeof id === "string"))],
        updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : null
      };
    } catch {
      return emptyProgress();
    }
  }

  function set(lessonId, completed) {
    const value = { completed: [...new Set(completed)], updatedAt: now() };
    storage.setItem(`${PREFIX}${lessonId}`, JSON.stringify(value));
    return value;
  }

  function toggle(lessonId, chapterId) {
    const completed = new Set(get(lessonId).completed);
    if (completed.has(chapterId)) completed.delete(chapterId);
    else completed.add(chapterId);
    return set(lessonId, completed);
  }

  return { get, set, toggle };
}
