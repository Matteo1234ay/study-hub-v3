const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
const span=(t,a,b)=>smooth((t-a)/(b-a));

// Scroll is a reversible time coordinate. All junctions have zero velocity
// and acceleration; no frame-by-frame random forces or accumulated drift.
export function sampleParticleTimeline(index,local) {
  let object=1,card=0;
  if(index>0 && local<.2)object=span(local,0,.18);
  else if(local>=.27 && local<.5)object=1-span(local,.27,.5);
  else if(local>=.5){object=0;card=span(local,.5,.69);}
  if(index<5 && local>.84)card=1-span(local,.86,1);
  const mesh=(index===0?1:span(local,.14,.2))*(1-span(local,.27,.33));
  const reveal=span(local,.69,.73)*(index===5?1:1-span(local,.84,.87));
  // Keep the assembled texture opaque underneath the DOM handoff. Two
  // complementary transparent layers would darken the card halfway through.
  return {object,card,cloud:Math.max(0,1-object-card),mesh,reveal,particles:(1-mesh)*(reveal<1?1:0)};
}
