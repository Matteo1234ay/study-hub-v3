import { StudyHubError } from "../ui/errors.js";

const STATUS_CODES = Object.freeze({
  401: "authorization-required",
  403: "document-not-authorized",
  404: "document-not-found",
  429: "quota-exceeded"
});

export async function fetchGoogleDoc(docId, token, fetchImpl = fetch) {
  let response;
  try {
    response = await fetchImpl(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(docId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (cause) {
    throw new StudyHubError("network-unavailable", "Google non è raggiungibile.", { cause });
  }
  if (!response.ok) {
    const code = STATUS_CODES[response.status] ?? "invalid-google-response";
    throw new StudyHubError(code, `La richiesta Google non è riuscita (${response.status}).`);
  }
  const document = await response.json();
  if (!document || typeof document !== "object") {
    throw new StudyHubError("invalid-google-response", "La risposta Google non contiene un documento.");
  }
  return document;
}
