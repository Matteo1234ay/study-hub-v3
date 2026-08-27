export const causalityVisualization = {
  id: "correlation-causality",
  title: "Dal movimento comune alla prova mancante",
  staticSummary: "Quando due variabili cambiano insieme esiste un’associazione da spiegare. Per sostenere una causa occorre considerare variabili alternative, ordine temporale, confronto e repliche: la correlazione da sola non seleziona una spiegazione.",
  steps: [
    { label: "Due variazioni insieme", explanation: "Dopo il nuovo montaggio aumentano retention e condivisioni.", items: ["Montaggio nuovo ↑", "Retention ↑", "Condivisioni ↑"] },
    { label: "Ipotesi", explanation: "Il montaggio potrebbe avere contribuito: è una spiegazione compatibile, non ancora dimostrata.", items: ["Montaggio → comportamento?"] },
    { label: "Alternative", explanation: "Tema, pubblico raggiunto, durata e distribuzione possono essere cambiati nello stesso periodo.", items: ["Tema", "Pubblico", "Durata", "Distribuzione"] },
    { label: "Prova più forte", explanation: "Servono confronti comparabili, criterio definito prima e repliche che distinguano le spiegazioni.", items: ["Confronto", "Controlli", "Replica", "Limiti"] }
  ]
};
