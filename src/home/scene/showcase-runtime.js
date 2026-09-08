import { createQualityController } from './quality-controller.js?v=20260906-33';
import { RoomEnvironment } from '../../../vendor/three/examples/jsm/environments/RoomEnvironment.js?v=20260906-33';
import { createSemanticObjects } from './semantic-objects.js?v=20260906-36';

export function createShowcaseRuntime({THREE,canvas,reducedMotion}) {
  const rect=canvas.getBoundingClientRect();
  const quality=createQualityController({devicePixelRatio:globalThis.devicePixelRatio??1,reducedMotion,initialProfile:rect.width<=760?'balanced':'high'});
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);
  let environmentTarget,objects;
  try {
    const room=new RoomEnvironment();
    const generator=new THREE.PMREMGenerator(renderer);
    try {environmentTarget=generator.fromScene(room,.04);}
    finally {room.dispose();generator.dispose();}
    scene.environment=environmentTarget.texture;
    objects=createSemanticObjects(THREE);
    scene.add(objects.root);
    return {renderer,scene,camera,quality,source:objects.root,dispose(){
      objects.dispose();environmentTarget.dispose();renderer.dispose();renderer.forceContextLoss?.();
    }};
  }catch(error){objects?.dispose();environmentTarget?.dispose();renderer.dispose();throw error;}
}
