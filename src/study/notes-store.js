const LEGACY_PREFIX = "study-hub-v3:note:";
const STRUCTURED_PREFIX = "study-hub-v3:notes:v2:";
const legacyKey = (lessonId, chapterId) => `${LEGACY_PREFIX}${lessonId}:${chapterId}`;
const structuredKey = lessonId => `${STRUCTURED_PREFIX}${lessonId}`;

function safeParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

export function createNotesStore(storage = localStorage) {
  function list(lessonId) {
    const notes = safeParse(storage.getItem(structuredKey(lessonId)), []);
    return Array.isArray(notes) ? notes.filter(note => note && note.id && typeof note.text === "string") : [];
  }
  function write(lessonId, notes) {
    storage.setItem(structuredKey(lessonId), JSON.stringify(notes));
    return notes;
  }
  return {
    get(lessonId, chapterId) { return storage.getItem(legacyKey(lessonId, chapterId)) ?? ""; },
    set(lessonId, chapterId, text) {
      const value = String(text);
      if (!value) storage.removeItem(legacyKey(lessonId, chapterId));
      else storage.setItem(legacyKey(lessonId, chapterId), value);
      return value;
    },
    remove(lessonId, chapterId) { storage.removeItem(legacyKey(lessonId, chapterId)); },
    list,
    add(lessonId, { chapterId, sectionId = null, text, concept = null, sourceRef = null, blockId = null }) {
      const now = new Date().toISOString();
      const note = { id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, lessonId, chapterId, sectionId, text: String(text).trim(), concept, sourceRef, blockId, createdAt: now, updatedAt: now };
      if (!note.text) return null;
      write(lessonId, [...list(lessonId), note]);
      return note;
    },
    update(lessonId, noteId, text) {
      const notes = list(lessonId).map(note => note.id === noteId ? { ...note, text: String(text).trim(), updatedAt: new Date().toISOString() } : note);
      write(lessonId, notes.filter(note => note.text));
      return notes.find(note => note.id === noteId) ?? null;
    },
    removeNote(lessonId, noteId) { return write(lessonId, list(lessonId).filter(note => note.id !== noteId)); },
    exportText(lessonId, title = lessonId) {
      const notes = list(lessonId);
      const lines = [title, `Esportato: ${new Date().toLocaleString("it-IT")}`, ""];
      let current = "";
      for (const note of notes) {
        const heading = `${note.chapterId}${note.sectionId ? ` / ${note.sectionId}` : ""}`;
        if (heading !== current) { lines.push(heading, "-".repeat(heading.length)); current = heading; }
        lines.push(`• ${note.text}`, "");
      }
      return lines.join("\n");
    }
  };
}
