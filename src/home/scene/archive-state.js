const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));

function smoothRange(value, start, end) {
  const x = clamp01((clamp01(value) - start) / Math.max(.0001, end - start));
  return x * x * (3 - 2 * x);
}

export function resolveArchivePhase(progress) {
  const value = clamp01(progress);
  const phase = value < .18 ? "studio"
    : value < .48 ? "knowledge"
      : value < .64 ? "destabilize"
        : value < .82 ? "fragment"
          : value < .96 ? "archive"
            : "handoff";

  return Object.freeze({
    progress: value,
    phase,
    studio: 1 - smoothRange(value, .48, .82),
    knowledge: smoothRange(value, .12, .48) * (1 - smoothRange(value, .64, .86)),
    destabilize: smoothRange(value, .48, .64) * (1 - smoothRange(value, .76, .9)),
    fragment: smoothRange(value, .61, .82) * (1 - smoothRange(value, .91, .995)),
    archive: smoothRange(value, .76, .93),
    handoff: smoothRange(value, .95, 1)
  });
}

const ARCHIVE_BUDGETS = Object.freeze({
  high: Object.freeze({ particles: 420, fragments: 96, connections: 10 }),
  balanced: Object.freeze({ particles: 260, fragments: 64, connections: 8 }),
  low: Object.freeze({ particles: 140, fragments: 36, connections: 6 })
});

export function resolveArchiveBudget({ profile = "balanced", mobile = false } = {}) {
  const base = ARCHIVE_BUDGETS[profile] ?? ARCHIVE_BUDGETS.balanced;
  if (!mobile) return { ...base };
  return {
    particles: Math.max(72, Math.round(base.particles * .58)),
    fragments: Math.max(20, Math.round(base.fragments * .58)),
    connections: Math.min(6, base.connections)
  };
}
