import { PATHS } from "../config/paths.js?v=20260827-1";
import { buildSearchIndex, searchStudyIndex } from "../study/search-index.js?v=20260827-1";
import { element, pageHeader } from "../ui/components.js?v=20260827-1";

export async function renderSearchView(query = "") {
  const view = element("section", { className: "content-page" }, [pageHeader("Ricerca locale", "Trova un concetto", "La ricerca usa soltanto le lezioni pubbliche già disponibili in Study Hub.")]);
  const form = element("form", { className: "search-form" });
  const input = element("input", { attrs: { type: "search", name: "q", value: query, placeholder: "Es. retention, KPI, reach", "aria-label": "Cerca nelle lezioni" } });
  input.value = query;
  form.append(input, element("button", { className: "button primary", text: "Cerca", attrs: { type: "submit" } }));
  form.addEventListener("submit", event => { event.preventDefault(); location.hash = `#/search?q=${encodeURIComponent(input.value.trim())}`; });
  view.append(form);
  const documents = new Map();
  let unavailable = 0;
  const lessons = PATHS.flatMap(path => path.lessons);
  const settled = await Promise.allSettled(lessons.map(async lesson => {
    const response = await fetch(lesson.dataUrl, { cache: "no-cache" });
    if (!response.ok) throw new Error();
    documents.set(lesson.id, await response.json());
  }));
  unavailable = settled.filter(result => result.status === "rejected").length;
  const results = searchStudyIndex(buildSearchIndex(PATHS, documents), query);
  const region = element("div", { className: "search-results", attrs: { "aria-live": "polite" } });
  if (!query) region.append(element("p", { className: "empty-copy", text: "Scrivi almeno due caratteri per iniziare." }));
  else if (!results.length) region.append(element("p", { className: "empty-copy", text: "Nessun risultato trovato." }));
  else for (const result of results) region.append(element("a", { className: "search-result", href: `#/lessons/${result.lessonId}/${result.chapterId}` }, [
    element("p", { className: "eyebrow", text: `${result.lessonId} · ${result.pathTitle}` }),
    element("h2", { text: result.chapterTitle }), element("p", { text: result.excerpt || result.lessonTitle })
  ]));
  if (unavailable) region.prepend(element("p", { className: "import-status", text: `${unavailable} fonte temporaneamente non disponibile.` }));
  view.append(region);
  return view;
}
