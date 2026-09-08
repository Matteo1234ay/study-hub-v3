import { createShowcaseRuntime } from './showcase-runtime.js?v=20260908-38';
import { createShowcaseGallery } from './showcase-gallery.js?v=20260908-38';
import { sampleShowcase, clamp, ease, SHOWCASE_OBJECTS } from './showcase-motion.js?v=20260908-38';
import { createPointerCamera } from './pointer-camera.js?v=20260908-38';

export async function createStudyRoomRenderer({ canvas, stations, reducedMotion = false, onFailure = () => {}, onPresentation = () => {} }) {
  const THREE = await import('../../../vendor/three/three.module.min.js?v=20260906-33');
  const state = createShowcaseRuntime({ THREE, canvas, reducedMotion });
  const { renderer, camera, scene, quality } = state;
  let gallery;
  let observer;
  let disposed = false;
  let frameId = 0;
  let previous = performance.now();
  let motionTime = 0;
  let target = 0;
  let current = 0;
  let exitTarget = 0;
  let exitCurrent = 0;
  let focus = null;
  let layout = 'desktop';
  const pointerCamera=createPointerCamera();
  const pointerSurface=canvas.parentElement;
  const pointerMedia=matchMedia('(hover: hover) and (pointer: fine)');
  function onPointer(event) {
    if(reducedMotion || !pointerMedia.matches || event.pointerType==='touch')return;
    const rect=canvas.getBoundingClientRect();
    pointerCamera.setTarget((event.clientX-rect.left)/Math.max(1,rect.width)*2-1,1-(event.clientY-rect.top)/Math.max(1,rect.height)*2);
  }
  function resetPointer(){pointerCamera.reset();}
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    focus?.resolve(false);
    observer?.disconnect();
    canvas.removeEventListener('webglcontextlost', onLost);
    document.removeEventListener('visibilitychange', onVisibility);
    pointerSurface?.removeEventListener('pointermove',onPointer);
    pointerSurface?.removeEventListener('pointerleave',resetPointer);
    window.removeEventListener('blur',resetPointer);
    gallery?.dispose();
    state.dispose();
  }
  function onLost(event) { event.preventDefault(); onFailure(new Error('Contesto WebGL interrotto')); }
  function onVisibility() { previous = performance.now(); }
  try {
    gallery = createShowcaseGallery({ THREE, source: state.source, scene });
    renderer.toneMappingExposure = 1.05;
    scene.environmentIntensity = .85;
    function resize() {
      const rect = canvas.getBoundingClientRect();
      camera.aspect = Math.max(.15, rect.width / Math.max(1,rect.height));
      layout = rect.width<=760 || rect.height>rect.width*1.12 ? 'mobile' : 'desktop';
      renderer.setPixelRatio(quality.getDprCap());
      renderer.setSize(Math.max(1,rect.width), Math.max(1,rect.height), false);
      camera.updateProjectionMatrix();
    }
    function draw(now) {
      if (disposed) return;
      frameId = requestAnimationFrame(draw);
      if (document.hidden) return;
      const delta = Math.min(.05, Math.max(0,(now-previous)/1000));
      previous = now;
      motionTime += delta;
      if (focus) {
        const t = clamp((now-focus.start)/focus.duration);
        current = focus.from + (focus.to-focus.from)*ease(t);
        if (t === 1) { target = focus.to; focus.resolve(true); focus = null; }
      } else {
        current += (target-current)*(reducedMotion ? 1 : 1-Math.exp(-delta/.11));
        if (Math.abs(target-current)<.00001) current=target;
      }
      exitCurrent += (exitTarget-exitCurrent)*(reducedMotion ? 1 : 1-Math.exp(-delta/.11));
      const shot = sampleShowcase(current, camera.aspect);
      gallery.update(shot, exitCurrent, {seconds:motionTime, motion:reducedMotion ? 0 : layout==='mobile' ? .6 : 1});
      if(!pointerMedia.matches || reducedMotion)pointerCamera.reset();
      const orbit=pointerCamera.sample(shot.position,shot.target,delta,reducedMotion ? 0 : (1-shot.reveal*.8)*(1-exitCurrent));
      camera.position.set(...orbit);
      camera.fov=shot.fov;
      camera.updateProjectionMatrix();
      camera.lookAt(...shot.target);
      renderer.render(scene, camera);
      onPresentation({...shot, exitProgress: exitCurrent});
      if (quality.recordFrame(delta*1000)) resize();
    }
    observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('webglcontextlost', onLost);
    document.addEventListener('visibilitychange', onVisibility);
    pointerSurface?.addEventListener('pointermove',onPointer,{passive:true});
    pointerSurface?.addEventListener('pointerleave',resetPointer);
    window.addEventListener('blur',resetPointer);
    resize();
    draw(previous);
    return {
      ready: Promise.resolve({heroMode:'v30'}),
      setJourney(value) { target=clamp(value); },
      setExitProgress(value) { exitTarget=clamp(value); },
      getActiveStation: value => sampleShowcase(value).stationId,
      getPresentationState: value => sampleShowcase(value),
      getPathsProjection() {
        const caption=canvas.closest('.home-journey')?.querySelector('.home-station-caption[data-station-id="future-paths"]');
        const rect=caption?.getBoundingClientRect();
        if (!rect?.width) return null;
        return {left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height};
      },
      focusStation(id, {duration=650}={}) {
        const index=SHOWCASE_OBJECTS.findIndex(item=>item[0]===id);
        if (disposed || index<0) return Promise.resolve(false);
        focus?.resolve(false);
        exitTarget=exitCurrent=0;
        return new Promise(resolve=>{focus={from:current,to:(index+.73)/6,start:performance.now(),duration,resolve};});
      },
      resize,
      getAudit: () => ({heroMode:'v30',direction:'object-showcase',cameraLayout:layout,objects:gallery.audit(),profile:quality.profile}),
      dispose
    };
  } catch(error) { dispose(); throw error; }
}
