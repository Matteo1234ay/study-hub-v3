const KEY = "study-hub-v3:review-concepts";

function read(storage) {
  try {
    const value = JSON.parse(storage.getItem(KEY));
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

export function createReviewConceptsStore(storage = localStorage) {
  function write(records) { storage.setItem(KEY, JSON.stringify(records)); }
  function list() { return read(storage); }
  function markForReview(lessonId, question = {}) {
    if (!lessonId || !question.id || !question.concept) return list();
    const key = `${lessonId}:${question.id}`;
    const records = list().filter(record => record.key !== key);
    records.unshift({
      key, lessonId, questionId: question.id, concept: question.concept,
      chapterId: question.chapterId ?? null, updatedAt: new Date().toISOString()
    });
    write(records);
    return records;
  }
  function clear(lessonId, questionId) {
    const records = list().filter(record => record.key !== `${lessonId}:${questionId}`);
    write(records);
    return records;
  }
  return { list, markForReview, clear };
}
