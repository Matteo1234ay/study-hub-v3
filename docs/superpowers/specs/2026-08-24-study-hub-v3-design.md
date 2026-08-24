# Study Hub V3 — Specifica di progettazione

**Data:** 24 agosto 2026  
**Stato:** approvata per la pianificazione  
**Repository:** `Matteo1234ay/study-hub-v3`

## 1. Obiettivo

Study Hub V3 è una piattaforma personale di apprendimento, gratuita e pubblicata con GitHub Pages. Deve separare il contenuto didattico dalla sua presentazione: Google Docs conserva le lezioni ufficiali, mentre Study Hub le trasforma in pagine leggibili, navigabili e visivamente strutturate.

Il sistema deve permettere questo flusso:

1. una lezione viene aggiornata nel relativo Google Doc;
2. l’utente apre o aggiorna Study Hub;
3. Study Hub legge la versione corrente tramite API Google;
4. il renderer didattico trasforma automaticamente il documento;
5. progressi, verifiche e competenze vengono letti o scritti nel Google Sheet privato.

Non sono ammessi copia-incolla ricorrenti, nuovi deployment manuali, download di nuove versioni o modifiche al frontend per ogni lezione.

## 2. Vincoli inderogabili

- Costo totale: **0 €**.
- Nessun Google Apps Script.
- Nessun backend a pagamento.
- Nessun dominio obbligatorio.
- Nessun servizio con prova gratuita destinata a scadere.
- Nessun metodo di pagamento o aumento di quota richiesto.
- Repository GitHub pubblico contenente soltanto codice e configurazione non sensibile.
- Nessun dato personale, risposta, risultato, token o segreto nel repository.
- Nessun contenuto didattico inventato quando una fonte non esiste.
- Google Docs rimane la fonte ufficiale delle lezioni.
- Google Sheets rimane la fonte privata di progressi, risultati e competenze.
- La vecchia applicazione Apps Script è considerata soltanto un prototipo.
- Il pacchetto locale “STUDY HUB V3 · Cinematic” è il riferimento visivo, non l’architettura da conservare.

## 3. Architettura

### 3.1 Frontend

Il frontend è un’applicazione statica modulare in HTML, CSS e JavaScript ES Modules, pubblicata direttamente dal ramo `main` tramite GitHub Pages.

Non viene introdotto un framework applicativo nella prima versione. Questa scelta riduce dipendenze, build, manutenzione e rischio di costi o incompatibilità.

Responsabilità principali:

- shell dell’applicazione;
- routing;
- dashboard;
- percorsi e catalogo lezioni;
- pagina lezione;
- indice dei capitoli;
- renderer didattico;
- autenticazione e autorizzazione Google;
- accesso a Docs e Sheets;
- cache e stato locale;
- gestione errori.

### 3.2 Collegamento Google

Study Hub usa Google Identity Services nel browser e richiede il consenso dell’utente solo quando deve accedere ai dati Google.

L’access token:

- viene ottenuto dal browser;
- non viene inserito nel repository;
- non viene scritto nei log;
- non viene salvato in `localStorage`;
- rimane in memoria per la sessione;
- viene rinnovato tramite una nuova autorizzazione quando scade.

Le API previste sono:

- Google Docs API per il contenuto strutturato delle lezioni;
- Google Drive API per metadati e individuazione controllata dei documenti;
- Google Sheets API per progresso, verifiche, feedback e competenze.

La configurazione OAuth contiene un client ID web e l’origine autorizzata GitHub Pages. Il client ID è un identificatore pubblico, non un segreto. Non viene usato alcun client secret nel frontend.

### 3.3 Modello dei contenuti

Il catalogo pubblico definisce soltanto la struttura della piattaforma e i riferimenti non sensibili:

- percorsi;
- codici lezione;
- titolo e descrizione;
- identificativo del Google Doc;
- stato di disponibilità;
- eventuale riferimento al foglio di valutazione.

I contenuti completi vengono recuperati dal Google Doc al momento dell’apertura della lezione.

Se un percorso o una lezione non possiede una fonte configurata, l’interfaccia mostra “Nessuna lezione disponibile” e non genera testo sostitutivo.

## 4. Navigazione

La gerarchia è:

```text
Dashboard
└── Percorsi
    ├── Social Media Manager
    │   └── SMM-01
    │       └── Indice capitoli
    ├── Intelligenza Artificiale
    ├── Design
    └── Video Making
```

Rotte previste:

- `#/home`
- `#/paths`
- `#/paths/:pathId`
- `#/lessons/:lessonId`
- `#/lessons/:lessonId/:chapterId`
- `#/progress`

L’hash routing è compatibile con GitHub Pages senza configurazioni server e permette link diretti a lezioni e capitoli.

Ogni pagina lezione contiene:

- breadcrumb;
- codice e titolo;
- metadati;
- stato di lettura;
- indice cliccabile dei capitoli;
- contenuto didattico;
- navigazione capitolo precedente/successivo;
- ritorno alla lezione e al percorso.

