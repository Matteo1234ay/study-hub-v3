import { PATHS, findLesson } from "../config/paths.js?v=20260827-2";
import { element } from "../ui/components.js?v=20260827-2";
import { createStudyStore } from "../study/study-store.js?v=20260827-2";
import { mountStudyHubWebGL } from "../home/study-hub-webgl.js?v=20260827-7";

function station({className="",eyebrow,title,detail,href,center,span=.08}){
  const children=[
    element("span",{className:"station-eyebrow",text:eyebrow}),
    element("strong",{text:title}),
    detail?element("small",{text:detail}):null,
    href?element("b",{text:"OPEN ↗"}):null
  ].filter(Boolean);
  const tag=href?"a":"div";
  return element(tag,{className:`hub-station ${className}`.trim(),href,attrs:{"data-center":String(center),"data-span":String(span)}},children);
}

export function renderHomeView(){
  const state=createStudyStore().getState();
  const last=state.lastPosition;
  const recent=last?findLesson(last.lessonId):null;
  const continueHref=recent?`#/lessons/${recent.id}${last.chapterId?`/${last.chapterId}`:""}`:"#/lessons/SMM-01";
  const social=PATHS.find(path=>path.id==="social-media-marketing")??PATHS[0];
  const futureCount=PATHS.filter(path=>!path.lessons.length).length;

  const root=element("section",{className:"home-journey webgl-journey",attrs:{"data-motion":"cinematic-room"}});
  const canvas=element("canvas",{className:"study-hub-canvas",attrs:{"aria-label":"Study Hub tridimensionale: una stanza di studio digitale esplorata durante lo scorrimento"}});

  const stations=[
    station({className:"station-establish",eyebrow:"STUDY HUB / V3",title:"IL TUO SPAZIO DI STUDIO",detail:"Scorri: la camera entra nell'hub.",center:.055,span:.09}),
    station({className:"station-desk",eyebrow:"01 / ACTIVE DESK",title:recent?recent.title:"SMM-01",detail:recent?"Riprendi dal punto in cui eri rimasto.":"La prima lezione è pronta.",href:continueHref,center:.315,span:.075}),
    station({className:"station-notes",eyebrow:"02 / NOTES + REVIEW",title:"MEMORIA DI STUDIO",detail:"Note, cronologia e ripasso restano nello stesso sistema.",href:"#/review",center:.44,span:.07}),
    station({className:"station-social",eyebrow:"03 / ACTIVE PATH",title:social.title,detail:`${social.lessons.length} lezione attiva`,href:`#/paths/${social.id}`,center:.565,span:.075}),
    station({className:"station-assessment",eyebrow:"04 / ASSESSMENT",title:"VERIFICA PROGRESSIVA",detail:"La verifica cresce insieme alle lezioni disponibili.",href:`#/paths/${social.id}/assessment`,center:.685,span:.065}),
    station({className:"station-progress",eyebrow:"05 / PROGRESS",title:"COMPETENZE E PROGRESSI",detail:"Il sistema evidenzia cosa hai studiato e cosa consolidare.",href:"#/progress",center:.79,span:.06}),
    station({className:"station-paths",eyebrow:"06 / FUTURE MODULES",title:`${futureCount} NUCLEI IN COSTRUZIONE`,detail:"AI, finanza e altri percorsi restano visibili come moduli dormienti.",href:"#/paths",center:.89,span:.06}),
    station({className:"station-final",eyebrow:"STUDY HUB / SYSTEM VIEW",title:"ENTRA NELL'HUB",detail:"Tutti i percorsi, un unico spazio.",href:"#/paths",center:.975,span:.045})
  ];

  const stage=element("div",{className:"home-stage"},[
    canvas,
    element("div",{className:"stage-noise",attrs:{"aria-hidden":"true"}}),
    element("div",{className:"stage-vignette",attrs:{"aria-hidden":"true"}}),
    element("div",{className:"stage-meta meta-top",text:"STUDY HUB / CINEMATIC KNOWLEDGE SPACE"}),
    element("div",{className:"stage-meta meta-side",text:"SCROLL / CAMERA TOUR / 00—08"}),
    element("div",{className:"hub-stations"},stations),
    element("div",{className:"journey-progress",attrs:{"aria-hidden":"true"}},[
      element("i"),element("span",{className:"journey-label",text:"APPROACH"})
    ])
  ]);
  root.append(stage);

  queueMicrotask(()=>{
    if(matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
    let journey=0,raf=0;
    const stationNodes=[...root.querySelectorAll(".hub-station")];
    const label=root.querySelector(".journey-label");
    const phases=[
      [0,.12,"APPROACH"],[.12,.25,"ENTER"],[.25,.38,"DESK"],[.38,.50,"NOTES"],
      [.50,.63,"PATH"],[.63,.74,"ASSESS"],[.74,.84,"PROGRESS"],[.84,.94,"MODULES"],[.94,1.01,"OVERVIEW"]
    ];
    const update=()=>{
      raf=0;
      const rect=root.getBoundingClientRect();
      const travel=Math.max(1,root.offsetHeight-innerHeight);
      journey=Math.min(1,Math.max(0,-rect.top/travel));
      root.style.setProperty("--journey",journey.toFixed(4));
      stationNodes.forEach(node=>{
        const center=Number(node.dataset.center),span=Number(node.dataset.span)||.07;
        const focus=Math.max(0,1-Math.abs(journey-center)/span);
        node.style.setProperty("--focus",focus.toFixed(3));
        node.classList.toggle("is-active",focus>.62);
      });
      const phase=phases.find(([start,end])=>journey>=start&&journey<end);
      if(label&&phase)label.textContent=phase[2];
    };
    addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});
    update();
    mountStudyHubWebGL(canvas,{getJourney:()=>journey});
  });
  return root;
}
