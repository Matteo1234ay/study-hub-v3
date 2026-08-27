const PERF_BUDGET="realistic-balanced";
const VERT=`#version 300 es
in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FRAG=`#version 300 es
precision highp float;out vec4 o;uniform vec2 r;uniform float t,j;uniform vec2 m;

float sdRoundBox(vec3 p,vec3 b,float a){vec3 q=abs(p)-b+a;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-a;}
float sdSphere(vec3 p,float s){return length(p)-s;}
float sdCylinder(vec3 p,float h,float rad){vec2 d=abs(vec2(length(p.xz),p.y))-vec2(rad,h);return min(max(d.x,d.y),0.)+length(max(d,0.));}
float sdTorus(vec3 p,vec2 q){vec2 d=vec2(length(p.xz)-q.x,p.y);return length(d)-q.y;}
float sdCapsule(vec3 p,vec3 a,vec3 b,float rad){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-rad;}
vec2 opU(vec2 a,vec2 b){return a.x<b.x?a:b;}

vec2 map(vec3 p){
 vec2 d=vec2(99.,0.);
 // architectural shell
 d=opU(d,vec2(sdRoundBox(p-vec3(0.,-1.12,-.05),vec3(3.05,.06,2.55),.035),2.));
 d=opU(d,vec2(sdRoundBox(p-vec3(0.,.20,-2.55),vec3(3.05,1.34,.045),.025),1.));
 d=opU(d,vec2(sdRoundBox(p-vec3(-3.02,.20,-.15),vec3(.045,1.34,2.35),.025),1.));
 d=opU(d,vec2(sdRoundBox(p-vec3(3.02,.20,-.15),vec3(.045,1.34,2.35),.025),1.));
 // rug
 d=opU(d,vec2(sdRoundBox(p-vec3(0.,-1.035,.30),vec3(1.75,.018,1.40),.16),5.));
 // DESK — real proportions, softened edges
 d=opU(d,vec2(sdRoundBox(p-vec3(0.,-.45,-.25),vec3(1.48,.065,.66),.045),3.));
 for(int k=0;k<2;k++){float sx=k==0?-1.18:1.18;d=opU(d,vec2(sdRoundBox(p-vec3(sx,-.79,-.25),vec3(.055,.34,.50),.025),4.));}
 d=opU(d,vec2(sdRoundBox(p-vec3(0.,.08,-.56),vec3(.74,.43,.035),.040),4.));
 d=opU(d,vec2(sdRoundBox(p-vec3(0.,.08,-.515),vec3(.68,.37,.010),.022),10.));
 d=opU(d,vec2(sdCapsule(p,vec3(0.,-.46,-.57),vec3(0.,-.30,-.57),.030),4.));
 d=opU(d,vec2(sdRoundBox(p-vec3(0.,-.31,-.57),vec3(.22,.025,.16),.018),4.));
 d=opU(d,vec2(sdRoundBox(p-vec3(-.10,-.355,.20),vec3(.43,.020,.15),.018),4.)); // keyboard
 d=opU(d,vec2(sdRoundBox(p-vec3(.53,-.35,.17),vec3(.085,.025,.12),.055),4.)); // mouse
 // articulated desk lamp
 d=opU(d,vec2(sdCylinder(p-vec3(-.98,-.36,.06),.020,.18),4.));
 d=opU(d,vec2(sdCapsule(p,vec3(-.98,-.34,.06),vec3(-1.05,.12,-.02),.025),4.));
 d=opU(d,vec2(sdCapsule(p,vec3(-1.05,.12,-.02),vec3(-.84,.34,-.18),.025),4.));
 d=opU(d,vec2(sdRoundBox(p-vec3(-.80,.30,-.22),vec3(.17,.10,.16),.07),16.));
 // books + mug
 for(int k=0;k<3;k++){float f=float(k);d=opU(d,vec2(sdRoundBox(p-vec3(.86+f*.08,-.34,-.43+f*.01),vec3(.055,.10,.23),.012),17.));}
 d=opU(d,vec2(sdCylinder(p-vec3(.96,-.32,.18),.095,.072),17.));
 // CHAIR — offset to camera-right, never centered in front of monitor
 d=opU(d,vec2(sdRoundBox(p-vec3(.78,-.70,.72),vec3(.40,.085,.38),.12),5.));
 d=opU(d,vec2(sdRoundBox(p-vec3(.86,-.25,.88),vec3(.38,.48,.075),.14),5.));
 d=opU(d,vec2(sdCapsule(p,vec3(.80,-.79,.74),vec3(.80,-1.01,.74),.055),4.));
 d=opU(d,vec2(sdCylinder(p-vec3(.80,-1.02,.74),.040,.24),4.));
 // NOTES board + physical shelves
 d=opU(d,vec2(sdRoundBox(p-vec3(-1.95,.50,-2.485),vec3(.74,.52,.025),.035),4.));
 d=opU(d,vec2(sdRoundBox(p-vec3(-1.95,.50,-2.447),vec3(.68,.46,.010),.020),11.));
 for(int k=0;k<3;k++){float f=float(k);d=opU(d,vec2(sdRoundBox(p-vec3(-2.08,-.45+f*.37,-2.20),vec3(.53,.025,.24),.018),3.));d=opU(d,vec2(sdRoundBox(p-vec3(-2.25,-.35+f*.37,-2.19),vec3(.16,.08,.19),.012),17.));}
 // SMM display
 d=opU(d,vec2(sdRoundBox(p-vec3(1.88,.54,-2.485),vec3(.78,.52,.025),.035),4.));
 d=opU(d,vec2(sdRoundBox(p-vec3(1.88,.54,-2.447),vec3(.72,.46,.010),.020),12.));
 // QUIZ display
 d=opU(d,vec2(sdRoundBox(p-vec3(1.20,-.53,-2.485),vec3(.62,.34,.025),.035),4.));
 d=opU(d,vec2(sdRoundBox(p-vec3(1.20,-.53,-2.447),vec3(.56,.28,.010),.020),13.));
 // PROGRESS display
 d=opU(d,vec2(sdRoundBox(p-vec3(-1.05,-.53,-2.485),vec3(.62,.34,.025),.035),4.));
 d=opU(d,vec2(sdRoundBox(p-vec3(-1.05,-.53,-2.447),vec3(.56,.28,.010),.020),14.));
 // FUTURE modules — inactive wall drawers/panels, no planets or floating cylinders
 for(int k=0;k<3;k++){float f=float(k);float x=-.74+f*.74;d=opU(d,vec2(sdRoundBox(p-vec3(x,1.03,-2.485),vec3(.28,.19,.025),.025),4.));d=opU(d,vec2(sdRoundBox(p-vec3(x,1.03,-2.447),vec3(.23,.14,.010),.016),15.));}
 return d;
}

