import test from 'node:test';
import assert from 'node:assert/strict';
import {createInterface} from '../src/interface.js';

function makeClassList() {
  const entries=new Set();
  return {add(n){entries.add(n)},remove(n){entries.delete(n)},contains(n){return entries.has(n)},toggle(n,val){if(val)entries.add(n);else entries.delete(n);return !!val}};
}
function element(dataset={}) {
  const el={dataset,style:{},classList:makeClassList(),textContent:'',onclick:null,innerHTML:'',scrollTop:0,offsetWidth:100,
    attributes:{},handlers:{},addEventListener(name,fn){this.handlers[name]=fn},setAttribute(name,value){this.attributes[name]=value},
    click(){this.handlers.click?.({preventDefault(){}});this.onclick?.()},querySelector(){return null},querySelectorAll(){return []}};
  return el;
}
function makeHarness() {
  const originalDocument=globalThis.document, originalStorage=globalThis.localStorage;
  const nodes=new Map();const all={};let currentHTML='';
  for(const id of ['menu','hud','story','skip-story','map-label','gesture-guide','story-who','story-line']) nodes.set('#'+id,element());
  const menu=nodes.get('#menu');
  Object.defineProperty(menu,'innerHTML', {get(){return currentHTML},set(html){
    currentHTML=html;
    for(const key of Object.keys(all))delete all[key];
    for(const m of html.matchAll(/id="([a-z-]+)"/g))all['#'+m[1]]=element();
    for(const m of html.matchAll(/data-(route|try)="([a-z]+)"/g)){
      const key='[data-'+m[1]+'="'+m[2]+'"]';
      all[key]=element({[m[1]]:m[2]});
      all[key].querySelector=sel=>sel==='.dlb-skin-tick'?element():null;
    }
  }});
  menu.querySelector=selector=>all[selector]||null;
  menu.querySelectorAll=selector=>Object.keys(all).filter(k=>k.startsWith(selector.slice(0,-1)+'=')).map(k=>all[k]);
  const handlers={},saved={};
  globalThis.localStorage={getItem:k=>saved[k]||null,setItem:(k,v)=>{saved[k]=v}};
  globalThis.document={querySelector:selector=>nodes.get(selector)||all[selector]||null,addEventListener:(event,fn)=>{handlers[event]=fn}};
  const changedMaps=[];const launches=[];let ui;
  ui=createInterface({onStart:c=>launches.push(c),onPreviewMap:id=>changedMaps.push(id),onSkipIntro(){},onReplay(){ui.showIntro()},onHome(){ui.showHome()}});
  return {
    ui,menu,all,handlers,saved,launches,changedMaps,
    click:selector=>{assert(all[selector],`Missing selector ${selector}`);all[selector].click()},
    close(){if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;if(originalStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=originalStorage}
  };
}
const withHarness=fn=>{const h=makeHarness();try{return fn(h)}finally{h.close()}};

test('home has only start/map/wardrobe entries, not every option',()=>withHarness(h=>{
  h.ui.showHome();
  assert.match(h.menu.innerHTML,/id="home-start"/);
  assert.match(h.menu.innerHTML,/id="open-maps"/);
  assert.match(h.menu.innerHTML,/id="open-wardrobe"/);
  assert.doesNotMatch(h.menu.innerHTML,/data-route=/);
  assert.doesNotMatch(h.menu.innerHTML,/data-try=/);
}));

test('map selection is a separate screen and only commits when confirmed',()=>withHarness(h=>{
  h.ui.showHome();h.click('#open-maps');
  assert.match(h.menu.innerHTML,/dlb-map-screen/);
  h.click('[data-route="coast"]');
  assert.equal(h.ui.config.map,'forest','preview cannot instantly commit selected map');
  assert.equal(h.changedMaps.at(-1),'coast');
  h.click('#page-back');
  assert.equal(h.ui.config.map,'forest');
  assert.equal(h.changedMaps.at(-1),'forest');
  h.click('#open-maps');h.click('[data-route="night"]');h.click('#map-confirm');
  assert.equal(h.ui.config.map,'night');
  assert.equal(JSON.parse(h.saved['dlb-prefs']).map,'night');
  assert.match(h.menu.innerHTML,/dlb-home-screen/);
}));

test('wardrobe gives full stage, dual role tabs and does not save on cancel',()=>withHarness(h=>{
  h.ui.showHome();h.click('#open-wardrobe');
  assert.match(h.menu.innerHTML,/id="dress-preview"/);
  assert.match(h.menu.innerHTML,/data-try="mocha"/);
  h.click('[data-try="mocha"]');
  assert.equal(h.ui.config.streamer,'purple');
  h.click('#role-cyclist');
  h.click('[data-try="rose"]');
  assert.equal(h.ui.config.cyclist,'neon');
  h.click('#page-back');
  assert.equal(h.ui.config.streamer,'purple');
  assert.equal(h.ui.config.cyclist,'neon');
}));

test('both characters retain trial looks across tabs and save together on confirm',()=>withHarness(h=>{
  h.ui.showHome();h.click('#open-wardrobe');
  h.click('[data-try="cow"]');h.click('#role-cyclist');h.click('[data-try="orange"]');
  h.click('#role-streamer');
  assert.match(h.menu.innerHTML,/data-try="cow" aria-pressed="true"/);
  h.click('#skin-confirm');
  assert.equal(h.ui.config.streamer,'cow');assert.equal(h.ui.config.cyclist,'orange');
  assert.equal(JSON.parse(h.saved['dlb-prefs']).cyclist,'orange');
  h.click('#home-start');
  assert.deepEqual(h.launches.at(-1),{map:'forest',streamer:'cow',cyclist:'orange'});
}));

test('escape exits subpages without saving and previous result replay still works',()=>withHarness(h=>{
  h.ui.showHome();h.click('#open-maps');h.click('[data-route="night"]');
  h.handlers.keydown({key:'Escape',preventDefault(){}});
  assert.equal(h.ui.config.map,'forest');
  h.ui.showEnd(false,354,34);
  assert.equal(h.menu.classList.contains('is-hidden'),false);
  h.click('#again');
  assert.equal(h.menu.classList.contains('is-hidden'),true);
  h.ui.launch();
  assert.equal(h.menu.classList.contains('is-hidden'),true);
  assert.equal(globalThis.document.querySelector('#hud').classList.contains('is-hidden'),false);
}));
