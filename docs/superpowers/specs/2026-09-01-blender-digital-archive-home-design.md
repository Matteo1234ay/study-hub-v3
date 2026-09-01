# Blender + archivio digitale — specifica di progetto

**Data:** 1 settembre 2026  
**Stato:** approvata dall'utente e pronta per implementazione  
**Ambito:** homepage di Study Hub V3  
**Estende:** `docs/superpowers/specs/2026-08-28-realistic-semantic-home-design.md`

## Obiettivo

Portare la homepage oltre l'aspetto da MVP procedurale: l'esperienza deve iniziare come uno studio fisico credibile e trasformarsi, attraverso lo scroll, in un archivio digitale tridimensionale che rappresenta le funzioni reali di Study Hub.

La narrazione resta continua e reversibile: se lo scroll si ferma, anche la scena si ferma in una composizione intenzionale; se lo scroll torna indietro, la trasformazione torna indietro.

## Decisione tecnica

La pipeline resta completamente gratuita e statica:

- Three.js vendorizzato localmente nel repository;
- asset glTF/GLB locali, modificabili in Blender e caricati con `GLTFLoader`;
- shader GLSL e geometrie di supporto scritti nel progetto;
- nessun backend, CDN, API a consumo o richiesta runtime esterna;
- GitHub Pages come hosting;
- DOM fallback completo se WebGL non parte.

La scena procedurale esistente rimane come fallback e come supporto semantico/interattivo, ma gli oggetti principali vicini alla camera devono essere sostituiti o coperti da asset 3D reali caricati dal repository.

## Sequenza narrativa

### 1. Ingresso nello studio — 0–18%
La camera entra lentamente in uno studio leggibile già dal primo frame. Scrivania, monitor, sedia e lampada hanno materiali fisici e proporzioni credibili. Le luci si accendono in tempi diversi e restano cumulative.

### 2. La conoscenza prende forma — 18–48%
Monitor, bacheca, display e console mostrano le funzioni reali: studio, ripasso, percorso SMM, verifiche e progressi. Gli oggetti hanno micro-movimenti con inerzia, senza effetto hover da landing page.

### 3. Instabilità — 48–64%
L'illuminazione diventa più fredda, compaiono linee di scansione e piccoli frammenti emissivi. Gli oggetti reali restano riconoscibili ma iniziano a separarsi dal loro stato fisico.

### 4. Smontaggio — 64–82%
Gli oggetti si trasformano con differenze di massa: elementi pesanti si spostano lentamente e ruotano poco, fogli/schede reagiscono prima, superfici digitali producono frammenti più leggeri. Non viene usata una dissolvenza uniforme.

### 5. Archivio digitale — 82–96%
La stanza fisica scompare quasi del tutto. Restano nuclei per Percorsi, Ripasso, Progressi, Verifiche e Cerca, collegati da particelle e linee. La densità dipende dal profilo qualità.

### 6. Handoff a Percorsi — 96–100%
Il nucleo Percorsi diventa il portale condiviso già usato dalla transizione `#/paths`. Il sistema esistente di resume/reverse resta intatto.

## Asset 3D

- Runtime asset budget iniziale: massimo 8 MiB aggiuntivi.
- Nessuna texture 4K.
- Asset esterni ammessi solo se CC0 e documentati in `assets/3d/ATTRIBUTION.md`.
- Asset creati internamente includono una sorgente riproducibile compatibile con Blender oppure una descrizione di build.
- Il caricamento ha timeout finito e fallback immediato alla geometria esistente.
- Il primo set copre almeno la massa visiva principale della postazione: scrivania, monitor e prop vicini alla camera. La lampada CC0 già presente resta utilizzabile.

## Stato di trasformazione

Un controller dedicato produce uno stato puro derivato da `journey` con le fasi `studio`, `knowledge`, `destabilize`, `fragment`, `archive`, `handoff`. Ogni fase espone intensità continue 0–1, così renderer, luci, asset fisici e archivio digitale usano la stessa sorgente temporale.

## Archivio digitale

- nuclei emissivi collegati alle stazioni reali;
- particelle `Points` e connessioni lineari a basso costo;
- movimento orbitale lento e deterministico;
- densità ridotta su mobile e profilo `low`;
- nessun oggetto sci-fi decorativo senza route/funzione.

## Qualità adattiva

- `high`: ombre morbide, densità archivio alta, DPR maggiore ma limitato;
- `balanced`: ombre selettive, densità media;
- `low`: ombre dinamiche ridotte, densità e frammenti limitati.

Su mobile resta la stessa storia con budget inferiore e inquadrature più stabili.

## Accessibilità e fallback

- `prefers-reduced-motion` conserva tutte le funzioni ma rende la trasformazione quasi statica;
- se l'asset principale fallisce, resta visibile la stanza procedurale esistente;
- se WebGL non è disponibile, resta la homepage DOM;
- nessuna modifica a note, progressi, assessment, contenuti delle lezioni o store.

## Privacy e costi

Il runtime resta compatibile con la CSP locale già presente in `index.html`: nessuna rete esterna necessaria per visualizzare la home. Nessun servizio richiede account, chiave API, carta di credito o abbonamento.

## Criteri di accettazione

- asset 3D principale locale caricato con timeout e fallback;
- nessun URL `http(s)` eseguibile nei moduli runtime della home;
- stato della trasformazione deterministico e reversibile;
- archivio digitale presente e legato alle stazioni reali;
- Percorsi è il nucleo finale e usa l'handoff esistente;
- densità adattiva per profilo e mobile;
- first frame leggibile;
- suite `node --test` verde;
- secret scan verde;
- nessuna regressione delle route e degli store.