## 5. Renderer didattico universale

### 5.1 Principio

Il renderer non copia semplicemente l’aspetto del Google Doc. Riceve la struttura restituita dalla Docs API, la normalizza in un modello intermedio e la trasforma in componenti didattici.

Pipeline:

```text
Google Docs API
→ normalizzazione
→ riconoscimento semantico
→ albero della lezione
→ componenti visuali
→ indice capitoli
```

### 5.2 Struttura riconosciuta

Il renderer distingue:

- titolo della lezione;
- titolo del capitolo;
- titolo della sottosezione;
- paragrafo;
- elenco numerato;
- elenco puntato;
- checklist;
- formula;
- esempio;
- concetto chiave;
- nota;
- attenzione;
- errore;
- domanda diagnostica;
- checkpoint;
- citazione o fonte;
- separatore di capitolo.

### 5.3 Regole semantiche

La gerarchia nativa del documento viene usata quando è disponibile, ma il sistema non dipende esclusivamente dagli Heading.

Vengono riconosciuti anche prefissi testuali controllati:

- `Esempio:`
- `Attenzione:`
- `Errore:`
- `Punto chiave:`
- `Regola:`
- `Nota:`
- `Domanda diagnostica:`
- `Formula:`
- `Checklist:`
- `Checkpoint:`

Il confronto ignora maiuscole/minuscole e spazi iniziali. Il prefisso viene rimosso dal corpo visualizzato e determina il tipo di componente.

Un paragrafo non riconosciuto rimane testo normale. Il renderer non deduce informazioni che non compaiono nel documento.

### 5.4 Capitoli

Ogni capitolo diventa una sezione autonoma e visivamente distinta, con:

- numero progressivo;
- titolo;
- ancoraggio stabile;
- indicatore di lettura;
- larghezza di testo controllata;
- separazione spaziale e cromatica;
- voce nell’indice.

Gli identificatori dei capitoli vengono generati da titolo e posizione in modo deterministico. In caso di duplicati viene aggiunto un suffisso numerico.

## 6. Sistema visivo

La V3 Cinematic viene mantenuta come direzione:

- sfondo scuro profondo;
- accenti blu, viola e ciano;
- superfici traslucide controllate;
- tipografia ampia e netta;
- animazioni leggere;
- aspetto professionale e leggermente futuristico.

Priorità:

1. leggibilità;
2. gerarchia;
3. navigazione;
4. qualità didattica;
5. estetica.

Le pagine di studio sono più calme della dashboard. Non vengono mantenuti effetti che ostacolano la lettura, consumano risorse inutilmente o riducono l’accessibilità.

Sono richiesti:

- contrasto sufficiente;
- focus da tastiera visibile;
- supporto `prefers-reduced-motion`;
- layout responsive;
- indice accessibile anche su mobile;
- dimensioni tipografiche chiaramente differenziate;
- righe di testo con lunghezza controllata.

## 7. Percorsi iniziali

Il catalogo contiene:

- Social Media Manager;
- Intelligenza Artificiale;
- Design;
- Video Making.

Solo SMM-01 viene inizialmente indicata come disponibile. Gli altri percorsi e moduli non ricevono contenuti fittizi.

SMM-01 è il modulo pilota e serve a validare il sistema universale. Le regole del renderer non possono contenere eccezioni nominate `SMM-01`, salvo fixture e test.

## 8. Progressi e valutazioni

### 8.1 Lettura

Il progresso di lettura viene calcolato per capitolo. Durante l’uso può essere mantenuto localmente per reattività e successivamente sincronizzato con Sheets.

Stati minimi:

- non iniziato;
- in corso;
- letto;
- completato.

La sincronizzazione deve essere idempotente: ripetere la stessa operazione non deve duplicare record.

### 8.2 Verifiche

Le domande vengono mostrate dal frontend, ma risposte, punteggi e feedback non vengono mai committati su GitHub.

Il foglio privato conserva almeno:

- identificativo invio;
- codice lezione;
- data;
- risposte;
- punteggio;
- feedback;
- stato;
- percentuale letta.

La prima versione conserva anche una copia locale temporanea delle risposte per evitare perdite durante la compilazione. I dati locali devono poter essere cancellati dall’utente.

### 8.3 Competenze

Le competenze vengono lette dal foglio centrale e visualizzate nella dashboard. Study Hub non inventa valori mancanti e distingue chiaramente valore corrente, obiettivo e assenza di dati.

## 9. Cache e aggiornamento

- Il catalogo statico segue i commit GitHub.
- Il contenuto dei Docs viene richiesto all’apertura della lezione.
- Il browser mantiene una cache locale con timestamp e identificativo della revisione quando disponibile.
- Il refresh esplicito tenta sempre di recuperare la versione corrente.
- Se Google non è raggiungibile, può essere mostrata l’ultima copia valida con indicazione chiara che si tratta di dati in cache.
- Errori di quota usano retry limitato con backoff; non vengono effettuati tentativi infiniti.
- Nessun meccanismo richiede deployment manuali dopo la modifica di una lezione.

