# Study Hub V3 — Esperienza di studio completamente locale

**Data:** 2026-08-24  
**Stato:** approvato

## Obiettivo

Migliorare l’esperienza di studio senza introdurre API, account applicativi, backend, database remoti, prove gratuite, metodi di pagamento o servizi con consumo fatturabile.

## Vincoli non negoziabili

- Tutte le nuove funzioni devono essere eseguite nel browser.
- I dati personali non devono essere inviati a GitHub, Google o OpenAI.
- Non devono esistere chiavi API, token, credenziali o variabili segrete.
- Il sito deve continuare a funzionare come frontend statico su GitHub Pages.
- La rimozione di ChatGPT non deve compromettere le altre funzioni.
- Note, cronologia, preferiti e progressi devono essere inclusi nel backup locale.

## Funzioni incluse

### Ricerca globale

La ricerca indicizza nel browser il catalogo e i JSON pubblici delle lezioni. Cerca per titolo della lezione, titolo del capitolo e testo pubblico. I risultati portano direttamente al capitolo.

### Preferiti e segnalibri

L’utente può aggiungere una lezione ai preferiti e salvare singoli capitoli. Lo stato è conservato nel `localStorage` con namespace `study-hub-v3:`.

### Ripresa e modalità ripasso

Ogni apertura di capitolo aggiorna l’ultima posizione. La home propone “Continua da dove eri rimasto”. La modalità ripasso raccoglie capitoli salvati e non completati senza inventare nuovi contenuti.

### Cronologia di studio

La cronologia registra localmente apertura delle lezioni, visita dei capitoli e completamenti. Gli eventi sono limitati agli ultimi 500 per evitare crescita indefinita. L’utente può esportarli nel backup e cancellarli esplicitamente.

### Note personali

Ogni capitolo offre un’area note con salvataggio locale automatico. Le note non entrano nei file delle lezioni, nella ricerca pubblica o nel prompt di approfondimento. L’interfaccia distingue chiaramente contenuto ufficiale e appunti personali.

### Preferenze di lettura

Sono previste dimensione del testo, larghezza di lettura e modalità concentrazione. Le preferenze sono locali e rispettano `prefers-reduced-motion`.

### Dashboard

La pagina Progressi mostra completamento, preferiti, segnalibri, attività recente e strumenti di backup. Tutti i conteggi derivano da dati locali.

## Approfondisci con ChatGPT

Il pulsante non usa API OpenAI e non invia dati automaticamente.

Flusso:

1. Study Hub costruisce un prompt usando solo titolo della lezione, titolo del capitolo e testo pubblico del capitolo.
2. Una finestra mostra il prompt completo prima di qualsiasi azione esterna.
3. L’utente può copiarlo negli appunti.
4. Un collegamento apre `https://chatgpt.com/` in una nuova scheda.
5. L’utente decide personalmente se incollare e inviare il testo.

Note, cronologia, risposte, preferiti e progressi non vengono mai inseriti nel prompt.

## Predisposizione per IA locale

Il sistema usa un’interfaccia `StudyAssistantAdapter` con responsabilità limitata alla preparazione di un’attività di approfondimento.

L’adattatore iniziale produce un prompt copiabile e un collegamento esterno. Un futuro adattatore locale potrà ricevere lo stesso contesto pubblico e restituire una risposta sul dispositivo. Nessun modello, runtime o dipendenza IA viene scaricato in questa fase.

## Moduli proposti

- `src/study/study-store.js`: preferiti, segnalibri, posizione e cronologia.
- `src/study/notes-store.js`: note per capitolo.
- `src/study/search-index.js`: indice e ricerca client-side.
- `src/study/preferences.js`: impostazioni di lettura.
- `src/assistant/study-assistant.js`: contratto dell’assistente.
- `src/assistant/chatgpt-adapter.js`: prompt copiabile e URL ChatGPT.
- viste e componenti dedicati per ricerca, ripasso, note e dialogo Approfondisci.

I moduli dipendono solo da funzioni browser standard e dai JSON pubblici delle lezioni.

## Privacy e sicurezza

- I contenuti delle note vengono inseriti nel DOM solo tramite `textContent` o proprietà sicure dei campi di testo.
- L’importazione continua ad accettare esclusivamente chiavi con namespace Study Hub.
- Nessun dato locale viene aggiunto a URL, log, commit o richieste di rete.
- Il dialogo Approfondisci mostra il contenuto prima della copia.
- Il collegamento esterno usa `noopener` e `noreferrer`.
- La Content Security Policy rimane incompatibile con script remoti.

## Gestione degli errori

- Se una lezione non è disponibile, la ricerca conserva gli altri risultati.
- Se il browser rifiuta gli appunti, il prompt rimane selezionabile manualmente.
- Se i dati locali sono malformati, il modulo ignora solo la sezione danneggiata.
- Il superamento del limite della cronologia rimuove gli eventi più vecchi.

## Test e criteri di accettazione

- Ricerca con corrispondenze e assenza di risultati.
- Preferiti e segnalibri senza duplicati.
- Ripresa dell’ultimo capitolo visitato.
- Cronologia limitata a 500 eventi.
- Note separate per lezione e capitolo.
- Backup comprendente tutte le chiavi locali e rifiuto di chiavi estranee.
- Prompt Approfondisci privo di note e dati personali.
- Adattatore ChatGPT senza chiamate di rete.
- Navigazione da tastiera e annunci accessibili.
- Suite completa e scansione dei segreti verdi.

## Fuori ambito

- Sincronizzazione automatica tra dispositivi.
- Google Sheets, Apps Script, Google Cloud e OAuth.
- OpenAI API o altre API IA.
- Correzione automatica tramite IA.
- Modelli locali inclusi o scaricati.
- Notifiche email o push.
- Modalità offline completa, da progettare separatamente per evitare contenuti obsoleti.
