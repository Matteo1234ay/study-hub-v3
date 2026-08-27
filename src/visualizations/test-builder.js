export const testBuilderVisualization = {
  id: "test-builder",
  title: "Costruire un test orientato alla decisione",
  staticSummary: "Un test utile collega domanda, ipotesi, variabile modificata, confronto, metrica e criterio decisionale. Definire questi elementi prima del risultato limita la scelta opportunistica della spiegazione più favorevole.",
  steps: [
    { label: "Domanda", explanation: "L’apertura che anticipa il conflitto trattiene più pubblico nei primi 30 secondi?", items: ["Domanda precisa"] },
    { label: "Ipotesi e variabile", explanation: "Ipotesi: aumenta la retention iniziale. Variabile modificata: soltanto la struttura dell’apertura.", items: ["Ipotesi", "Apertura"] },
    { label: "Confronto", explanation: "Confronta contenuti ragionevolmente simili e registra tema, durata, pubblico e fonte di traffico.", items: ["Versione A", "Versione B", "Contesto"] },
    { label: "Decisione", explanation: "Stabilisci prima quale risultato porta ad adottare, modificare o scartare l’apertura e quale controllo verrà dopo.", items: ["Criterio", "Decisione", "Verifica"] }
  ]
};
