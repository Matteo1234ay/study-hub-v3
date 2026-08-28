const SCREEN_SIZE = Object.freeze({ width: 512, height: 320 });

function normalizeData(data = {}) {
  return {
    lessonId: typeof data.lessonId === "string" ? data.lessonId : "SMM-01",
    chapter: typeof data.chapter === "string" ? data.chapter : "Misurare ciò che conta",
    completion: Number.isFinite(Number(data.completion)) ? Math.max(0, Math.min(100, Number(data.completion))) : 0,
    reviewCount: Number.isFinite(Number(data.reviewCount)) ? Math.max(0, Number(data.reviewCount)) : 0,
    noteCount: Number.isFinite(Number(data.noteCount)) ? Math.max(0, Number(data.noteCount)) : 0,
    lessonCount: Number.isFinite(Number(data.lessonCount)) ? Math.max(0, Number(data.lessonCount)) : 0,
    completedChapters: Number.isFinite(Number(data.completedChapters)) ? Math.max(0, Number(data.completedChapters)) : 0,
    totalChapters: Number.isFinite(Number(data.totalChapters)) ? Math.max(0, Number(data.totalChapters)) : 0,
    pathTitle: typeof data.pathTitle === "string" ? data.pathTitle : "Social Media Manager",
    assessmentAvailable: Boolean(data.assessmentAvailable)
  };
}

function sameData(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function label(context, text, x, y, size = 18, color = "#d8e7f6", weight = 500) {
  context.fillStyle = color;
  context.font = `${weight} ${size}px system-ui, sans-serif`;
  context.fillText(text, x, y);
}

function panel(context, x, y, width, height, color = "#17202b") {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function progressBar(context, x, y, width, value, color = "#66aef4") {
  panel(context, x, y, width, 10, "#28313c");
  panel(context, x, y, width * value / 100, 10, color);
}

function drawLesson(context, data) {
  label(context, "LEZIONE ATTIVA", 28, 34, 13, "#7ab8ff", 700);
  label(context, data.lessonId, 28, 72, 30, "#f5f7fa", 760);
  label(context, `Capitolo · ${data.chapter}`, 28, 106, 16, "#b9c4d2");
  panel(context, 28, 132, 456, 88, "#151d27");
  label(context, "Continua dal punto in cui eri rimasto", 48, 168, 17, "#e8edf4", 620);
  label(context, `${data.completion}% completato`, 48, 198, 14, "#9eafc1");
  progressBar(context, 28, 248, 456, data.completion);
  label(context, "Continua →", 388, 292, 15, "#8bc4ff", 700);
}

function drawMemory(context, data) {
  label(context, "MEMORIA DI STUDIO", 28, 34, 13, "#e4bd6f", 700);
  label(context, "Note e Ripasso", 28, 72, 29, "#f6f1e7", 760);
  panel(context, 28, 102, 216, 106, "#3b3327");
  panel(context, 264, 102, 220, 106, "#1b2a37");
  label(context, `${data.noteCount} note`, 46, 140, 16, "#f2dbac", 650);
  label(context, "Appunti salvati", 46, 174, 14, "#cbbd9e");
  label(context, "Da consolidare", 282, 140, 16, "#a9d2f2", 650);
  label(context, "Ripasso programmato", 282, 174, 14, "#a9bac8");
  label(context, "Apri il ripasso →", 328, 272, 15, "#e4bd6f", 700);
}

function drawSocial(context, data) {
  label(context, "SOCIAL MEDIA MANAGER", 24, 32, 13, "#7ab8ff", 700);
  label(context, data.pathTitle, 24, 65, 25, "#f3f6fa", 740);
  panel(context, 24, 88, 460, 74, "#152331");
  label(context, `${data.lessonCount} lezione disponibile`, 42, 120, 18, "#e7f2fb", 700);
  label(context, "Reach · Impression · Watch time · Retention", 42, 146, 13, "#91a9be", 600);
  label(context, "Gli indicatori vengono studiati nel loro contesto", 24, 205, 15, "#c5d5e3", 600);
  label(context, "Nessun dato dimostrativo viene presentato come reale.", 24, 235, 13, "#91a9be", 500);
  label(context, "Apri il percorso →", 336, 292, 15, "#7ab8ff", 700);
}

function drawAssessment(context, data) {
  label(context, "VERIFICA PROGRESSIVA", 26, 32, 13, "#a8c8ef", 700);
  label(context, data.assessmentAvailable ? "Disponibile" : "In preparazione", 26, 72, 27, "#f2f5f8", 730);
  panel(context, 26, 104, 460, 112, "#17202b");
  label(context, "Domande, feedback e secondo tentativo", 46, 145, 17, "#e3e9ef", 650);
  label(context, "La verifica usa soltanto contenuti del percorso.", 46, 181, 14, "#aebdcb", 550);
  label(context, "Apri la verifica →", 338, 286, 15, "#8bc4ff", 700);
}

function drawProgress(context, data) {
  label(context, "PROGRESSI", 28, 32, 13, "#79d09f", 700);
  label(context, "Avanzamento reale", 28, 68, 27, "#f0f6f2", 740);
  label(context, `${data.completedChapters} di ${data.totalChapters} capitoli completati`, 28, 118, 17, "#d9eee2", 700);
  progressBar(context, 28, 142, 456, data.completion, "#66c48f");
  panel(context, 28, 184, 456, 62, "#17241d");
  label(context, `${data.reviewCount} concetti da consolidare`, 48, 222, 16, "#f0c486", 650);
  label(context, "Apri progressi →", 344, 288, 14, "#79d09f", 700);
}

function drawFuture(context) {
  label(context, "ARCHIVIO PERCORSI", 28, 36, 13, "#aab3bf", 700);
  label(context, "In preparazione", 28, 74, 28, "#ecf0f4", 740);
  ["Intelligenza Artificiale", "Design", "Video Making"].forEach((name, index) => {
    panel(context, 28, 104 + index * 54, 456, 42, "#191f27");
    label(context, name, 44, 132 + index * 54, 14, "#c1c9d2", 600);
    label(context, "Standby", 410, 132 + index * 54, 12, "#7d8996", 650);
  });
  label(context, "Esplora la struttura →", 324, 294, 14, "#b8c2cd", 700);
}

const DRAWERS = Object.freeze({
  lesson: drawLesson,
  memory: drawMemory,
  social: drawSocial,
  assessment: drawAssessment,
  progress: drawProgress,
  future: drawFuture
});

export function createStationScreen({
  station,
  data = {},
  canvasFactory = () => document.createElement("canvas")
}) {
  const canvas = canvasFactory();
  canvas.width = SCREEN_SIZE.width;
  canvas.height = SCREEN_SIZE.height;
  const context = canvas.getContext("2d");
  let current = normalizeData(data);
  let disposed = false;

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#090d12";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const drawer = DRAWERS[station?.screenKind] ?? drawFuture;
    drawer(context, current, station);
  }

  draw();
  return {
    canvas,
    update(nextData = {}) {
      if (disposed) return false;
      const next = normalizeData({ ...current, ...nextData });
      if (sameData(current, next)) return false;
      current = next;
      draw();
      return true;
    },
    dispose() {
      disposed = true;
    }
  };
}
