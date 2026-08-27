import { PATHS, findLesson } from "../config/paths.js?v=20260827-2";
import { element } from "../ui/components.js?v=20260827-2";
import { createStudyStore } from "../study/study-store.js?v=20260827-2";
import { mountStudyHubWebGL } from "../home/study-hub-webgl.js?v=20260827-6";

function node(path,index){return element("a",{className:`hub-label hub-label-${index+1}`,href:`#/paths/${path.id}`},[element("span",{text:String(index+1).padStart(2,"0")}),element("b",{text:path.title}),element("small",{text:path.lessons.length?`${path.lessons.length} LEZIONE ATTIVA`:"IN COSTRUZIONE"})]);}

export function renderHomeView(){
  const last=createStudyStore().getState().lastPosition;const recent=last?findLesson(last.lessonId):null;const continueHref=recent?`#/lessons/${recent.id}${last.chapterId?`/${last.chapterId}`:""}`:"#/lessons/SMM-01";
  const root=element("section",{className:"home-journey webgl-journey"});
  const canvas=element("canvas",{className:"study-hub-canvas",attrs:{"aria-label":"Visualizzazione tridimensionale interattiva dello Study Hub"}});
  const stage=element("div",{className:"home-stage"},[
    canvas,
    element("div",{className:"stage-noise",attrs:{"aria-hidden":"true"}}),
    element("div",{className:"stage-meta meta-top",text:"STUDY HUB / LIVE KNOWLEDGE SYSTEM"}),
    element("div",{className:"stage-meta meta-side",text:"SCROLL / OPEN THE HUB / 00—05"}),
    element("div",{className:"hub-intro"},[element("span",{text:"YOUR STUDY HUB"}),element("h1",{text:"V3"}),element("p",{text:"Scorri per aprire il sistema."})]),
    element("div",{className:"hub-labels"},PATHS.map(node)),
    element("div",{className:"hub-details"},[
      element("div",{className:"detail detail-progress"},[element("span",{text:"PROGRESS"}),element("b",{text:"LOCAL / LIVE"})]),
      element("div",{className:"detail detail-review"},[element("span",{text:"RETRIEVAL"}),element("b",{text:"REVIEW ENGINE"})]),
      element("div",{className:"detail detail-memory"},[element("span",{text:"MEMORY"}),element("b",{text:"NOTES + HISTORY"})])
    ]),
    element("a",{className:"hub-enter",href:continueHref,text:recent?`CONTINUA ${recent.id} ↗`:"ENTRA IN SMM-01 ↗"}),
    element("div",{className:"journey-progress",attrs:{"aria-hidden":"true"}},[element("i"),element("span",{text:"OPEN HUB"})])
  ]);
  root.append(stage);
  queueMicrotask(()=>{
    if(matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
    let journey=0,raf=0;
    const update=()=>{raf=0;const rect=root.getBoundingClientRect(),travel=Math.max(1,root.offsetHeight-innerHeight);journey=Math.min(1,Math.max(0,-rect.top/travel));root.style.setProperty("--journey",journey.toFixed(4));};
    addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});update();
    mountStudyHubWebGL(canvas,{getJourney:()=>journey});
  });
  return root;
}
