# Study Hub V3 — Verifiche progressive ed esami finali dei percorsi

**Data:** 2026-08-24  
**Stato:** approvato in chat; in attesa di revisione della specifica

## Obiettivo

Estendere il sistema di valutazione dalle singole lezioni agli interi percorsi di Study Hub: Social Media Manager, Intelligenza Artificiale, Design, Video Making e futuri percorsi.

Ogni percorso deve offrire:

- una **verifica progressiva**, aggiornata alle lezioni effettivamente disponibili;
- un **esame finale**, predisposto fin da subito ma sbloccato solo quando il percorso viene dichiarato completo.

Il sistema deve valutare un insieme rappresentativo di competenze senza proporre centinaia di domande, individuare lacune specifiche e rimandare alle lezioni e ai capitoli pertinenti.

## Vincoli non negoziabili

- Il sito rimane statico e ospitato su GitHub Pages.
- Selezione, correzione, valutazione e persistenza avvengono nel browser.
- Non vengono usati Apps Script, Google Cloud, OAuth, Google Sheets o API IA.
- Non vengono introdotti servizi fatturabili, prove gratuite, token, credenziali o segreti.
- Risposte, risultati, cronologia e profilo delle competenze restano nel `localStorage` con namespace `study-hub-v3:`.
- Il sistema non inventa domande: usa esclusivamente banche valutative pubbliche, preparate e revisionate per le lezioni disponibili.
- L'esito progressivo descrive soltanto la padronanza dei contenuti pubblicati fino a quel momento.
- L'esame finale non viene sbloccato automaticamente in base al numero di lezioni: richiede un'esplicita dichiarazione di completezza nel catalogo del percorso.

## Modello dei contenuti

### Banca delle lezioni

Ogni lezione continua a possedere la propria valutazione pubblica con:

- domande;
- capitoli associati;
- competenze;
- pesi;
- correzioni e spiegazioni;
- versione.

Le banche delle lezioni costituiscono la fonte delle domande utilizzabili a livello di percorso.

### Manifesto del percorso

Ogni percorso con valutazione possiede un manifesto pubblico che definisce:

- identificativo e versione;
- stato `in-progress` oppure `complete`;
- competenze del percorso;
- competenze obbligatorie;
- lezioni incluse e relativo stato;
- peso delle competenze;
- numero minimo e massimo di domande;
- regole di copertura;
- soglie dei livelli;
- eventuali domande trasversali specifiche del percorso.

Il manifesto non contiene risposte personali o dati sensibili.

### Domande trasversali

Le domande che collegano più lezioni non vengono generate automaticamente. Sono contenuti didattici revisionati e dichiarano:

- lezioni e capitoli coinvolti;
- competenze verificate;
- criteri di correzione;
- risposta modello;
- spiegazione.

Se non esistono ancora domande trasversali, la verifica rimane disponibile usando domande delle singole lezioni e segnala che la copertura integrata è ancora parziale.

## Verifica progressiva

La verifica progressiva è disponibile quando almeno una lezione del percorso possiede una valutazione valida.

Prima dell'avvio mostra:

- numero di lezioni pubblicate e incluse;
- competenze attualmente valutabili;
- numero previsto di domande;
- data/versione della copertura;
- avvertenza che il risultato riguarda solo i contenuti disponibili.

La verifica viene costruita al momento dell'avvio e salvata come sessione immutabile, così l'aggiunta successiva di una lezione non modifica un tentativo già iniziato.

## Esame finale

L'esame finale usa lo stesso motore di selezione e correzione, con regole più severe:

- è accessibile soltanto con manifesto `complete`;
- richiede copertura di tutte le competenze obbligatorie;
- include domande trasversali quando previste dal manifesto;
- impedisce la dichiarazione di completamento se manca una competenza fondamentale;
- conserva la versione completa del manifesto e delle banche usate.

Finché il percorso è `in-progress`, l'interfaccia mostra “Esame finale non ancora disponibile” e spiega quante lezioni e competenze sono attualmente presenti, senza stimare una data o inventare contenuti mancanti.

## Selezione delle domande

### Obiettivo

Selezionare il minor numero di domande capace di fornire una copertura sensata delle competenze disponibili.

Il numero non è rigidamente fissato a dieci:

- minimo iniziale: 10, se la banca lo consente;
- massimo ordinario: 20;
- con pochi contenuti: il numero può scendere sotto 10 senza duplicare domande;
- il manifesto può aumentare il minimo dell'esame finale se le competenze obbligatorie non sarebbero altrimenti coperte.

### Regole di copertura

