# Study Hub V3

Piattaforma personale di apprendimento statica, gratuita e pubblicabile con GitHub Pages.

## Architettura

- GitHub Pages ospita HTML, CSS, JavaScript e lezioni trasformate in JSON.
- Google Docs pubblicati sul web sono la fonte ufficiale delle lezioni.
- GitHub Actions controlla periodicamente le fonti pubblicate e rigenera i JSON.
- Il browser conserva localmente progressi e backup.
- Ricerca, preferiti, segnalibri, cronologia, note e preferenze di lettura funzionano interamente nel browser.

Non sono usati Google Cloud, Apps Script, OAuth, API a pagamento, backend o segreti.

Il comando **Approfondisci** prepara un testo basato soltanto sul capitolo pubblico: non usa API e non invia nulla automaticamente. L’utente controlla e copia personalmente la richiesta prima di aprire ChatGPT. L’adattatore è separato per consentire in futuro un modello locale senza modificare le lezioni.

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
