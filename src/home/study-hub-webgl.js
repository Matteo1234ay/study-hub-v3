const VERT = `#version 300 es
in vec2 p;
void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 r;
uniform float t, j;
uniform vec2 m;

float sdBox(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.); }
float sdRoundBox(vec3 p, vec3 b, float rad){ vec3 q=abs(p)-b+rad; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-rad; }
float sdSphere(vec3 p,float s){ return length(p)-s; }
vec2 opU(vec2 a,vec2 b){ return a.x<b.x?a:b; }

// Architectural Study Hub: shell, floor, desk, screen wall, shelves and learning modules.
vec2 map(vec3 p){
  float open=smoothstep(.08,.24,j);
  vec2 d=vec2(99.,0.);
  d=opU(d,vec2(sdRoundBox(p-vec3(0.,-1.12,0.),vec3(2.55,.10,2.05),.08),1.));
  d=opU(d,vec2(sdRoundBox(p-vec3(-2.40-.22*open,.12,-.05),vec3(.09,1.30,1.95),.07),1.));
  d=opU(d,vec2(sdRoundBox(p-vec3(2.40+.22*open,.12,-.05),vec3(.09,1.30,1.95),.07),1.));
  d=opU(d,vec2(sdRoundBox(p-vec3(0.,.15,-1.92),vec3(2.45,1.25,.08),.06),1.));
  d=opU(d,vec2(sdRoundBox(p-vec3(0.,1.43+.15*open,-.05),vec3(2.48,.07,1.95),.05),1.));

  // central desk
  d=opU(d,vec2(sdRoundBox(p-vec3(0.,-.48,.28),vec3(1.02,.08,.55),.06),2.));
  d=opU(d,vec2(sdRoundBox(p-vec3(-.78,-.80,.28),vec3(.08,.36,.42),.04),2.));
  d=opU(d,vec2(sdRoundBox(p-vec3(.78,-.80,.28),vec3(.08,.36,.42),.04),2.));
  d=opU(d,vec2(sdRoundBox(p-vec3(0.,-.18,.08),vec3(.54,.33,.035),.04),3.));

  // screen wall
  d=opU(d,vec2(sdRoundBox(p-vec3(-.82,.42,-1.80),vec3(.62,.43,.025),.04),3.));
  d=opU(d,vec2(sdRoundBox(p-vec3(.82,.42,-1.80),vec3(.62,.43,.025),.04),4.));
  d=opU(d,vec2(sdRoundBox(p-vec3(0.,1.04,-1.80),vec3(.48,.12,.025),.04),3.));

  // left notes / review shelves
  for(int k=0;k<4;k++){
    float fk=float(k);
    d=opU(d,vec2(sdRoundBox(p-vec3(-1.92,-.70+fk*.47,-1.35),vec3(.34,.05,.34),.035),2.));
  }
  d=opU(d,vec2(sdRoundBox(p-vec3(-2.05,.36,-.78),vec3(.025,.68,.58),.03),4.));

  // right learning-path modules, including SMM core
  float pulse=.04*sin(t*1.4);
  d=opU(d,vec2(sdSphere(p-vec3(1.72,.40,-.82),.28+pulse),5.));
  d=opU(d,vec2(sdRoundBox(p-vec3(1.88,-.45,-1.18),vec3(.36,.20,.30),.08),6.));
  d=opU(d,vec2(sdRoundBox(p-vec3(1.72,.92,-1.18),vec3(.30,.16,.26),.08),6.));

  // assessment and progress consoles
  d=opU(d,vec2(sdRoundBox(p-vec3(.96,-.79,1.17),vec3(.38,.24,.20),.07),4.));
  d=opU(d,vec2(sdRoundBox(p-vec3(-1.05,-.79,1.08),vec3(.44,.24,.20),.07),3.));

  // luminous architectural spine
  d=opU(d,vec2(sdRoundBox(p-vec3(0.,1.18,.0),vec3(.045,.045,1.55),.025),5.));
  return d;
}

vec3 normalAt(vec3 p){
  vec2 e=vec2(.002,0.);
  return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));
}

mat3 lookAt(vec3 ro,vec3 ta){
  vec3 f=normalize(ta-ro);
  vec3 rr=normalize(cross(vec3(0.,1.,0.),f));
  vec3 u=cross(f,rr);
  return mat3(rr,u,f);
}

void cameraJourney(float journey,out vec3 ro,out vec3 target){
  float q=clamp(journey,0.,1.);
  if(q<.12){ float s=smoothstep(0.,.12,q); ro=mix(vec3(0.,2.25,7.8),vec3(0.,1.48,5.25),s); target=vec3(0.,.0,-.10); }
  else if(q<.25){ float s=smoothstep(.12,.25,q); ro=mix(vec3(0.,1.48,5.25),vec3(0.,.62,2.10),s); target=mix(vec3(0.,0.,-.10),vec3(0.,-.12,-.60),s); }
  else if(q<.38){ float s=smoothstep(.25,.38,q); ro=mix(vec3(0.,.62,2.10),vec3(.18,.15,1.24),s); target=mix(vec3(0.,-.12,-.60),vec3(0.,-.35,.20),s); }
  else if(q<.50){ float s=smoothstep(.38,.50,q); ro=mix(vec3(.18,.15,1.24),vec3(-1.38,.20,.72),s); target=mix(vec3(0.,-.35,.20),vec3(-1.92,.18,-.82),s); }
  else if(q<.63){ float s=smoothstep(.50,.63,q); ro=mix(vec3(-1.38,.20,.72),vec3(.95,.40,.92),s); target=mix(vec3(-1.92,.18,-.82),vec3(1.72,.40,-.82),s); }
  else if(q<.74){ float s=smoothstep(.63,.74,q); ro=mix(vec3(.95,.40,.92),vec3(.72,-.15,1.62),s); target=mix(vec3(1.72,.40,-.82),vec3(.96,-.79,1.17),s); }
  else if(q<.84){ float s=smoothstep(.74,.84,q); ro=mix(vec3(.72,-.15,1.62),vec3(-.65,-.02,1.68),s); target=mix(vec3(.96,-.79,1.17),vec3(-1.05,-.79,1.08),s); }
  else if(q<.94){ float s=smoothstep(.84,.94,q); ro=mix(vec3(-.65,-.02,1.68),vec3(3.75,1.68,4.75),s); target=mix(vec3(-1.05,-.79,1.08),vec3(.42,.05,-.55),s); }
  else { float s=smoothstep(.94,1.,q); ro=mix(vec3(3.75,1.68,4.75),vec3(0.,2.55,6.80),s); target=vec3(0.,.05,-.40); }
}

vec3 material(float id,vec3 p){
  if(id<1.5) return vec3(.055,.075,.13);
  if(id<2.5) return vec3(.12,.15,.22);
  if(id<3.5) return vec3(.20,.42,.95);
  if(id<4.5) return vec3(.55,.28,.98);
  if(id<5.5) return vec3(.22,.70,1.0);
  return vec3(.09,.13,.22);
}

void main(){
  vec2 uv=(gl_FragCoord.xy*2.-r)/r.y;
  uv+=m*.018;
  vec3 ro,target;
  cameraJourney(j,ro,target);
  mat3 cam=lookAt(ro,target);
  vec3 rd=cam*normalize(vec3(uv,1.60));
  float dist=0.; vec3 p=ro; vec2 hit=vec2(99.,0.);
  for(int i=0;i<120;i++){
    p=ro+rd*dist; hit=map(p);
    if(hit.x<.0015||dist>12.) break;
    dist+=hit.x*.72;
  }

  vec3 col=vec3(.006,.010,.026);
  float vignette=1.-.18*length(uv);
  col+=vec3(.018,.028,.07)*(1.-max(uv.y,0.)*.22);
  if(dist<12.){
    vec3 n=normalAt(p);
    vec3 key=normalize(vec3(-.55,.82,.65));
    vec3 fill=normalize(vec3(.72,.28,.35));
    float dif=max(dot(n,key),0.);
    float dif2=max(dot(n,fill),0.);
    float rim=pow(1.-max(dot(n,-rd),0.),2.2);
    vec3 base=material(hit.y,p);
    col+=base*(.20+.92*dif+.24*dif2);
    col+=rim*vec3(.28,.48,1.05)*.42;
    float spec=pow(max(dot(reflect(-key,n),-rd),0.),24.);
    col+=spec*vec3(.8,.9,1.0)*.46;
    if(hit.y>2.5&&hit.y<5.6) col+=base*(.35+.20*sin(t*1.4+p.x*3.));
    if(abs(p.y+1.02)<.13) col+=vec3(.05,.10,.24)*max(0.,.45-abs(fract((p.x+p.z)*2.)-.5));
  }
  float atmosphere=.006/(abs(length(uv-vec2(.18,-.05))-.62)+.045);
  col+=vec3(.08,.17,.55)*atmosphere;
  col*=vignette;
  o=vec4(pow(max(col,0.),vec3(.82)),1.);
}`;

