import { PATHS, findLesson } from "../config/paths.js?v=20260906-33";
import { element } from "../ui/components.js?v=20260906-33";
import { createStudyStore } from "../study/study-store.js?v=20260906-33";
import { createProgressStore } from "../progress/local-progress.js?v=20260906-33";
import { createNotesStore } from "../study/notes-store.js?v=20260906-33";
import { createReviewConceptsStore } from "../study/review-concepts-store.js?v=20260906-33";
import {
  createHomeQuickActions,
  createHomeStations
} from "../home/home-stations.js?v=20260906-33";
import { mountHomeExperience } from "../home/home-experience.js?v=20260908-42";

function sectionPreview(station) {
  const data=station.screenData ?? {};
  const entries={
    desk: [['Capitolo',data.chapter ?? 'Lezione introduttiva'],['Completamento',`${data.completion ?? 0}%`]],
    memory: [['Note salvate',String(data.noteCount ?? 0)],['Concetti da ripassare',String(data.reviewCount ?? 0)]],
    social: [['Percorso',data.pathTitle ?? 'Social Media Manager'],['Lezioni disponibili',String(data.lessonCount ?? 0)]],
    assessment: [['01','Rispondi'],['02','Confronta il feedback'],['03','Consolida']],
    progress: [['Capitoli completati',String(data.completedChapters ?? 0)],['Avanzamento',`${data.completion ?? 0}%`]],
    'future-paths': [['01','Esplora i percorsi'],['02','Scegli cosa imparare']]
  };
  return element('span',{className:'showcase-preview'},(entries[station.id] ?? []).map(([label,value])=>
    element('span',{className:'showcase-preview-row'},[
      element('span',{text:label}),element('span',{text:value})
    ])
  ));
}

function stationCaption(station, index) {
  return element("a", {
    className: "home-station-caption",
    href: station.href,
    attrs: {
      "data-station-id": station.id,
      "data-station-index": String(index),
      "data-station-status": station.status
    }
  }, [
    element("span", { className: "home-station-label", text: station.label }),
    element("strong", { text: station.title }),
    element("small", { text: station.description }),
    sectionPreview(station),
    station.meta ? element("span", { className: "home-station-meta", text: station.meta }) : null,
    element("b", { text: station.status === "standby" ? "Esplora la struttura →" : "Apri →" })
  ]);
}

function quickNavigation(actions) {
  return element("nav", {
    className: "home-quick-actions",
    attrs: { "aria-label": "Accesso rapido" }
  }, actions.map(action => element("a", {
    className: action.id === "lesson" ? "is-primary" : "",
    href: action.href,
    text: action.label,
    attrs: { "data-quick-action": action.id }
  })));
}

export function renderHomeView({ mountExperience = mountHomeExperience, navigate } = {}) {
  const state = createStudyStore().getState();
  const activeLesson = findLesson(state.lastPosition?.lessonId) ?? PATHS.flatMap(path => path.lessons)[0];
  const progress = createProgressStore().get(activeLesson?.id);
  const totalChapters = activeLesson?.chapterCount ?? 0;
  const completedChapters = progress.completed.length;
  const stations = createHomeStations({
    paths: PATHS,
    lastPosition: state.lastPosition,
    findLessonById: findLesson,
    screenState: {
      chapter: state.lastPosition?.chapterId ?? activeLesson?.title,
      completedChapters,
      completion: totalChapters ? Math.round(completedChapters / totalChapters * 100) : 0,
      noteCount: createNotesStore().list({ lessonId: activeLesson?.id }).length,
      reviewCount: createReviewConceptsStore().list().filter(item => item.lessonId === activeLesson?.id).length
    }
  });
  const actions = createHomeQuickActions(stations);
  const root = element("section", {
    className: "home-journey",
    attrs: {
      "data-home-state": "loading",
      "data-home-renderer": "poster",
      "data-motion": "object-showcase"
    }
  });
  const poster = element("img", {
    className: "home-v30-poster",
    attrs: {
      src: "assets/3d/home-v30/home-v30-poster.webp",
      alt: "",
      "aria-hidden": "true",
      decoding: "async",
      fetchpriority: "high"
    }
  });
  const canvas = element("canvas", {
    className: "study-room-canvas",
    attrs: { "aria-hidden": "true" }
  });
  const preload = element("div", {
    className: "home-preload",
    attrs: {
      "aria-live": "polite",
      "aria-label": "Preparazione Study Hub"
    }
  }, [
    element("span", { className: "home-preload-mark", text: "Preparazione dello spazio…" }),
    element("span", { className: "home-preload-line", attrs: { "aria-hidden": "true" } })
  ]);
  const fallback = element("div", { className: "home-fallback" }, [
    element("p", { className: "home-kicker", text: "Study Hub · Brainframe" }),
    element("h1", { text: "Fai spazio alla conoscenza." }),
    element("p", {
      text: "Lezioni, note, verifiche e progressi: scegli da dove continuare."
    }),
    element("a", {
      className: "button primary",
      href: stations[0].href,
      text: "Continua a studiare"
    })
  ]);
  const captions = element(
    "div",
    { className: "home-captions" },
    stations.map(stationCaption)
  );
  const stage = element("div", { className: "home-stage" }, [
    poster,
    element("header", { className: "home-masthead" }, [
      element("a", { className: "brand", href: "#/home", text: "Study Hub /" }),
      element("a", { href: "#/paths", text: "Entra nei percorsi ↗" })
    ]),
    element("div", { className: "home-intro" }, [
      element("p", { className: "eyebrow", text: "Brainframe · Il tuo spazio di studio" }),
      element("h1", { text: "Dai forma a ciò che impari." }),
      element("p", { text: "Scorri per esplorare. Ogni oggetto, un modo di imparare." })
    ]),
    canvas,
    preload,
    element("div", { className: "home-stage-shade", attrs: { "aria-hidden": "true" } }),
    fallback,
    quickNavigation(actions),
    captions,
    element("div", { className: "home-progress", attrs: { "aria-hidden": "true" } }, [
      element("progress", { attrs: { max: "100", value: "0" } }),
      element("span", { text: "Studio" })
    ])
  ]);

  root.append(stage);
  queueMicrotask(async () => {
    if (!root.isConnected) return;
    try {
      await mountExperience(root, { stations, navigate });
    } catch (error) {
      root.dataset.homeState = "dom";
      root.dataset.homeRenderer = "poster";
      root.dataset.homeRendererError = "load";
      console.warn("La scena V30 non è disponibile; uso la homepage accessibile.", error);
    }
  });
  return root;
}
