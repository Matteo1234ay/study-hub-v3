import { isStudentVisibleLesson } from "../lessons/lesson-model.js?v=20260828-15";

export function studentVisibleLessons(lessons = []) {
  return lessons.filter(isStudentVisibleLesson);
}

export const PATHS = Object.freeze([
  {
    id: "smm",
    code: "SMM",
    title: "Social Media Manager",
    description: "Strategia, contenuti, metriche e decisioni sostenute dai dati.",
    accent: "blue",
    assessmentManifestUrl: "data/path-assessments/smm.json",
    lessons: [{
      id: "SMM-01",
      pathId: "smm",
      title: "Metriche e KPI organici",
      description: "Leggere le performance organiche e trasformarle in decisioni motivate.",
      level: "Fondamenta",
      estimated: "5 ore",
      chapterCount: 4,
      dataUrl: "data/lessons/SMM-01.json",
      assessmentUrl: "data/assessments/SMM-01.json",
      publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRTVVkxYkCN8QwPRqR4Szdmr0mi4zJRCtasHz1Xw8bvF80nop9Y10VuSXhaNwl_UOUBizJUhAIgRo9F/pub"
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
