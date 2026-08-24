# Study Hub V3 — Esercitazioni e valutazioni locali

**Data:** 2026-08-24  
**Stato:** approvato in chat; in attesa di revisione della specifica

## Obiettivo

Aggiungere a ogni modulo un sistema universale di esercitazione e valutazione che verifichi la comprensione dei singoli capitoli e dell'intera lezione. Il sistema deve conservare tentativi, risposte ed errori ricorrenti esclusivamente nel browser, senza API, backend, account, prove gratuite o servizi fatturabili.

SMM-01 è il primo modulo reale, ma struttura, motore e interfaccia non devono dipendere dai suoi contenuti.

## Vincoli non negoziabili

- Il sito rimane statico e ospitato su GitHub Pages.
- La valutazione viene eseguita interamente nel browser.
- Non vengono usati Apps Script, Google Cloud, Google Sheets, OAuth o API IA.
- Nessuna risposta, nota, valutazione o cronologia viene inviata a GitHub, Google, OpenAI o altri soggetti.
- Non vengono introdotti abbonamenti, prove gratuite, metodi di pagamento, credenziali, token o segreti.
- I contenuti valutativi pubblicati nel repository non devono contenere dati personali.
- La mancanza di una valutazione per un modulo deve produrre “Valutazione non ancora disponibile”, senza inventare domande.

## Principio didattico

Le domande non vengono generate automaticamente dal testo nel browser. Per ogni lezione devono essere preparate e verificate domande coerenti con i contenuti ufficiali del Google Doc. Questo evita quiz superficiali, ambigui o basati su informazioni che non compaiono nella lezione.

Ogni concetto rilevante deve essere verificato con il formato più appropriato:

- scelta multipla per distinguere concetti vicini;
- vero/falso per convinzioni errate frequenti;
- risposta aperta per spiegazione, collegamento e applicazione;
- scenario applicativo quando la lezione richiede decisioni pratiche.

Le domande devono valutare comprensione e applicazione, non soltanto memoria letterale.

## Struttura pubblica delle valutazioni

Ogni modulo disponibile può avere un file di valutazione pubblico separato dal contenuto della lezione. Il file contiene esclusivamente materiale didattico non sensibile:

- identificativo e versione della valutazione;
- identificativo della lezione;
- domande associate a uno o più capitoli;
- tipo di domanda;
- opzioni, quando necessarie;
- risposta corretta o concetti chiave;
- spiegazione didattica;
- competenze verificate;
- peso e soglie di valutazione.

Le soluzioni sono necessariamente visibili nel codice pubblico. Il sistema è quindi uno strumento personale di apprendimento, non una piattaforma antifrode o una certificazione ufficiale.

## Tipi di domanda

### Scelta multipla

Una o più opzioni, con risposta corretta deterministica. Dopo la consegna vengono mostrati esito e spiegazione. Le opzioni errate devono rappresentare errori plausibili, non distrattori casuali.

### Vero o falso

Valutazione deterministica con spiegazione obbligatoria, soprattutto quando l'affermazione rappresenta un errore comune.

### Risposta aperta con concetti chiave

La risposta viene normalizzata localmente ignorando maiuscole, accenti e punteggiatura. I concetti possono avere sinonimi controllati e gruppi alternativi.

L'esito usa tre livelli:

- **corretta:** sono presenti tutti i concetti essenziali richiesti;
- **parzialmente corretta:** è presente una parte significativa dei concetti;
- **da rivedere:** mancano i concetti essenziali.

Il motore non pretende di comprendere semanticamente il testo. Mostra sempre i concetti riconosciuti, quelli mancanti e una risposta modello. L'interfaccia chiarisce che la correzione automatica è un supporto allo studio e non una valutazione linguistica infallibile.

### Scenario applicativo

Può usare scelta multipla o risposta aperta. Deve collegare il caso ai capitoli pertinenti e spiegare perché una conclusione è o non è supportata dai dati.

## Flussi dell'interfaccia

### Accesso dalla lezione

La pagina di ogni lezione contiene:

