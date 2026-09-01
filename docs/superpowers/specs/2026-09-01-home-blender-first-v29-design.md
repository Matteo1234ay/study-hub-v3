# Study Hub Home V29 — Blender-first cinematic redesign

**Data:** 1 settembre 2026  
**Stato:** design approvato in chat; specifica da revisionare prima dell'implementazione  
**Ambito:** sostituzione della homepage 3D di Study Hub V3  
**Supersede per la resa visiva:** `2026-09-01-blender-digital-archive-home-design.md`

## Problema osservato

La home V28 è tecnicamente funzionante ma visivamente non raggiunge il livello richiesto. Lo screenshot di produzione mostra quattro difetti strutturali:

1. quasi tutti i materiali ricadono nella stessa famiglia blu;
2. i mobili principali leggono come primitive smussate / plastica;
3. gli oggetti sono soprattutto scenografia statica e non parti meccaniche credibili;
4. la trasformazione studio → archivio è troppo debole per cambiare davvero la percezione della pagina.

Il problema non viene risolto aggiungendo altri shader o particelle sopra la scena attuale. V29 sostituisce la pipeline visiva principale.

## Obiettivo

Creare una homepage cinematografica scroll-driven con livello di cura paragonabile a un sito 3D premiato: materiali distinti e credibili, composizione intenzionale, movimenti con peso e causalità, dettagli meccanici, trasformazione narrativa completa.

L'ispirazione riguarda qualità di animazione, transizioni e direzione 3D; non vengono copiati asset, layout, branding o codice di Igloo Inc.

## Decisione architetturale: Blender-first

Gli oggetti principali non vengono più generati in Three.js.

### Blender possiede

- stanza e architettura principale;
- scrivania completa;
- cassettiera con cassetti separati;
- sedia ergonomica;
- monitor e supporto;
- lampada articolata;
- mensole e mobile laterale;
- libri, quaderni, fogli e contenitori;
- pivot meccanici corretti;
- clip di animazione fisica;
- materiali PBR e texture locali;
- gerarchia dei nodi destinata al runtime.

### Three.js possiede

- camera scroll-driven;
- `AnimationMixer` e scrubbing delle clip Blender;
- superfici UI dinamiche dei monitor;
- particelle, linee e nuclei dell'archivio digitale;
- transizione finale verso `#/paths`;
- qualità adattiva, responsive e fallback;
- input mouse/touch e riduzione motion.

La scena procedurale V28 resta solo come fallback tecnico durante un errore di caricamento; non deve essere visibile quando il GLB V29 è disponibile.

## Pipeline Blender reale e gratuita

Il repository conterrà:

- `scripts/blender/build-home-v29.py`: generazione/edit della scena;
- `assets/3d/home-v29/study-hub-home-v29.blend`: sorgente Blender risultante;
- `assets/3d/home-v29/study-hub-home-v29.glb`: asset runtime;
- eventuali texture generate localmente, massimo 1024 px per lato;
- un workflow GitHub Actions manuale per eseguire Blender headless e verificare che `.blend` e `.glb` siano riproducibili.

Il workflow usa runner standard del repository pubblico e non introduce servizi a pagamento, API o backend.

## Art direction

La scena non è più monocromatica.

Palette fisica:

- pareti: intonaco grigio caldo / off-white, opaco;
- scrivania e mensole: noce medio-scuro con variazione reale della venatura;
- struttura: grafite e alluminio satinato;
- sedia: tessuto antracite con struttura metallica;
- monitor: vetro nero e cornice grafite;
- carta: bianco caldo / avorio;
- ceramica: neutra;
- luce pratica: calda 2700–3200 K;
- Study Hub blue: solo emissioni, UI, piccoli LED e archivio digitale;
- arancione: accento molto limitato per un punto focale caldo.

Nessun materiale principale deve chiamarsi o apparire come “blue metal”, “blue fabric” o “deep blue floor”.

## Modellazione

Gli oggetti hero devono avere silhouette e costruzione credibili, non semplici box smussati.

### Scrivania

- top con profilo reale e bordo lavorato;
- struttura metallica distinta;
- cassettiera laterale integrata;
- almeno tre frontali cassetto separati;
- guide/interstizi visibili;
- cassetto superiore animabile su un solo asse con limiti realistici;
- secondo cassetto con micro-apertura più breve durante la sequenza;
- maniglie o gola coerente con il design.

### Sedia

