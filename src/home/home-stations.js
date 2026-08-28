const STATIC_STATIONS = Object.freeze({
  memory: Object.freeze({
    id: "memory",
    label: "02 / Note e ripasso",
    title: "Memoria di studio",
    description: "Appunti, concetti salvati e argomenti da consolidare.",
    href: "#/review",
    objectId: "memory-board",
    status: "active",
    screenKind: "memory"
  }),
  progress: Object.freeze({
    id: "progress",
    label: "05 / Progressi",
    title: "Competenze e avanzamento",
    description: "Lezioni completate, competenze forti e aree da consolidare.",
    href: "#/progress",
    objectId: "progress-display",
    status: "active",
    screenKind: "progress"
  })
});

function safeLessonPath(lesson, chapterId = null) {
  if (!lesson?.id) return "#/lessons/SMM-01";
  const chapter = typeof chapterId === "string" && chapterId.trim()
    ? `/${chapterId.trim()}`
    : "";
  return `#/lessons/${lesson.id}${chapter}`;
}

function findPrimaryPath(paths) {
  return paths.find(path => Array.isArray(path.lessons) && path.lessons.length) ?? paths[0] ?? null;
}

export function createHomeStations({
  paths = [],
  lastPosition = null,
  findLessonById = () => null,
  screenState = {}
} = {}) {
  const primaryPath = findPrimaryPath(paths);
  const fallbackLesson = primaryPath?.lessons?.[0] ?? null;
  const recentLesson = lastPosition?.lessonId
    ? findLessonById(lastPosition.lessonId)
    : null;
  const activeLesson = recentLesson ?? fallbackLesson;
  const chapterId = recentLesson ? lastPosition?.chapterId : null;
  const continuation = safeLessonPath(activeLesson, chapterId);
  const futureCount = paths.filter(path => !Array.isArray(path.lessons) || path.lessons.length === 0).length;
  const pathId = primaryPath?.id ?? "smm";
  const pathTitle = primaryPath?.title ?? "Social Media Manager";

  return [
    {
      id: "desk",
      label: "01 / Lezione attiva",
      title: activeLesson?.title ?? "Metriche e KPI organici",
      description: recentLesson
        ? "Riprendi dal capitolo e dal punto in cui avevi interrotto."
        : "Apri la prima lezione e inizia il percorso.",
      href: continuation,
      objectId: "main-monitor",
      status: "active",
      screenKind: "lesson",
      meta: activeLesson?.id ?? "SMM-01",
      screenData: {
        lessonId: activeLesson?.id ?? "SMM-01",
        chapter: screenState.chapter ?? activeLesson?.title ?? "Lezione introduttiva",
        completion: screenState.completion ?? 0,
        completedChapters: screenState.completedChapters ?? 0
      }
    },
    {
      ...STATIC_STATIONS.memory,
      screenData: { noteCount: screenState.noteCount ?? 0, reviewCount: screenState.reviewCount ?? 0 }
    },
    {
      id: "social",
      label: "03 / Percorso attivo",
      title: pathTitle,
      description: "Contenuti, metriche e lettura strategica delle performance.",
      href: `#/paths/${pathId}`,
      objectId: "social-display",
      status: "active",
      screenKind: "social",
      meta: `${primaryPath?.lessons?.length ?? 0} lezione disponibile`,
      screenData: { pathTitle, lessonCount: primaryPath?.lessons?.length ?? 0 }
    },
    {
      id: "assessment",
      label: "04 / Verifica",
      title: "Verifica progressiva",
      description: "Domande, feedback e avanzamento della valutazione.",
      href: `#/paths/${pathId}/assessment`,
      objectId: "assessment-console",
      status: primaryPath?.assessmentManifestUrl ? "active" : "standby",
      screenKind: "assessment",
      screenData: { assessmentAvailable: Boolean(primaryPath?.assessmentManifestUrl) }
    },
    {
      ...STATIC_STATIONS.progress,
      screenData: {
        completion: screenState.completion ?? 0,
        completedChapters: screenState.completedChapters ?? 0,
        totalChapters: activeLesson?.chapterCount ?? 0,
        reviewCount: screenState.reviewCount ?? 0
      }
    },
    {
      id: "future-paths",
      label: "06 / Percorsi futuri",
      title: "Archivio dei prossimi percorsi",
      description: "Moduli già previsti nella struttura, ancora in preparazione.",
      href: "#/paths",
      objectId: "future-archive",
      status: "standby",
      screenKind: "future",
      meta: `${futureCount} ${futureCount === 1 ? "percorso" : "percorsi"} in preparazione`
    }
  ];
}

export function createHomeQuickActions(stations = []) {
  const continuation = stations.find(station => station.id === "desk")?.href ?? "#/lessons/SMM-01";
  return [
    { id: "lesson", label: "Continua", href: continuation },
    { id: "paths", label: "Percorsi", href: "#/paths" },
    { id: "search", label: "Cerca", href: "#/search" },
    { id: "review", label: "Ripasso", href: "#/review" },
    { id: "progress", label: "Progressi", href: "#/progress" }
  ];
}
