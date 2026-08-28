import { element } from "../ui/components.js?v=20260828-15";
import { metricVisualizations } from "./metric-visualizations.js?v=20260828-15";
import { causalityVisualization } from "./causality-visualization.js?v=20260828-15";
import { testBuilderVisualization } from "./test-builder.js?v=20260828-15";
import { reportBuilderVisualization } from "./report-builder.js?v=20260828-15";

const definitions = new Map([
  ...metricVisualizations,
  causalityVisualization,
  testBuilderVisualization,
  reportBuilderVisualization
].map(definition => [definition.id, definition]));

export function getVisualizationDefinition(id) {
  return definitions.get(id) ?? null;
}

export function visualizationFallback(block = {}) {
  return {
    id: block.visualizationId ?? "unknown",
    title: "Visualizzazione non disponibile",
    staticSummary: block.staticSummary ?? "Questa visualizzazione non è disponibile. Usa la spiegazione testuale della sezione.",
    steps: []
  };
}

export function initialVisualizationState(stepCount, reducedMotion) {
  return { step: reducedMotion ? Math.max(0, stepCount - 1) : 0, playing: false, reducedMotion };
}

export function nextVisualizationState(state, direction, stepCount) {
  return { ...state, step: Math.max(0, Math.min(stepCount - 1, state.step + direction)), playing: false };
}

export function renderVisualization(block, { reducedMotion = false } = {}) {
  const definition = getVisualizationDefinition(block.visualizationId) ?? visualizationFallback(block);
  let state = initialVisualizationState(definition.steps.length, reducedMotion);
  let timer = null;
  const stage = element("div", { className: `visualization-stage visual-${definition.id}` });
  const position = element("span", { className: "visualization-position" });
  const previous = element("button", { text: "← Indietro", attrs: { type: "button" } });
  const play = element("button", { text: reducedMotion ? "Mostra passaggi" : "Riproduci", attrs: { type: "button" } });
  const next = element("button", { text: "Avanti →", attrs: { type: "button" } });

  function paint() {
    const step = definition.steps[state.step];
    stage.replaceChildren();
    if (!step) {
      stage.append(element("p", { className: "visualization-static", text: definition.staticSummary }));
    } else {
      stage.append(
        element("p", { className: "visualization-step-label", text: step.label }),
        element("div", { className: "visualization-items" }, step.items.map((item, index) => element("span", {
          className: "visualization-item",
          text: item,
          attrs: { style: `--item-index:${index}` }
        }))),
        element("p", { className: "visualization-explanation", text: step.explanation })
      );
    }
    position.textContent = definition.steps.length ? `${state.step + 1} / ${definition.steps.length}` : "Versione statica";
    previous.disabled = state.step <= 0;
    next.disabled = state.step >= definition.steps.length - 1;
    play.textContent = state.playing ? "Pausa" : (state.step >= definition.steps.length - 1 ? "Ripeti" : "Riproduci");
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    state = { ...state, playing: false };
  }

  previous.addEventListener("click", () => { stop(); state = nextVisualizationState(state, -1, definition.steps.length); paint(); });
  next.addEventListener("click", () => { stop(); state = nextVisualizationState(state, 1, definition.steps.length); paint(); });
  play.addEventListener("click", () => {
    if (reducedMotion) { state = { ...state, step: state.step >= definition.steps.length - 1 ? 0 : state.step + 1 }; paint(); return; }
    if (state.playing) { stop(); paint(); return; }
    if (state.step >= definition.steps.length - 1) state = { ...state, step: 0 };
    state = { ...state, playing: true };
    paint();
    timer = setInterval(() => {
      if (state.step >= definition.steps.length - 1) { stop(); paint(); return; }
      state = { ...state, step: state.step + 1 };
      paint();
    }, 1800);
  });

  const node = element("figure", { className: "learning-visualization", attrs: { "data-visualization-id": definition.id } }, [
    element("figcaption", {}, [element("span", { className: "eyebrow", text: "Visualizzazione guidata" }), element("h4", { text: definition.title })]),
    stage,
    element("div", { className: "visualization-controls" }, [previous, play, next, position]),
    element("details", { className: "visualization-transcript" }, [
      element("summary", { text: "Leggi la spiegazione completa" }),
      element("p", { text: definition.staticSummary })
    ])
  ]);
  paint();
  return node;
}