vec3 normalAt(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));}
float softShadow(vec3 ro,vec3 rd,float mint,float maxt){float res=1.,tv=mint;for(int i=0;i<8;i++){float h=map(ro+rd*tv).x;if(h<.002)return .20;res=min(res,9.*h/tv);tv+=clamp(h,.05,.30);if(tv>maxt)break;}return clamp(res,.20,1.);}
float ambientOcclusion(vec3 p,vec3 n){float occ=0.;for(int i=0;i<2;i++){float h=.07+.12*float(i);occ+=max(0.,h-map(p+n*h).x)*(.80-.22*float(i));}return clamp(1.-occ*1.2,.55,1.);}
mat3 lookAt(vec3 ro,vec3 ta){vec3 f=normalize(ta-ro),rr=normalize(cross(vec3(0.,1.,0.),f)),u=cross(f,rr);return mat3(rr,u,f);}
float smoothCamera(float x){x=clamp(x,0.,1.);return x*x*(3.-2.*x);}

// THREE_QUARTER_FRONT openingCamera keeps the monitor visible; chairClearance confirms the offset composition.
const float chairClearance=.78;
vec3 openingCamera(){return vec3(-2.45,1.48,5.15);}
vec3 DESK=vec3(0.,.08,-.50),NOTES=vec3(-1.95,.50,-2.44),SMM=vec3(1.88,.54,-2.44),QUIZ=vec3(1.20,-.53,-2.44),PROGRESS=vec3(-1.05,-.53,-2.44),FUTURE=vec3(0.,1.03,-2.44);
vec3 semanticTarget(float q){
 if(q<.18)return mix(vec3(0.,-.10,-.45),DESK,smoothCamera(q/.18));
 if(q<.34)return DESK;
 if(q<.48)return mix(DESK,NOTES,smoothCamera((q-.34)/.14));
 if(q<.62)return mix(NOTES,SMM,smoothCamera((q-.48)/.14));
 if(q<.74)return mix(SMM,QUIZ,smoothCamera((q-.62)/.12));
 if(q<.84)return mix(QUIZ,PROGRESS,smoothCamera((q-.74)/.10));
 if(q<.94)return mix(PROGRESS,FUTURE,smoothCamera((q-.84)/.10));
 return mix(FUTURE,vec3(0.,.02,-.65),smoothCamera((q-.94)/.06));
}
// shotAnchors: every camera and target transition uses the same smooth interpolation.
void cameraPose(float q,out vec3 ro,out vec3 target){vec3 a,b,ta,tb;float s;
 if(q<.18){s=smoothCamera(q/.18);a=openingCamera();b=vec3(-1.55,1.03,3.20);ta=vec3(0.,-.08,-.50);tb=DESK;}
 else if(q<.34){s=smoothCamera((q-.18)/.16);a=vec3(-1.55,1.03,3.20);b=vec3(-1.05,.72,2.25);ta=DESK;tb=DESK;}
 else if(q<.48){s=smoothCamera((q-.34)/.14);a=vec3(-1.05,.72,2.25);b=vec3(-1.15,.78,1.35);ta=DESK;tb=NOTES;}
 else if(q<.62){s=smoothCamera((q-.48)/.14);a=vec3(-1.15,.78,1.35);b=vec3(.95,.78,1.38);ta=NOTES;tb=SMM;}
 else if(q<.74){s=smoothCamera((q-.62)/.12);a=vec3(.95,.78,1.38);b=vec3(1.28,.05,1.55);ta=SMM;tb=QUIZ;}
 else if(q<.84){s=smoothCamera((q-.74)/.10);a=vec3(1.28,.05,1.55);b=vec3(-1.15,.08,1.55);ta=QUIZ;tb=PROGRESS;}
 else if(q<.94){s=smoothCamera((q-.84)/.10);a=vec3(-1.15,.08,1.55);b=vec3(0.,1.28,2.25);ta=PROGRESS;tb=FUTURE;}
 else{s=smoothCamera((q-.94)/.06);a=vec3(0.,1.28,2.25);b=vec3(-2.30,1.70,4.65);ta=FUTURE;tb=vec3(0.,0.,-.55);}ro=mix(a,b,s);target=mix(ta,tb,s);}

