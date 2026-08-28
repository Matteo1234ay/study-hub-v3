import { element } from "../ui/components.js?v=20260828-15";

function validOptions(options) {
  return Array.isArray(options) && options.length >= 2 && options.some(option => option?.correct === true)
    && options.every(option => option?.id && option?.text && typeof option.feedback === "string");
}

export function validateMicroQuestion(question = {}) {
  return question.type === "micro-question" && Boolean(question.id && question.concept && question.prompt)
    && validOptions(question.options);
}

export function evaluateMicroQuestion(question, optionId, attempt = 1) {
  const options = attempt > 1 && validOptions(question.retryOptions) ? question.retryOptions : question.options;
  const option = options.find(candidate => candidate.id === optionId);
  if (!option) return { correct: false, canRetry: false, feedback: "Seleziona una risposta prima di continuare." };
  return { correct: option.correct === true, canRetry: option.correct !== true && attempt === 1 && validOptions(question.retryOptions), feedback: option.feedback };
}

export function renderMicroQuestion(question, { lessonId, chapterId, onReview = () => {}, onConsolidate = () => {} } = {}) {
  if (!validateMicroQuestion(question)) return null;
  const root = element("section", { className: "micro-question", attrs: { "data-question-id": question.id } });
  let attempt = 1;

  function paint() {
    const options = attempt > 1 && validOptions(question.retryOptions) ? question.retryOptions : question.options;
    const fieldset = element("fieldset", {}, [
      element("legend", { text: attempt > 1 ? question.retryPrompt : question.prompt })
    ]);
    options.forEach(option => {
      const input = element("input", { attrs: { type: "radio", name: `micro-${question.id}`, value: option.id } });
      fieldset.append(element("label", { className: "micro-option" }, [input, element("span", { text: option.text })]));
    });
    const feedback = element("div", { className: "micro-feedback", attrs: { "aria-live": "polite" } });
    const submit = element("button", { className: "button primary", text: "Controlla risposta", attrs: { type: "button" } });
    submit.addEventListener("click", () => {
      const selected = fieldset.querySelector("input:checked")?.value;
      const result = evaluateMicroQuestion(question, selected, attempt);
      feedback.textContent = result.feedback;
      feedback.className = `micro-feedback ${result.correct ? "is-correct" : "is-review"}`;
      if (result.correct) {
        onConsolidate(lessonId, question);
        submit.disabled = true;
      } else if (selected) {
        onReview(lessonId, { ...question, chapterId });
        if (result.canRetry) {
          submit.disabled = true;
          const retry = element("button", { className: "button quiet", text: "Prova con una domanda riformulata", attrs: { type: "button" } });
          retry.addEventListener("click", () => { attempt = 2; paint(); });
          feedback.after(retry);
        }
      }
    });
    root.replaceChildren(
      element("p", { className: "eyebrow", text: "Fermati e recupera" }),
      fieldset, submit, feedback,
      element("small", { text: "Puoi proseguire anche se sbagli: il concetto verrà riproposto nel ripasso." })
    );
  }
  paint();
  return root;
}
