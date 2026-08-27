export const metricVisualizations = [
  {
    id: "reach-impressions",
    title: "Una persona, più esposizioni",
    staticSummary: "La reach conta gli account unici raggiunti almeno una volta; le impression contano le esposizioni complessive. La stessa persona può quindi aumentare le impression senza aumentare la reach.",
    steps: [
      { label: "Prima esposizione", explanation: "Un account vede il contenuto: reach 1, impression 1.", items: ["A · 1 esposizione"] },
      { label: "Nuovo account", explanation: "Arriva un secondo account: reach 2, impression 2.", items: ["A · 1", "B · 1"] },
      { label: "Esposizione ripetuta", explanation: "A vede di nuovo il contenuto: la reach resta 2, le impression salgono a 3.", items: ["A · 2", "B · 1"] },
      { label: "Lettura corretta", explanation: "Reach e impression descrivono distribuzione ed esposizione, non dimostrano comprensione o conversione.", items: ["Reach 2", "Impression 3", "Frequenza media 1,5"] }
    ]
  },
  {
    id: "watch-time-average",
    title: "Totale e media raccontano cose diverse",
    staticSummary: "Il watch time somma il tempo visto da tutte le visualizzazioni; la durata media divide quel totale per le visualizzazioni conteggiate. Un totale maggiore può dipendere dal volume senza implicare una visione media più lunga.",
    steps: [
      { label: "Tre visualizzazioni", explanation: "Tre persone guardano rispettivamente 20, 40 e 60 secondi.", items: ["20 s", "40 s", "60 s"] },
      { label: "Watch time", explanation: "Il tempo complessivo è 120 secondi: somma di tutte le sessioni conteggiate.", items: ["20 + 40 + 60 = 120 s"] },
      { label: "Durata media", explanation: "La durata media è 120 / 3 = 40 secondi per visualizzazione.", items: ["120 s ÷ 3 views = 40 s"] },
      { label: "Limite", explanation: "La media nasconde la distribuzione: nessuna delle tre persone deve necessariamente avere guardato esattamente 40 secondi.", items: ["Totale ≠ media", "Media ≠ comportamento individuale"] }
    ]
  },
  {
    id: "retention-curve",
    title: "Leggere una curva senza inventare la causa",
    staticSummary: "La curva di retention mostra la quota di pubblico ancora presente nei diversi momenti. Cadute e picchi localizzano passaggi da investigare, ma non identificano automaticamente la causa dell’abbandono o della ripetizione.",
    steps: [
      { label: "Ingresso", explanation: "Il 100% rappresenta il gruppo conteggiato all’avvio del contenuto.", items: ["0 s · 100%", "10 s · 78%", "30 s · 61%", "60 s · 45%"] },
      { label: "Caduta iniziale", explanation: "Una discesa rapida segnala perdita iniziale; possono contribuire promessa non mantenuta, pubblico non adatto o conteggio della piattaforma.", items: ["▼ -22 punti nei primi 10 s"] },
      { label: "Picco locale", explanation: "Un piccolo picco può indicare riavvolgimenti o accessi diretti a quel punto, non necessariamente gradimento.", items: ["▲ ripetizione al secondo 42"] },
      { label: "Confronto utile", explanation: "Confronta video di durata e contesto simili, formula alternative e verifica la stessa ipotesi su più contenuti.", items: ["Segnale", "Alternative", "Replica"] }
    ]
  }
];