- “Esercitati sul capitolo” vicino al capitolo corrente;
- “Esercitazione completa” nell'indice e in fondo alla lezione;
- stato sintetico dell'ultimo tentativo;
- collegamento agli argomenti da ripassare.

### Esercitazione del capitolo

Mostra esclusivamente le domande associate al capitolo. L'utente risponde, consegna il tentativo e riceve:

- risultato complessivo;
- correzione domanda per domanda;
- spiegazioni;
- concetti mancanti;
- collegamento diretto al capitolo da ristudiare.

### Valutazione del modulo

Comprende domande provenienti da tutti i capitoli e alcune domande trasversali. Mostra progressione, numero di domande e possibilità di interrompere e riprendere una bozza sullo stesso dispositivo.

### Dashboard

La pagina Progressi aggiunge:

- ultimo punteggio per modulo;
- miglior punteggio;
- numero di tentativi;
- competenze consolidate, in miglioramento e da ripassare;
- errori ricorrenti;
- collegamenti ai capitoli interessati.

## Calcolo del risultato

Ogni domanda produce un valore normalizzato tra 0 e 1. Il peso definito nel contenuto valutativo contribuisce al punteggio del capitolo, delle competenze e del modulo.

Soglie iniziali:

- 80–100%: comprensione solida;
- 60–79%: comprensione parziale, ripasso consigliato;
- 0–59%: capitolo da rivedere.

Le soglie sono costanti controllate e potranno essere modificate senza alterare i dati storici. Ogni tentativo conserva la versione della valutazione e il punteggio calcolato in quel momento.

## Errori ricorrenti e competenze

Ogni domanda possiede un identificativo stabile e una o più competenze. Dopo la consegna il sistema registra localmente:

- esito della domanda;
- concetti chiave mancanti;
- competenze coinvolte;
- capitoli associati;
- data del tentativo;
- versione della valutazione.

Un errore diventa ricorrente dopo almeno due esiti insufficienti in tentativi distinti. La dashboard ordina gli argomenti da ripassare per frequenza recente e gravità. Un risultato corretto successivo riduce la priorità, ma non cancella lo storico.

## Dati locali

Le risposte e i risultati usano chiavi con namespace `study-hub-v3:` e comprendono:

- bozze non consegnate;
- tentativi consegnati;
- risposte date;
- punteggi per capitolo e modulo;
- stato delle competenze;
- statistiche degli errori ricorrenti.

Il numero dei tentativi completi conservati è limitato per evitare crescita indefinita; le statistiche aggregate vengono mantenute. Tutte le nuove chiavi entrano nel backup JSON già esistente. L'importazione continua a rifiutare chiavi esterne al namespace.

## Privacy e sicurezza

- Nessun dato valutativo personale compare negli URL.
- Nessuna risposta viene aggiunta al prompt “Approfondisci”.
- Nessun dato personale viene scritto nei log dell'applicazione.
- Il rendering usa proprietà DOM sicure e non interpreta HTML inserito dall'utente.
- L'eliminazione della cronologia di studio non elimina automaticamente i tentativi; la cancellazione delle valutazioni è un'azione distinta e dichiarata.
- L'utente può esportare un backup prima della cancellazione.
- La Content Security Policy continua a bloccare script e connessioni remote non autorizzati.

## Seconda correzione facoltativa con ChatGPT

Quando la correzione deterministica di una risposta aperta richiede un chiarimento, l'utente può preparare una richiesta di seconda correzione senza API.

Il flusso è sempre esplicito:

1. l'utente sceglie una singola risposta oppure l'intero test;
2. Study Hub costruisce localmente un testo con domande, risposte selezionate, esiti deterministici, concetti attesi e risposte modello;
3. una finestra mostra integralmente il testo prima di qualsiasi azione esterna;
4. l'utente può copiarlo e aprire `https://chatgpt.com/`;
5. l'utente decide personalmente se incollarlo e inviarlo.

Il pacchetto non include nome, note personali, cronologia di studio, preferiti, altri tentativi o identificativi del dispositivo. Nessun contenuto viene inserito nell'URL, caricato automaticamente o inviato tramite richieste di rete. La valutazione locale continua a funzionare se ChatGPT non è disponibile.

