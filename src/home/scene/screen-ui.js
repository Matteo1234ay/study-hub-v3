const SCREEN_SIZES = Object.freeze({
  default: Object.freeze({
    logicalWidth: 512,
    logicalHeight: 320,
    base: Object.freeze({ width: 768, height: 480 }),
    active: Object.freeze({ width: 1024, height: 640 })
  }),
  social: Object.freeze({
    logicalWidth: 640,
    logicalHeight: 896,
    base: Object.freeze({ width: 960, height: 1344 }),
    active: Object.freeze({ width: 1280, height: 1792 })
  })
});

function screenSize(screenKind, active = false) {
  const policy = SCREEN_SIZES[screenKind] ?? SCREEN_SIZES.default;
  return {
    ...policy[active ? "active" : "base"],
    logicalWidth: policy.logicalWidth,
    logicalHeight: policy.logicalHeight
  };
}

export function resolveScreenPresentation({
  screenKind = "default",
  active = false,
  read = false,
  compact = false
} = {}) {
  const sharp = Boolean(active || read);
  const compactCopy = Boolean(read && compact);
  return {
    ...screenSize(screenKind, sharp),
    active: Boolean(active),
    read: Boolean(read),
    compact: Boolean(compact),
    compactCopy,
    maxSupportLines: compactCopy ? 2 : 4
  };
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

function label(context, text, x, y, size = 18, color = "#e4edf5", weight = 620) {
  context.fillStyle = color;
  context.font = `${weight} ${size}px system-ui, sans-serif`;
  context.fillText(text, x, y);
}

function panel(context, x, y, width, height, color = "#17202b") {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function progressBar(context, x, y, width, value, color = "#76baff") {
  panel(context, x, y, width, 12, "#2a3541");
  panel(context, x, y, width * value / 100, 12, color);
}

function drawLesson(context, data) {
  label(context, "LEZIONE ATTIVA", 28, 36, 16, "#8bc4ff", 780);
  label(context, data.lessonId, 28, 84, 40, "#ffffff", 820);
  label(context, `Capitolo · ${data.chapter}`, 28, 120, 18, "#d6e0e9", 660);
  panel(context, 28, 144, 456, 84, "#15202b");
  label(context, `${data.completion}% completato`, 48, 185, 22, "#ffffff", 760);
  progressBar(context, 28, 252, 456, data.completion);
  label(context, "Continua →", 368, 296, 20, "#8bc4ff", 800);
}

function drawMemory(context, data) {
  label(context, "MEMORIA DI STUDIO", 28, 36, 16, "#efcd85", 780);
  label(context, "Note e Ripasso", 28, 84, 38, "#fffaf1", 820);
  panel(context, 28, 116, 216, 100, "#3d3427");
  panel(context, 264, 116, 220, 100, "#1a2b39");
  label(context, `${data.noteCount} note`, 46, 158, 23, "#ffe4ad", 760);
  label(context, "Appunti salvati", 46, 190, 16, "#e2d5bd", 650);
  label(context, "Da consolidare", 282, 158, 21, "#c9e8ff", 760);
  label(context, "Ripasso", 282, 190, 16, "#cfdae3", 650);
  label(context, "Apri il ripasso →", 292, 286, 20, "#f2cf82", 800);
}

function drawSocial(context, data, station, presentation = {}) {
  label(context, "PERCORSO ATTIVO", 52, 84, 26, "#8bc4ff", 800);
  label(context, data.pathTitle, 52, 166, 56, "#ffffff", 840);

  panel(context, 52, 226, 536, 210, "#142433");
  label(context, `${data.lessonCount} lezione disponibile`, 82, 304, 38, "#ffffff", 800);
  label(context, "Reach · Impression", 82, 370, 30, "#d9ebf8", 720);
  label(context, "Watch time · Retention", 82, 418, 30, "#d9ebf8", 720);

  if (presentation.compactCopy) {
    panel(context, 52, 520, 536, 150, "#0f1c28");
    label(context, "Apri il percorso →", 82, 612, 36, "#91c9ff", 820);
    return;
  }

  label(context, "LETTURA STRATEGICA", 52, 538, 26, "#8bc4ff", 780);
  label(context, "Metriche nel contesto", 52, 600, 36, "#f7fafc", 780);
  panel(context, 52, 710, 536, 120, "#0f1c28");
  label(context, "Apri il percorso →", 82, 788, 34, "#91c9ff", 820);
}

function drawAssessment(context, data) {
  label(context, "VERIFICA PROGRESSIVA", 26, 36, 16, "#b4d3f7", 780);
  label(context, data.assessmentAvailable ? "Disponibile" : "In preparazione", 26, 86, 39, "#ffffff", 820);
  panel(context, 26, 118, 460, 104, "#17222d");
  label(context, "Domande e feedback", 46, 162, 24, "#f4f8fb", 760);
  label(context, "Secondo tentativo incluso", 46, 198, 17, "#d1dbe5", 650);
  label(context, "Apri la verifica →", 294, 292, 20, "#8bc4ff", 800);
}

function drawProgress(context, data) {
  label(context, "PROGRESSI", 28, 36, 16, "#86d9aa", 780);
  label(context, "Avanzamento", 28, 84, 38, "#f5fff8", 820);
  label(context, `${data.completedChapters} di ${data.totalChapters} capitoli completati`, 28, 130, 20, "#e8f7ed", 740);
  progressBar(context, 28, 158, 456, data.completion, "#73cf9b");
  panel(context, 28, 198, 456, 64, "#17251e");
  label(context, `${data.reviewCount} concetti da consolidare`, 48, 240, 19, "#ffd39a", 720);
  label(context, "Apri progressi →", 304, 296, 19, "#86d9aa", 800);
}

function drawFuture(context) {
  label(context, "ARCHIVIO DIDATTICO", 28, 36, 16, "#c4ccd5", 780);
  label(context, "Percorsi", 28, 84, 38, "#ffffff", 820);
  label(context, "In preparazione", 286, 82, 34, "#d8dfe7", 780);
  ["Intelligenza Artificiale", "Design", "Video Making"].forEach((name, index) => {
    panel(context, 28, 112 + index * 52, 456, 40, "#191f27");
    label(context, name, 44, 139 + index * 52, 17, "#e0e5eb", 680);
    label(context, "Standby", 400, 139 + index * 52, 15, "#aab5c0", 740);
  });
  label(context, "Vai ai percorsi →", 300, 298, 20, "#d7e0e8", 800);
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
  const context = canvas.getContext("2d");
  let current = normalizeData(data);
  let presentation = Object.freeze({ active: false, read: false, compact: false });
  let disposed = false;

  function presentationState() {
    return resolveScreenPresentation({ screenKind: station?.screenKind, ...presentation });
  }

  function applySize() {
    const size = presentationState();
    canvas.width = size.width;
    canvas.height = size.height;
    return size;
  }

  function draw() {
    const state = presentationState();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#090d12";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const drawer = DRAWERS[station?.screenKind] ?? drawFuture;
    context.save();
    context.scale(canvas.width / state.logicalWidth, canvas.height / state.logicalHeight);
    drawer(context, current, station, state);
    context.restore();
  }

  function setPresentation(nextState = {}) {
    if (disposed) return false;
    const next = Object.freeze({
      active: Boolean(nextState.active),
      read: Boolean(nextState.read),
      compact: Boolean(nextState.compact)
    });
    if (next.active === presentation.active && next.read === presentation.read && next.compact === presentation.compact) return false;
    const before = presentationState();
    presentation = next;
    const after = presentationState();
    if (before.width !== after.width || before.height !== after.height) applySize();
    draw();
    return true;
  }

  applySize();
  draw();
  return {
    canvas,
    setActive(value) {
      return setPresentation({ ...presentation, active: Boolean(value) });
    },
    setPresentation,
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