float hash21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}
float woodGrain(vec3 p){float g=sin((p.z*16.+p.x*2.)+sin(p.z*3.)*1.4);return .5+.5*g;}
float fabricWeave(vec3 p){float a=sin(p.x*95.)*.5+.5,b=sin(p.y*105.)*.5+.5;return a*b;}
float wallMicroTexture(vec3 p){return noise2(p.xz*18.)*.7+noise2(p.xy*28.)*.3;}
float floorMicroTexture(vec3 p){return noise2(p.xz*10.);}
vec3 fresnelSchlick(float cosTheta,vec3 F0){return F0+(1.-F0)*pow(1.-cosTheta,5.);}
vec3 woodMaterial(vec3 p){float g=woodGrain(p);float n=noise2(p.xz*7.);return mix(vec3(.115,.052,.025),vec3(.285,.135,.058),g*.34+n*.10);}
vec3 metalMaterial(vec3 p){return vec3(.20,.205,.21)+vec3(.018)*noise2(p.xz*22.);}
vec3 glassMaterial(vec3 p){return vec3(.012,.016,.020)+vec3(.010)*noise2(p.xy*18.);}
vec3 baseMaterial(float id,vec3 p){
 if(id<1.5)return vec3(.112,.108,.102)*( .88+.12*wallMicroTexture(p));
 if(id<2.5)return vec3(.090,.078,.064)*( .92+.08*floorMicroTexture(p));
 if(id<3.5)return woodMaterial(p);
 if(id<4.5)return metalMaterial(p);
 if(id<5.5){float w=fabricWeave(p);return vec3(.055,.052,.049)*( .88+.12*w);}
 if(id<10.)return vec3(.18,.16,.12);
 return glassMaterial(p);
}
float roughness(float id){if(id<1.5)return .92;if(id<2.5)return .84;if(id<3.5)return .60;if(id<4.5)return .28;if(id<5.5)return .96;if(id<10.)return .70;return .12;}
float metallic(float id){return id>3.5&&id<4.5?.82:.0;}

