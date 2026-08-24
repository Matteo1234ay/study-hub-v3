import { StudyHubError } from "../ui/errors.js";

export async function fetchDriveMetadata(fileId, token, fetchImpl = fetch) {
  const fields = encodeURIComponent("id,name,modifiedTime,version");
  let response;
  try {
    response = await fetchImpl(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=${fields}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (cause) {
    throw new StudyHubError("network-unavailable", "Google non è raggiungibile.", { cause });
  }
  if (!response.ok) throw new StudyHubError(response.status === 429 ? "quota-exceeded" : "invalid-google-response", "Impossibile leggere i metadati Drive.");
  return response.json();
}
