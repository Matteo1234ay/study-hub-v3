const STORAGE_KEY = "study-hub:cinematic-route:v1";
const ENTRY_TTL = 300_000;

function clampResume(value) {
  return Math.min(.97, Math.max(.8, Number(value) || .94));
}

export function createCinematicRouteState(
  storage = globalThis.sessionStorage,
  now = () => Date.now()
) {
  function clear() {
    try { storage?.removeItem?.(STORAGE_KEY); } catch { /* Storage is optional. */ }
  }

  function write(phase, resumeProgress) {
    try {
      storage?.setItem?.(STORAGE_KEY, JSON.stringify({
        phase,
        resumeProgress: clampResume(resumeProgress),
        createdAt: Number(now()) || Date.now()
      }));
    } catch { /* Navigation remains functional without storage. */ }
  }

  function consume(expectedPhase) {
    let record = null;
    try { record = JSON.parse(storage?.getItem?.(STORAGE_KEY) ?? "null"); } catch { clear(); }
    if (!record || record.phase !== expectedPhase
      || !Number.isFinite(record.createdAt)
      || Math.max(0, Number(now()) - record.createdAt) > ENTRY_TTL) {
      clear();
      return null;
    }
    clear();
    return { resumeProgress: clampResume(record.resumeProgress) };
  }

  return {
    markExit({ resumeProgress = .97 } = {}) { write("paths-entry", resumeProgress); },
    consumePathsEntry() { return consume("paths-entry"); },
    markReturn({ resumeProgress = .97 } = {}) { write("home-resume", resumeProgress); },
    consumeHomeResume() { return consume("home-resume"); },
    clear
  };
}
