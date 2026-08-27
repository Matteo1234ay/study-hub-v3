# Study Hub V3 — Esperienza di lezione basata sulle evidenze

## Obiettivo

Trasformare SMM-01 nella lezione pilota del nuovo Study Hub: un’esperienza editoriale dinamica, coinvolgente e leggibile, nella quale grafica, animazioni e verifiche servono l’apprendimento invece di competere con esso.

Il prototipo deve preservare navigazione, progressi, note, preferiti, approfondimenti e valutazioni già esistenti. Deve inoltre rimanere statico, gratuito e pubblicabile su GitHub Pages, senza backend, API a pagamento o servizi che possano diventare obbligatori.

## Principi approvati

1. La struttura della lezione è ibrida: un capitolo alla volta come modalità predefinita, con indice persistente e vista completa opzionale.
2. Le micro-domande compaiono soltanto nei punti didatticamente rilevanti, non dopo ogni blocco.
3. Le micro-domande usano un controllo morbido: feedback immediato, breve secondo tentativo riformulato e libertà di proseguire.
4. Le fonti sono mostrate su due livelli: richiamo discreto vicino all’affermazione e scheda espandibile con metadati, qualità e limiti.
5. Ogni lezione ha uno stato editoriale: `draft`, `review`, `published`. Solo `published` compare normalmente agli studenti.
6. La prima lezione è sottoposta al controllo completo di Matteo e diventa il modello editoriale per le successive.
7. La direzione visiva è “editoriale dinamica”: ritmo e movimento guidano il percorso, mentre la zona di lettura resta stabile.
8. La modalità focus deve essere sempre reversibile con un controllo visibile e accessibile.

## Fondamento didattico

Il progetto applica in modo prudente:

- recupero attivo con feedback;
- pratica distribuita e ripresa successiva dei concetti non consolidati;
- segmentazione controllata dallo studente;
- segnalazione visiva degli elementi rilevanti;
- uso selettivo dell’interleaving quando occorre distinguere concetti simili;
- esempi e applicazioni orientati al trasferimento.

Nessun principio viene tradotto in una promessa universale. La scheda editoriale deve registrare fonte, contesto, limiti e decisione progettuale. Sono esclusi learning styles, piramide dell’apprendimento, gamification ornamentale e meccanismi di engagement non collegati a un obiettivo formativo.

## Esperienza della lezione

### Testata

La testata contiene titolo, obiettivo operativo, livello, durata stimata, stato della fonte e avanzamento. Le azioni secondarie non devono dominare il primo schermo.

### Indice e navigazione

Su desktop l’indice rimane laterale e indica capitolo attivo, completato e da riprendere. Su schermi piccoli diventa un pannello apribile. I collegamenti precedente e successivo restano disponibili. Ogni cambio di capitolo deve aggiornare correttamente URL, focus della tastiera, posizione e stato attivo.

La vista “capitolo” mostra un solo capitolo. La vista “lezione completa” rende tutti i capitoli in sequenza per consultazione e ricerca, senza cambiare i dati di progresso.

### Corpo del capitolo

Ogni capitolo può contenere:

- obiettivo locale;
- spiegazioni segmentate;
- esempi e controesempi;
- concetti chiave, avvertenze e formule;
- visualizzazioni statiche o animate quando rappresentano informazioni;
- richiami alle fonti;
- micro-domande;
- appunti personali;
- azioni di approfondimento e salvataggio.

Il testo rimane stabile durante la lettura. Le transizioni collegano cambi di fase, feedback e avanzamento; non animano continuamente paragrafi o decorazioni.

## Micro-domande

Una micro-domanda contiene un identificatore stabile, il concetto verificato, il prompt, le opzioni o il tipo di risposta, il feedback per ciascun esito, un eventuale secondo prompt e l’indicazione di riproporre il concetto nel ripasso.

Flusso:

1. lo studente risponde senza essere obbligato a riaprire il testo;
2. riceve feedback esplicativo, non soltanto “giusto” o “sbagliato”;
3. in caso di errore può affrontare una variante breve;
4. può proseguire comunque;
5. il concetto non consolidato viene salvato localmente tra quelli da riprendere.

Le micro-domande non sostituiscono l’esercitazione del capitolo né la verifica riassuntiva del percorso.

