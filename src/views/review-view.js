import { PATHS } from "../config/paths.js";
import { createStudyStore } from "../study/study-store.js";
import { createProgressStore } from "../progress/local-progress.js";
import { element, pageHeader } from "../ui/components.js";

export async function renderReviewView() {
  const view = element("section", { className: "content-page" }, [pageHeader("Ripasso", "Torna ai concetti importanti", "Capitoli salvati e non ancora completati, senza contenuti generati automaticamente.")]);
  const state = createStudyStore().getState();
  const cards = element("div", { className: "review-grid" });
  for (const lesson of PATHS.flatMap(path => path.lessons)) {
    try {
      const response = await fetch(lesson.dataUrl, { cache: "no-cache" });
      if (!response.ok) continue;
      const model = await response.json();
      const completed = new Set(createProgressStore().get(lesson.id).completed);
      const bookmarked = new Set(state.bookmarks[lesson.id] ?? []);
      for (const chapter of model.chapters.filter(item => bookmarked.has(item.id) || !completed.has(item.id))) {
        cards.append(element("a", { className: "review-card", href: `#/lessons/${lesson.id}/${chapter.id}` }, [
          element("p", { className: "eyebrow", text: bookmarked.has(chapter.id) ? `${lesson.id} · salvato` : `${lesson.id} · da completare` }),
          element("h2", { text: chapter.title })
        ]));
      }
    } catch {}
  }
  if (!cards.childElementCount) cards.append(element("section", { className: "empty-state" }, [element("h2", { text: "Niente da ripassare" }), element("a", { className: "button primary", text: "Esplora i percorsi", href: "#/paths" })]));
  view.append(cards);
  return view;
}
