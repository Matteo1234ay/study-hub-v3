# Study Hub V3 — Zero-Cost Remaining Implementation Plan

**Goal:** Completare progressi locali, backup JSON, sicurezza, pubblicazione e verifica della sincronizzazione senza Google Cloud.

**Spec:** `docs/superpowers/specs/2026-08-24-zero-cost-sync-amendment.md`

## Task 1 — Progressi locali e backup

- [ ] Testare chiavi, percentuali, esportazione, importazione e validazione.
- [ ] Implementare completamento capitoli e percentuale lezione.
- [ ] Implementare bozze di verifica locali.
- [ ] Implementare download JSON, import JSON e cancellazione dati.
- [ ] Aggiungere schermata Progressi.
- [ ] Eseguire tutti i test e committare.

## Task 2 — Verifica sincronizzazione pubblica

- [ ] Verificare il modello iniziale SMM-01: 19 capitoli e contenuto non vuoto.
- [ ] Verificare che il parser ignori script, stili e numerazioni interne.
- [ ] Verificare il workflow manuale GitHub Actions sul ramo principale dopo integrazione.
- [ ] Confermare che un documento invariato non produca commit.

## Task 3 — Sicurezza, accessibilità e rilascio

- [ ] Aggiungere Content Security Policy senza domini Google API.
- [ ] Aggiungere workflow test gratuito.
- [ ] Controllare assenza di segreti e dati personali.
- [ ] Verificare tastiera, motion ridotto, mobile e Safari.
- [ ] Integrare il branch dopo revisione.
- [ ] Attivare GitHub Pages da `main` e verificare il sito pubblico.
