import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES, isGoogleConfigured } from "../config/google.js";
import { StudyHubError } from "../ui/errors.js";

let accessToken = null;
let tokenClient = null;

function ensureTokenClient() {
  if (!isGoogleConfigured()) {
    throw new StudyHubError("google-not-configured", "Il client OAuth pubblico non è configurato.");
  }
  if (!globalThis.google?.accounts?.oauth2) {
    throw new StudyHubError("network-unavailable", "La libreria Google Identity Services non è disponibile.");
  }
  tokenClient ??= globalThis.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GOOGLE_SCOPES.join(" "),
    callback: () => {}
  });
  return tokenClient;
}

export function clearAccessToken() {
  accessToken = null;
}

export function getAccessToken({ interactive = false } = {}) {
  if (accessToken) return Promise.resolve(accessToken);
  if (!interactive) {
    return Promise.reject(new StudyHubError("authorization-required", "È necessaria l’autorizzazione Google."));
  }
  let client;
  try {
    client = ensureTokenClient();
  } catch (error) {
    return Promise.reject(error);
  }
  return new Promise((resolve, reject) => {
    client.callback = (response) => {
      if (response.error || !response.access_token) {
        reject(new StudyHubError("authorization-denied", "Google non ha concesso l’accesso."));
        return;
      }
      accessToken = response.access_token;
      resolve(accessToken);
    };
    client.requestAccessToken({ prompt: "consent" });
  });
}
