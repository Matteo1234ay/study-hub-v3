// Paint the actual DOM content into a local texture. No remote image, duplicate
// data model, HTML injection or screenshot service is involved.
export function snapshotCard(element) {
  const rect=element.getBoundingClientRect();
  if(!rect.width || !rect.height)return null;
  const canvas=document.createElement('canvas');
  const resolution=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.ceil(rect.width*resolution);
  canvas.height=Math.ceil(rect.height*resolution);
  const ctx=canvas.getContext('2d');
  if(!ctx)return null;
  ctx.scale(resolution,resolution);
  ctx.fillStyle=getComputedStyle(element).backgroundColor;
  ctx.fillRect(0,0,rect.width,rect.height);
  for(const row of element.querySelectorAll('.showcase-preview-row')){
    const r=row.getBoundingClientRect(),style=getComputedStyle(row);
    ctx.fillStyle=style.borderTopColor;
    ctx.fillRect(r.left-rect.left,r.top-rect.top,r.width,parseFloat(style.borderTopWidth)||0);
  }
  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
  const range=document.createRange();
  let node;
  while((node=walker.nextNode())){
    const style=getComputedStyle(node.parentElement);
    if(style.display==='none')continue;
    ctx.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.fillStyle=style.color;
    ctx.textBaseline='alphabetic';
    if('letterSpacing' in ctx)ctx.letterSpacing=style.letterSpacing;
    for(const match of node.textContent.matchAll(/\S+/g)){
      range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
      const r=range.getBoundingClientRect();
      if(!r.width || r.bottom<rect.top || r.top>rect.bottom)continue;
      let text=match[0];
      if(style.textTransform==='uppercase')text=text.toUpperCase();
      if(style.textTransform==='lowercase')text=text.toLowerCase();
      const metrics=ctx.measureText(text);
      const ascent=metrics.fontBoundingBoxAscent??parseFloat(style.fontSize)*.8;
      const descent=metrics.fontBoundingBoxDescent??parseFloat(style.fontSize)*.2;
      ctx.fillText(text,r.left-rect.left,r.top-rect.top+(r.height-ascent-descent)/2+ascent);
    }
  }
  range.detach();
  return canvas;
}
