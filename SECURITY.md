# Sicurezza e privacy

Study Hub V3 è un frontend statico. Non richiede account, API key, token, carta di credito, Google Cloud o Apps Script.

## Dati pubblici

Il codice e il contenuto dei Google Docs pubblicati sul web sono pubblici. Pubblicare una lezione significa renderne pubblico il contenuto.

## Dati locali

Progressi, bozze di valutazione, risposte, punteggi, competenze ed errori ricorrenti restano nel `localStorage` del browser. Il backup JSON viene creato solo su richiesta dell’utente e non viene inviato automaticamente ad alcun servizio.

Note, preferiti, segnalibri, preferenze e gli ultimi 500 eventi della cronologia seguono la stessa regola. Il pulsante Approfondisci non include questi dati e non effettua richieste verso OpenAI: apre soltanto un collegamento dopo che l’utente ha controllato il prompt pubblico.

La seconda correzione con ChatGPT è separata dal comando Approfondisci. Include esclusivamente le domande e risposte scelte dall'utente, insieme ai criteri didattici pubblici. Study Hub mostra il testo prima della copia e apre soltanto `https://chatgpt.com/`: non carica file, non compila la chat, non inserisce dati nell'URL e non effettua chiamate alle API OpenAI. Note, cronologia, preferiti, altri tentativi e identificativi del dispositivo restano esclusi.

Chi decide di incollare il testo in ChatGPT trasferisce volontariamente quelle risposte a OpenAI. La valutazione locale resta disponibile senza compiere questo passaggio.

Non inserire nel repository credenziali, risposte private, valutazioni personali o URL contenenti segreti.
