import { PATHS } from "../config/paths.js?v=20260829-23";
import { exportLocalData, importLocalData } from "../progress/backup.js?v=20260829-23";
import { calculateLessonProgress, createProgressStore } from "../progress/local-progress.js?v=20260829-23";
import { element, pageHeader } from "../ui/components.js?v=20260829-23";
import { createStudyStore } from "../study/study-store.js?v=20260829-23";
import { createPreferencesStore } from "../study/preferences.js?v=20260829-23";
import { createAssessmentStore } from "../assessment/assessment-store.js?v=20260829-23";
import { deriveAssessmentInsights, summarizeAssessmentProgress } from "../assessment/insights.js?v=20260829-23";
import { validateAssessment } from "../assessment/assessment-schema.js?v=20260829-23";
import { createPathAssessmentStore } from "../path-assessment/path-store.js?v=20260829-23";

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
  const motionSelect = element("select", { attrs: { "aria-label": "Movimento dell’interfaccia" } }, [
    element("option", { text: "Movimento: segui il dispositivo", attrs: { value: "system" } }),
    element("option", { text: "Riduci il movimento", attrs: { value: "reduced" } })
  ]);
  const focusLabel = element("label", { className: "toggle-label", text: "Modalità concentrazione" });
  const focus = element("input", { attrs: { type: "checkbox" } });
  focus.checked = preferences.get().focus;
  focusLabel.prepend(focus);
  fontSelect.value = preferences.get().fontSize;
  widthSelect.value = preferences.get().width;
  motionSelect.value = preferences.get().motion;
  const applyPreferences = () => {
    preferences.update({ fontSize: fontSelect.value, width: widthSelect.value, focus: focus.checked, motion: motionSelect.value });
    preferences.applyTo(document.documentElement);
  };
  fontSelect.addEventListener("change", applyPreferences);
  widthSelect.addEventListener("change", applyPreferences);
  motionSelect.addEventListener("change", applyPreferences);
  focus.addEventListener("change", applyPreferences);
  const readingPreview = element("div", { className: "reading-preview" }, [
    element("p", { className: "eyebrow", text: "Anteprima dal vivo" }),
    element("p", { text: "Questa frase mostra subito la dimensione del testo e la larghezza di lettura selezionate." })
  ]);
  preferencePanel.append(fontSelect, widthSelect, motionSelect, focusLabel, readingPreview);
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
  const assessmentStore = createAssessmentStore();
  const pathAssessmentStore = createPathAssessmentStore();
  for (const path of PATHS.filter(item => item.assessmentManifestUrl)) {
    const attempts = pathAssessmentStore.getAttempts(path.id);
    const latest = attempts[0];
    const scores = attempts.map(item => item.result?.total?.percent).filter(Number.isFinite);
    const panel = element("section", { className: "assessment-progress-card path-progress-card" }, [
      element("p", { className: "eyebrow", text: `${path.code} · Verifica riassuntiva` }),
      element("h2", { text: latest ? `Ultimo risultato: ${latest.result.total.percent}%` : "Nessuna verifica riassuntiva" }),
      element("p", { text: attempts.length ? `${attempts.length} tentativi · migliore ${Math.max(...scores)}% · dati salvati solo qui` : "Valuta con poche domande rappresentative tutte le lezioni finora disponibili." }),
      element("a", { className: "button primary", text: "Apri verifica riassuntiva", href: `#/paths/${path.id}/assessment` })
    ]);
    if (latest?.result?.weakCompetencyIds?.length) panel.append(element("p", { text: `${latest.result.weakCompetencyIds.length} aree da consolidare influenzeranno moderatamente il prossimo tentativo.` }));
    const clear = element("button", { className: "button quiet", text: "Cancella verifiche del percorso", attrs: { type: "button" } });
    clear.addEventListener("click", () => {
      if (confirm(`Cancellare sessioni e risultati progressivi di ${path.title}? Le valutazioni delle singole lezioni resteranno intatte.`)) {
        pathAssessmentStore.clearPath(path.id);
        location.reload();
      }
    });
    panel.append(clear);
    grid.append(panel);
  }
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
    if (lesson.assessmentUrl) {
      const attempts = assessmentStore.getAttempts(lesson.id);
      const summary = summarizeAssessmentProgress(attempts);
      let assessment = null;
      try {
        const response = await fetch(lesson.assessmentUrl, { cache: "no-cache" });
        if (response.ok) assessment = validateAssessment(await response.json());
      } catch {}
      const panel = element("section", { className: "assessment-progress-card" }, [
        element("p", { className: "eyebrow", text: `${lesson.id} · Valutazioni` }),
        element("h2", { text: attempts.length ? `Ultimo risultato: ${summary.latest ?? "solo esercizi capitolo"}${summary.latest === null ? "" : "%"}` : "Nessuna valutazione completata" }),
        element("p", { text: attempts.length ? `${summary.moduleAttempts} valutazioni complete · ${summary.totalAttempts} tentativi totali${summary.best === null ? "" : ` · migliore ${summary.best}%`}` : "Completa un esercizio o la valutazione finale per vedere competenze ed errori ricorrenti." }),
        element("a", { className: "button primary", text: "Apri la valutazione", href: `#/lessons/${lesson.id}/assessment` })
      ]);
      if (assessment && attempts.length) {
        const insights = deriveAssessmentInsights(assessment, attempts);
        const competencyList = element("ul", { className: "competency-list" });
        for (const competency of insights.competencies) competencyList.append(element("li", { text: competency.status === "not-assessed" ? `${competency.label}: non ancora valutata` : `${competency.label}: ${competency.percent}% · ${competency.status === "solid" ? "consolidata" : competency.status === "improving" ? "in miglioramento" : "da ripassare"}` }));
        panel.append(element("h3", { text: "Competenze" }), competencyList);
        if (insights.recurringErrors.length) panel.append(element("p", { text: `${insights.recurringErrors.length} errori ricorrenti individuati.` }));
        const reviewLinks = element("div", { className: "review-links" });
        for (const item of insights.reviewChapters.slice(0, 3)) reviewLinks.append(element("a", { text: "Ripassa capitolo →", href: `#/lessons/${lesson.id}/${item.chapterId}` }));
        panel.append(reviewLinks);
      }
      const clear = element("button", { className: "button quiet", text: "Cancella valutazioni", attrs: { type: "button" } });
      clear.addEventListener("click", () => {
        if (confirm(`Cancellare bozze, risposte e risultati di ${lesson.id}? Note e progressi di lettura resteranno intatti.`)) {
          assessmentStore.clearAssessments(lesson.id);
          location.reload();
        }
      });
      panel.append(clear);
      grid.append(panel);
    }
  }
  const totals = element("p", { className: "local-summary", text: `${study.favorites.length} preferiti · ${Object.values(study.bookmarks).flat().length} capitoli salvati · ${study.history.length} attività locali` });
  view.append(totals);
  view.append(grid);
  return view;
}