- seduta e schienale modellati con superficie curva;
- supporto lombare;
- colonna, razze e ruote separate;
- movimento di roll + piccola rotazione delle ruote;
- nessun volume rettangolare puro per seduta/schienale.

### Lampada

- base, due bracci, snodi e testa separati;
- pivot esattamente sugli snodi;
- accensione con lieve assestamento meccanico;
- cono/diffusore fisicamente leggibile.

### Mobile / mensole

- un'anta con cardine e pivot corretto;
- una mensola/cassetto estraibile;
- libri e card contenuti fisicamente prima di diventare elementi digitali.

### Props

- libri con costa e copertina;
- quaderno con spessore carta;
- fogli/card sottili ma non zero-thickness;
- tastiera, mouse e mug più dettagliati della V28;
- oggetti nominati semanticamente per il runtime.

## Contratto dei nodi GLB

I nodi animati devono avere nomi stabili. Minimo:

- `DeskRoot`
- `DrawerTop`
- `DrawerMiddle`
- `ChairRoot`
- `ChairWheel_*`
- `LampRoot`
- `LampJointLower`
- `LampJointUpper`
- `LampHead`
- `CabinetDoor`
- `PulloutShelf`
- `Book_*`
- `Paper_*`
- `MonitorScreenAnchor`
- `ArchiveOrigin_*`

Three.js non deve cercare nodi per indice; solo per nome o `userData` esportato.

## Clip Blender

Le clip vengono esportate nel GLB e controllate da `AnimationMixer` con tempo derivato dallo scroll, non lasciate in autoplay.

Clip minime:

- `LampWake` — lampada si assesta e si orienta;
- `ChairClear` — sedia arretra/ruota e libera la camera;
- `DrawerReveal` — cassetto superiore si apre con easing meccanico;
- `DrawerSecondary` — seconda micro-apertura;
- `CabinetOpen` — anta laterale ruota sul cardine;
- `ShelfPull` — elemento estraibile scorre;
- `BooksRelease` — libri inclinano e iniziano il passaggio al digitale;
- `PaperLift` — fogli/card emergono e acquistano profondità.

Le azioni meccaniche devono avere overshoot minimo o nullo; l'inerzia viene percepita tramite accelerazione/decelerazione e differenze di massa.

## Timeline narrativa V29

### 0–12% — Establish

La camera entra in una stanza già leggibile. Nessun nero iniziale. Il monitor è spento, la lampada è spenta, le superfici fisiche sono già distinguibili per materiale.

### 12–27% — Wake / apertura fisica

La lampada si accende e si orienta. La sedia arretra con peso. Il monitor si accende. Il cassetto superiore si apre e rivela card/fogli collegati al ripasso. Il secondo cassetto reagisce appena, senza effetto “cassetti impazziti”.

### 27–45% — Knowledge mechanics

Il mobile laterale apre l'anta, una mensola scorre, un libro viene liberato. La camera mostra che le funzioni Study Hub esistono come oggetti fisici: percorso, ripasso, verifica, progresso.

### 45–60% — Physical → semantic

Fogli, card e libri si sollevano. Le loro posizioni iniziali derivano dai contenitori reali. Compaiono connessioni digitali sottili, mentre mobili e pareti restano ancora solidi.

### 60–78% — Disassembly

La stanza si smonta per parti, non con una dissolvenza globale. Carta e piccoli props reagiscono prima; monitor e mobili dopo. Cassetti/anta restano coerenti con le loro gerarchie mentre si separano. Colore e luce passano dal fisico caldo al digitale più freddo.

### 78–94% — Digital archive

L'ambiente fisico è quasi assente. Le funzioni diventano nuclei spatiali per Percorsi, Ripasso, Progressi, Verifiche e Cerca. Particelle e linee sono semanticamente collegate e deterministiche.

### 94–100% — Paths handoff

`Percorsi` diventa il nucleo dominante e si espande nel portale esistente verso `#/paths`. La transizione resta reversibile.

## Scrubbing e reversibilità

Il progresso della home è la sola sorgente temporale.

- ogni clip Blender viene mappata a una finestra della timeline;
- `AnimationAction.paused = true` e il runtime imposta il tempo direttamente;
- tornare indietro nello scroll chiude realmente cassetti/anta e riporta la sedia/oggetti al loro stato iniziale;
- non vengono usati timeout per coordinare la coreografia principale;
- gli effetti Three.js leggono lo stesso stato di progressione delle clip Blender.

## Materiali e illuminazione

