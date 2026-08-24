export function progressiveLevel(manifest, percent) {
  const thresholds = manifest.thresholds.progressive;
  const lastLesson = manifest.lessons.at(-1)?.lessonId ?? "i contenuti disponibili";
  const suffix = `Valutazione riferita ai contenuti pubblicati fino a ${lastLesson}.`;
  if (percent >= thresholds.solid) return { id: "solid", label: "Padronanza solida", description: suffix };
  if (percent >= thresholds.good) return { id: "good", label: "Buona padronanza", description: suffix };
  if (percent >= thresholds.partial) return { id: "partial", label: "Padronanza parziale", description: suffix };
  return { id: "consolidate", label: "Da consolidare", description: suffix };
}

export function scoreFinalGate(manifest, result) {
  if (manifest.status !== "complete") return { unlocked: false, passed: false, level: "locked" };
  const mandatoryOk = manifest.competencies.filter(item => item.mandatory)
    .every(item => (result.byCompetency?.[item.id]?.percent ?? 0) >= manifest.thresholds.final.mandatoryMin);
  const passed = (result.total?.percent ?? 0) >= manifest.thresholds.final.pass && mandatoryOk;
  const percent = result.total?.percent ?? 0;
  const level = !passed ? "not-completed" : percent >= 90 ? "excellent" : percent >= 82 ? "advanced" : "completed";
  return { unlocked: true, passed, level };
}
