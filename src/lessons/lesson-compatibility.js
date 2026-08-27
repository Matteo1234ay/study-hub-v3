export const LEGACY_CHAPTER_MAP = Object.freeze({
  "obiettivo-del-modulo": "misurare-cio-che-conta",
  "1-metrica-kpi-e-obiettivo-tre-cose-diverse": "misurare-cio-che-conta",
  "2-reach-impression-e-views-non-sono-sinonimi": "leggere-dati-piattaforme",
  "3-watch-time-e-durata-media-quanto-contenuto-viene-realmente-consumato": "leggere-dati-piattaforme",
  "4-retention-dove-il-pubblico-rimane-e-dove-lo-perdi": "leggere-dati-piattaforme",
  "5-engagement-le-interazioni-non-sono-tutte-uguali": "leggere-dati-piattaforme",
  "6-follower-e-iscritti-crescita-totale-e-attribuzione-al-singolo-contenuto": "leggere-dati-piattaforme",
  "7-ctr-stesso-nome-contesti-diversi": "leggere-dati-piattaforme",
  "8-conversione-engagement-e-fidelizzazione-non-sono-la-stessa-cosa": "interpretare-senza-ingannarsi",
  "9-vanity-metric-il-problema-non-e-la-metrica-ma-l-uso-che-ne-fai": "misurare-cio-che-conta",
  "10-correlazione-attribuzione-e-causa": "interpretare-senza-ingannarsi",
  "11-come-progettare-un-test-utile": "trasformare-dati-decisioni",
  "12-kpi-primari-e-metriche-diagnostiche": "misurare-cio-che-conta",
  "13-confrontare-contenuti-correttamente": "interpretare-senza-ingannarsi",
  "14-dalla-metrica-alla-decisione-il-metodo-completo": "trasformare-dati-decisioni",
  "15-errori-che-devi-saper-riconoscere": "interpretare-senza-ingannarsi",
  "16-checklist-per-il-mini-report": "trasformare-dati-decisioni",
  "criterio-di-completamento-smm-01": "trasformare-dati-decisioni",
  "nota-sulle-piattaforme-e-sulle-fonti": "trasformare-dati-decisioni"
});

export function resolveLegacyChapterId(id) {
  return LEGACY_CHAPTER_MAP[id] ?? id;
}

export function legacyIdsForMacroChapter(macroChapterId) {
  return Object.entries(LEGACY_CHAPTER_MAP)
    .filter(([, target]) => target === macroChapterId)
    .map(([legacyId]) => legacyId);
}

export function resolveRequestedChapter(chapters = [], requestedId = null) {
  const firstId = chapters[0]?.id ?? null;
  if (!requestedId) return { chapterId: firstId, redirected: false, missing: false };
  const resolvedId = resolveLegacyChapterId(requestedId);
  if (chapters.some(chapter => chapter.id === resolvedId)) {
    return { chapterId: resolvedId, redirected: resolvedId !== requestedId, missing: false };
  }
  return { chapterId: firstId, redirected: false, missing: true };
}

export function aggregateLegacyCompletion(completedIds = []) {
  const legacyCompletedIds = [...completedIds];
  const completedMacroChapterIds = [];
  const seen = new Set();

  for (const id of legacyCompletedIds) {
    const resolved = resolveLegacyChapterId(id);
    if (!seen.has(resolved)) {
      seen.add(resolved);
      completedMacroChapterIds.push(resolved);
    }
  }

  return { legacyCompletedIds, completedMacroChapterIds };
}
