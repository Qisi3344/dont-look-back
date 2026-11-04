import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Supplied, repaired and mobile-optimized GLB. Textures are embedded.
export const BULL_MODEL_URL = import.meta.env.BASE_URL + 'models/niulai-bull.glb';
let cached=null;
export function loadBullInstance(){
  if(!cached){
    cached=new GLTFLoader().loadAsync(BULL_MODEL_URL).catch(error=>{
      cached=null;
      throw error;
    });
  }
  return cached.then(gltf=>{
    const result=gltf.scene.clone(true);
    result.traverse(o=>{
      if(!o.isMesh)return;
      o.castShadow=true;
      o.receiveShadow=true;
      o.userData.dlbSharedAsset=true;
      const materials=Array.isArray(o.material)?o.material:[o.material];
      for(const mat of materials)if(mat?.map)mat.map.colorSpace=THREE.SRGBColorSpace;
    });
    return result;
  });
}
