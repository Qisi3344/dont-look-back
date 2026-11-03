import test from 'node:test';
import assert from 'node:assert/strict';
import {createInterface} from '../src/interface.js';

function mockElement() {
  const classes=new Set();
  return {
    classList:{add(v){classes.add(v)},remove(v){classes.delete(v)},contains(v){return classes.has(v)}},
    innerHTML:'',textContent:'',onclick:null,scrollTop:0,style:{},offsetWidth:10,
    querySelectorAll(){return []},
    querySelector(){return {addEventListener(){}}}
  };
}

function withUI(fn) {
  const original=globalThis.document;
  const nodes=new Map();
  for (const name of ['menu','hud','story','again','go-home','skip-story','map-label','gesture-guide'])
    nodes.set('#'+name,mockElement());
  globalThis.document={querySelector(selector){
    if (!nodes.has(selector)) throw Error('Unexpected selector '+selector);
    return nodes.get(selector);
  }};
  const menu=nodes.get('#menu'),hud=nodes.get('#hud'),story=nodes.get('#story');
  let ui;
  try {
    ui=createInterface({onStart(){},onPreviewMap(){},onSkipIntro(){},onReplay(){ui.showIntro()},onHome(){ui.showHome()}});
    return fn({ui,menu,hud,story,nodes});
  } finally {
    if(original===undefined)delete globalThis.document;
    else globalThis.document=original;
  }
}

test('replay closes end overlay before the new opening advances',()=>withUI(({ui,menu,hud,story,nodes})=>{
  for (const won of [true,false]) {
    ui.showEnd(won,725,55);
    assert.equal(menu.classList.contains('is-hidden'),false,'end card should be visible');
    nodes.get('#again').onclick();
    assert.equal(menu.classList.contains('is-hidden'),true,'end card MUST disappear on replay');
    assert.equal(story.classList.contains('is-hidden'),false,'opening story should be visible');
    assert.equal(hud.classList.contains('is-hidden'),true,'HUD stays hidden during the story');
    ui.launch();
    assert.equal(menu.classList.contains('is-hidden'),true,'end card must stay hidden during the actual chase');
    assert.equal(story.classList.contains('is-hidden'),true,'story disappears on launch');
    assert.equal(hud.classList.contains('is-hidden'),false,'HUD displays during gameplay');
  }
}));

test('launch independently closes any stale result panel',()=>withUI(({ui,menu,hud})=>{
  ui.showEnd(false,330,20);
  ui.launch();
  assert.equal(menu.classList.contains('is-hidden'),true);
  assert.equal(hud.classList.contains('is-hidden'),false);
}));

test('return home still displays selection menu',()=>withUI(({ui,menu,hud,story})=>{
  ui.showEnd(false,330,20);
  ui.showHome();
  assert.equal(menu.classList.contains('is-hidden'),false);
  assert.equal(hud.classList.contains('is-hidden'),true);
  assert.equal(story.classList.contains('is-hidden'),true);
}));
