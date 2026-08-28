const PROFILES = Object.freeze(["low", "balanced", "high"]);
const DPR_CAPS = Object.freeze({ high: 1.5, balanced: 1.25, low: 1 });

function validProfile(value) {
  return PROFILES.includes(value) ? value : "high";
}

export function createQualityController({
  devicePixelRatio = 1,
  reducedMotion = false,
  initialProfile,
  now = () => performance.now()
} = {}) {
  let profile = validProfile(initialProfile ?? (reducedMotion ? "balanced" : "high"));
  let visible = true;
  let slowFrames = 0;
  let fastFrames = 0;
  let lastChange = now();

  function changeProfile(direction) {
    const index = PROFILES.indexOf(profile);
    const next = PROFILES[Math.max(0, Math.min(PROFILES.length - 1, index + direction))];
    if (next === profile) return false;
    profile = next;
    lastChange = now();
    slowFrames = 0;
    fastFrames = 0;
    return true;
  }

  function recordFrame(milliseconds) {
    if (!visible || reducedMotion || !Number.isFinite(milliseconds)) return false;
    if (milliseconds > 24) {
      slowFrames += 1;
      fastFrames = 0;
      if (slowFrames >= 90) return changeProfile(-1);
    } else if (milliseconds < 15) {
      fastFrames += 1;
      slowFrames = 0;
      if (fastFrames >= 180 && now() - lastChange >= 10_000) return changeProfile(1);
    } else {
      slowFrames = 0;
      fastFrames = 0;
    }
    return false;
  }

  return {
    get profile() { return profile; },
    get isVisible() { return visible; },
    get isStatic() { return reducedMotion; },
    getDprCap() {
      return Math.min(Math.max(.75, Number(devicePixelRatio) || 1), DPR_CAPS[profile]);
    },
    recordFrame,
    setVisible(value) {
      visible = Boolean(value);
      slowFrames = 0;
      fastFrames = 0;
      return visible;
    }
  };
}
