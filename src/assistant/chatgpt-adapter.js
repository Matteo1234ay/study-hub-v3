export function createChatGptAdapter() {
  return {
    id: "chatgpt-manual",
    destination: "https://chatgpt.com/",
    prepare(context) {
      return `Aiutami ad approfondire questo capitolo di studio senza inventare informazioni non presenti.\n\nLezione: ${context.lessonId} — ${context.lessonTitle}\nCapitolo: ${context.chapterTitle}\n\nContenuto pubblico:\n${context.text}\n\nSpiega: definizione, funzionamento, collegamenti con altri concetti, un esempio pratico, errori comuni, cosa possiamo e non possiamo concludere e un'applicazione concreta. Segnala chiaramente ogni informazione aggiuntiva che richiederebbe una fonte esterna.`;
    }
  };
}
