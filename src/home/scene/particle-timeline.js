const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
const span=(t,a,b)=>smooth((t-a)/(b-a));

// A single reading object per station, with a shared cloud between stations.
export function sampleParticleTimeline(index,local) {
  const card=(index===0?1:span(local,0,.18))*(index===5?1:1-span(local,.68,1));
  const reveal=(index===0?1:span(local,.12,.2))*(index===5?1:1-span(local,.64,.76));
  return {object:0,card,cloud:1-card,mesh:reveal,reveal,particles:1-reveal};
}

export function sampleParticleExit(progress) {
  const dissolve=span(progress,0,.62);
  return {object:0,card:1-dissolve,cloud:dissolve,mesh:1-dissolve,reveal:1-dissolve,particles:span(progress,.02,.18)};
}