function compileShader(gl,type,source){
  const shader=gl.createShader(type);
  gl.shaderSource(shader,source);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

export function mountStudyHubWebGL(canvas,{getJourney}){
  const gl=canvas.getContext("webgl2",{antialias:true,alpha:true,powerPreference:"high-performance"});
  if(!gl) return ()=>{};
  const program=gl.createProgram();
  gl.attachShader(program,compileShader(gl,gl.VERTEX_SHADER,VERT));
  gl.attachShader(program,compileShader(gl,gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  gl.useProgram(program);
  const position=gl.getAttribLocation(program,"p");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uR=gl.getUniformLocation(program,"r");
  const uT=gl.getUniformLocation(program,"t");
  const uJ=gl.getUniformLocation(program,"j");
  const uM=gl.getUniformLocation(program,"m");
  let mx=0,my=0,dead=false,frame;
  const pointer=(event)=>{mx=(event.clientX/innerWidth-.5)*2;my=(event.clientY/innerHeight-.5)*2;};
  addEventListener("pointermove",pointer,{passive:true});
  function draw(ms){
    if(dead||!canvas.isConnected){ dead=true; removeEventListener("pointermove",pointer); return; }
    const dpr=Math.min(devicePixelRatio||1,1.5);
    const w=Math.floor(canvas.clientWidth*dpr),h=Math.floor(canvas.clientHeight*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const journey=getJourney();
    gl.viewport(0,0,w,h);
    gl.useProgram(program);
    gl.uniform2f(uR,w,h);
    gl.uniform1f(uT,ms*.001);
    gl.uniform1f(uJ,journey);
    gl.uniform2f(uM,mx,my);
    gl.drawArrays(gl.TRIANGLES,0,3);
    frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);
  return()=>{dead=true;cancelAnimationFrame(frame);removeEventListener("pointermove",pointer);};
}

export const hubNodes=["DESK","NOTES","SMM","ASSESSMENT","PROGRESS","PATHS"];