## Moduli proposti

- `src/assessment/assessment-schema.js`: validazione e normalizzazione dei file pubblici.
- `src/assessment/assessment-engine.js`: correzione deterministica e calcolo dei punteggi.
- `src/assessment/open-answer.js`: normalizzazione, sinonimi e copertura dei concetti chiave.
- `src/assessment/assessment-store.js`: bozze, tentativi e limiti di conservazione.
- `src/assessment/insights.js`: errori ricorrenti, competenze e priorità di ripasso.
- `src/assessment/review-package.js`: costruzione del testo selettivo per una seconda correzione manuale.
- `src/views/assessment-view.js`: esercitazione del capitolo e valutazione completa.
- componenti nella vista lezione e nella dashboard Progressi.
- file pubblico iniziale per la valutazione di SMM-01.

I moduli di correzione non dipendono dal DOM, così possono essere verificati tramite test unitari.

## Gestione degli aggiornamenti

Ogni valutazione ha una versione. Se cambiano domande o criteri:

- i tentativi vecchi rimangono leggibili con la loro versione;
- le bozze incompatibili vengono archiviate o scartate in modo sicuro;
- i nuovi tentativi usano la versione più recente;
- la dashboard non confronta direttamente punteggi ottenuti da versioni incompatibili senza segnalarlo.

## Gestione degli errori

- File valutativo assente: mostra “Valutazione non ancora disponibile”.
- File non valido: la lezione rimane leggibile e la valutazione viene disabilitata.
- Dati locali malformati: viene ignorata soltanto la porzione danneggiata.
- Spazio locale esaurito: il tentativo resta visibile nella sessione e viene proposto il backup, senza dichiarare il salvataggio riuscito.
- Risposta aperta vuota: viene considerata non valutabile e segnalata chiaramente.

## Accessibilità

- Tutti i campi hanno etichette esplicite.
- Lo stato di avanzamento non dipende soltanto dal colore.
- Esiti e concetti mancanti sono annunciabili dai lettori di schermo.
- Il focus viene spostato sul riepilogo dopo la consegna.
- È possibile completare l'intero flusso da tastiera.
- Le preferenze di lettura e `prefers-reduced-motion` vengono rispettate.

## Test e criteri di accettazione

- Validazione di file corretti e rifiuto di strutture non valide.
- Correzione di scelta multipla e vero/falso.
- Normalizzazione di accenti, maiuscole e punteggiatura nelle risposte aperte.
- Gestione di sinonimi e gruppi alternativi.
- Esiti corretta, parziale e da rivedere.
- Punteggi pesati per domanda, capitolo, competenza e modulo.
- Storico separato per modulo e versione.
- Individuazione di un errore ricorrente dopo almeno due tentativi distinti.
- Riduzione della priorità dopo una risposta successiva corretta.
- Backup comprendente bozze, tentativi e statistiche.
- Nessuna risposta negli URL, nel prompt Approfondisci o nelle richieste di rete.
- Pacchetto di revisione ChatGPT limitato alle risposte selezionate, mostrato integralmente prima della copia e privo di note, cronologia e altri tentativi.
- Navigazione diretta tra valutazione e capitolo da ripassare.
- SMM-01 contiene domande per tutti i capitoli effettivamente disponibili, senza informazioni estranee alla lezione.
- Suite completa, controllo sintattico e scansione dei segreti superati.

## Fuori ambito

- Sincronizzazione automatica tra dispositivi.
- Invio dei risultati a Google Sheets.
- Account, classi, docenti o classifiche.
- Controlli antifrode o certificazioni ufficiali.
- Correzione semantica tramite IA remota.
- Invio o caricamento automatico delle risposte verso ChatGPT.
- Generazione automatica di domande dal Google Doc.
- Inclusione o download automatico di un modello IA locale.

## Evoluzione futura compatibile

L'interfaccia del motore separa contenuto, correzione e persistenza. In futuro sarà possibile aggiungere, come opzione esplicita, un correttore IA eseguito sul dispositivo. La modalità deterministica attuale continuerà a funzionare senza AI e senza connessione a servizi a pagamento.