## Fonti e controllo editoriale

Una fonte contiene almeno titolo, autori o ente, anno, collegamento, tipo di fonte, data di consultazione e nota editoriale. Per le affermazioni che richiedono cautela include anche qualità dell’evidenza e limiti.

Il richiamo compatto non interrompe la lettura. L’espansione mostra i dettagli nello stesso contesto, senza cambiare pagina. I collegamenti esterni sono azioni esplicite.

Il file della lezione include:

- stato editoriale;
- data e autore dell’ultima revisione;
- elenco delle fonti;
- collegamenti fra blocchi e fonti;
- note editoriali non mostrate allo studente.

Nessuna lezione passa automaticamente da `review` a `published`.

## Movimento e accessibilità

Un’animazione è ammessa soltanto se orienta l’attenzione, rappresenta un processo, comunica un cambiamento di stato, fornisce feedback o rende leggibile l’avanzamento.

Il sistema deve rispettare `prefers-reduced-motion` e offrire un controllo interno per ridurre il movimento. Nessuna informazione può essere comunicata esclusivamente tramite animazione o colore. Focus, contrasto, navigazione da tastiera e lettura tramite tecnologie assistive devono rimanere funzionanti.

## Modalità focus e preferenze di lettura

La modalità focus nasconde gli elementi globali non necessari ma non la navigazione interna indispensabile. Il pulsante “Esci dalla modalità focus” resta fisso, visibile e raggiungibile da tastiera. Il tasto Escape esce dalla modalità focus come scorciatoia aggiuntiva.

Dimensione del testo e larghezza di lettura devono modificare realmente il corpo della lezione e fornire un’anteprima coerente. Le preferenze sono locali e persistenti.

## Dati e compatibilità

Il modello JSON esistente viene esteso in modo retrocompatibile. Le lezioni prive dei nuovi campi continuano a essere renderizzate. I nuovi campi principali sono:

- `editorial` per stato e revisione;
- `sources` per il registro delle fonti;
- `sourceRefs` sui blocchi;
- blocchi `micro-question`;
- metadati facoltativi per obiettivi e visualizzazioni.

Progressi, note e preferiti già salvati non vengono migrati o cancellati. Le chiavi esistenti restano valide.

## Gestione degli errori

- Una fonte mancante mostra “Fonte da verificare” in modalità editoriale e non interrompe il rendering.
- Una micro-domanda non valida viene omessa in modo sicuro e segnalata nei controlli automatici.
- Un capitolo inesistente porta alla lezione e mostra un messaggio comprensibile.
- Se il JSON remoto non è disponibile, resta valido il comportamento della copia locale già previsto.
- Qualunque errore dei controlli di lettura non deve impedire il caricamento della navigazione principale.

## Ambito del prototipo SMM-01

Il primo rilascio introduce l’involucro completo della nuova esperienza su SMM-01. I primi capitoli ricevono inoltre fonti strutturate e micro-domande curate, sufficienti per verificare il modello editoriale. I capitoli rimanenti continuano a funzionare nel nuovo involucro e vengono arricchiti soltanto dopo l’approvazione del prototipo.

Il prototipo non introduce autenticazione, sincronizzazione tra dispositivi, backend, IA automatica, notifiche o automazioni a pagamento.

## Verifica

I test automatici devono coprire:

- retrocompatibilità del modello della lezione;
- rendering di fonti e micro-domande;
- controllo morbido e secondo tentativo;
- registrazione locale dei concetti da riprendere;
- cambio capitolo e vista completa;
- modalità focus, uscita visibile ed Escape;
- dimensione del testo, larghezza e riduzione del movimento;
- navigazione da tastiera e attributi accessibili essenziali;
- assenza di regressioni su valutazioni, note, preferiti e progressi.

La verifica manuale deve essere eseguita almeno su Safari desktop e su una larghezza mobile. Il prototipo è approvato soltanto se la navigazione funziona, nessun contenuto scompare e le preferenze producono cambiamenti visibili.

## Criterio di successo

Matteo deve poter completare i primi capitoli di SMM-01, consultare le fonti, rispondere alle micro-domande, ricevere feedback, entrare e uscire dal focus e ritrovare progressi e note senza blocchi. Solo dopo questa prova il modello viene esteso al resto della lezione e alle lezioni future.
