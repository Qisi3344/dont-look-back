import test from 'node:test';
import assert from 'node:assert/strict';
import {roadX,roadY,roadGrade,roadPitch,roadTangent} from '../src/road-geometry.js';
import {CROW_MARKERS,CROW_TAPS,CROW_TIMEOUT,shouldReleaseCrow,crowTapStatus} from '../src/crow-event.js';

test('terrain begins at ground zero and undulates smoothly',()=>{
  assert.equal(roadY(0),0);
  for(let z=0;z<1800;z+=3){
    assert(Math.abs(roadY(z+3)-roadY(z))<.25,'slope should not create an abrupt step');
    assert(Math.abs(roadX(z+3)-roadX(z))<.55,'curve must not snap');
  }
  assert(Math.max(...Array.from({length:180},(_,i)=>roadY(i*10)))>1.5);
  assert(Math.min(...Array.from({length:180},(_,i)=>roadY(i*10)))< -1.5);
});
test('road pitch matches the elevation derivative for all maps',()=>{
  for(const map of ['forest','coast','night'])for(let z=2;z<1700;z+=71){
    const numeric=(roadY(z+.001,map)-roadY(z-.001,map))/.002;
    assert(Math.abs(roadGrade(z,map)-numeric)<1e-7);
    assert(Math.abs(roadPitch(z,map)+Math.atan(numeric))<1e-7);
    assert(Number.isFinite(roadTangent(z)));
  }
});
test('crow event schedule never retriggers its own active encounter',()=>{
  assert.equal(CROW_MARKERS.length,3);
  assert.equal(shouldReleaseCrow(260,0,false),true);
  assert.equal(shouldReleaseCrow(300,0,true),false);
  assert.equal(shouldReleaseCrow(800,1,false),true);
  assert.equal(shouldReleaseCrow(2000,3,false),false);
});
test('crow takes three clicks, clamps click count, and has a timeout',()=>{
  assert.equal(CROW_TAPS,3);
  assert(CROW_TIMEOUT>=8);
  assert.deepEqual(crowTapStatus(0),{taps:1,cleared:false,remaining:2});
  assert.deepEqual(crowTapStatus(1),{taps:2,cleared:false,remaining:1});
  assert.deepEqual(crowTapStatus(2),{taps:3,cleared:true,remaining:0});
  assert.deepEqual(crowTapStatus(9),{taps:3,cleared:true,remaining:0});
});
