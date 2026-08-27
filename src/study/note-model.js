function optionalId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeNote(value) {
  if (!value || typeof value !== "object") return null;
  const id = optionalId(value.id);
  const lessonId = optionalId(value.lessonId);
  const chapterId = optionalId(value.chapterId);
  const text = typeof value.text === "string" ? value.text.trim() : "";
  if (!id || !lessonId || !chapterId || !text) return null;
  return {
    id,
    lessonId,
    chapterId,
    sectionId: optionalId(value.sectionId),
    text,
    conceptId: optionalId(value.conceptId),
    sourceId: optionalId(value.sourceId),
    blockId: optionalId(value.blockId),
    createdAt: Number.isFinite(value.createdAt) ? value.createdAt : 0,
    updatedAt: Number.isFinite(value.updatedAt) ? value.updatedAt : 0
  };
}

export function createNote(input, now = Date.now, idFactory = () => crypto.randomUUID()) {
  const timestamp = now();
  return normalizeNote({
    ...input,
    id: input.id ?? idFactory(),
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp
  });
}
