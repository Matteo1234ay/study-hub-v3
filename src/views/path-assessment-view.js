import { validateAssessment } from "../assessment/assessment-schema.js";
import { scoreAttempt } from "../assessment/assessment-engine.js";
import { buildAssessmentReviewPackage } from "../assessment/review-package.js";
import { includeConfiguredLessons, validatePathAssessment } from "../path-assessment/path-schema.js";
import { buildQuestionPool } from "../path-assessment/question-pool.js";
import { selectPathQuestions } from "../path-assessment/selector.js";
import { progressiveLevel, scoreFinalGate } from "../path-assessment/path-score.js";
import { createPathAssessmentStore } from "../path-assessment/path-store.js";
import { element, pageHeader } from "../ui/components.js";
import { createStudyDialog } from "../ui/study-dialog.js";

function message(path, title, description) {
  return element("section", { className: "content-page" }, [
    pageHeader("Valutazione del percorso", title, description),
    element("a", { className: "button primary", text: "Torna al percorso", href: `#/paths/${path?.id ?? ""}` })
  ]);
}

function control(question, saved, onChange) {
  if (question.type === "open" || question.type === "scenario") {
    const input = element("textarea", { className: "assessment-open-answer", attrs: { rows: "6", placeholder: "Scrivi la tua risposta…", "aria-label": `Risposta: ${question.prompt}` } });
    input.value = saved ?? "";
    input.addEventListener("input", () => onChange(input.value));
    return input;
  }
  const choices = question.type === "boolean"
    ? [{ id: "true", value: true, text: "Vero" }, { id: "false", value: false, text: "Falso" }]
    : question.options.map(option => ({ ...option, value: option.id }));
  const group = element("div", { className: "assessment-options" });
  for (const choice of choices) {
    const input = element("input", { attrs: { type: "radio", name: question.id, value: String(choice.id) } });
    input.checked = saved === choice.value;
    input.addEventListener("change", () => onChange(choice.value));
    group.append(element("label", { className: "assessment-option" }, [input, element("span", { text: choice.text })]));
  }
  return group;
}

function feedback({ path, manifest, assessment, attempt, dialog, mode }) {
  const result = attempt.result;
  const level = progressiveLevel(manifest, result.total.percent);
  const finalGate = mode === "final" ? scoreFinalGate(manifest, result) : null;
  const finalLabels = { excellent: "Livello eccellente", advanced: "Livello avanzato", completed: "Percorso completato", "not-completed": "Percorso da consolidare" };
  const panel = element("section", { className: "assessment-results", attrs: { "aria-live": "polite" } }, [
    element("p", { className: "eyebrow", text: finalGate ? finalLabels[finalGate.level] : level.label }),
    element("h2", { text: `${finalGate ? "Risultato finale" : "Risultato progressivo"}: ${result.total.percent}%` }),
    element("p", { text: finalGate ? (finalGate.passed ? "Hai superato la soglia complessiva e quella delle competenze obbligatorie." : "La soglia complessiva o una competenza obbligatoria richiede ancora ripasso.") : level.description }),
    element("p", { text: "È una diagnosi personale, non una certificazione. Risposte e risultato restano in questo browser." })
  ]);
  const competencyLabels = new Map(manifest.competencies.map(item => [item.id, item.label]));
  const competenceGrid = element("div", { className: "competency-results" });
  for (const competency of manifest.competencies) {
    const percent = result.byCompetency[competency.id]?.percent;
    competenceGrid.append(element("article", { className: "competency-result" }, [
      element("strong", { text: competency.label }),
      element("span", { text: percent === undefined ? "Non valutata" : `${percent}%` })
    ]));
  }
  panel.append(competenceGrid);
  const weakQuestions = assessment.questions.filter(question => (result.questions[question.id]?.score ?? 0) < 1);
  if (weakQuestions.length) {
    panel.append(element("h3", { text: "Ripasso consigliato" }));
    for (const question of weakQuestions) {
      panel.append(element("a", {
        className: "review-target",
        href: `#/lessons/${question.lessonId}/${question.chapterIds[0]}`
      }, [
        element("span", { text: `${question.lessonId} · ${question.prompt}` }),
        element("small", { text: `Competenze: ${(question.competencyIds ?? []).map(id => competencyLabels.get(id) ?? id).join(", ")} →` })
      ]));
    }
  }
  const review = element("button", { className: "button quiet", text: "Verifica il test con ChatGPT", attrs: { type: "button" } });
  review.addEventListener("click", () => dialog.open(buildAssessmentReviewPackage({ assessment, attempt, questionIds: assessment.questions.map(item => item.id) })));
  panel.append(review, element("a", { className: "button primary", text: "Genera una nuova verifica", href: `#/paths/${path.id}/assessment?new=${Date.now()}` }));
  return panel;
}

