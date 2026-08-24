import { element } from "./components.js";

export function createStudyDialog() {
  const prompt = element("textarea", { className: "study-prompt", attrs: { readonly: "", rows: "14", "aria-label": "Richiesta di approfondimento" } });
  const status = element("p", { className: "dialog-status", attrs: { role: "status" } });
  const copy = element("button", { className: "button primary", text: "Copia richiesta", attrs: { type: "button" } });
  const external = element("a", { className: "button quiet", text: "Apri ChatGPT", href: "https://chatgpt.com/", attrs: { target: "_blank", rel: "noopener noreferrer" } });
  const close = element("button", { className: "button quiet", text: "Chiudi", attrs: { type: "button" } });
  const dialog = element("dialog", { className: "study-dialog" }, [
    element("p", { className: "eyebrow", text: "Contenuto pubblico" }),
    element("h2", { text: "Approfondisci il capitolo" }),
    element("p", { text: "Controlla il testo, copialo e decidi tu se incollarlo in una nuova chat. Note e progressi non sono inclusi." }),
    prompt, status,
    element("div", { className: "dialog-actions" }, [copy, external, close])
  ]);
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(prompt.value); status.textContent = "Richiesta copiata."; }
    catch { prompt.focus(); prompt.select(); status.textContent = "Copia automatica non disponibile: usa il testo selezionato."; }
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  return {
    node: dialog,
    open(text) { prompt.value = text; status.textContent = ""; dialog.showModal(); },
  };
}