- Principled/PBR con roughness distinta per legno, metallo, tessuto, carta, ceramica, vetro;
- texture procedurali locali generate offline e incluse nell'asset quando utili;
- nessuna texture remota;
- key light morbida e neutra;
- practical lamp calda;
- fill freddo leggero solo per separazione;
- emissioni blu controllate;
- niente dominante blu sulle superfici fisiche;
- esposizione e tone mapping calibrati per evitare look “plastica lucida”.

## Camera

La camera non salta semplicemente fra sei stazioni. V29 usa una coreografia continua:

1. ingresso e reveal del desk;
2. breve avvicinamento al cassetto mentre si apre;
3. lateral move verso cabinet/memory;
4. ritorno verso il centro mentre gli oggetti si sollevano;
5. pull-back durante lo smontaggio;
6. attraversamento dell'archivio;
7. dolly finale verso Percorsi.

Le inquadrature mobile sono dedicate, non semplici FOV più larghi della versione desktop.

## UI DOM

La navbar Study Hub resta, ma la scena deve essere il focus.

- nessuna duplicazione visiva forte tra nav principale e quick nav;
- overlay lezione più leggero e integrato;
- captions visibili solo quando servono;
- UI non deve coprire l'oggetto che sta eseguendo l'azione;
- transizione finale elimina progressivamente il chrome non necessario.

## Performance

Budget target runtime V29:

- GLB + texture principali: preferibilmente <= 12 MiB, hard limit 18 MiB;
- texture max 1024px, 512px dove basta;
- geometria hero più dettagliata ma con LOD/quality profile;
- ombre solo su oggetti rilevanti;
- particelle adattive high/balanced/low;
- mobile riduce particelle, shadow maps e dettagli secondari, non la storia.

## Fallback

Ordine dei fallback:

1. V29 Blender-first;
2. V28 procedural solo se il GLB fallisce;
3. DOM accessibile se WebGL non è disponibile.

Il fallback V28 non deve comparire per qualche frame prima di V29: lo stato “ready” arriva solo dopo il primo frame V29 oppure dopo la decisione esplicita di fallback.

## Privacy e costi

- hosting GitHub Pages;
- Three.js locale;
- Blender e build offline/headless;
- nessuna API a pagamento;
- nessun backend;
- nessun analytics/tracker nuovo;
- nessuna richiesta runtime a CDN o asset host esterni;
- nessun dato personale inviato fuori dal browser.

## Test e verifiche

### Test automatici

Devono verificare almeno:

- asset `.blend` e `.glb` presenti e dentro budget;
- GLB valido (`glTF`, versione 2, lunghezza coerente);
- nodi minimi presenti;
- clip minime presenti;
- `AnimationMixer` usato in modalità scrub, non autoplay;
- progressione deterministica e reversibile;
- V29 atteso prima dello stato `ready`;
- assenza di runtime URL esterni;
- token release nuovo lungo tutto il grafo Home;
- route/store/test esistenti senza regressioni.

### Verifica visiva

La CI non basta. Prima del merge va verificata almeno una cattura desktop reale della home pubblicata/preview e controllati:

- almeno cinque famiglie materiali chiaramente distinguibili;
- pareti/pavimento non blu dominante;
- sedia non rettangolare/plastica;
- cassetto visibilmente integrato e in grado di aprirsi;
- lampada articolata credibile;
- nessun oggetto hero che sembri una primitiva isolata;
- trasformazione chiaramente percepibile prima del 50% scroll;
- archivio digitale dominante nella parte finale.

## Criteri di accettazione finali

La V29 è accettabile solo se:

1. il primo frame è visivamente diverso dalla V28 anche senza scroll;
2. gli oggetti principali provengono dal GLB Blender V29;
3. il look fisico usa almeno legno, metallo, tessuto, vetro/carta e superfici murarie distinguibili;
4. almeno due cassetti/elementi meccanici e un'anta/mensola eseguono movimenti reali e reversibili;
5. sedia e lampada hanno movimenti gerarchici credibili;
6. gli oggetti fisici originano semanticamente la trasformazione digitale;
7. la fase finale è un archivio digitale, non la stessa stanza con particelle sopra;
8. Percorsi mantiene l'handoff funzionante;
9. desktop e mobile mantengono la stessa narrazione con regia dedicata;
10. tutto resta statico, gratuito, locale e privacy-preserving;
11. suite automatica e secret scan sono verdi;
12. una verifica visiva reale conferma che non è più la stanza monocromatica/plastica della V28.
