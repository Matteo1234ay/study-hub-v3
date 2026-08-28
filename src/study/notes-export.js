import { createNotesDocx } from "./docx-writer.js?v=20260828-15";

function formatDate(value) {
  return new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
}

export function buildNotesExportModel(lesson, notes = [], date = new Date()) {
  return {
    title: `Note · ${lesson.title}`,
    date: formatDate(date),
    chapters: (lesson.chapters ?? []).map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      sections: (chapter.sections ?? []).map(section => ({
        id: section.id,
        title: section.title,
        notes: notes.filter(note => note.chapterId === chapter.id && note.sectionId === section.id)
      })).filter(section => section.notes.length)
    })).filter(chapter => chapter.sections.length)
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
