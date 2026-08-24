const KEY = "study-hub-v3:study";
const HISTORY_LIMIT = 500;

function emptyState() {
  return { favorites: [], bookmarks: {}, lastPosition: null, history: [] };
}

function uniqueStrings(value) {
  return Array.isArray(value) ? [...new Set(value.filter(item => typeof item === "string"))] : [];
}

function sanitize(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyState();
  const bookmarks = {};
  if (value.bookmarks && typeof value.bookmarks === "object" && !Array.isArray(value.bookmarks)) {
    for (const [lessonId, chapters] of Object.entries(value.bookmarks)) bookmarks[lessonId] = uniqueStrings(chapters);
  }
  return {
    favorites: uniqueStrings(value.favorites),
    bookmarks,
    lastPosition: value.lastPosition && typeof value.lastPosition === "object" ? value.lastPosition : null,
    history: Array.isArray(value.history) ? value.history.filter(item => item && typeof item === "object").slice(-HISTORY_LIMIT) : []
  };
}

export function createStudyStore(storage = localStorage, now = Date.now) {
  function getState() {
    try { return sanitize(JSON.parse(storage.getItem(KEY))); }
    catch { return emptyState(); }
  }

  function write(state) {
    const safe = sanitize(state);
    storage.setItem(KEY, JSON.stringify(safe));
    return safe;
  }

  function toggleFavorite(lessonId) {
    const state = getState();
    const values = new Set(state.favorites);
    values.has(lessonId) ? values.delete(lessonId) : values.add(lessonId);
    return write({ ...state, favorites: [...values] });
  }

  function toggleBookmark(lessonId, chapterId) {
    const state = getState();
    const values = new Set(state.bookmarks[lessonId] ?? []);
    values.has(chapterId) ? values.delete(chapterId) : values.add(chapterId);
    const bookmarks = { ...state.bookmarks, [lessonId]: [...values] };
    if (!bookmarks[lessonId].length) delete bookmarks[lessonId];
    return write({ ...state, bookmarks });
  }

  function recordVisit(event) {
    const state = getState();
    return write({ ...state, history: [...state.history, { ...event, at: now() }].slice(-HISTORY_LIMIT) });
  }

  function setLastPosition(lessonId, chapterId = null) {
    const state = getState();
    return write({ ...state, lastPosition: { lessonId, chapterId, at: now() } });
  }

  function clearHistory() {
    const state = getState();
    return write({ ...state, history: [] });
  }

  return { getState, toggleFavorite, toggleBookmark, recordVisit, setLastPosition, clearHistory };
}
