import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STREAMER_SKINS,findSkin} from '../src/game-content.js';

test('real cow GLB appears as a selectable streamer skin',()=>{
  assert.equal(findSkin(STREAMER_SKINS,'niulai').model,'niulai');
});
test('embedded-texture mobile GLB is valid and available',()=>{
  const bytes=readFileSync(new URL('../public/models/niulai-bull.glb',import.meta.url));
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const size=bytes.readUInt32LE(12);
  const scene=JSON.parse(bytes.subarray(20,20+size).toString('utf8'));
  assert.equal(scene.asset.version,'2.0');
  assert.equal(scene.meshes.length,1);
  assert.ok(scene.accessors[0].count<65000);
  assert.ok(scene.images.length>=1);
  assert.ok(bytes.length<2500000);
});
