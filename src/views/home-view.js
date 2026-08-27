import { PATHS, findLesson } from "../config/paths.js?v=20260827-2";
import { element } from "../ui/components.js?v=20260827-2";
import { createStudyStore } from "../study/study-store.js?v=20260827-2";

function decorateHomeMotion(section) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const scene = section.querySelector(".home-scene");
  const title = section.querySelector(".kinetic-title");
  let raf = 0;
  const move = (event) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = (event.clientX / innerWidth - .5) * 2;
      const y = (event.clientY / innerHeight - .5) * 2;
      scene?.style.setProperty("--mx", x.toFixed(3)); scene?.style.setProperty("--my", y.toFixed(3));
      title?.style.setProperty("--tx", x.toFixed(3)); title?.style.setProperty("--ty", y.toFixed(3));
    });
  };
  addEventListener("pointermove", move, { passive:true });
  const onScroll = () => section.style.setProperty("--scroll", Math.min(scrollY / innerHeight, 1.6).toFixed(3));
  addEventListener("scroll", onScroll, { passive:true }); onScroll();
  section.querySelectorAll(".preview-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => { const r=card.getBoundingClientRect(); card.style.setProperty("--rx",`${((event.clientY-r.top)/r.height-.5)*-10}deg`); card.style.setProperty("--ry",`${((event.clientX-r.left)/r.width-.5)*12}deg`); });
    card.addEventListener("pointerleave",()=>{card.style.setProperty("--rx","0deg");card.style.setProperty("--ry","0deg");});
  });
  const observer = new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle("is-visible",e.isIntersecting)),{threshold:.12});
  section.querySelectorAll("[data-reveal]").forEach(n=>observer.observe(n));
}

function scene() {
  return element("div", { className:"home-scene", attrs:{"aria-hidden":"true"}}, [
    element("div",{className:"scene-halo halo-outer"}), element("div",{className:"scene-halo halo-inner"}),
    element("div",{className:"scene-glow glow-a"}), element("div",{className:"scene-glow glow-b"}),
    element("div",{className:"knowledge-object"},[
      element("div",{className:"crystal crystal-a"}),element("div",{className:"crystal crystal-b"}),element("div",{className:"crystal crystal-c"}),element("div",{className:"crystal crystal-d"}),
      element("div",{className:"knowledge-core"},[element("span",{text:"KNOWLEDGE"}),element("strong",{text:"V3"}),element("em",{text:"SYSTEM / ACTIVE"})]),
      element("div",{className:"orbit orbit-a"}),element("div",{className:"orbit orbit-b"}),element("div",{className:"orbit orbit-c"})
    ]),
    element("span",{className:"scene-label label-a",text:"01 / LEARN"}),element("span",{className:"scene-label label-b",text:"02 / APPLY"}),element("span",{className:"scene-label label-c",text:"03 / PROVE"}),
    element("span",{className:"scene-coordinate coord-a",text:"45°04' N"}),element("span",{className:"scene-coordinate coord-b",text:"SYSTEM 03.1"})
  ]);
}

export function renderHomeView() {
  const last=createStudyStore().getState().lastPosition; const recent=last?findLesson(last.lessonId):null;
  const continueHref=recent?`#/lessons/${recent.id}${last.chapterId?`/${last.chapterId}`:""}`:"#/lessons/SMM-01";
  const root=element("section",{className:"home-view immersive-home igloo-home"});
  const hero=element("section",{className:"hero hero-immersive"},[
    element("div",{className:"hero-noise",attrs:{"aria-hidden":"true"}}), scene(),
    element("div",{className:"hero-copy",attrs:{"data-reveal":""}},[
      element("div",{className:"hero-kicker-row"},[element("p",{className:"eyebrow hero-kicker",text:"STUDY HUB / PERSONAL KNOWLEDGE ENGINE"}),element("span",{text:"V3.0 · 2026"})]),
      element("h1",{className:"hero-title kinetic-title"},[element("span",{text:"CAPISCI."}),element("span",{text:"APPLICA."}),element("span",{className:"title-accent",text:"DIMOSTRA."})]),
      element("div",{className:"hero-bottom"},[
        element("p",{className:"hero-lead",text:"Un sistema vivo per trasformare ciò che leggi in qualcosa che sai spiegare, applicare e dimostrare."}),
        element("div",{className:"hero-actions"},[element("a",{className:"button primary magnetic",text:"ESPLORA ↗",href:"#/paths"}),element("a",{className:"button quiet",text:recent?`CONTINUA ${recent.id}`:"CONTINUA SMM-01",href:continueHref})])
      ]),
      element("div",{className:"hero-status"},[element("span",{className:"status-dot"}),element("span",{text:"KNOWLEDGE ENGINE ONLINE"})])
    ]),
    element("div",{className:"edge-copy edge-left",text:"LEARN / CONNECT / RETRIEVE / APPLY"}),
    element("a",{className:"scroll-cue",href:"#home-paths",attrs:{"aria-label":"Scorri ai percorsi"}},[element("span",{text:"ENTER SYSTEM"}),element("i")])
  ]);
  const cards=element("div",{className:"path-preview cinematic-grid"},PATHS.map((p,i)=>element("a",{className:`preview-card accent-${p.accent}`,href:`#/paths/${p.id}`,attrs:{"data-reveal":""}},[
    element("div",{className:"card-sheen"}),element("div",{className:"card-atmosphere"}),
    element("div",{className:"card-top"},[element("span",{className:"card-code",text:p.code}),element("span",{className:"card-index",text:String(i+1).padStart(2,"0")})]),
    element("div",{className:"card-center"},[element("span",{className:"card-mini-label",text:"LEARNING DOMAIN"}),element("h2",{text:p.title}),element("p",{text:p.description})]),
    element("div",{className:"card-footer"},[element("span",{className:"card-meta",text:p.lessons.length?`${p.lessons.length} LEZIONE ATTIVA`:"IN PREPARAZIONE"}),element("span",{className:"card-arrow",text:"↗"})])
  ])));
  root.append(hero,element("div",{className:"marquee",attrs:{"aria-hidden":"true"}},[element("div",{text:"KNOWLEDGE → PRACTICE → COMPETENCE → RETRIEVAL → KNOWLEDGE → PRACTICE → COMPETENCE → RETRIEVAL →"})]),element("section",{className:"home-paths",attrs:{id:"home-paths"}},[
    element("div",{className:"section-number",text:"02 / PATHS"}),
    element("div",{className:"section-heading split-heading",attrs:{"data-reveal":""}},[element("div",{},[element("p",{className:"eyebrow",text:"ENTER THE SYSTEM"}),element("h2",{text:"NON STUDIARE DI PIÙ. COSTRUISCI CONNESSIONI."})]),element("p",{className:"section-manifesto",text:"Ogni percorso è una sequenza di comprensione, recupero attivo, applicazione e verifica. La home non è un archivio: è l'ingresso nel sistema."})]),cards
  ]));
  queueMicrotask(()=>decorateHomeMotion(root)); return root;
}
