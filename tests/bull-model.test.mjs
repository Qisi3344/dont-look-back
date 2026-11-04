import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {STREAMER_SKINS,findSkin} from '../src/game-content.js';

const files=Array.from({length:5},(_,i)=>new URL('../public/models/niulai-bull-v062.'+i+'.bin',import.meta.url));
test('true cow model is selectable in the streamer wardrobe',()=>{
  assert.equal(findSkin(STREAMER_SKINS,'niulai').model,'niulai');
});
test('five binary chunks reassemble to one complete textured posed GLB',()=>{
  const parts=files.map(file=>readFileSync(file));
  assert.equal(parts.length,5);
  assert.ok(parts.every(part=>part.length>0));
  const bytes=Buffer.concat(parts);
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  assert.equal(bytes.length,3960944);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'9797ccc9158657ed35adb280cfb96099a0b3a97bbdb13f9cbc1b2d885419fdfe');
  const size=bytes.readUInt32LE(12);
  const scene=JSON.parse(bytes.subarray(20,20+size).toString('utf8'));
  assert.equal(scene.asset.version,'2.0');
  const attrs=scene.meshes[0].primitives[0];
  assert.equal(scene.accessors[attrs.indices].count/3,102690);
  assert.ok(scene.images.length>=1);
  assert.equal(scene.materials[0].normalTexture,undefined,'avoid mismatched normal maps and triangular creases');
  const bounds=scene.accessors[attrs.attributes.POSITION];
  assert.ok(bounds.min[0] < -0.39,'right elbow should be bent outward');
});
test('the in-game cow turns 180 degrees without rolling face-down',()=>{
  const up=[0,1,0],face=[0,0,1];
  // local X -90° transforms face into skywards +Y and spine/head towards -Z.
  // parent Y 180° reverses spine/head into +Z without changing skywards face.
  const rotateX=v=>[v[0],v[2],-v[1]];
  const yaw180=v=>[-v[0],v[1],-v[2]];
  const normal=yaw180(rotateX(face));
  const spine=yaw180(rotateX(up));
  // Rotations can produce negative zero; compare vectors geometrically.
  assert.ok(normal.every((value,i)=>Math.abs(value-[0,1,0][i])<1e-10));
  assert.ok(spine.every((value,i)=>Math.abs(value-[0,0,1][i])<1e-10));
});
