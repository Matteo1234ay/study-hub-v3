const SCREEN_SIZES = Object.freeze({
  default: Object.freeze({ width: 768, height: 480, logicalWidth: 512, logicalHeight: 320 }),
  social: Object.freeze({ width: 960, height: 1344, logicalWidth: 640, logicalHeight: 896 })
});

function screenSize(screenKind) {
  return SCREEN_SIZES[screenKind] ?? SCREEN_SIZES.default;
}

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
  label(context, "LEZIONE ATTIVA", 28, 34, 15, "#7ab8ff", 760);
  label(context, data.lessonId, 28, 78, 36, "#ffffff", 790);
  label(context, `Capitolo · ${data.chapter}`, 28, 112, 17, "#c5d1dd", 620);
  panel(context, 28, 136, 456, 86, "#151d27");
  label(context, "Riprendi da qui", 48, 171, 21, "#f4f7fb", 720);
  label(context, `${data.completion}% completato`, 48, 202, 16, "#aab9c8", 620);
  progressBar(context, 28, 248, 456, data.completion);
  label(context, "Continua →", 374, 292, 18, "#8bc4ff", 760);
}

function drawMemory(context, data) {
  label(context, "MEMORIA DI STUDIO", 28, 34, 15, "#e4bd6f", 760);
  label(context, "Note e Ripasso", 28, 78, 35, "#fffaf1", 790);
  panel(context, 28, 108, 216, 102, "#3b3327");
  panel(context, 264, 108, 220, 102, "#1b2a37");
  label(context, `${data.noteCount} note`, 46, 148, 20, "#ffe2aa", 700);
  label(context, "Appunti salvati", 46, 180, 15, "#d1c4a8", 600);
  label(context, "Da consolidare", 282, 148, 19, "#b9def8", 700);
  label(context, "Ripasso", 282, 180, 15, "#b4c4d1", 600);
  label(context, "Apri il ripasso →", 306, 278, 18, "#f0c979", 760);
}

function drawSocial(context, data) {
  label(context, "PERCORSO ATTIVO", 52, 82, 26, "#7ab8ff", 780);
  label(context, data.pathTitle, 52, 158, 52, "#ffffff", 800);

  panel(context, 52, 216, 536, 202, "#152331");
  label(context, `${data.lessonCount} lezione disponibile`, 82, 288, 36, "#ffffff", 780);
  label(context, "Reach · Impression", 82, 350, 28, "#cfe1f0", 680);
  label(context, "Watch time · Retention", 82, 394, 28, "#cfe1f0", 680);

  label(context, "LETTURA STRATEGICA", 52, 516, 25, "#7ab8ff", 760);
  label(context, "Metriche nel loro contesto", 52, 574, 34, "#f3f7fb", 740);

  panel(context, 52, 706, 536, 112, "#101b26");
  label(context, "Apri il percorso →", 82, 779, 32, "#8bc4ff", 800);
}

function drawAssessment(context, data) {
  label(context, "VERIFICA PROGRESSIVA", 26, 34, 15, "#a8c8ef", 760);
  label(context, data.assessmentAvailable ? "Disponibile" : "In preparazione", 26, 82, 35, "#ffffff", 790);
  panel(context, 26, 112, 460, 104, "#17202b");
  label(context, "Domande e feedback", 46, 156, 22, "#edf3f8", 720);
  label(context, "Secondo tentativo incluso", 46, 190, 16, "#b8c6d3", 600);
  label(context, "Apri la verifica →", 310, 286, 18, "#8bc4ff", 760);
}

function drawProgress(context, data) {
  label(context, "PROGRESSI", 28, 34, 15, "#79d09f", 760);
  label(context, "Avanzamento", 28, 80, 35, "#f4fff7", 790);
  label(context, `${data.completedChapters} di ${data.totalChapters} capitoli completati`, 28, 124, 19, "#dff4e7", 700);
  progressBar(context, 28, 150, 456, data.completion, "#66c48f");
  panel(context, 28, 190, 456, 62, "#17241d");
  label(context, `${data.reviewCount} concetti da consolidare`, 48, 229, 18, "#f4c98d", 680);
  label(context, "Apri progressi →", 318, 290, 17, "#79d09f", 760);
}

function drawFuture(context) {
  label(context, "ARCHIVIO PERCORSI", 28, 36, 15, "#b7c0cb", 760);
  label(context, "In preparazione", 28, 82, 35, "#ffffff", 790);
  ["Intelligenza Artificiale", "Design", "Video Making"].forEach((name, index) => {
    panel(context, 28, 108 + index * 52, 456, 40, "#191f27");
    label(context, name, 44, 135 + index * 52, 17, "#d0d7df", 650);
    label(context, "Standby", 406, 135 + index * 52, 13, "#8a96a4", 700);
  });
  label(context, "Vai ai percorsi →", 330, 294, 17, "#cbd4de", 760);
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
  const size = screenSize(station?.screenKind);
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  let current = normalizeData(data);
  let disposed = false;

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#090d12";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const drawer = DRAWERS[station?.screenKind] ?? drawFuture;
    context.save();
    context.scale(canvas.width / size.logicalWidth, canvas.height / size.logicalHeight);
    drawer(context, current, station);
    context.restore();
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
