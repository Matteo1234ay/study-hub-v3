export function assessmentReviewDestination() {
  return "https://chatgpt.com/";
}

export function buildAssessmentReviewPackage({ assessment, attempt, questionIds }) {
  const selected = questionIds.map(id => {
    const question = assessment.questions.find(item => item.id === id);
    if (!question) throw new Error(`Domanda sconosciuta: ${id}`);
    return question;
  });
  const sections = selected.map((question, index) => {
    const result = attempt.result?.questions?.[question.id] ?? {};
    const conceptLabels = new Map((question.requiredConcepts ?? []).map(concept => [concept.id, concept.label]));
    const expected = question.modelAnswer ?? (question.options?.find(option => option.id === question.correct)?.text ?? String(question.correct ?? "Non disponibile"));
    return [
      `DOMANDA ${index + 1}`,
      `Domanda: ${question.prompt}`,
      `Risposta dello studente: ${String(attempt.answers?.[question.id] ?? "(nessuna risposta)")}`,
      `Esito automatico Study Hub: ${result.status ?? "non disponibile"}`,
      `Concetti riconosciuti: ${(result.matchedConcepts ?? []).map(id => conceptLabels.get(id) ?? id).join(", ") || "nessuno"}`,
      `Concetti mancanti: ${(result.missingConcepts ?? []).map(id => conceptLabels.get(id) ?? id).join(", ") || "nessuno"}`,
      `Risposta o criterio modello: ${expected}`,
      `Spiegazione della lezione: ${question.explanation}`
    ].join("\n");
  });
  return [
    "Agisci come correttore didattico prudente.",
    "Valuta il significato delle risposte, non la presenza letterale delle stesse parole. Distingui ciò che è corretto, parziale o errato; indica i concetti mancanti e spiega eventuali divergenze dalla correzione automatica. Usa soltanto le informazioni e i criteri forniti: non inventare contenuti della lezione.",
    `Modulo: ${assessment.lessonId}`,
    ...sections,
    "Restituisci per ogni domanda: esito motivato, elementi validi, elementi mancanti e una formulazione migliorata."
  ].join("\n\n");
}