float rectMask(vec2 uv,vec2 c,vec2 b){vec2 d=abs(uv-c)-b;return 1.-smoothstep(0.,.012,max(d.x,d.y));}
vec3 screenLessonVisual(vec2 uv){vec3 c=vec3(.025,.032,.042);c+=vec3(.10,.42,.78)*rectMask(uv,vec2(.50,.82),vec2(.34,.035));c+=vec3(.13,.15,.18)*rectMask(uv,vec2(.31,.56),vec2(.18,.15));c+=vec3(.10,.12,.15)*rectMask(uv,vec2(.70,.56),vec2(.20,.15));c+=vec3(.18,.58,.88)*rectMask(uv,vec2(.43,.22),vec2(.27,.020));return c;}
vec3 screenNotesVisual(vec2 uv){vec3 c=vec3(.035,.031,.026);c+=vec3(.58,.45,.23)*rectMask(uv,vec2(.28,.68),vec2(.16,.18));c+=vec3(.68,.63,.50)*rectMask(uv,vec2(.67,.65),vec2(.18,.15));c+=vec3(.25,.43,.60)*rectMask(uv,vec2(.48,.28),vec2(.25,.08));return c;}
vec3 screenSocialVisual(vec2 uv){vec3 c=vec3(.022,.032,.048);for(int k=0;k<3;k++){float f=float(k);c+=vec3(.075,.22,.38)*rectMask(uv,vec2(.24+f*.26,.66),vec2(.09,.13));}float graph=smoothstep(.025,0.,abs(uv.y-(.20+.11*sin(uv.x*8.))));c+=vec3(.16,.61,.88)*graph;return c;}
vec3 screenQuizVisual(vec2 uv){vec3 c=vec3(.030,.033,.038);c+=vec3(.18,.38,.62)*rectMask(uv,vec2(.50,.76),vec2(.31,.035));for(int k=0;k<3;k++){float f=float(k);c+=vec3(.105,.115,.13)*rectMask(uv,vec2(.50,.52-f*.16),vec2(.30,.045));}return c;}
vec3 screenProgressVisual(vec2 uv){vec3 c=vec3(.024,.033,.029);for(int k=0;k<4;k++){float f=float(k),h=.10+.075*f;c+=vec3(.18,.58,.40)*rectMask(uv,vec2(.22+f*.18,.18+h*.5),vec2(.052,h*.5));}return c;}
vec3 screenFutureVisual(vec2 uv){float lock=rectMask(uv,vec2(.5,.5),vec2(.09,.11));return vec3(.025,.028,.032)+vec3(.055,.065,.075)*lock;}
vec2 screenUV(float id,vec3 p){if(id<10.5)return vec2(p.x/.68*.5+.5,(p.y-.08)/.37*.5+.5);if(id<11.5)return vec2((p.x+1.95)/.68*.5+.5,(p.y-.50)/.46*.5+.5);if(id<12.5)return vec2((p.x-1.88)/.72*.5+.5,(p.y-.54)/.46*.5+.5);if(id<13.5)return vec2((p.x-1.20)/.56*.5+.5,(p.y+.53)/.28*.5+.5);if(id<14.5)return vec2((p.x+1.05)/.56*.5+.5,(p.y+.53)/.28*.5+.5);return vec2(fract(p.x*1.4+.5),(p.y-1.03)/.14*.5+.5);}
vec3 screenColor(float id,vec3 p){vec2 uv=screenUV(id,p);if(id<10.5)return screenLessonVisual(uv);if(id<11.5)return screenNotesVisual(uv);if(id<12.5)return screenSocialVisual(uv);if(id<13.5)return screenQuizVisual(uv);if(id<14.5)return screenProgressVisual(uv);return screenFutureVisual(uv);}

