import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Original 2026-11-04 GLB was repaired with a bent right arm, then retopologized
// using UV-aware quadric decimation (NOT vertex voxel clustering). The
// five byte-range assets reassemble to one standard GLB without transcoding.
// Separate static chunks avoid GitHub upload-size limits for this single asset.
export const BULL_MODEL_PARTS = [
  'niulai-bull-v062.0.bin',
  'niulai-bull-v062.1.bin',
  'niulai-bull-v062.2.bin',
  'niulai-bull-v062.3.bin',
  'niulai-bull-v062.4.bin'
];
const assetBase=import.meta.env.BASE_URL+'models/';
let cached=null;
async function readBullBuffer(){
  const buffers=await Promise.all(BULL_MODEL_PARTS.map(async name=>{
    const response=await fetch(assetBase+name);
    if(!response.ok)throw new Error('牛来模型资源加载失败：'+name+' HTTP '+response.status);
    return new Uint8Array(await response.arrayBuffer());
  }));
  const length=buffers.reduce((sum,b)=>sum+b.byteLength,0);
  const bytes=new Uint8Array(length);
  let position=0;
  for(const buffer of buffers){bytes.set(buffer,position);position+=buffer.byteLength;}
  // glTF 2 GLB header: magic, version, actual assembled file length.
  const header=new DataView(bytes.buffer);
  if(length<20||header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2||header.getUint32(8,true)!==length){
    throw new Error('拼接后的牛来 GLB 数据不完整');
  }
  return bytes.buffer;
}
export function loadBullInstance(){
  if(!cached){
    cached=readBullBuffer().then(buffer=>new GLTFLoader().parseAsync(buffer,assetBase)).catch(error=>{
      cached=null;
      throw error;
    });
  }
  return cached.then(gltf=>{
    const result=gltf.scene.clone(true);
    result.traverse(object=>{
      if(!object.isMesh)return;
      object.castShadow=true;
      object.receiveShadow=true;
      object.userData.dlbSharedAsset=true;
      const materials=Array.isArray(object.material)?object.material:[object.material];
      for(const material of materials)if(material?.map)material.map.colorSpace=THREE.SRGBColorSpace;
    });
    return result;
  });
}