export async function renderPathAssessmentView({ path, mode = "progressive" }) {
  if (!path?.assessmentManifestUrl) return message(path, "Valutazione non ancora disponibile", "Comparirà quando il percorso avrà lezioni e domande revisionate.");
  let manifest;
  try {
    const response = await fetch(path.assessmentManifestUrl, { cache: "no-cache" });
    manifest = response.ok ? validatePathAssessment(includeConfiguredLessons(await response.json(), path.lessons)) : null;
  } catch { manifest = null; }
  if (!manifest) return message(path, "Valutazione temporaneamente non disponibile", "Non è stato possibile caricare il piano di valutazione.");
  if (mode === "final" && manifest.status !== "complete") {
    return message(path, "Esame finale non ancora disponibile", `Il percorso ${path.title} è ancora in costruzione. Puoi già usare la verifica progressiva sui contenuti pubblicati.`);
  }
  const assessments = (await Promise.all(manifest.lessons.map(async lesson => {
    try {
      const response = await fetch(lesson.assessmentUrl, { cache: "no-cache" });
      return { lessonId: lesson.lessonId, assessment: response.ok ? validateAssessment(await response.json()) : null };
    } catch { return { lessonId: lesson.lessonId, assessment: null }; }
  }))).filter(item => item.assessment);
  const pool = buildQuestionPool({ manifest, assessments });
  if (!pool.questions.length) return message(path, "Nessuna domanda disponibile", "Le domande compariranno dopo la revisione didattica delle lezioni.");
  const store = createPathAssessmentStore();
  const selection = selectPathQuestions({
    manifest,
    pool,
    seed: Date.now(),
    recentQuestionIds: store.getRecentQuestionIds(path.id),
    weakCompetencyIds: store.getAttempts(path.id)[0]?.result?.weakCompetencyIds ?? []
  });
  const questions = selection.questions.map(question => ({ ...question, originalId: question.id, id: question.poolId }));
  const assessment = { lessonId: `${path.code} · percorso progressivo`, version: manifest.version, questions };
  const session = store.createSession({ pathId: path.id, manifestVersion: manifest.version, mode, questionIds: questions.map(item => item.id), coverage: selection.coverage });
  const answers = {};
  const dialog = createStudyDialog({
    kicker: "Condivisione facoltativa",
    title: "Seconda correzione con ChatGPT",
    description: "Controlla il testo prima di copiarlo. Study Hub non invia automaticamente domande, risposte o risultati.",
    ariaLabel: "Test progressivo per la seconda correzione",
    copyLabel: "Copia il test"
  });
  const view = element("section", { className: "content-page assessment-page" }, [
    element("nav", { className: "breadcrumbs", attrs: { "aria-label": "Breadcrumb" } }, [
      element("a", { text: path.title, href: `#/paths/${path.id}` }), element("span", { text: "/" }), element("span", { text: mode === "final" ? "Esame finale" : "Verifica riassuntiva" })
    ]),
    pageHeader("Valutazione del percorso", mode === "final" ? `Esame finale · ${path.title}` : `Verifica riassuntiva · ${path.title}`, `${questions.length} domande rappresentative di tutte le lezioni disponibili. Quando viene aggiunta una nuova lezione con le sue domande, entra automaticamente nelle verifiche successive.`),
    dialog.node
  ]);
  const form = element("form", { className: "assessment-form" });
  questions.forEach((question, index) => form.append(element("fieldset", { className: "assessment-question" }, [
    element("legend", { text: `${index + 1}. ${question.prompt}` }),
    element("p", { className: "question-provenance", text: question.lessonId }),
    control(question, answers[question.id], value => { answers[question.id] = value; store.saveAnswers(session.id, answers); })
  ])));
  form.append(element("button", { className: "button primary", text: "Consegna e valuta", attrs: { type: "submit" } }));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const result = scoreAttempt(assessment, answers);
    const weakCompetencyIds = manifest.competencies.filter(item => (result.byCompetency[item.id]?.percent ?? 0) < manifest.thresholds.progressive.good).map(item => item.id);
    store.saveAnswers(session.id, answers);
    const completed = store.submitSession(session.id, { ...result, weakCompetencyIds });
    const attempt = { ...completed, answers, result };
    form.replaceWith(feedback({ path, manifest, assessment, attempt, dialog, mode }));
  });
  view.append(form);
  return view;
}
