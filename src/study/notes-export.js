import { createNotesDocx } from "./docx-writer.js?v=20260906-33";

function formatDate(value) {
  return new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
}

export function buildNotesExportModel(lesson, notes = [], date = new Date()) {
  const exportedNoteIds = new Set();
  const chapters = (lesson.chapters ?? []).map(chapter => {
    const sections = (chapter.sections ?? []).map(section => {
      const sectionNotes = notes.filter(note => note.chapterId === chapter.id && note.sectionId === section.id);
      sectionNotes.forEach(note => exportedNoteIds.add(note.id));
      return {
        id: section.id,
        title: section.title,
        notes: sectionNotes
      };
    }).filter(section => section.notes.length);

    const chapterNotes = notes.filter(note => note.chapterId === chapter.id && !exportedNoteIds.has(note.id));
    if (chapterNotes.length) {
      chapterNotes.forEach(note => exportedNoteIds.add(note.id));
      sections.push({
        id: `${chapter.id}-chapter-notes`,
        title: "Appunti del capitolo",
        notes: chapterNotes
      });
    }

    return {
      id: chapter.id,
      title: chapter.title,
      sections
    };
  }).filter(chapter => chapter.sections.length);

  const previousNotes = notes.filter(note => !exportedNoteIds.has(note.id));
  if (previousNotes.length) {
    chapters.push({
      id: "previous-notes",
      title: "Appunti precedenti",
      sections: [{
        id: "previous-notes-list",
        title: "Note conservate",
        notes: previousNotes
      }]
    });
  }

  return {
    title: `Note · ${lesson.title}`,
    date: formatDate(date),
    chapters
  };
}

export function createNotesPlainText(model) {
  const lines = [model.title, `Esportate il ${model.date}`, ""];
  for (const chapter of model.chapters) {
    lines.push(chapter.title, "=".repeat(chapter.title.length));
    for (const section of chapter.sections) {
      lines.push("", section.title);
      for (const note of section.notes) {
        lines.push(`- ${note.text}${note.conceptId ? ` [Concetto: ${note.conceptId}]` : ""}`);
      }
    }
    lines.push("");
  }
  lines.push("Sintesi personale", "------------------", "");
  return lines.join("\n");
}

export async function exportNotes({ lesson, notes, date = new Date(), saveFile, copyText }) {
  const model = buildNotesExportModel(lesson, notes, date);
  try {
    await saveFile(createNotesDocx(model), `note-${lesson.id ?? "lezione"}.docx`);
    return { method: "docx" };
  } catch (error) {
    const text = createNotesPlainText(model);
    await copyText(text);
    return { method: "clipboard", error };
  }
}
