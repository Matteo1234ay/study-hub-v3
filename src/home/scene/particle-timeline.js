const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
const span=(t,a,b)=>smooth((t-a)/(b-a));

// A single reading object per station, with a shared cloud between stations.
export function sampleParticleTimeline(index,local) {
  const card=(index===0?1:span(local,0,.18))*(index===5?1:1-span(local,.8,1));
  const reveal=(index===0?1:span(local,.17,.23))*(index===5?1:1-span(local,.76,.8));
  return {object:0,card,cloud:1-card,mesh:reveal,reveal,particles:reveal<1?1:0};
}
