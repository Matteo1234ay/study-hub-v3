import { element } from "./components.js";

export class StudyHubError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "StudyHubError";
    this.code = code;
  }
}

const ERROR_COPY = Object.freeze({
  "google-not-configured": ["Collegamento Google da configurare", "Manca il client OAuth pubblico. Il codice della piattaforma è pronto, ma Google deve ancora autorizzare questo indirizzo."],
  "authorization-required": ["Accedi a Google", "Autorizza Study Hub a leggere la fonte ufficiale della lezione."],
  "authorization-denied": ["Autorizzazione non concessa", "Nessun dato è stato letto. Puoi riprovare quando vuoi."],
  "document-not-authorized": ["Documento non autorizzato", "L’account selezionato non può leggere questo Google Doc."],
  "document-not-found": ["Documento non trovato", "La fonte configurata non esiste più oppure il suo identificativo è cambiato."],
  "quota-exceeded": ["Limite temporaneo raggiunto", "Attendi qualche istante e riprova. Study Hub non effettuerà richieste infinite."],
  "network-unavailable": ["Connessione assente", "Google non è raggiungibile. Se esiste una copia salvata verrà mostrata."],
  "invalid-google-response": ["Risposta non valida", "Google ha restituito dati che Study Hub non può interpretare in sicurezza."]
});

export function renderErrorState(error, { onRetry = null, onAuthorize = null } = {}) {
  const [title, message] = ERROR_COPY[error.code] ?? ["Qualcosa non ha funzionato", "Riprova oppure torna al percorso."];
  const actions = element("div", { className: "error-actions" });
  if (onAuthorize && ["authorization-required", "authorization-denied", "google-not-configured"].includes(error.code)) {
    const button = element("button", { className: "button primary", text: "Collega Google", attrs: { type: "button" } });
    button.addEventListener("click", onAuthorize);
    actions.append(button);
  }
  if (onRetry) {
    const button = element("button", { className: "button quiet", text: "Riprova", attrs: { type: "button" } });
    button.addEventListener("click", onRetry);
    actions.append(button);
  }
  return element("section", { className: "error-state", attrs: { role: "alert" } }, [
    element("p", { className: "eyebrow", text: error.code }),
    element("h2", { text: title }),
    element("p", { text: message }),
    actions
  ]);
}
