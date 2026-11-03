import test from 'node:test';
import assert from 'node:assert/strict';
import {MAPS,STREAMER_SKINS,CYCLIST_SKINS,findMap,findSkin,steerFromScreen,classifySwipe,shiftLaneIndex} from '../src/game-content.js';

test('three distinct playable map palettes are selectable',()=>{
  assert.equal(MAPS.length,3);
  assert.equal(new Set(MAPS.map(map=>map.id)).size,3);
  assert.notEqual(findMap('forest').sky,findMap('night').sky);
  assert.equal(findMap('coast').name,'海风栈道');
});
test('each role exposes interchangeable skins and cyclist defaults fluorescent green',()=>{
  assert(STREAMER_SKINS.length>=4&&CYCLIST_SKINS.length>=4);
  assert.equal(CYCLIST_SKINS[0].id,'neon');
  assert.equal(CYCLIST_SKINS[0].shirt,0xc0ff27);
  assert.equal(findSkin(STREAMER_SKINS,'unknown').id,'purple');
});
test('A and left arrow move toward screen left, D moves right',()=>{
  assert.equal(steerFromScreen(true,false),1);
  assert.equal(steerFromScreen(false,true),-1);
  assert.equal(steerFromScreen(false,false),0);
  assert.equal(steerFromScreen(true,true),0);
});
test('touch gestures classify horizontal drags, downward brake and upward boost',()=>{
  assert.equal(classifySwipe(-80,7),'left');
  assert.equal(classifySwipe(80,7),'right');
  assert.equal(classifySwipe(4,65),'brake');
  assert.equal(classifySwipe(4,-65),'boost');
  assert.equal(classifySwipe(5,9),null);
});
test('swiping visually left increments world-X lane and respects map borders',()=>{
  assert.equal(shiftLaneIndex(2,'left'),3);
  assert.equal(shiftLaneIndex(2,'right'),1);
  assert.equal(shiftLaneIndex(4,'left'),4);
  assert.equal(shiftLaneIndex(0,'right'),0);
});

test('streaming overlay has no virtual joystick or button IDs', async () => {
  const {renderShell}=await import('../src/interface.js');
  const markup=renderShell();
  assert(!markup.includes('id="mobile"'));
  assert(!markup.includes('id="left"'));
  assert(!markup.includes('id="right"'));
  assert(markup.includes('id="story"'));
  assert(markup.includes('id="chat"'));
});
