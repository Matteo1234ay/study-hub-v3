# Study Hub V3 — Addendum sincronizzazione a costo e rischio zero

**Data:** 24 agosto 2026  
**Stato:** approvato e prevalente sulla specifica originaria

## Decisione

Study Hub non usa Google Cloud, OAuth, Google Apps Script, API Google, server, database o servizi con prova gratuita. Non viene collegato alcun account di fatturazione.

## Contenuto didattico

Il Google Doc ufficiale viene pubblicato sul web dal proprietario. Un workflow GitHub Actions nel repository pubblico legge la versione pubblicata ogni 15 minuti, elimina markup e script, riconosce la struttura didattica e aggiorna un modello JSON versionato.

Fonte SMM-01:

`https://docs.google.com/document/d/e/2PACX-1vRTVVkxYkCN8QwPRqR4Szdmr0mi4zJRCtasHz1Xw8bvF80nop9Y10VuSXhaNwl_UOUBizJUhAIgRo9F/pub`

Il sincronizzatore esegue un commit solo se il contenuto cambia. GitHub Pages serve l’ultima versione verificata. Il normale ritardo tra modifica e disponibilità è fino a circa 15 minuti, con possibili ritardi occasionali del servizio schedulato.

## Renderer

Il sincronizzatore riconosce:

- titolo della lezione;
- “Obiettivo del modulo”;
- capitoli numerati in sequenza;
- numerazioni interne che ripartono da 1 senza trasformarle in capitoli;
- criterio di completamento;
- nota sulle piattaforme e sulle fonti;
- liste con marcatori visibili;
- prefissi semantici e formule.

Il frontend riceve un modello didattico pulito e non incorpora iframe o HTML del documento.

## Dati personali

Progressi, bozze, risposte e risultati restano nel browser. Study Hub offre esportazione JSON, importazione JSON e cancellazione locale. Non esiste sincronizzazione automatica privata con Google Sheets.

L’aggiornamento del foglio può essere eseguito su richiesta allegando il backup JSON in chat. Nessun dato personale entra nel repository.

## Privacy

La dispensa pubblicata è accessibile a chi possiede il collegamento e può essere indicizzata secondo il comportamento di Google. Gli altri file Drive, i fogli, le risposte e i progressi restano privati e non vengono pubblicati.

## Costi

Si usano soltanto GitHub Pages e GitHub Actions in un repository pubblico. Non vengono attivati billing, servizi cloud fatturabili o aumenti di quota.

## Criteri di accettazione aggiornati

1. SMM-01 viene mostrata dal modello JSON sincronizzato.
2. Una modifica del documento pubblico compare dopo una successiva esecuzione del workflow.
3. Nessun codice OAuth/API Google è presente nel frontend.
4. Il renderer non inserisce HTML remoto direttamente nel DOM.
5. Il progresso sopravvive al refresh nello stesso browser.
6. Backup e ripristino JSON funzionano.
7. Nessun dato personale viene committato.
