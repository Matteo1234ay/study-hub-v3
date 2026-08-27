# Study Hub V3

## Prototipo SMM-01 basato sulle evidenze

SMM-01 usa una struttura ibrida: un capitolo alla volta per lo studio guidato e una vista completa per consultazione. I primi capitoli includono fonti contestuali espandibili e micro-domande non bloccanti con feedback e ripasso locale.

Le lezioni supportano gli stati editoriali `draft`, `review` e `published`; le lezioni legacy restano compatibili. Progressi, note, preferiti e concetti da riprendere rimangono nel browser. Il prototipo non usa account, backend, API a consumo o servizi a pagamento.

Piattaforma personale di apprendimento statica, gratuita e pubblicabile con GitHub Pages.

## Architettura

- GitHub Pages ospita HTML, CSS, JavaScript e lezioni trasformate in JSON.
- Google Docs pubblicati sul web sono la fonte ufficiale delle lezioni.
- GitHub Actions controlla periodicamente le fonti pubblicate e rigenera i JSON.
- Il browser conserva localmente progressi e backup.
- Ricerca, preferiti, segnalibri, cronologia, note e preferenze di lettura funzionano interamente nel browser.
- Esercitazioni, valutazioni, risposte, punteggi, competenze ed errori ricorrenti vengono elaborati e conservati localmente.

Non sono usati Google Cloud, Apps Script, OAuth, API a pagamento, backend o segreti.

Il comando **Approfondisci** prepara un testo basato soltanto sul capitolo pubblico: non usa API e non invia nulla automaticamente. L’utente controlla e copia personalmente la richiesta prima di aprire ChatGPT. L’adattatore è separato per consentire in futuro un modello locale senza modificare le lezioni.

## Esercitazioni e valutazioni

SMM-01 include esercizi per ogni capitolo e una valutazione completa. Scelta multipla e vero/falso hanno correzione deterministica; le risposte aperte vengono confrontate con concetti chiave e sinonimi controllati, con esito corretto, parziale o da rivedere. Questo controllo non equivale a una comprensione semantica tramite IA: Study Hub mostra sempre concetti riconosciuti, concetti mancanti e risposta modello.

Tentativi ed errori ripetuti alimentano la sezione Progressi e vengono inclusi nel backup JSON. Le soluzioni sono presenti nei file pubblici del repository: il sistema serve allo studio personale, non a esami ufficiali o controlli antifrode.

Il comando **Verifica con ChatGPT** è facoltativo. Prepara localmente soltanto le domande e risposte selezionate, mostra un'anteprima completa e apre la home di ChatGPT. Non usa API, non inserisce risposte nell'URL e non invia automaticamente alcun contenuto: copia e invio restano azioni dell'utente.

Ogni percorso può inoltre avere una **verifica riassuntiva progressiva**: seleziona un numero contenuto di domande rappresentative da tutte le lezioni pubblicate, copre competenze e lezioni diverse, riduce la ripetizione delle domande recenti e dà una priorità moderata alle aree risultate deboli. Il risultato dichiara sempre fino a quale lezione è valida la diagnosi e rimanda direttamente ai capitoli da ripassare. Le lezioni configurate con un archivio di domande entrano automaticamente nel test, senza modificare la pagina della verifica.

L’**esame finale** usa lo stesso archivio ma resta bloccato finché il manifesto del percorso non è marcato come completo. Quando sarà attivo richiederà sia la soglia complessiva sia la soglia minima di ogni competenza obbligatoria. Il livello ottenuto è un’autovalutazione personale, non una certificazione.

## Sviluppo

Servire la cartella con un server statico, per esempio:

```sh
python3 -m http.server 8080
```

Eseguire i test:

```sh
node --test
```

Sincronizzare manualmente la lezione pilota:

```sh
node scripts/sync-published-doc.mjs
```

## Privacy

Solo le lezioni esplicitamente pubblicate sul web vengono importate. Progressi e dati personali non devono essere committati; consulta [SECURITY.md](SECURITY.md).
