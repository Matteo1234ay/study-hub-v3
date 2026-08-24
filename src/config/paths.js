export const PATHS = Object.freeze([
  {
    id: "smm",
    code: "SMM",
    title: "Social Media Manager",
    description: "Strategia, contenuti, metriche e decisioni sostenute dai dati.",
    accent: "blue",
    lessons: [{
      id: "SMM-01",
      pathId: "smm",
      title: "Metriche e KPI organici",
      description: "Leggere le performance organiche e trasformarle in decisioni motivate.",
      level: "Fondamenta",
      estimated: "5 ore",
      docId: "1A-hkkknz7F4uMnbizJFq53cPu_crfXGLP4Sf42x-O0A"
    }]
  },
  {
    id: "ai",
    code: "AI",
    title: "Intelligenza Artificiale",
    description: "Modelli, strumenti, limiti e uso responsabile dell’intelligenza artificiale.",
    accent: "violet",
    lessons: []
  },
  {
    id: "design",
    code: "DSG",
    title: "Design",
    description: "Progettazione visiva, interfacce e sistemi capaci di orientare l’esperienza.",
    accent: "cyan",
    lessons: []
  },
  {
    id: "video",
    code: "VID",
    title: "Video Making",
    description: "Ideazione, ripresa, montaggio e costruzione di contenuti audiovisivi.",
    accent: "green",
    lessons: []
  }
]);

export function findPath(pathId) {
  return PATHS.find((path) => path.id === pathId) ?? null;
}

export function findLesson(lessonId) {
  return PATHS.flatMap((path) => path.lessons).find((lesson) => lesson.id === lessonId) ?? null;
}
