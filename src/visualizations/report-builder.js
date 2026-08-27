export const reportBuilderVisualization = {
  id: "report-builder",
  title: "Separare i pezzi del mini-report",
  staticSummary: "Un mini-report leggibile separa dato osservato, interpretazione, limiti e alternative, decisione e verifica successiva. La separazione rende visibile dove finisce l’evidenza e dove comincia il giudizio operativo.",
  steps: [
    { label: "Osservazione", explanation: "Scrivi soltanto ciò che è misurato, includendo confronto, periodo e denominatore.", items: ["1 · Dato osservato"] },
    { label: "Interpretazione", explanation: "Proponi il significato senza trasformarlo automaticamente in una causa.", items: ["1 · Dato", "2 · Interpretazione"] },
    { label: "Limiti", explanation: "Aggiungi alternative, dati mancanti e condizioni che restringono la conclusione.", items: ["1 · Dato", "2 · Interpretazione", "3 · Limiti"] },
    { label: "Azione verificabile", explanation: "Concludi con decisione, responsabile, tempo e controllo successivo.", items: ["4 · Decisione", "5 · Verifica"] }
  ]
};
