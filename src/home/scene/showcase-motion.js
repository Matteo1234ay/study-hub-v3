export const SHOWCASE_OBJECTS = Object.freeze([
  ['desk', 'Learning_Book'], ['memory', 'Memory_Cards'],
  ['social', 'Course_Path'], ['assessment', 'Assessment_Checklist'],
  ['progress', 'Progress_Steps'], ['future-paths', 'Path_Archive']
]);
export const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
export const ease = value => { const t = clamp(value); return t*t*t*(t*(t*6-15)+10); };
export const windowProgress = (value, start, end) => ease((value-start)/(end-start));

// Fit a bounding sphere inside the narrower camera dimension with room for
// separated parts. This remains valid for tall phones and wide desktop windows.
export function framingDistance(radius, aspect, fov = 36) {
  const vertical = fov*Math.PI/360;
  const horizontal = Math.atan(Math.tan(vertical)*Math.max(.15, aspect));
  return radius / Math.sin(Math.min(vertical, horizontal)) * 1.28;
}

export function sampleShowcase(value, aspect = 1.6) {
  const progress = clamp(value);
  const index = Math.min(5, Math.floor(progress*6));
  const local = progress === 1 ? 1 : progress*6-index;
  const approach = windowProgress(local, 0, .24);
  const opening = windowProgress(local, .27, .62);
  const release = index === 5 ? 0 : windowProgress(local, .84, 1);
  const reveal = windowProgress(local, .53, .72)*(index === 5 ? 1 : 1-windowProgress(local, .82, .94));
  const x = index*6 + release*6;
  const distance = framingDistance(1.05, aspect);
  const orbit = (1-approach)*(1-release)+release;
  const position = [x + orbit*.42, .22*orbit, distance*(1.22-.22*approach+.22*release)];
  const target = [x,0,0];
  if (index === 0) {
    const axis = aspect < 1 ? 1 : 0;
    const offset = (aspect < 1 ? .62 : -.8)*(1-approach);
    target[axis] += offset;
    position[axis] += offset;
  }
  return {
    stationId: SHOWCASE_OBJECTS[index][0], index, local, opening, reveal, release,
    phase: local < .27 ? 'approach' : local < .62 ? 'unfold' : local < .84 || index === 5 ? 'read' : 'release',
    position, target, fov: 36, settled: local >= .24 && local <= .84,
    readStrength: reveal, captionStrength: reveal
  };
}
