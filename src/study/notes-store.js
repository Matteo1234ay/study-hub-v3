import { resolveLegacyChapterId } from "../lessons/lesson-compatibility.js?v=20260829-23";
import { createNote, normalizeNote } from "./note-model.js?v=20260829-23";

const PREFIX = "study-hub-v3:note:";
const V2_PREFIX = "study-hub-v3:notes:v2:";
const keyFor = (lessonId, chapterId) => `${PREFIX}${lessonId}:${chapterId}`;

function v2Key(lessonId) {
  return `${V2_PREFIX}${lessonId}`;
}

export function createNotesStore(storage = localStorage, now = Date.now, idFactory = () => crypto.randomUUID()) {
  function readV2(lessonId) {
    try {
      const value = JSON.parse(storage.getItem(v2Key(lessonId)));
      if (!value || value.version !== 2 || !Array.isArray(value.notes)) return [];
      return value.notes.map(normalizeNote).filter(Boolean);
    } catch {
      return [];
    }
  }

  function writeV2(lessonId, notes) {
    storage.setItem(v2Key(lessonId), JSON.stringify({ version: 2, notes }));
  }

  function legacyNotes(lessonId) {
    const prefix = `${PREFIX}${lessonId}:`;
    const notes = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const text = storage.getItem(key)?.trim();
      if (!text) continue;
      const legacyChapterId = key.slice(prefix.length);
      notes.push({
        id: `legacy:${legacyChapterId}`,
        lessonId,
        chapterId: resolveLegacyChapterId(legacyChapterId),
        sectionId: null,
        text,
        conceptId: null,
        sourceId: null,
        blockId: null,
        createdAt: 0,
        updatedAt: 0,
        legacy: true,
        legacyChapterId
      });
    }
    return notes;
  }

  function list(scope = {}) {
    if (!scope.lessonId) return [];
    return [...readV2(scope.lessonId), ...legacyNotes(scope.lessonId)].filter(note => {
      if (scope.chapterId && note.chapterId !== scope.chapterId) return false;
      if (scope.sectionId && note.sectionId !== scope.sectionId) return false;
      return true;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function upsert(input) {
    const existing = input.id ? readV2(input.lessonId).find(note => note.id === input.id) : null;
    const note = createNote({
      ...existing,
      ...input,
      createdAt: existing?.createdAt ?? input.createdAt
    }, now, idFactory);
    if (!note) throw new TypeError("La nota deve contenere lezione, capitolo e testo.");
    const notes = readV2(note.lessonId).filter(candidate => candidate.id !== note.id);
    notes.push(note);
    writeV2(note.lessonId, notes);
    return note;
  }

  function removeStructured(lessonId, noteId) {
    const notes = readV2(lessonId).filter(note => note.id !== noteId);
    writeV2(lessonId, notes);
  }

  function search(query, scope = {}) {
    const normalized = String(query ?? "").trim().toLocaleLowerCase("it");
    if (!normalized) return list(scope);
    return list(scope).filter(note => note.text.toLocaleLowerCase("it").includes(normalized));
  }

  return {
    get(lessonId, chapterId) { return storage.getItem(keyFor(lessonId, chapterId)) ?? ""; },
    set(lessonId, chapterId, text) {
      const value = String(text);
      if (!value) storage.removeItem(keyFor(lessonId, chapterId));
      else storage.setItem(keyFor(lessonId, chapterId), value);
      return value;
    },
    remove(lessonId, id) {
      if (id.startsWith("legacy:")) return false;
      if (readV2(lessonId).some(note => note.id === id)) removeStructured(lessonId, id);
      else storage.removeItem(keyFor(lessonId, id));
      return true;
    },
    list,
    upsert,
    search,
    getLegacyText(lessonId, chapterId) { return storage.getItem(keyFor(lessonId, chapterId)) ?? ""; }
  };
}
