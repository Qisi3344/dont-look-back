import { MAPS, STREAMER_SKINS, CYCLIST_SKINS, findMap, findSkin } from './game-content.js';

const safeLoad = () => { try { return JSON.parse(localStorage.getItem('dlb-prefs') || '{}'); } catch { return {}; } };
const safeSave = value => { try { localStorage.setItem('dlb-prefs', JSON.stringify(value)); } catch {} };

export function renderShell() {
  return `<div id="world"></div><div id="speed-fx" aria-hidden="true"></div>
  <div id="hud" class="is-hidden" aria-live="off">
    <div class="broadcast"><div class="broadcast-status"><span class="live-dot"></span> LIVE <span class="live-count" id="viewers">8,439</span><span class="live-eye">● 1080P</span></div><div class="broadcast-sub">直播中 · <span id="map-label">迷雾林道</span></div></div>
    <div class="minimap"><div class="minihead"><span>追踪雷达</span><span>GPS ●</span></div><canvas id="map" width="292" height="290" aria-label="追击者和玩家位置小地图"></canvas><div class="distance" id="gap">追击距离 46m</div></div>
    <div class="chat" id="chat" aria-label="直播评论"></div><div id="message" aria-live="polite"></div>
    <div class="game-footer"><div class="velocity"><strong id="speed">38</strong><span>KM/H<small>BOARD SPEED</small></span></div><div class="progress"><span id="meters">0</span> / 1800 M<small>逃离路线进度</small></div></div>
    <div id="gesture-guide">左右滑一次换一道 · 下滑刹车 · 上滑冲刺</div>
  </div>
  <div class="story is-hidden" id="story" aria-live="polite"><div class="story-bar"><span class="story-tag">开播现场 · 00:00</span><div class="story-who" id="story-who">骑车男</div><p class="story-line" id="story-line">……</p><button class="story-skip" id="skip-story" type="button">跳过剧情 ↗</button></div></div>
  <div class="veil" id="menu"></div>`;
}

const skinList = role => role === 'streamer' ? STREAMER_SKINS : CYCLIST_SKINS;
const roleLabel = role => role === 'streamer' ? '主播' : '骑车男';
const number = n => String(n).padStart(2, '0');