L'algoritmo deterministico:

1. include almeno una domanda per ogni competenza disponibile, entro i limiti;
2. distribuisce le domande tra le lezioni incluse;
3. rispetta i pesi delle competenze nel manifesto;
4. privilegia domande mai viste nella recente cronologia;
5. aumenta moderatamente la probabilità di argomenti sbagliati in precedenza;
6. evita di riproporre troppe domande identiche nello stesso tentativo;
7. include domande trasversali secondo la quota prevista;
8. completa gli slot restanti con una selezione pseudo-casuale riproducibile.

La selezione usa un seed salvato nella sessione. Lo stesso tentativo mantiene quindi sempre le stesse domande e il risultato può essere ricostruito.

### Limite della copertura

Se il numero massimo non permette di coprire ogni lezione singolarmente, la priorità va alle competenze. La schermata finale dichiara quali competenze sono state valutate e non suggerisce che ogni dettaglio del percorso sia stato verificato.

## Livelli della verifica progressiva

Il punteggio complessivo produce un livello riferito esclusivamente ai contenuti disponibili:

- **Padronanza solida:** 85–100%;
- **Buona preparazione:** 70–84%;
- **Preparazione parziale:** 55–69%;
- **Da consolidare:** 0–54%.

La dicitura completa deve essere, per esempio: “Padronanza solida sui contenuti SMM pubblicati fino a SMM-07”. Non vengono usate etichette assolute come “esperto Social Media Manager” durante un percorso incompleto.

## Completamento dell'esame finale

Un percorso completo può essere dichiarato superato soltanto se:

- il punteggio complessivo è almeno 75%;
- ogni competenza obbligatoria raggiunge almeno 60%;
- la copertura dell'esame soddisfa il manifesto;
- il tentativo usa la versione corrente dell'esame finale.

Livelli finali iniziali:

- **Eccellente:** 90–100%, senza competenze obbligatorie sotto 75%;
- **Avanzato:** 80–89%, senza competenze obbligatorie sotto 65%;
- **Completato:** 75–79%, con tutte le competenze obbligatorie almeno al 60%;
- **Non ancora completato:** requisiti non soddisfatti.

Questi livelli descrivono il completamento del percorso Study Hub, non una certificazione professionale riconosciuta.

## Risultati e lacune

Il riepilogo mostra:

- punteggio totale e livello;
- versione e copertura del tentativo;
- competenze solide, in miglioramento e insufficienti;
- lezioni e capitoli prioritari da ripassare;
- errori ricorrenti rispetto ai tentativi precedenti;
- contenuti non inclusi in quel tentativo;
- collegamento a una nuova verifica con domande parzialmente differenti.

Ogni lacuna collega direttamente a `#/lessons/:lessonId/:chapterId`. Il testo usa riferimenti specifici, per esempio “Rivedi SMM-15 → Retention iniziale”, non indicazioni generiche.

## Evoluzione con nuove lezioni

Quando viene aggiunta una nuova lezione:

1. la lezione viene collegata al manifesto del percorso;
2. la sua banca domande viene validata;
3. le nuove competenze vengono aggiunte o collegate a quelle esistenti;
4. la versione del manifesto aumenta;
5. le nuove verifiche progressive includono la copertura aggiornata;
6. i vecchi tentativi rimangono leggibili con la loro versione e non vengono ricalcolati retroattivamente.

La dashboard distingue risultati ottenuti con coperture differenti.

## Persistenza locale

Il sistema conserva:

- sessioni progressive e finali iniziate;
- seed e domande selezionate;
- risposte;
- tentativi consegnati;
- risultati per competenza;
- copertura e versioni;
- errori ricorrenti;
- stato di completamento dell'esame finale.

Le chiavi seguono il namespace `study-hub-v3:path-assessment:` e sono incluse automaticamente nel backup JSON. Il numero di tentativi dettagliati è limitato; le statistiche aggregate vengono mantenute.

## Interfaccia

### Pagina del percorso

Ogni percorso mostra un pannello “Valuta le tue competenze” con:

- stato della verifica progressiva;
- lezioni incluse;
- ultimo e miglior risultato confrontabili;
- pulsante “Avvia verifica progressiva”;
- stato dell'esame finale;
- spiegazione del blocco quando il percorso è incompleto.

### Durante la verifica

La pagina mostra avanzamento, domande rimanenti, salvataggio automatico locale e possibilità di riprendere. Non mostra immediatamente le soluzioni prima della consegna.

### Dashboard Progressi

La dashboard aggiunge una sezione per ciascun percorso con:

