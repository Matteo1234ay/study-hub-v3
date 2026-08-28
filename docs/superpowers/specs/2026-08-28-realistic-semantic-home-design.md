# Homepage 3D realistica e semantica — specifica di progetto

**Data:** 28 agosto 2026
**Stato:** approvata per la pianificazione tecnica
**Ambito:** homepage di Study Hub V3

## Obiettivo

Trasformare la homepage in uno studio contemporaneo tridimensionale, realistico, cinematico e funzionale. La stanza non deve essere una dimostrazione WebGL né una scenografia futuristica generica: deve rappresentare fisicamente le funzioni che esistono davvero nello Study Hub.

Il successo non si misura dal numero di effetti, ma dalla capacità dell'utente di:

1. capire immediatamente di trovarsi in uno spazio di studio;
2. riconoscere le funzioni rappresentate dagli oggetti;
3. raggiungere rapidamente le sezioni operative;
4. seguire il tour senza perdita di fluidità o orientamento;
5. percepire materiali, proporzioni, luci e movimenti come credibili.

## Decisione tecnica

L'attuale homepage pubblica costruisce stanza, oggetti, materiali, schermi, illuminazione e camera dentro un unico shader di raymarching. Questa soluzione è compatta, ma rende gli oggetti inevitabilmente sintetici, accoppia responsabilità diverse e usa fino a 96 passaggi per pixel a pieno schermo.

La nuova homepage userà una scena rasterizzata con geometrie tridimensionali reali e un motore 3D leggero mantenuto localmente nel repository. Il motore sarà caricato in modo asincrono soltanto nella homepage; nessuna funzione dipenderà da CDN, API esterne o servizi a pagamento.

Vincoli:

- nessun backend;
- nessuna API a consumo;
- nessuna dipendenza runtime remota;
- qualità adattiva e limite del pixel ratio;
- caricamento progressivo con fallback immediato;
- nessun modello o texture di grandi dimensioni;
- preferenza per geometrie semplici ben costruite, smussi e materiali procedurali.

## Sorgente semantica

Prima dell'implementazione verranno inventariati routing, configurazione dei percorsi e view esistenti. La homepage potrà rappresentare soltanto funzioni reali:

- Home;
- Percorsi;
- lezioni e capitoli;
- note e ripasso;
- ricerca;
- progressi;
- verifiche progressive;
- esame finale;
- modalità Focus;
- posizione e avanzamento dell'utente;
- percorsi presenti ma incompleti;
- Social Media Marketing, attualmente il percorso più sviluppato.

Le informazioni dinamiche — ultima lezione, capitolo, progresso, numero di percorsi e disponibilità delle verifiche — saranno lette dagli store e dalle configurazioni già presenti. Non saranno duplicate come testo statico nella scena.

## Struttura della stanza

La stanza conterrà circa 15–20 oggetti convincenti. Ogni zona avrà una funzione precisa.

### Postazione principale

La scrivania rappresenta la ripresa dello studio:

- monitor principale con vera anteprima della lezione attiva;
- titolo della lezione e capitolo corrente;
- avanzamento;
- azione per continuare;
- tastiera, mouse, lampada articolata e sedia ergonomica proporzionati.

Quando la postazione diventa attiva, monitor e lampada si accendono. Il monitor produce luce fredda; la lampada produce luce calda. Le luci restano accese nelle fasi successive.

### Memoria di studio

Una bacheca e una mensola rappresentano note, ripasso, elementi salvati e memoria:

- schede leggibili;
- quaderni e raccoglitori;
- indicatori di concetti da ripassare;
- collegamento alla view Ripasso.

Le mensole non saranno vuote e non conterranno decorazioni casuali.

### Social Media Marketing

Un display verticale dedicato rappresenta il percorso attivo con visual realistici:

- struttura della lezione;
- reach e impression;
- watch time;
- retention;
- andamento del percorso.

I visual saranno derivati dai contenuti reali di SMM-01 e assomiglieranno a interfacce analitiche credibili, senza copiare marchi esterni.

### Verifica

Una console o un tablet inclinato mostrerà:

- domanda;
- opzioni;
- risposta selezionata;
- feedback;
- avanzamento e punteggio quando disponibili.

La console collegherà alla verifica progressiva esistente.

### Progressi

Un pannello a parete mostrerà completamento, competenze, aree forti e aree da consolidare. I dati visivi dovranno corrispondere allo stato reale dell'utente quando disponibile.

### Percorsi futuri

I percorsi incompleti saranno rappresentati come raccoglitori, pannelli chiusi o moduli in standby. Comunicheranno chiaramente che esistono nella struttura ma non sono ancora disponibili.

### Ricerca e modalità Focus

La ricerca rimarrà accessibile nel pannello rapido della homepage. La modalità Focus non avrà una stazione separata: sarà suggerita dalla postazione di lettura e resterà una funzione della lezione, evitando di inventare un oggetto artificiale.

## Regia e percorso

La homepage userà cinque o sei stazioni, riducendo l'attuale percorso di oltre dieci schermate.

L'apertura sarà un'inquadratura a tre quarti frontale, leggermente rialzata. Il monitor sarà visibile; la sedia potrà occupare un margine laterale ma non coprirà la postazione.

Ogni segmento avrà:

- ingresso;
- decelerazione;
- composizione stabile;
- tempo di lettura;
- uscita continua.

Posizione della camera, bersaglio e campo visivo saranno interpolati con una timeline dichiarativa. Il testo apparirà soltanto quando l'oggetto corrispondente è già inquadrato.

## Illuminazione

