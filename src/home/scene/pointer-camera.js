const bound=value=>Math.max(-1,Math.min(1,Number(value)||0));
export function createPointerCamera() {
  let x=0,y=0,targetX=0,targetY=0;
  return {
    setTarget(nextX,nextY){targetX=bound(nextX);targetY=bound(nextY);},
    reset(){targetX=targetY=0;},
    sample(position,target,seconds,strength=1){
      const damping=1-Math.exp(-Math.max(0,seconds)/.22);
      x+=(targetX-x)*damping;y+=(targetY-y)*damping;
      const delta=position.map((value,index)=>value-target[index]);
      const radius=Math.hypot(...delta);
      if(!radius)return [...position];
      const yaw=Math.atan2(delta[0],delta[2])+x*.12*strength;
      const pitch=Math.asin(Math.max(-1,Math.min(1,delta[1]/radius)))+y*.065*strength;
      return [target[0]+radius*Math.cos(pitch)*Math.sin(yaw),target[1]+radius*Math.sin(pitch),target[2]+radius*Math.cos(pitch)*Math.cos(yaw)];
    }
  };
}
