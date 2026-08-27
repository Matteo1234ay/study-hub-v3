function normalize(text) {
  return String(text ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}
function blockText(block) { return Array.isArray(block.items) ? block.items.join(" ") : block.text ?? ""; }
function chapterSections(chapter) {
  return Array.isArray(chapter.sections) && chapter.sections.length ? chapter.sections : [{ id: chapter.id, title: chapter.title, blocks: chapter.blocks || [] }];
}
export function buildSearchIndex(catalog, lessonDocuments) {
  const index = [];
  for (const path of catalog) for (const lesson of path.lessons) {
    const document = lessonDocuments.get(lesson.id);
    for (const chapter of document?.chapters ?? []) for (const section of chapterSections(chapter)) {
      const text = (section.blocks || []).map(blockText).join(" ").replace(/\s+/g, " ").trim();
      index.push({
        pathId: path.id, pathTitle: path.title, lessonId: lesson.id, lessonTitle: lesson.title,
        chapterId: chapter.id, chapterTitle: chapter.title, sectionId: section.id, sectionTitle: section.title,
        excerpt: text.slice(0, 180), normalizedTitle: normalize(`${lesson.title} ${chapter.title} ${section.title}`), normalizedText: normalize(text)
      });
    }
  }
  return index;
}
export function searchStudyIndex(index, query, limit = 20) {
  const words = normalize(query).split(/\s+/).filter(word => word.length > 1);
  if (!words.length) return [];
  return index.map(item => {
    if (!words.every(word => item.normalizedTitle.includes(word) || item.normalizedText.includes(word))) return null;
    const score = words.reduce((total, word) => total + (item.normalizedTitle.includes(word) ? 10 : 1), 0);
    return { ...item, score };
  }).filter(Boolean).sort((a, b) => b.score - a.score || (a.sectionTitle || a.chapterTitle).localeCompare(b.sectionTitle || b.chapterTitle)).slice(0, limit);
}
