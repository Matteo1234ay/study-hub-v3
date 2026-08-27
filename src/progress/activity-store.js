const KEY = "study-hub-v3:lesson-activity:v1";
function read(storage) { try { const value = JSON.parse(storage.getItem(KEY)); return value && typeof value === "object" ? value : {}; } catch { return {}; } }
export function createActivityStore(storage = localStorage) {
  function write(state) { storage.setItem(KEY, JSON.stringify(state)); }
  function getChapter(lessonId, chapterId) { const value = read(storage)?.[lessonId]?.[chapterId] ?? {}; return { visitedSections: Array.isArray(value.visitedSections) ? value.visitedSections : [], answeredQuestions: Array.isArray(value.answeredQuestions) ? value.answeredQuestions : [] }; }
  function add(lessonId, chapterId, field, id) { const state = read(storage), current = getChapter(lessonId, chapterId); current[field] = [...new Set([...current[field], id])]; state[lessonId] ??= {}; state[lessonId][chapterId] = current; write(state); return current; }
  return { getChapter, visitSection:(lessonId,chapterId,sectionId)=>add(lessonId,chapterId,"visitedSections",sectionId), answerQuestion:(lessonId,chapterId,questionId)=>add(lessonId,chapterId,"answeredQuestions",questionId) };
}