// persistentLighting: once a practical zone switches on, it never turns off again.
void persistentLighting(float q,out float deskLightHold,out float notesLightHold,out float socialLightHold,out float quizLightHold,out float progressLightHold,out float futureLightHold,out float roomPower){deskLightHold=smoothstep(.16,.24,q);notesLightHold=smoothstep(.34,.42,q);socialLightHold=smoothstep(.48,.56,q);quizLightHold=smoothstep(.62,.69,q);progressLightHold=smoothstep(.74,.80,q);futureLightHold=smoothstep(.84,.90,q);roomPower=smoothstep(.94,1.,j);}
vec3 pointLight(vec3 p,vec3 n,vec3 v,vec3 pos,vec3 color,float power,float rough,float met,vec3 albedo){vec3 l=pos-p;float d2=max(dot(l,l),.12);l=normalize(l);float ndl=max(dot(n,l),0.);vec3 h=normalize(l+v);float ndh=max(dot(n,h),0.);float specPow=mix(95.,14.,rough);vec3 F0=mix(vec3(.04),albedo,met);vec3 F=fresnelSchlick(max(dot(h,v),0.),F0);float spec=pow(ndh,specPow)*(1.-rough*.65);return (albedo*ndl*(1.-met*.65)+F*spec)*color*power/d2;}

