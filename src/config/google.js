export const GOOGLE_CLIENT_ID = "";

export const GOOGLE_SCOPES = Object.freeze([
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/spreadsheets"
]);

export function isGoogleConfigured() {
  return GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com");
}
