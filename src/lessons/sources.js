import { element } from "../ui/components.js?v=20260829-23";

export function resolveSourceRefs(block = {}, sources = []) {
  const registry = new Map((Array.isArray(sources) ? sources : []).map(source => [source.id, source]));
  const resolved = [];
  const missing = [];
  for (const id of Array.isArray(block.sourceRefs) ? block.sourceRefs : []) {
    const source = registry.get(id);
    if (source) resolved.push(source);
    else missing.push(id);
  }
  return { resolved, missing };
}

function sourceMetadata(source) {
  return [
    source.authors,
    source.year,
    source.type,
    source.accessedAt ? `consultata il ${source.accessedAt}` : null
  ].filter(Boolean).join(" · ");
}

export function renderSourceRefs(block, sources) {
  const { resolved, missing } = resolveSourceRefs(block, sources);
  if (!resolved.length && !missing.length) return null;
  const group = element("aside", { className: "source-references", attrs: { "aria-label": "Fonti dell’affermazione" } });
  resolved.forEach((source, index) => {
    const details = element("details", { className: "source-card" }, [
      element("summary", {}, [
        element("span", { className: "source-marker", text: `[${index + 1}]` }),
        element("span", { text: source.title })
      ]),
      element("div", { className: "source-card-body" }, [
        element("p", { className: "source-meta", text: sourceMetadata(source) }),
        source.evidenceQuality ? element("p", { text: `Qualità/ruolo: ${source.evidenceQuality}` }) : null,
        source.limitations ? element("p", { text: `Limiti: ${source.limitations}` }) : null,
        source.editorialNote ? element("p", { text: source.editorialNote }) : null,
        source.url ? element("a", { href: source.url, text: "Apri la fonte originale ↗", attrs: { target: "_blank", rel: "noreferrer" } }) : null
      ])
    ]);
    group.append(details);
  });
  missing.forEach(id => group.append(element("span", {
    className: "source-missing",
    text: `Fonte da verificare (${id})`,
    attrs: { role: "status" }
  })));
  return group;
}