Il primo fotogramma sarà scuro ma leggibile. Scrivania, sedia, monitor, lampada, pareti e mensole dovranno essere identificabili prima di qualsiasi interazione.

Le luci saranno cumulative:

1. luce ambientale minima;
2. monitor e lampada della scrivania;
3. luce della memoria di studio;
4. display Social Media;
5. console della verifica;
6. pannello dei progressi;
7. area dei percorsi futuri;
8. illuminazione generale nel finale.

Nessuna luce si spegnerà soltanto perché la camera cambia soggetto. Ombre morbide, contatto e occlusione ambientale verranno usati con budget controllato.

## Geometrie e materiali

Le primitive potranno essere usate come base costruttiva, ma non dovranno rimanere riconoscibili come contenuto finale. Gli oggetti avranno spessore, smussi, supporti, giunti, cornici, basi e proporzioni plausibili.

Materiali procedurali:

- legno con variazioni di tono, venatura e rugosità;
- metallo satinato con riflessi controllati;
- tessuto opaco con micro-grana;
- vetro dei monitor con Fresnel, riflessi ed emissione soltanto da acceso;
- pareti opache con irregolarità minima;
- pavimento riconoscibile con contatto credibile con i mobili.

Il dettaglio sarà concentrato sugli oggetti osservati da vicino.

## Interfaccia e accessibilità

Il testo DOM resterà la sorgente di verità, con gerarchia: occhiello, titolo, descrizione e azione. Non verranno usate card generiche da landing page.

Un pannello rapido sempre disponibile consentirà di aprire Lezione, Percorsi, Cerca, Ripasso e Progressi senza completare il tour.

Con `prefers-reduced-motion` o l'impostazione interna di riduzione del movimento:

- la stanza userà composizioni statiche;
- il routing sarà quasi immediato;
- parallax e movimenti intensi saranno disattivati;
- tutte le funzioni resteranno accessibili.

Su mobile verrà usata una versione alleggerita con meno geometrie, ombre ridotte e inquadrature semplificate. Se WebGL non è disponibile, verrà mostrata una homepage DOM completa e funzionale.

## Interazione e transizioni

Il puntatore produrrà soltanto un parallax molto lieve, piccoli riflessi e un feedback sottile sugli oggetti cliccabili. Non potrà alterare la composizione della camera.

Il click su una stazione avvierà una transizione condivisa di 400–900 ms:

- monitor principale → lezione;
- bacheca → ripasso;
- display Social Media → percorso;
- console → verifica;
- pannello progressi → progressi;
- archivio → percorsi.

La camera si avvicinerà all'oggetto; un overlay DOM coerente assorbirà l'ultima parte del movimento e diventerà la pagina di destinazione. La View Transitions API sarà usata quando disponibile, con fallback CSS/JavaScript. La navigazione resterà interrompibile e non verrà ritardata in modalità ridotta.

## Architettura

La homepage sarà suddivisa in moduli con responsabilità isolate:

- inventario semantico delle stazioni;
- costruzione della scena;
- materiali procedurali;
- UI dei display;
- timeline della camera;
- stato cumulativo delle luci;
- gestione interazioni e oggetti cliccabili;
- transizioni e integrazione con il router;
- qualità adattiva e fallback;
- view DOM e collegamento ai dati reali.

Il router continuerà a essere la sorgente delle destinazioni. Il sistema di transizione chiederà una navigazione al router solo dopo aver completato o saltato l'animazione; non duplicherà la logica di routing.

## Prestazioni

Ordine di priorità: camera, illuminazione, materiali, silhouette e proporzioni, dettagli.

Controlli previsti:

- lazy loading del renderer;
- pixel ratio limitato;
- geometrie condivise e instancing dove utile;
- numero limitato di luci con ombra;
- ombre disattivate o semplificate sui dispositivi meno potenti;
- sospensione del rendering quando la pagina non è visibile;
- qualità adattiva in base al tempo medio dei frame;
- nessun caricamento remoto necessario al funzionamento.

## Compatibilità con la versione esistente

La homepage pubblica osservata usa asset `20260828-14`, mentre il ramo remoto `main` è stato riportato a una revisione precedente dall'automazione. Prima di scrivere il nuovo renderer, la versione pubblica corrente verrà recuperata in un ramo isolato e confrontata con `main`. Nessun file di lezioni, note, assessment, progressi o protezione Safari verrà sovrascritto.

La sincronizzazione automatica dei contenuti non dovrà modificare file della homepage né riportare indietro il codice applicativo.

## Test e criteri di accettazione

L'implementazione seguirà TDD. I test dovranno dimostrare almeno:

- apertura frontale a tre quarti;
- monitor principale non occluso;
- primo frame leggibile;
- luci cumulative;
- illuminazione generale soltanto nel finale;
- presenza dei materiali procedurali approvati;
- corrispondenza tra ogni stazione, visual, testo e route;
- assenza di oggetti astratti usati come contenuto principale;
- pannello di accesso rapido funzionante;
- transizioni condivise e fallback;
- reduced motion;
- fallback senza WebGL;
- assenza di overflow orizzontale;
- canvas alla risoluzione corretta;
- navigazione, Focus e funzioni esistenti non regredite;
- suite completa del progetto verde.

La verifica manuale finale includerà desktop Safari, viewport mobile e almeno un profilo con riduzione del movimento.

## Fuori ambito

- backend, account o autenticazione;
- nuove funzioni didattiche non già previste;
- modelli 3D acquistati;
- contenuti generati tramite API;
- audio automatico;
- libertà di movimento da videogioco;
- decorazioni sci-fi o oggetti privi di funzione.
