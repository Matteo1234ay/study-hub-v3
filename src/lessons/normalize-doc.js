const STYLE_TO_KIND = Object.freeze({
  TITLE: "title",
  HEADING_1: "heading-1",
  HEADING_2: "heading-2",
  HEADING_3: "heading-3"
});

function paragraphText(paragraph) {
  return (paragraph.elements ?? [])
    .map((element) => element.textRun?.content ?? "")
    .join("")
    .replace(/\n+$/g, "")
    .trim();
}

function isOrderedList(document, listId) {
  const nesting = document.lists?.[listId]?.listProperties?.nestingLevels?.[0];
  return Boolean(nesting?.glyphType);
}

export function normalizeDocument(document) {
  const blocks = [];
  let openList = null;

  const flushList = () => {
    if (openList) blocks.push(openList);
    openList = null;
  };

  for (const structuralElement of document.body?.content ?? []) {
    const paragraph = structuralElement.paragraph;
    if (!paragraph) continue;
    const text = paragraphText(paragraph);
    if (!text) continue;

    if (paragraph.bullet?.listId) {
      const listId = paragraph.bullet.listId;
      if (!openList || openList.listId !== listId) {
        flushList();
        openList = {
          kind: "list",
          ordered: isOrderedList(document, listId),
          items: [],
          listId
        };
      }
      openList.items.push(text);
      continue;
    }

    flushList();
    const namedStyle = paragraph.paragraphStyle?.namedStyleType;
    blocks.push({ kind: STYLE_TO_KIND[namedStyle] ?? "paragraph", text });
  }
  flushList();
  return blocks.map(({ listId, ...block }) => block);
}