export function createInterface({ onStart, onPreviewMap, onSkipIntro, onReplay, onHome }) {
  const menu = document.querySelector('#menu');
  const hud = document.querySelector('#hud');
  const story = document.querySelector('#story');
  const stored = safeLoad();
  const config = {
    map: findMap(stored.map).id,
    streamer: findSkin(STREAMER_SKINS, stored.streamer).id,
    cyclist: findSkin(CYCLIST_SKINS, stored.cyclist).id
  };
  let currentScreen = 'home';
  let selectedMap = config.map;
  let tryOn = { streamer: config.streamer, cyclist: config.cyclist };
  let activeRole = 'streamer';
  let preview = null;
  let previewGeneration = 0;
  const persist = () => safeSave(config);

  function disposePreview() {
    previewGeneration++;
    if (preview) { preview.dispose(); preview = null; }
  }
  function openMenu() {
    menu.classList.remove('is-hidden');
    hud.classList.add('is-hidden');
    story.classList.add('is-hidden');
    menu.scrollTop = 0;
  }
  function setMenuPage(screen, content) {
    currentScreen = screen;
    openMenu();
    menu.innerHTML = content;
  }
  function brand() {
    return `<div class="dlb-brand"><span class="dlb-brand-emblem">◇</span><div><b>WILD <em>STREAM</em></b><small>AN UNREASONABLE ESCAPE GAME</small></div></div>`;
  }
  function topBar(title, index) {
    return `<header class="dlb-sub-top">${brand()}<div class="dlb-sub-heading"><span>${index} / GAME MENU</span><strong>${title}</strong></div><button type="button" class="dlb-back" id="page-back" aria-label="返回游戏首页">← 返回首页</button></header>`;
  }

  function showHome() {
    disposePreview();
    onPreviewMap(config.map);
    const currentMap = findMap(config.map);
    const streamer = findSkin(STREAMER_SKINS, config.streamer);
    const cyclist = findSkin(CYCLIST_SKINS, config.cyclist);
    setMenuPage('home', `<div class="dlb-home-screen">
      <header class="dlb-home-top">${brand()}<span class="dlb-version">V 0.5.0 <span>●</span> READY TO RUN</span></header>
      <main class="dlb-home-main"><div class="dlb-home-copy"><div class="dlb-kicker"><i></i> A VERY STRANGE LIVESTREAM / AN EVEN STRANGER CHASE</div>
        <h1>主播<span>别回头<b>!</b></span></h1><p class="dlb-home-english">DON'T LOOK BACK <strong>///</strong> RUN FOR YOUR STREAM</p>
        <p class="dlb-home-description">一个躺在滑板上直播的人。<br>一个穿着荧光绿骑车追赶的人。<br>以及一条怎么都不够长的路。</p>
        <nav class="dlb-home-nav" aria-label="主菜单"><button id="home-start" class="dlb-play" type="button"><span>开始逃命</span><b>↗</b></button>
          <button id="open-maps" class="dlb-nav-btn" type="button"><span class="dlb-nav-symbol">◈</span><span><strong>选择地图</strong><small>${currentMap.name} / ${currentMap.difficulty}</small></span><b>→</b></button>
          <button id="open-wardrobe" class="dlb-nav-btn" type="button"><span class="dlb-nav-symbol">✦</span><span><strong>角色换装</strong><small>${streamer.name} · ${cyclist.name}</small></span><b>→</b></button></nav>
      </div><div class="dlb-home-art" aria-hidden="true"><div class="dlb-orbit orbit-one"></div><div class="dlb-orbit orbit-two"></div><div class="dlb-home-light"></div>
        <div class="dlb-home-speech">“他还在后面吗？！”</div>
        <div class="dlb-home-board"><i class="dlb-hero-hair"></i><i class="dlb-hero-face"></i><i class="dlb-hero-shirt"></i><i class="dlb-hero-legs"></i><i class="dlb-hero-screen"></i></div>
        <div class="dlb-home-bike"><i class="dlb-bike-wheel one"></i><i class="dlb-bike-wheel two"></i><i class="dlb-bike-frame"></i><i class="dlb-bike-person"></i><i class="dlb-bike-head"></i></div><div class="dlb-speedline"></div>
        <div class="dlb-home-art-caption">01 / KEEP MOVING <span>NO TURNING BACK</span></div></div></main>
      <footer class="dlb-home-foot"><span>WILD STREAM · INDIE RUNNER</span><span>PC：A / D 变道 · 手机：左右滑动变道</span></footer></div>`);
    menu.querySelector('#home-start').addEventListener('click', () => {
      menu.classList.add('is-hidden');
      onStart({ ...config });
    });
    menu.querySelector('#open-maps').addEventListener('click', showMaps);
    menu.querySelector('#open-wardrobe').addEventListener('click', () => showWardrobe('streamer', true));
  }

  function showMaps() {
    disposePreview();
    selectedMap = config.map;
    renderMapScreen();
  }
  function renderMapScreen() {
    const map = findMap(selectedMap);
    onPreviewMap(map.id); // Actual three.js world behind the selector also changes immediately.
    setMenuPage('maps', `<div class="dlb-sub-screen dlb-map-screen" style="--dlb-accent:${map.accent}">
      ${topBar('选择地图', '01')}
      <main class="dlb-map-body"><section class="dlb-map-stage" aria-label="地图场景预览">
        <div class="dlb-map-scene scene-${map.id}"><div class="dlb-scene-sun"></div><div class="dlb-scene-hills"></div><div class="dlb-scene-land left"></div><div class="dlb-scene-land right"></div><div class="dlb-scene-road"></div><div class="dlb-scene-dashes"></div><div class="dlb-scene-flora"></div></div>
        <div class="dlb-map-index">ROUTE ${number(MAPS.findIndex(x => x.id === map.id) + 1)} <span> / 03</span></div>
        <div class="dlb-map-stage-footer"><div><span>NOW VIEWING / ${map.en}</span><h2>${map.name}</h2><p>${map.description}</p></div><span class="dlb-map-difficulty">${map.difficulty}</span></div>
      </section><aside class="dlb-map-picker"><div class="dlb-section-overline">SELECT A RUNNING ROUTE</div><h2>这次要在哪里<br><em>被追？</em></h2><p>每张地图拥有不同的天空、植被和道路氛围。选好后确认，再返回首页出发。</p>
      <div class="dlb-map-options">${MAPS.map((item, i) => `<button type="button" class="dlb-route ${selectedMap === item.id ? 'active' : ''}" data-route="${item.id}" aria-pressed="${selectedMap === item.id}">
        <span class="dlb-route-no">${number(i + 1)}</span><span class="dlb-route-icon map-tone-${item.id}">◆</span><span class="dlb-route-label"><b>${item.name}</b><small>${item.type}</small></span><span class="dlb-route-marker">${selectedMap === item.id ? '✓' : '→'}</span></button>`).join('')}</div>
      <button type="button" class="dlb-confirm" id="map-confirm">确认地图 <span>→</span></button>
      <div class="dlb-selection-note">已选：${map.name}${config.map === selectedMap ? ' · 当前使用' : ' · 待确认'}</div></aside></main>
      <footer class="dlb-sub-foot"><span>WORLD SELECT / ONE STEP BEFORE THE CHASE</span><span>ESC  返回首页</span></footer></div>`);
    menu.querySelector('#page-back').addEventListener('click', () => { onPreviewMap(config.map); showHome(); });
    menu.querySelectorAll('[data-route]').forEach(el => el.addEventListener('click', () => { selectedMap = el.dataset.route; renderMapScreen(); }));
    menu.querySelector('#map-confirm').addEventListener('click', () => { config.map = selectedMap; persist(); showHome(); });
  }

  function showWardrobe(role = 'streamer', fresh = false) {
    disposePreview();
    if (fresh) tryOn = { streamer: config.streamer, cyclist: config.cyclist };
    activeRole = role;
    renderWardrobeScreen();
  }
  function renderWardrobeScreen() {
    const items = skinList(activeRole);
    const chosen = findSkin(items, tryOn[activeRole]);
    const equipped = tryOn[activeRole] === config[activeRole];
    setMenuPage('wardrobe', `<div class="dlb-sub-screen dlb-wardrobe-screen">
      ${topBar('角色换装', '02')}
      <main class="dlb-wardrobe-body"><section class="dlb-model-zone"><div class="dlb-model-topline"><span>THE FITTING ROOM</span><span class="dlb-model-live">● LIVE 3D PREVIEW</span></div>
        <div class="dlb-character-stage" id="dress-preview" aria-label="可拖动旋转的三维角色展示"><div class="dlb-preview-prompt">3D 角色加载中…</div><div class="dlb-stage-disc"></div></div>
        <div class="dlb-stage-detail"><div><span>NOW PREVIEWING / ${activeRole === 'streamer' ? 'ESCAPER' : 'CHASER'}</span><strong id="dress-name">${chosen.name}</strong><small id="dress-detail">${chosen.detail}</small></div><span class="dlb-rotate-hint">↻ 拖动旋转角色</span></div>
      </section><aside class="dlb-wardrobe-picker"><div class="dlb-section-overline">02 / CUSTOMIZE YOUR RUN</div><h2>换一身行头，<br><em>再去逃命。</em></h2>
        <div class="dlb-role-tabs" role="tablist" aria-label="选择换装角色"><button id="role-streamer" type="button" role="tab" aria-selected="${activeRole === 'streamer'}" class="${activeRole === 'streamer' ? 'active' : ''}">🛹 主播 <small>ESCAPER</small></button>
        <button id="role-cyclist" type="button" role="tab" aria-selected="${activeRole === 'cyclist'}" class="${activeRole === 'cyclist' ? 'active' : ''}">🚲 骑车男 <small>CHASER</small></button></div>
        <div class="dlb-skin-head"><span>选择${roleLabel(activeRole)}的外观</span><small>${items.length} 套装扮</small></div>
        <div class="dlb-skin-grid">${items.map((skin, i) => `<button type="button" data-try="${skin.id}" aria-pressed="${chosen.id === skin.id}" class="dlb-skin-tile ${chosen.id === skin.id ? 'active' : ''}">
          <span class="dlb-skin-swatch" style="--skin-color:${skin.color}"><i></i></span><span class="dlb-skin-copy"><strong>${skin.name}</strong><small>${skin.detail}</small></span><span class="dlb-skin-tick">${chosen.id === skin.id ? '✓' : number(i+1)}</span></button>`).join('')}</div>
        <div class="dlb-wardrobe-actions"><button type="button" class="dlb-restore" id="skin-reset">恢复默认</button><button type="button" class="dlb-confirm" id="skin-confirm">确认换装 <span>→</span></button></div>
        <p class="dlb-selection-note" id="dress-selection-note">${equipped ? '当前装备' : '试穿中 · 尚未保存'} · 可先给两位角色分别换装，再一起确认</p>
      </aside></main><footer class="dlb-sub-foot"><span>CHANGE YOUR LOOK / KEEP YOUR SPEED</span><span>ESC  返回首页（不保存）</span></footer></div>`);
    menu.querySelector('#page-back').addEventListener('click', showHome);
    menu.querySelector('#role-streamer').addEventListener('click', () => { if (activeRole !== 'streamer') showWardrobe('streamer'); });
    menu.querySelector('#role-cyclist').addEventListener('click', () => { if (activeRole !== 'cyclist') showWardrobe('cyclist'); });
    menu.querySelectorAll('[data-try]').forEach(el => el.addEventListener('click', () => trySkin(el.dataset.try)));
    menu.querySelector('#skin-reset').addEventListener('click', () => trySkin(items[0].id));
    menu.querySelector('#skin-confirm').addEventListener('click', () => {
      config.streamer = tryOn.streamer;
      config.cyclist = tryOn.cyclist;
      persist();
      showHome();
    });
    mountPreview();
  }
  function trySkin(id) {
    const items = skinList(activeRole);
    const skin = findSkin(items, id);
    tryOn[activeRole] = skin.id;
    const name = menu.querySelector('#dress-name');
    const detail = menu.querySelector('#dress-detail');
    const note = menu.querySelector('#dress-selection-note');
    name.textContent = skin.name;
    detail.textContent = skin.detail;
    note.textContent = (skin.id === config[activeRole] ? '当前装备' : '试穿中 · 尚未保存') + ' · 确认换装后才会带进游戏';
    menu.querySelectorAll('[data-try]').forEach(el => {
      const selected = el.dataset.try === skin.id;
      el.classList.toggle('active', selected);
      el.setAttribute('aria-pressed', String(selected));
      const tick = el.querySelector('.dlb-skin-tick');
      if (tick) tick.textContent = selected ? '✓' : number(items.findIndex(item => item.id === el.dataset.try) + 1);
    });
    if (preview) preview.setCharacter(activeRole, skin);
  }
  function mountPreview() {
    const generation = ++previewGeneration;
    if (typeof window === 'undefined') return; // Headless UI test environment.
    import('./dressing-preview.js').then(({ createDressingPreview }) => {
      if (generation !== previewGeneration || currentScreen !== 'wardrobe') return;
      const stage = menu.querySelector('#dress-preview');
      if (!stage) return;
      preview = createDressingPreview(stage, { role: activeRole, skin: findSkin(skinList(activeRole), tryOn[activeRole]) });
    }).catch(() => {
      if (generation !== previewGeneration) return;
      const stage = menu.querySelector('#dress-preview');
      if (stage) stage.querySelector('.dlb-preview-prompt').textContent = '3D 预览暂不可用，仍可选择皮肤';
    });
  }
  function navigateBack() {
    if (currentScreen === 'maps' || currentScreen === 'wardrobe') showHome();
  }
  // Escape works on PC menus; do not steal gameplay keys while running.
  document.addEventListener?.('keydown', event => {
    if (event.key === 'Escape' && (currentScreen === 'maps' || currentScreen === 'wardrobe') && !menu.classList.contains('is-hidden')) {
      event.preventDefault(); navigateBack();
    }
  });

  function showIntro() {
    disposePreview();
    currentScreen = 'intro';
    menu.classList.add('is-hidden');
    story.classList.remove('is-hidden');
    hud.classList.add('is-hidden');
    document.querySelector('#skip-story').onclick = onSkipIntro;
  }
  function setStory(who, line) {
    document.querySelector('#story-who').textContent = who;
    document.querySelector('#story-line').textContent = line;
  }
  function launch() {
    disposePreview();
    currentScreen = 'play';
    menu.classList.add('is-hidden');
    story.classList.add('is-hidden');
    hud.classList.remove('is-hidden');
    document.querySelector('#map-label').textContent = findMap(config.map).name;
    const hint = document.querySelector('#gesture-guide');
    hint.style.animation = 'none'; void hint.offsetWidth; hint.style.animation = '';
  }
  function showEnd(won, progress, time) {
    disposePreview();
    currentScreen = 'results';
    hud.classList.add('is-hidden');
    story.classList.add('is-hidden');
    menu.classList.remove('is-hidden');
    menu.innerHTML = `<div class="result-card"><div class="result-eyebrow">${won ? '● STREAM SAVED' : '● STREAM DISCONNECTED'}</div><div class="result-icon">${won ? '✦' : '⚠'}</div><h2>${won ? '逃出生天！' : '你被追上了！'}</h2><p>${won ? '评论区已经把这段逃生剪成名场面了。' : '自行车终于赶上了。弹幕正在疯狂截图。'}</p><div class="result-stats"><div><strong>${Math.floor(progress)}</strong><span>滑行米数</span></div><div><strong>${Math.floor(time)}</strong><span>逃亡秒数</span></div><div><strong>${findMap(config.map).name}</strong><span>本局地图</span></div></div><div class="result-actions"><button class="primary-start" id="again">再逃一次 ↗</button><button class="secondary-action" id="go-home">返回首页</button></div></div>`;
    document.querySelector('#again').onclick = onReplay;
    document.querySelector('#go-home').onclick = onHome;
  }
  return { config, showHome, showMaps, showWardrobe, showIntro, setStory, launch, showEnd };
}