void main(){
 vec2 uv=(gl_FragCoord.xy*2.-r)/r.y;uv+=m*.0025;
 vec3 ro,target;cameraPose(j,ro,target);vec3 rd=normalize(lookAt(ro,target)*vec3(uv,1.72));
 float dist=0.,id=0.;vec3 p=ro;for(int i=0;i<96;i++){p=ro+rd*dist;vec2 h=map(p);id=h.y;if(h.x<.0015||dist>14.)break;dist+=h.x*.82;}
 float initialAmbient=.105;vec3 col=vec3(.012,.013,.014)+vec3(.020,.019,.018)*initialAmbient;
 if(dist<14.){
  vec3 n=normalAt(p),v=normalize(ro-p);float ao=ambientOcclusion(p,n);vec3 albedo=baseMaterial(id,p);float rough=roughness(id),met=metallic(id);
  float deskLightHold,notesLightHold,socialLightHold,quizLightHold,progressLightHold,futureLightHold,roomPower;persistentLighting(j,deskLightHold,notesLightHold,socialLightHold,quizLightHold,progressLightHold,futureLightHold,roomPower);
  vec3 guidedLight=semanticTarget(j)+vec3(m.x*.09,.42+m.y*.06,.65);vec3 glDir=normalize(guidedLight-p);float sh=softShadow(p+n*.008,glDir,.05,4.5);
  col=albedo*(.065+.11*max(n.y,0.))*ao;
  col+=pointLight(p,n,v,guidedLight,vec3(.88,.84,.78),2.1*sh,rough,met,albedo);
  col+=pointLight(p,n,v,vec3(-.80,.34,-.22),vec3(1.0,.58,.30),2.0*deskLightHold,rough,met,albedo);
  col+=pointLight(p,n,v,vec3(-1.95,.52,-2.10),vec3(.56,.72,.95),.65*notesLightHold,rough,met,albedo);
  col+=pointLight(p,n,v,vec3(1.88,.56,-2.10),vec3(.43,.66,.95),.72*socialLightHold,rough,met,albedo);
  col+=pointLight(p,n,v,vec3(1.20,-.48,-2.08),vec3(.48,.63,.86),.48*quizLightHold,rough,met,albedo);
  col+=pointLight(p,n,v,vec3(-1.05,-.48,-2.08),vec3(.42,.78,.62),.48*progressLightHold,rough,met,albedo);
  col+=albedo*vec3(.30,.27,.22)*roomPower*(.45+.55*max(n.y,0.));
  if(id>=10.){float power=id<10.5?deskLightHold:id<11.5?notesLightHold:id<12.5?socialLightHold:id<13.5?quizLightHold:id<14.5?progressLightHold:futureLightHold;vec3 sc=screenColor(id,p);col=mix(col,sc,clamp(.24+.76*power,0.,1.));col+=sc*power*.70;}
  if(id>15.5&&id<16.5)col+=vec3(1.0,.50,.22)*deskLightHold*.55;
 }
 float finalReveal=smoothstep(.94,1.,j);col+=vec3(.018,.017,.015)*finalReveal;
 col=col/(col+vec3(1.));col=pow(col,vec3(.88));float vign=1.-.16*dot(uv,uv);o=vec4(col*clamp(vign,.72,1.),1.);
}`;

function compile(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(s));gl.deleteShader(s);return null}return s}
export function mountStudyHubWebGL(canvas,{getJourney=()=>0}={}){const gl=canvas?.getContext?.("webgl2",{antialias:false,alpha:false,powerPreference:"high-performance"});if(!gl)return()=>{};const vs=compile(gl,gl.VERTEX_SHADER,VERT),fs=compile(gl,gl.FRAGMENT_SHADER,FRAG);if(!vs||!fs)return()=>{};const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){console.warn(gl.getProgramInfoLog(program));return()=>{}}gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);const ur=gl.getUniformLocation(program,"r"),ut=gl.getUniformLocation(program,"t"),uj=gl.getUniformLocation(program,"j"),um=gl.getUniformLocation(program,"m");let dead=false,mx=0,my=0,tx=0,ty=0,lastW=0,lastH=0;const pointer=e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*-2};addEventListener("pointermove",pointer,{passive:true});function resize(){const dpr=Math.min(devicePixelRatio||1,1.10),w=Math.max(1,Math.floor(innerWidth*dpr)),h=Math.max(1,Math.floor(innerHeight*dpr));if(w!==lastW||h!==lastH){canvas.width=w;canvas.height=h;lastW=w;lastH=h;gl.viewport(0,0,w,h)}}function draw(now){if(dead)return;resize();mx+=(tx-mx)*.055;my+=(ty-my)*.055;gl.useProgram(program);gl.uniform2f(ur,canvas.width,canvas.height);gl.uniform1f(ut,now*.001);gl.uniform1f(uj,Math.min(1,Math.max(0,getJourney())));gl.uniform2f(um,mx,my);gl.drawArrays(gl.TRIANGLES,0,3);requestAnimationFrame(draw)}requestAnimationFrame(draw);return()=>{dead=true;removeEventListener("pointermove",pointer);gl.deleteProgram(program);gl.deleteBuffer(buffer)}}