## 10. Gestione errori

Stati distinti:

- autorizzazione necessaria;
- autorizzazione negata;
- documento inesistente;
- documento non autorizzato;
- lezione non configurata;
- risposta Google non valida;
- quota temporaneamente superata;
- rete non disponibile;
- contenuto in cache;
- configurazione incompleta.

Ogni errore deve offrire un’azione concreta: accedi, riprova, torna al percorso o usa la copia salvata. Non sono ammesse pagine bianche.

## 11. Sicurezza e privacy

- Nessun segreto nel codice.
- Nessun token persistente.
- Scope OAuth minimi.
- Rendering tramite nodi DOM e `textContent`; nessun HTML proveniente dai Docs viene inserito direttamente.
- Validazione dei dati ricevuti dalle API.
- Content Security Policy compatibile con GitHub Pages e Google Identity Services.
- Nessun analytics di terze parti.
- Nessun dato privato incluso negli errori o nella console di produzione.
- Repository pubblico controllato automaticamente per pattern di segreti prima dei commit principali.

## 12. Struttura prevista del repository

```text
/
├── index.html
├── 404.html
├── README.md
├── .nojekyll
├── assets/
│   └── icons/
├── src/
│   ├── app.js
│   ├── router.js
│   ├── config/
│   │   ├── paths.js
│   │   └── google.js
│   ├── google/
│   │   ├── auth.js
│   │   ├── docs-client.js
│   │   ├── drive-client.js
│   │   └── sheets-client.js
│   ├── lessons/
│   │   ├── normalize-doc.js
│   │   ├── classify-block.js
│   │   ├── build-lesson.js
│   │   └── render-lesson.js
│   ├── progress/
│   │   ├── local-progress.js
│   │   └── progress-sync.js
│   ├── views/
│   │   ├── home-view.js
│   │   ├── paths-view.js
│   │   ├── path-view.js
│   │   ├── lesson-view.js
│   │   └── progress-view.js
│   └── ui/
│       ├── components.js
│       └── errors.js
├── styles/
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   └── lesson.css
├── tests/
│   ├── fixtures/
│   │   └── smm-01-doc.json
│   ├── classify-block.test.js
│   ├── normalize-doc.test.js
│   ├── build-lesson.test.js
│   ├── router.test.js
│   └── progress.test.js
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

## 13. Strategia di test

Test automatici senza accesso ai dati privati:

- classificazione dei prefissi;
- normalizzazione della risposta Docs API;
- costruzione dei capitoli;
- identificatori stabili e duplicati;
- fallback per testo ordinario;
- routing;
- calcolo progresso;
- serializzazione delle righe Sheets;
- gestione degli errori.

La fixture SMM-01 contiene soltanto il contenuto già presente nel pacchetto fornito e serve per simulare la struttura dell’API. Non diventa la fonte live della lezione.

Verifiche manuali:

- desktop Safari;
- mobile;
- navigazione da tastiera;
- autorizzazione Google;
- refresh dopo modifica del Doc;
- rete assente;
- token scaduto;
- documento non autorizzato;
- invio verifica;
- lettura successiva dei risultati.

## 14. Fasi di consegna

### Fase 1 — Fondamenta pubblicabili

- shell;
- routing;
- catalogo percorsi;
- dashboard V3;
- schermate vuote corrette;
- GitHub Pages;
- test di navigazione.

### Fase 2 — Renderer universale

- modello intermedio;
- classificazione semantica;
- capitoli;
- indice;
- componenti didattici;
- test con fixture SMM-01.

### Fase 3 — Collegamento Google Docs

- OAuth;
- Docs/Drive client;
- configurazione SMM-01;
- caricamento live;
- cache;
- errori.

### Fase 4 — Progresso e valutazioni

- progresso locale;
- sincronizzazione Sheets;
- verifiche;
- risultati;
- competenze.

### Fase 5 — Perfezionamento

- QA visivo;
- accessibilità;
- responsive;
- prestazioni;
- rifinitura SMM-01;
- successivo miglioramento del Google Doc alla fonte.

## 15. Criteri di accettazione del primo modulo live

SMM-01 è accettato quando:

1. è raggiungibile da Percorsi → Social Media Manager;
2. mostra un indice cliccabile;
3. permette link diretti ai capitoli;
4. legge il contenuto dal Google Doc;
5. riflette una modifica del Doc dopo refresh;
6. distingue chiaramente tutti i livelli visivi;
7. non appare come un Google Doc incorporato;
8. non contiene testo inventato dal frontend;
9. conserva il progresso;
10. invia e recupera dati privati soltanto tramite API Google autorizzate;
11. non espone token, risposte o risultati nel repository;
12. funziona gratuitamente senza Apps Script.
