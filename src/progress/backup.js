const PREFIX = "study-hub-v3:";

function invalidBackup() {
  throw new Error("Backup non valido");
}

export function exportLocalData(storage = localStorage, now = () => new Date().toISOString()) {
  const entries = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(PREFIX)) entries[key] = storage.getItem(key);
  }
  return { schemaVersion: 1, exportedAt: now(), entries };
}

export function importLocalData(backup, storage = localStorage) {
  if (!backup || backup.schemaVersion !== 1 || !backup.entries || Array.isArray(backup.entries) || typeof backup.entries !== "object") {
    invalidBackup();
  }
  const entries = Object.entries(backup.entries);
  if (entries.some(([key, value]) => !key.startsWith(PREFIX) || typeof value !== "string")) invalidBackup();
  for (const [key, value] of entries) storage.setItem(key, value);
  return entries.length;
}
