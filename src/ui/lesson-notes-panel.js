import { element } from "./components.js?v=20260906-33";

export function notesForScope(notes, scope, context) {
  if (scope === "section") return notes.filter(note => note.chapterId === context.chapterId && note.sectionId === context.sectionId);
  if (scope === "chapter") return notes.filter(note => note.chapterId === context.chapterId);
  return notes;
}

export function noteContextLabel(context = {}) {
  return [context.chapterTitle, context.sectionTitle].filter(Boolean).join(" · ");
}

export function createLessonNotesPanel({ lessonId, store, initialContext, initialScope = "section", onExport = () => {} }) {
  let context = { ...initialContext };
  let scope = ["section", "chapter", "lesson"].includes(initialScope) ? initialScope : "section";
  let open = matchMedia("(min-width: 1181px)").matches;
  let saveTimer = null;
  let draftNote = null;
  let dirty = false;

  const trigger = element("button", {
    className: "notes-trigger",
    text: "Note",
    attrs: { type: "button", "aria-expanded": "false", "aria-controls": "lesson-notes-panel" }
  });
  const closeButton = element("button", { className: "notes-close", text: "Chiudi", attrs: { type: "button" } });
  const contextText = element("p", { className: "notes-context" });
  const search = element("input", { className: "notes-search", attrs: { type: "search", placeholder: "Cerca nelle note…", "aria-label": "Cerca nelle note" } });
  const scopeSelect = element("select", { className: "notes-scope", attrs: { "aria-label": "Mostra note" } }, [
    element("option", { text: "Questa sezione", attrs: { value: "section" } }),
    element("option", { text: "Questo capitolo", attrs: { value: "chapter" } }),
    element("option", { text: "Tutta la lezione", attrs: { value: "lesson" } })
  ]);
  scopeSelect.value = scope;
  const editor = element("textarea", {
    className: "notes-editor",
    attrs: { rows: "7", placeholder: "Scrivi una nota…", "aria-label": "Nuova nota personale" }
  });
  const status = element("p", { className: "notes-save-status", text: "Salvata solo su questo dispositivo", attrs: { "aria-live": "polite" } });
  const list = element("div", { className: "notes-list" });
  const exportButton = element("button", { className: "button quiet notes-export", text: "Esporta per Google Docs", attrs: { type: "button" } });
  const newButton = element("button", { className: "button quiet", text: "Nuova nota", attrs: { type: "button" } });
  const panel = element("aside", {
    className: "lesson-notes-panel",
    attrs: { id: "lesson-notes-panel", "aria-label": "Note della lezione", "data-open": String(open) }
  }, [
    element("header", { className: "notes-header" }, [
      element("div", {}, [element("p", { className: "eyebrow", text: "Appunti personali" }), element("h2", { text: "Le tue note" })]),
      closeButton
    ]),
    contextText,
    element("div", { className: "notes-tools" }, [scopeSelect, search]),
    editor,
    status,
    element("div", { className: "notes-actions" }, [newButton, exportButton]),
    list
  ]);
  const node = element("div", { className: "notes-dock" }, [trigger, panel]);
  trigger.setAttribute("aria-expanded", String(open));
  node.classList.toggle("is-open", open);

  function allNotes() {
    return store.search(search.value, { lessonId });
  }

  function renderList() {
    const visible = notesForScope(allNotes(), scope, context);
    list.replaceChildren();
    if (!visible.length) {
      list.append(element("p", { className: "notes-empty", text: "Nessuna nota in questa vista." }));
      return;
    }
    for (const note of visible) {
      const remove = note.legacy ? null : element("button", { className: "note-remove", text: "Elimina", attrs: { type: "button", "aria-label": "Elimina nota" } });
      remove?.addEventListener("click", () => {
        if (!confirm("Eliminare questa nota?")) return;
        if (draftNote?.id === note.id) { clearTimeout(saveTimer); saveTimer = null; dirty = false; draftNote = null; editor.value = ""; }
        store.remove(lessonId, note.id);
        renderList();
      });
      const edit = element("button", { className: "note-edit", text: "Modifica", attrs: { type: "button" } });
      edit.addEventListener("click", () => {
        if (!flush()) return;
        draftNote = note;
        editor.value = note.text;
        status.textContent = "Modifica della nota salvata · posizione originale conservata";
        editor.focus();
      });
      list.append(element("article", { className: `note-card${note.legacy ? " is-legacy" : ""}` }, [
        element("p", { text: note.text }),
        element("footer", {}, [
          element("span", { text: note.legacy ? "Nota precedente conservata" : (note.sectionId ?? note.chapterId) }),
          edit,
          remove
        ])
      ]));
    }
  }

  function setOpen(next) {
    if (!next && !flush()) return;
    open = next;
    panel.dataset.open = String(open);
    trigger.setAttribute("aria-expanded", String(open));
    node.classList.toggle("is-open", open);
    if (open) editor.focus();
    else trigger.focus();
  }

  function saveDraft() {
    clearTimeout(saveTimer); saveTimer = null;
    if (!dirty) return true;
    const text = editor.value.trim();
    if (!text) {
      dirty = false;
      if (draftNote) {
        editor.value = draftNote.text;
        status.textContent = "Nota salvata conservata. Usa Elimina per rimuoverla.";
      } else status.textContent = "Nessuna nota da salvare";
      return true;
    }
    try {
      if (draftNote?.legacy) {
        store.set(lessonId, draftNote.legacyChapterId, text);
        draftNote = { ...draftNote, text };
      } else draftNote = store.upsert({
        ...draftNote,
        lessonId,
        chapterId: draftNote?.chapterId ?? context.chapterId,
        sectionId: draftNote ? draftNote.sectionId : (context.sectionId ?? null),
        text
      });
      dirty = false;
      status.textContent = "Salvata sul dispositivo";
      renderList();
      return true;
    } catch {
      status.textContent = "Non salvata: copia il testo prima di chiudere";
      return false;
    }
  }

  function flush() { return saveDraft(); }
  newButton.addEventListener("click", () => {
    if (!flush()) return;
    draftNote = null; editor.value = ""; dirty = false;
    status.textContent = "Nuova nota · salvata mentre scrivi";
    editor.focus();
  });
  editor.addEventListener("input", () => {
    dirty = true;
    status.textContent = "Salvataggio…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 300);
  });
  trigger.addEventListener("click", () => setOpen(!open));
  closeButton.addEventListener("click", () => setOpen(false));
  scopeSelect.addEventListener("change", () => { scope = scopeSelect.value; renderList(); });
  search.addEventListener("input", renderList);
  exportButton.addEventListener("click", async () => {
    if (!flush()) return;
    try { await onExport(store.list({ lessonId })); }
    catch { status.textContent = "Esportazione non riuscita. Le note restano sul dispositivo."; }
  });
  panel.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
    }
  });

  function setContext(next) {
    const sameLocation = context.chapterId === next.chapterId && context.sectionId === next.sectionId;
    if (sameLocation) {
      context = { ...context, ...next };
      contextText.textContent = noteContextLabel(context) || "Lezione";
      renderList();
      return;
    }
    if (!flush()) return;
    context = { ...context, ...next };
    contextText.textContent = noteContextLabel(context) || "Lezione";
    draftNote = null;
    editor.value = "";
    renderList();
  }

  setContext(context);
  return {
    node,
    open: () => setOpen(true),
    close: () => setOpen(false),
    setContext,
    flush,
    destroy() { flush(); clearTimeout(saveTimer); }
  };
}
