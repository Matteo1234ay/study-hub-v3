function publicBlockText(block) {
  return Array.isArray(block.items) ? block.items.join("\n") : block.text ?? "";
}

export function buildPublicChapterContext({ lesson, chapter }) {
  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    chapterTitle: chapter.title,
    text: chapter.blocks.map(publicBlockText).filter(Boolean).join("\n")
  };
}