- copertura corrente;
- ultimo livello progressivo;
- andamento tra versioni comparabili;
- principali lacune;
- stato dell'esame finale.

## Seconda correzione facoltativa con ChatGPT

Come nelle valutazioni delle lezioni, l'utente può preparare un pacchetto di revisione per domande aperte o per l'intero tentativo.

- Il testo viene costruito localmente.
- L'anteprima mostra tutto ciò che verrebbe condiviso.
- Il collegamento apre soltanto `https://chatgpt.com/`.
- Copia, incolla e invio sono manuali.
- Nessuna API viene usata.
- Note, cronologia, altri tentativi e identificativi del dispositivo restano esclusi.

## Moduli proposti

- `src/path-assessment/path-schema.js`: validazione del manifesto.
- `src/path-assessment/question-pool.js`: unificazione delle banche delle lezioni e delle domande trasversali.
- `src/path-assessment/selector.js`: copertura, seed e selezione bilanciata.
- `src/path-assessment/path-score.js`: livelli progressivi e requisiti finali.
- `src/path-assessment/path-store.js`: sessioni e tentativi locali.
- `src/path-assessment/path-insights.js`: lacune e collegamenti di ripasso.
- `src/views/path-assessment-view.js`: flusso della verifica.
- integrazioni in `path-view.js` e `progress-view.js`.
- `data/path-assessments/smm.json`: primo manifesto progressivo.

I moduli di selezione e valutazione sono funzioni pure e non dipendono dal DOM.

## Gestione degli errori

- Nessuna banca valida: verifica non disponibile, percorso comunque navigabile.
- Banca di una lezione non disponibile: esclusione dichiarata e copertura aggiornata; nessuna domanda inventata.
- Manifesto non valido: pannello disabilitato senza interrompere le lezioni.
- Sessione incompatibile con una nuova versione: la vecchia sessione resta completabile se i suoi contenuti pubblici sono ancora disponibili; altrimenti viene archiviata e viene proposta una nuova sessione.
- Dati locali malformati: viene ignorata solo la porzione danneggiata.
- Spazio locale esaurito: l'interfaccia non dichiara il salvataggio riuscito e propone il backup.

## Accessibilità

- Navigazione completa da tastiera.
- Etichette esplicite per opzioni e risposte.
- Avanzamento e livelli non comunicati soltanto tramite colore.
- Focus spostato sul riepilogo dopo la consegna.
- Collegamenti di ripasso descrittivi.
- Rispetto delle preferenze di lettura e di `prefers-reduced-motion`.

## Test e criteri di accettazione

- Validazione del manifesto e rifiuto di stati o riferimenti non validi.
- Aggregazione di più banche senza collisioni di identificativi.
- Copertura delle competenze entro minimo e massimo.
- Distribuzione tra lezioni e rispetto dei pesi.
- Selezione riproducibile con lo stesso seed.
- Riduzione delle ripetizioni recenti.
- Priorità moderata agli argomenti sbagliati senza trasformare l'intero test in solo recupero.
- Sessione immutabile dopo l'avvio.
- Livelli progressivi calcolati correttamente.
- Esame finale bloccato con percorso `in-progress`.
- Esame finale sbloccato solo con percorso `complete` e copertura obbligatoria valida.
- Fallimento finale se una competenza obbligatoria è sotto soglia anche con totale sufficiente.
- Collegamenti precisi a lezioni e capitoli insufficienti.
- Tentativi di versioni diverse non confrontati direttamente senza segnalazione.
- Backup comprendente sessioni e tentativi dei percorsi.
- Pacchetto ChatGPT privo di note, cronologia e dati non selezionati.
- SMM progressivo disponibile con la sola SMM-01 e aggiornabile senza modificare il motore.
- Suite completa, controllo sintattico e scansione segreti superati.

## Fuori ambito

- Certificazioni professionali riconosciute.
- Antifrode o supervisione d'esame.
- Generazione automatica di domande tramite IA.
- Correzione semantica automatica tramite servizi remoti.
- Sincronizzazione automatica tra dispositivi.
- Account, classifiche o confronti tra utenti.
- Sblocco dell'esame finale prima della dichiarazione esplicita di completezza.

## Stato iniziale

- Social Media Manager: verifica progressiva attiva usando SMM-01; esame finale bloccato.
- Intelligenza Artificiale: non disponibile finché non esiste almeno una lezione valutabile.
- Design: non disponibile finché non esiste almeno una lezione valutabile.
- Video Making: non disponibile finché non esiste almeno una lezione valutabile.
