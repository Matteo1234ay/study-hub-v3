import { PATHS } from "../config/paths.js";
import { exportLocalData, importLocalData } from "../progress/backup.js";
import { calculateLessonProgress, createProgressStore } from "../progress/local-progress.js";
import { element, pageHeader } from "../ui/components.js";

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
      element("div", { className: "progress-track", attrs: { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(percent) } }, [
        element("span", { attrs: { style: `width:${percent}%` } })
      ]),
      element("p", { text: `${percent}% · ${saved.completed.length} capitoli completati` })
    ]));
  }
  view.append(grid);
  return view;
}
