import { validateAssessment } from "../assessment/assessment-schema.js?v=20260829-23";
import { scoreAttempt } from "../assessment/assessment-engine.js?v=20260829-23";
import { createAssessmentStore } from "../assessment/assessment-store.js?v=20260829-23";
import { element, pageHeader } from "../ui/components.js?v=20260829-23";
import { buildAssessmentReviewPackage } from "../assessment/review-package.js?v=20260829-23";
import { createStudyDialog } from "../ui/study-dialog.js?v=20260829-23";

const STATUS_LABELS = { correct: "Corretta", partial: "Parzialmente corretta", review: "Da rivedere", unanswered: "Non compilata" };

function unavailable(message = "Valutazione non ancora disponibile") {
  return element("section", { className: "content-page" }, [
    pageHeader("Esercitazione", message, "La lezione resta disponibile. Le domande compariranno solo dopo una revisione didattica."),
    element("a", { className: "button primary", text: "Torna alla lezione", href: "#/paths" })
  ]);
}

function answerControl(question, saved, onChange) {
  if (question.type === "open" || question.type === "scenario") {
    const input = element("textarea", { className: "assessment-open-answer", attrs: { rows: "6", "aria-label": `Risposta: ${question.prompt}`, placeholder: "Scrivi la tua risposta…" } });
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

function renderFeedback(assessment, attempt, lesson, chapterId, onReview) {
  const result = attempt.result;
  const panel = element("section", { className: "assessment-results", attrs: { "aria-live": "polite" } });
  const heading = element("h2", { text: `Risultato: ${result.total.percent}%`, attrs: { tabindex: "-1" } });
  panel.append(
    element("p", { className: "eyebrow", text: result.total.percent >= 80 ? "Comprensione solida" : result.total.percent >= 60 ? "Ripasso consigliato" : "Da rivedere" }),
    heading,
    element("p", { text: `${result.total.earned} punti su ${result.total.max}. Le risposte restano solo su questo dispositivo.` })
  );
  for (const question of assessment.questions) {
    const scored = result.questions[question.id];
    const card = element("article", { className: `assessment-feedback status-${scored.status}` }, [
      element("p", { className: "eyebrow", text: STATUS_LABELS[scored.status] ?? "Esito" }),
      element("h3", { text: question.prompt }),
      element("p", { text: question.explanation })
    ]);
    if (question.requiredConcepts) {
      const labels = new Map(question.requiredConcepts.map(concept => [concept.id, concept.label]));
      if (scored.matchedConcepts.length) card.append(element("p", { text: `Concetti riconosciuti: ${scored.matchedConcepts.map(id => labels.get(id)).join(", ")}.` }));
      if (scored.missingConcepts.length) card.append(element("p", { text: `Concetti mancanti: ${scored.missingConcepts.map(id => labels.get(id)).join(", ")}.` }));
      card.append(element("details", {}, [element("summary", { text: "Mostra risposta modello" }), element("p", { text: question.modelAnswer })]));
      const aiReview = element("button", { className: "button quiet", text: "Verifica questa risposta con ChatGPT", attrs: { type: "button" } });
      aiReview.addEventListener("click", () => onReview([question.id]));
      card.append(aiReview);
    }
    const reviewChapter = question.chapterIds[0];
    card.append(element("a", { className: "button quiet", text: "Ripassa il capitolo", href: `#/lessons/${lesson.id}/${reviewChapter}` }));
    panel.append(card);
  }
  const reviewAll = element("button", { className: "button quiet", text: "Verifica il test con ChatGPT", attrs: { type: "button" } });
  reviewAll.addEventListener("click", () => onReview(assessment.questions.map(question => question.id)));
  panel.append(reviewAll, element("a", { className: "button primary", text: chapterId ? "Riprova il capitolo" : "Riprova il modulo", href: chapterId ? `#/lessons/${lesson.id}/assessment/${chapterId}` : `#/lessons/${lesson.id}/assessment` }));
  requestAnimationFrame(() => heading.focus({ preventScroll: true }));
  return panel;
}

export async function renderAssessmentView({ lesson, chapterId = null }) {
  if (!lesson?.assessmentUrl) return unavailable();
  let assessment;
  try {
    const response = await fetch(lesson.assessmentUrl, { cache: "no-cache" });
    assessment = response.ok ? validateAssessment(await response.json()) : null;
  } catch {
    assessment = null;
  }
  if (!assessment) return unavailable("Valutazione temporaneamente non disponibile");
  const questions = chapterId ? assessment.questions.filter(question => question.chapterIds.includes(chapterId)) : assessment.questions;
  if (!questions.length) return unavailable();
  const scoped = { ...assessment, questions };
  const store = createAssessmentStore();
  const reviewDialog = createStudyDialog({
    kicker: "Condivisione facoltativa",
    title: "Seconda correzione con ChatGPT",
    description: "Controlla tutto il testo. Nessuna risposta viene inviata automaticamente: copiala soltanto se vuoi condividerla in una nuova chat.",
    ariaLabel: "Testo per la seconda correzione",
    copyLabel: "Copia il test selezionato"
  });
  const scopeId = chapterId ? `${lesson.id}:${chapterId}` : lesson.id;
  const saved = store.getDraft(scopeId, assessment.version)?.answers ?? {};
  const answers = { ...saved };
  const view = element("section", { className: "content-page assessment-page" }, [
    element("nav", { className: "breadcrumbs", attrs: { "aria-label": "Breadcrumb" } }, [
      element("a", { text: lesson.id, href: `#/lessons/${lesson.id}` }), element("span", { text: "/" }), element("span", { text: chapterId ? "Esercizio capitolo" : "Valutazione" })
    ]),
    pageHeader("Valutazione locale", chapterId ? "Esercitati sul capitolo" : `Valutazione completa · ${lesson.id}`, `${questions.length} domande. Correzione e salvataggio avvengono soltanto in questo browser.`)
  ]);
  view.append(reviewDialog.node);
  const form = element("form", { className: "assessment-form" });
  questions.forEach((question, index) => {
    const card = element("fieldset", { className: "assessment-question" }, [
      element("legend", { text: `${index + 1}. ${question.prompt}` }),
      answerControl(question, answers[question.id], value => {
        answers[question.id] = value;
        store.saveDraft(scopeId, assessment.version, answers);
      })
    ]);
    form.append(card);
  });
  const submit = element("button", { className: "button primary", text: "Consegna e correggi", attrs: { type: "submit" } });
  form.append(submit);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const result = scoreAttempt(scoped, answers);
    const attempt = store.recordAttempt({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      lessonId: lesson.id,
      scopeId,
      chapterId,
      version: assessment.version,
      answers,
      result
    });
    store.clearDraft(scopeId, assessment.version);
    form.replaceWith(renderFeedback(scoped, attempt, lesson, chapterId, questionIds => {
      reviewDialog.open(buildAssessmentReviewPackage({ assessment: scoped, attempt, questionIds }));
    }));
  });
  view.append(form);
  return view;
}
