# Baseline della homepage pubblica 3D

**Rilevazione:** 28 agosto 2026
**URL:** `https://matteo1234ay.github.io/study-hub-v3/`
**Versione asset osservata:** `20260828-14`

## Asset recuperati

| Asset pubblico | SHA-256 | Byte |
|---|---|---:|
| `src/views/home-view.js?v=20260828-14` | `2335269f0b41d6e3a8f4a8f217af678f4bee73e0ec2a534c6e52aeb5c4ea574a` | 5.781 |
| `src/home/study-hub-webgl.js?v=20260828-14` | `dc1be9866fb9f2e5e5d15800decebc1d41d2e8b1626f7ce05b1d8e52a85f6677` | 15.897 |
| `styles/home-immersive.css?v=20260828-14` | `8a5606bc973dfed54cafcb0d22f84372cf1e42829605825977b1ff23fc932be6` | 5.671 |

Le copie di recupero sono conservate localmente in `.recovery/home-20260828-14/` e non fanno parte del prodotto finale.

## Stato osservato nel browser

- Viewport: `1363 × 936`, DPR `1`.
- Canvas visualizzato: `1363 × 936` CSS pixel.
- Buffer interno osservato al primo controllo: `300 × 150` pixel.
- Larghezza documento: `1356` pixel contro `1348` pixel disponibili, con overflow orizzontale visibile.
- Altezza documento: `10456` pixel, pari a oltre undici viewport.
- Primo fotogramma quasi nero: titolo leggibile, ambiente non riconoscibile.
- Sei stazioni funzionali più apertura e vista finale.
- Le didascalie collegano le stazioni alle route reali, ma la scena 3D non rende ancora chiaramente riconoscibili gli oggetti.

## Architettura recuperata

- `home-view.js` genera il canvas, otto didascalie e la timeline di scroll.
- `study-hub-webgl.js` costruisce l'intera stanza con raymarching in un unico fragment shader.
- Lo shader calcola geometrie, materiali, UI degli schermi, camera e luci con un massimo di 96 passaggi per pixel.
- Le luci sono già cumulative nella versione recuperata.
- Il mouse applica un parallax limitato.
- Non è presente un gestore di transizione condivisa verso le route.

## Divergenza del repository

La homepage pubblica `20260828-14` non coincide con `origin/main`, che al momento della rilevazione punta a `a9db8c7`. L'implementazione parte dal ramo affidabile SMM-01 e usa questi asset recuperati soltanto come baseline di confronto. Nessun aggiornamento di `main` è consentito prima della verifica del ramo di anteprima.
