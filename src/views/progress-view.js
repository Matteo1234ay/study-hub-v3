import { PATHS } from "../config/paths.js";
import { exportLocalData, importLocalData } from "../progress/backup.js";
import { calculateLessonProgress, createProgressStore } from "../progress/local-progress.js";
import { element, pageHeader } from "../ui/components.js";
import { createStudyStore } from "../study/study-store.js";
import { createPreferencesStore } from "../study/preferences.js";

function downloadBackup() {
  const blob = new Blob([JSON.stringify(exportLocalData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = element("a", { href: url, attrs: { download: `study-hub-backup-${new Date().toISOString().slice(0, 10)}.json` } });
  link.click();
  URL.revokeObjectURL(url);
}

export async function renderProgressView() {
  const view = element("section", { className: "content-page progress-page" }, [
    pageHeader("Dati sul dispositivo", "I tuoi progressi", "Restano in questo browser. Puoi esportarli per conservarli o trasferirli, senza account e senza servizi a pagamento.")
  ]);
  const actions = element("div", { className: "progress-actions" });
  const exportButton = element("button", { className: "button primary", text: "Esporta backup JSON", attrs: { type: "button" } });
  const importLabel = element("label", { className: "button quiet", text: "Importa backup" });
  const input = element("input", { className: "visually-hidden", attrs: { type: "file", accept: "application/json,.json" } });
  const status = element("p", { className: "import-status", attrs: { role: "status" } });
  importLabel.append(input);
  exportButton.addEventListener("click", downloadBackup);
  input.addEventListener("change", async () => {
    try {
      const backup = JSON.parse(await input.files[0].text());
      const count = importLocalData(backup);
      status.textContent = `Backup importato: ${count} elementi ripristinati.`;
      setTimeout(() => location.reload(), 500);
    } catch {
      status.textContent = "Backup non valido: nessun dato è stato modificato.";
    }
  });
  actions.append(exportButton, importLabel);
  view.append(actions, status);

  const studyStore = createStudyStore();
  const preferences = createPreferencesStore();
  const study = studyStore.getState();
  const preferencePanel = element("section", { className: "settings-panel" }, [
    element("div", {}, [element("p", { className: "eyebrow", text: "Lettura" }), element("h2", { text: "Personalizza l’esperienza" })])
  ]);
  const fontSelect = element("select", { attrs: { "aria-label": "Dimensione del testo" } }, [
    element("option", { text: "Testo piccolo", attrs: { value: "small" } }),
    element("option", { text: "Testo normale", attrs: { value: "normal" } }),
    element("option", { text: "Testo grande", attrs: { value: "large" } })
  ]);
  const widthSelect = element("select", { attrs: { "aria-label": "Larghezza di lettura" } }, [
    element("option", { text: "Larghezza comoda", attrs: { value: "comfortable" } }),
    element("option", { text: "Larghezza stretta", attrs: { value: "narrow" } })
  ]);
  const focusLabel = element("label", { className: "toggle-label", text: "Modalità concentrazione" });
  const focus = element("input", { attrs: { type: "checkbox" } });
  focus.checked = preferences.get().focus;
  focusLabel.prepend(focus);
  fontSelect.value = preferences.get().fontSize;
  widthSelect.value = preferences.get().width;
  const applyPreferences = () => {
    preferences.update({ fontSize: fontSelect.value, width: widthSelect.value, focus: focus.checked });
    preferences.applyTo(document.documentElement);
  };
  fontSelect.addEventListener("change", applyPreferences);
  widthSelect.addEventListener("change", applyPreferences);
  focus.addEventListener("change", applyPreferences);
  preferencePanel.append(fontSelect, widthSelect, focusLabel);
  view.append(preferencePanel);

  const activity = element("section", { className: "activity-panel" }, [
    element("div", { className: "activity-heading" }, [
      element("div", {}, [element("p", { className: "eyebrow", text: "Cronologia locale" }), element("h2", { text: "Attività recente" })])
    ])
  ]);
  const clearHistory = element("button", { className: "button quiet", text: "Cancella cronologia", attrs: { type: "button" } });
  clearHistory.addEventListener("click", () => {
    if (confirm("Cancellare soltanto la cronologia di studio? Note e progressi resteranno intatti.")) {
      studyStore.clearHistory();
      activity.querySelector(".activity-list")?.replaceChildren(element("li", { text: "Nessuna attività registrata." }));
    }
  });
  activity.querySelector(".activity-heading").append(clearHistory);
  const activityList = element("ol", { className: "activity-list" });
  const typeLabels = { lesson: "Lezione aperta", chapter: "Capitolo visitato", complete: "Completamento aggiornato" };
  for (const event of [...study.history].reverse().slice(0, 20)) activityList.append(element("li", {}, [
    element("b", { text: typeLabels[event.type] ?? "Attività" }),
    element("span", { text: event.title ?? event.chapterId ?? event.lessonId ?? "Study Hub" }),
    element("time", { text: new Date(event.at).toLocaleString("it-IT") })
  ]));
  if (!activityList.childElementCount) activityList.append(element("li", { text: "Nessuna attività registrata." }));
  activity.append(activityList);
  view.append(activity);

  const grid = element("div", { className: "progress-grid" });
  const store = createProgressStore();
  const lessons = PATHS.flatMap((path) => path.lessons.map((lesson) => ({ lesson, path })));
  for (const { lesson, path } of lessons) {
    let chapters = [];
    try {
      const response = await fetch(lesson.dataUrl, { cache: "no-cache" });
      if (response.ok) chapters = (await response.json()).chapters ?? [];
    } catch {}
    const saved = store.get(lesson.id);
    const percent = calculateLessonProgress(chapters, new Set(saved.completed));
    grid.append(element("a", { className: "progress-card", href: `#/lessons/${lesson.id}` }, [
      element("p", { className: "eyebrow", text: `${path.code} · ${lesson.id}` }),
      element("h2", { text: lesson.title }),
      element("progress", { className: "progress-track", attrs: { max: "100", value: String(percent), "aria-label": `Completamento ${lesson.id}` } }),
      element("p", { text: `${percent}% · ${saved.completed.length} capitoli completati` })
    ]));
  }
  const totals = element("p", { className: "local-summary", text: `${study.favorites.length} preferiti · ${Object.values(study.bookmarks).flat().length} capitoli salvati · ${study.history.length} attività locali` });
  view.append(totals);
  view.append(grid);
  return view;
}
