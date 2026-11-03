import {MAPS,STREAMER_SKINS,CYCLIST_SKINS,findMap,findSkin} from './game-content.js';

const safeLoad = () => {
  try {return JSON.parse(localStorage.getItem('dlb-prefs')||'{}')} catch {return {}}
};
const safeSave = (value) => {
  try {localStorage.setItem('dlb-prefs',JSON.stringify(value))} catch {}
};
export function renderShell(){
  return `<div id="world"></div>
  <div id="speed-fx" aria-hidden="true"></div>
  <div id="hud" class="is-hidden" aria-live="off">
    <div class="broadcast"><div class="broadcast-status"><span class="live-dot"></span> LIVE <span class="live-count" id="viewers">8,439</span><span class="live-eye">● 1080P</span></div><div class="broadcast-sub">直播中 · <span id="map-label">迷雾林道</span></div></div>
    <div class="minimap"><div class="minihead"><span>追踪雷达</span><span>GPS ●</span></div><canvas id="map" width="292" height="290" aria-label="追击者和玩家位置小地图"></canvas><div class="distance" id="gap">追击距离 46m</div></div>
    <div class="chat" id="chat" aria-label="直播评论"></div>
    <div id="message" aria-live="polite"></div>
    <div class="game-footer"><div class="velocity"><strong id="speed">38</strong><span>KM/H<small>BOARD SPEED</small></span></div><div class="progress"><span id="meters">0</span> / 1800 M<small>逃离路线进度</small></div></div>
    <div id="gesture-guide">滑动左右变道 · 下滑刹车 · 上滑冲刺</div>
  </div>
  <div class="story is-hidden" id="story" aria-live="polite"><div class="story-bar"><span class="story-tag">开播现场 · 00:00</span><div class="story-who" id="story-who">骑车男</div><p class="story-line" id="story-line">……</p><button class="story-skip" id="skip-story" type="button">跳过剧情 ↗</button></div></div>
  <div class="veil" id="menu"></div>`;
}
function optionCards(items,current,type){
  return items.map((item)=>`<button type="button" class="choice ${current===item.id?'chosen':''}" data-kind="${type}" data-id="${item.id}" aria-pressed="${current===item.id}"><span class="swatch" style="--swatch:${item.color}"></span><span class="choice-text"><strong>${item.name}</strong><small>${item.detail}</small></span><span class="choice-check">${current===item.id?'✓':''}</span></button>`).join('');
}
export function createInterface({onStart,onPreviewMap,onSkipIntro,onReplay,onHome}){
  const menu=document.querySelector('#menu');const hud=document.querySelector('#hud');const story=document.querySelector('#story');
  const stored=safeLoad();const config={map:findMap(stored.map).id,streamer:findSkin(STREAMER_SKINS,stored.streamer).id,cyclist:findSkin(CYCLIST_SKINS,stored.cyclist).id};
  const persist=()=>safeSave(config);
  function showHome(){
    menu.classList.remove('is-hidden');hud.classList.add('is-hidden');story.classList.add('is-hidden');
    menu.innerHTML=`<div class="home-wrap"><header class="home-top"><div class="home-brand"><span class="brand-icon">◈</span><span>WILD <b>STREAM</b> <small>/ ORIGINAL RUN</small></span></div><div class="home-version">BUILD 0.4.1 <span>●</span> ONLINE</div></header>
      <div class="home-body"><section class="hero"><div class="eyebrow"><span class="mini-red">●</span> INSPIRED BY A VERY STRANGE LIVESTREAM</div><h1>主播<br><span>别回头<span class="punct">!</span></span></h1><p class="hero-en">DON'T LOOK BACK <i>///</i> A RIDICULOUS CHASE</p><p class="hero-description">你躺着直播，他骑车追你。<br>别分心，别翻车，最重要的是——别被追上。</p>
      <div class="home-illustration" aria-hidden="true"><div class="speedlines"></div><div class="pixel-bike"><span class="bike-head"></span><span class="bike-shirt"></span><span class="bike-wheel one"></span><span class="bike-wheel two"></span></div><div class="pixel-board"><span class="pixel-head"></span><span class="pixel-body"></span><span class="pixel-phone"></span></div><div class="floating-comment">“他还在后面吗？！”</div></div>
      <div class="hero-actions"><button type="button" class="primary-start" id="home-start">开始逃命 <span>↗</span></button><span class="hero-note">极速逃亡 · 失败可以重来</span></div></section>
      <section class="customize"><div class="select-heading"><span>01 / SELECT ROUTE</span><strong>选择地图</strong></div><div class="map-list">${MAPS.map((map,i)=>`<button type="button" data-kind="map" data-id="${map.id}" class="map-card ${config.map===map.id?'chosen':''}" aria-pressed="${config.map===map.id}"><span class="map-art map-art-${map.id}"><i class="art-path"></i><i class="art-orb"></i></span><span class="map-info"><b>0${i+1} / ${map.name}</b><small>${map.type} · ${map.difficulty}</small></span><span class="map-check">${config.map===map.id?'●':'○'}</span></button>`).join('')}</div>
      <div class="select-heading skin-heading"><span>02 / YOUR LOOK</span><strong>双方换装</strong></div><div class="skin-columns"><div class="skin-col"><div class="skin-col-head">🛹 主播 <small>ESCAPER</small></div>${optionCards(STREAMER_SKINS,config.streamer,'streamer')}</div><div class="skin-col"><div class="skin-col-head">🚲 骑车男 <small>CHASER</small></div>${optionCards(CYCLIST_SKINS,config.cyclist,'cyclist')}</div></div><div class="menu-help">PC：A / ← 向左，D / → 向右，空格刹车<br>手机：屏幕左右滑动变道 · 下滑刹车 · 上滑冲刺</div></section></div>
      <footer class="home-bottom"><span>LIVE LONGBOARD ESCAPE · FREE PLAY</span><span>躺着，也要逃命。 © PROJECT DLB</span></footer></div>`;
    onPreviewMap(config.map);
    menu.querySelectorAll('[data-kind]').forEach(el=>el.addEventListener('click',()=>{
      const kind=el.dataset.kind;const id=el.dataset.id;
      if(kind==='map')config.map=id;else config[kind]=id;
      const previousScroll=menu.scrollTop;persist();showHome();menu.scrollTop=previousScroll;
    }));
    menu.querySelector('#home-start').addEventListener('click',()=>{menu.classList.add('is-hidden');onStart({...config})});
  }
  function showIntro(){story.classList.remove('is-hidden');hud.classList.add('is-hidden');document.querySelector('#skip-story').onclick=onSkipIntro}
  function setStory(who,line){document.querySelector('#story-who').textContent=who;document.querySelector('#story-line').textContent=line}
  function launch(){story.classList.add('is-hidden');hud.classList.remove('is-hidden');document.querySelector('#map-label').textContent=findMap(config.map).name;const hint=document.querySelector('#gesture-guide');hint.style.animation='none';void hint.offsetWidth;hint.style.animation=''}
  function showEnd(won,progress,time){
    hud.classList.add('is-hidden');story.classList.add('is-hidden');menu.classList.remove('is-hidden');
    menu.innerHTML=`<div class="result-card"><div class="result-eyebrow">${won?'● STREAM SAVED':'● STREAM DISCONNECTED'}</div><div class="result-icon">${won?'✦':'⚠'}</div><h2>${won?'逃出生天！':'你被追上了！'}</h2><p>${won?'评论区已经把这段逃生剪成名场面了。':'自行车终于赶上了。弹幕正在疯狂截图。'}</p><div class="result-stats"><div><strong>${Math.floor(progress)}</strong><span>滑行米数</span></div><div><strong>${Math.floor(time)}</strong><span>逃亡秒数</span></div><div><strong>${findMap(config.map).name}</strong><span>本局地图</span></div></div><div class="result-actions"><button class="primary-start" id="again">再逃一次 ↗</button><button class="secondary-action" id="go-home">返回首页</button></div></div>`;
    document.querySelector('#again').onclick=onReplay;document.querySelector('#go-home').onclick=onHome;
  }
  return {config,showHome,showIntro,setStory,launch,showEnd};
}
