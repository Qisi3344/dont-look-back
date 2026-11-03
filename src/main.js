import * as THREE from 'three';
import './style.css';
import { INITIAL_GAP, CATCH_DISTANCE, WARNING_DISTANCE, CRITICAL_DISTANCE, IMPACT, playerCruiseSpeed, advanceCyclist } from './chase.js';
import { BIKE_HEADING_CORRECTION, STREAMER_HEAD_Z, STREAMER_FEET_Z } from './pose.js';

const app=document.querySelector('#app');
app.innerHTML=`<div id="world"></div><div id="hud"><div class="top"><div class="minimap"><div class="minihead"><span>● LIVE TRACKER</span><span>GPS</span></div><canvas id="map" width="292" height="290"></canvas><div class="distance" id="gap">追击距离 46m</div></div><div class="stats"><div class="live">● LIVE <span id="viewers">8,439</span> 👁</div><div class="meter"><strong id="speed">38</strong> km/h<small>LONGBOARD SPEED</small></div></div></div><div class="chat" id="chat"></div><div id="message"></div><div class="bottom"><div class="controls">A / D 或 ← / → 转向 · SPACE 刹车 · 避开障碍 · 到达安全区</div><div class="progress"><span id="meters">0</span> / 1800m<small>逃离路线进度</small></div></div><div id="mobile"><button id="left" aria-label="向左">◀</button><button id="brake" aria-label="刹车">Ⅱ</button><button id="right" aria-label="向右">▶</button></div></div><div class="veil" id="menu"><div class="panel"><div class="tag">● LIVE STREAM CHASE / V0.3</div><h1>主播<br/><em>别回头！</em></h1><p class="info">你躺在滑板上，右手枕着头，手机直播还没关。背后的自行车追击者越来越近！<br/>躲开垃圾桶、路障和碎石。摔倒会浪费宝贵时间。<br/><b>蓝点是你，红点是追击者。别让他追上！</b></p><button class="go" id="start">开始直播逃命 →</button></div></div>`;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x7e9aa0);scene.fog=new THREE.FogExp2(0x819994,.0105);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,650);const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;document.querySelector('#world').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xd4e5ea,0x3d4c38,2.1));const sun=new THREE.DirectionalLight(0xffdfb8,2.3);sun.position.set(-40,75,-20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-75;sun.shadow.camera.right=75;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;scene.add(sun);
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});const roadMat=mat(0x555d5c), shoulderMat=mat(0x918c78), dirtMat=mat(0x486348), lineMat=mat(0xe8dcb4), bark=mat(0x594b3b), leaves=[mat(0x47664e),mat(0x67846c),mat(0x385b50)];
const geoBox=new THREE.BoxGeometry(1,1,1);const geoSphere=new THREE.IcosahedronGeometry(1,0);function box(parent,w,h,d,color,x=0,y=0,z=0){const mesh=new THREE.Mesh(geoBox,typeof color==='number'?mat(color):color);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}function sphere(parent,r,color,x,y,z){const m=new THREE.Mesh(geoSphere,color);m.scale.setScalar(r);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function pathX(z){return Math.sin(z*.008)*7+Math.sin(z*.019)*2.2}function tangent(z){return (pathX(z+1)-pathX(z-1))*.5}function centerGroup(z){const g=new THREE.Group();g.position.set(pathX(z),0,z);g.rotation.y=Math.atan(tangent(z));scene.add(g);return g}
const CHUNK=65,TOTAL=1800;const chunks=[];function makeChunk(i){const start=i*CHUNK,g=new THREE.Group();scene.add(g);const parts=Math.ceil(CHUNK/5);for(let j=0;j<parts;j++){const z=start+j*5+2.5,cx=pathX(z);box(g,200,.1,5,dirtMat,cx,-.25,z);const angle=Math.atan(tangent(z));const road=box(g,11,.18,5.12,roadMat,cx,-.105,z);road.rotation.y=angle;for(const side of [-1,1]){const sh=box(g,1.3,.12,5.1,shoulderMat,cx+side*6.1,-.105,z);sh.rotation.y=angle;}if(j%3===0){const line=box(g,.15,.015,2.2,lineMat,cx,.003,z);line.rotation.y=angle;}}const random=mulberry32(i*919+113);for(let j=0;j<22;j++){const z=start+random()*CHUNK,side=random()<.5?-1:1;const x=pathX(z)+side*(10+random()*48);if(random()<.22){box(g,2,2+random()*3,2,mat(0x6c7068),x,1,z);continue;}const h=6+random()*9;box(g,.85,h*.55,.85,bark,x,h*.275,z);for(let k=0;k<3;k++)sphere(g,2+random()*1.4,leaves[Math.floor(random()*3)],x+(random()-.5)*1.3,h*(.52+k*.13),z+(random()-.5)*1.2)}return {g,i}}
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
// World-forward is +Z. The streamer lies on the back, feet facing +Z, face facing -Z.
// Both arms are built from distinct upper/forearm pieces so the "hand behind head" silhouette reads in 3D.
function segmentBox(parent,a,b,width,depth,material){
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
  const delta=end.clone().sub(start);
  const mesh=box(parent,width,delta.length(),depth,material);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  return mesh;
}
function createStreamer(parent){
  const root=new THREE.Group();parent.add(root);
  const skin=mat(0xe6bc9b),shirt=mat(0x8665b1),shirtHi=mat(0xa18acb),pants=mat(0x262e38),hair=mat(0x22272c),shoe=mat(0x191d25),eye=mat(0x12161d);
  // Relaxed supine pose. Behind camera = -Z; his head is visibly the closest body part to the viewer.
  box(root,.97,.33,1.38,shirt,0,.62,.10);
  const chest=box(root,.88,.075,.54,shirtHi,0,.81,-.16);chest.rotation.x=-.08;
  box(root,.56,.22,.30,shirt,0,.67,-.70); // neck / neck support
  const headTilt=new THREE.Group();headTilt.position.set(0,.84,STREAMER_HEAD_Z);headTilt.rotation.x=.27;root.add(headTilt);
  box(headTilt,.86,.46,.72,skin,0,.07,-.27);
  box(headTilt,.91,.16,.75,hair,0,.37,-.28);
  box(headTilt,.92,.25,.16,hair,0,.19,.05); // dark hair behind crown
  for(const x of [-.21,.21])box(headTilt,.15,.088,.043,eye,x,.11,-.653);
  box(headTilt,.14,.043,.042,mat(0x955b61),0,-.055,-.654); // mouth
  // Anatomical right = +X for a character looking toward -Z.
  // Right elbow sticks outward; the forearm bends back and the hand rests beneath the crown.
  const rightShoulder=[.52,.68,-.36],rightElbow=[1.02,.81,-.84],rightHand=[.39,.87,-1.27];
  segmentBox(root,rightShoulder,rightElbow,.32,.31,shirt);
  segmentBox(root,rightElbow,rightHand,.27,.27,skin);
  box(root,.28,.18,.27,skin,...rightHand);
  // Left arm lies relaxed beside the body, not the phone's mount.
  const leftShoulder=[-.53,.67,-.28],leftElbow=[-.79,.55,.27],leftHand=[-.65,.56,.88];
  segmentBox(root,leftShoulder,leftElbow,.30,.29,shirt);
  segmentBox(root,leftElbow,leftHand,.25,.24,skin);
  box(root,.25,.16,.25,skin,...leftHand);
  box(root,.91,.33,.86,pants,0,.57,.97);
  for(const x of [-.25,.25]){
    const leg=box(root,.35,.30,1.20,pants,x,.56,1.57);
    leg.rotation.x=.07;
    box(root,.38,.16,.48,shoe,x,.43,STREAMER_FEET_Z);
  }
  return {root,headTilt,rightShoulder,rightElbow,rightHand};
}
function makePhoneScreen(){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=448;
  const c=canvas.getContext('2d');
  c.fillStyle='#10202e';c.fillRect(0,0,256,448);
  c.fillStyle='#1c3446';c.fillRect(8,9,240,430);
  c.fillStyle='#f34f69';c.beginPath();c.arc(29,32,10,0,Math.PI*2);c.fill();
  c.fillStyle='#f6fcff';c.font='bold 29px Arial';c.fillText('LIVE',53,42);
  c.font='18px Arial';c.fillStyle='#b8d8f2';c.fillText('● 8.4K',24,81);
  c.fillStyle='#253e4a';c.fillRect(25,112,206,190);
  c.fillStyle='#89b2c7';c.fillRect(79,164,98,85); // tiny selfie silhouette, icon rather than a fake video feed
  c.fillStyle='#a5cce0';c.fillRect(108,131,41,39);
  for(let i=0;i<3;i++){
    c.fillStyle=i===0?'#ffb7cb':'#80bacd';c.fillRect(27,330+i*29,14,10);
    c.fillStyle='#a0b2be';c.fillRect(52,331+i*29,145-i*25,8);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function createStreamingPhone(parent){
  const holder=new THREE.Group();holder.position.set(-.57,.34,-.63);parent.add(holder);
  const hardware=mat(0xadb4be),black=mat(0x0d151a),redLed=new THREE.MeshBasicMaterial({color:0xff344a,toneMapped:false});
  // Rigid post attaches to the deck, not the character's body.
  segmentBox(holder,[.0,.09,0],[-.34,.78,-.15],.073,.076,hardware);
  segmentBox(holder,[-.34,.78,-.15],[-.46,.96,-.32],.072,.071,hardware);
  const phone=new THREE.Group();phone.position.set(-.46,.97,-.32);phone.rotation.y=-.24;phone.rotation.z=-.12;holder.add(phone);
  box(phone,.43,.72,.086,black);
  // Screen faces the trailing camera (-Z) so the LIVE interface remains visible in play.
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(.37,.65),new THREE.MeshBasicMaterial({map:makePhoneScreen(),side:THREE.DoubleSide,toneMapped:false}));
  screen.position.z=-.047;screen.rotation.y=Math.PI;phone.add(screen);
  box(phone,.055,.055,.017,redLed,.155,.29,-.056);
  box(phone,.09,.019,.017,hardware,0,-.30,-.056);
  return {holder,phone};
}
const player=new THREE.Group();scene.add(player);const deck=box(player,1.45,.16,3.45,mat(0x252a30),0,.32,0);box(player,1.32,.035,3.2,mat(0x8264b4),0,.42,0);for(const x of [-.69,.69])for(const z of [-1.17,1.17]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.15,12),mat(0x13161b));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.22,z);wheel.castShadow=true;player.add(wheel)}const rider=createStreamer(player);const streamerPhone=createStreamingPhone(player);
const chaser=new THREE.Group();scene.add(chaser);const bike=new THREE.Group();chaser.add(bike);const tire=mat(0x171819),metal=mat(0xb8c3c3),red=mat(0x854847);for(const z of [-1.05,1.05]){const w=new THREE.Mesh(new THREE.TorusGeometry(.69,.095,7,16),tire);w.rotation.y=Math.PI/2;w.position.set(0,.82,z);bike.add(w)}const bikeFrame=[[0,.95,-1.05,0,1.45,0],[0,1.45,0,0,.95,1.05],[0,.95,-1.05,0,.95,1.05],[0,1.45,0,0,.95,1.05]];function rod(parent,a,b,r,material){const v1=new THREE.Vector3(...a),v2=new THREE.Vector3(...b),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v1.distanceTo(v2),8),material);m.position.copy(v1).add(v2).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v2.sub(v1).normalize());parent.add(m)}bikeFrame.forEach(([x,y,z,X,Y,Z])=>rod(bike,[x,y,z],[X,Y,Z],.072,red));rod(bike,[0,1.4,-1],[0,1.9,-1.05],.065,metal);rod(bike,[-.55,1.9,-1.05],[.55,1.9,-1.05],.065,metal);box(bike,.45,.08,.58,tire,0,1.6,.13);box(bike,.82,.96,.55,red,0,2.48,.3);box(bike,.65,.65,.62,mat(0xd0aa83),0,3.27,-.22);box(bike,.7,.15,.65,mat(0x34312d),0,3.64,-.25);for(const x of [-.16,.16])box(bike,.12,.075,.03,mat(0x1a1c20),x,3.32,-.548);box(bike,.22,.06,.035,mat(0x6b3938),0,3.16,-.55);for(const x of [-.42,.42]){rod(bike,[x,2.65,.12],[x*.8,1.7,-.65],.14,mat(0xd0aa83));rod(bike,[x*.55,1.9,.58],[x*.55,1.13,.26],.18,mat(0x27303a))}
const obstacles=[];function createObstacle(z,xoffset,type){const g=centerGroup(z);g.position.x+=xoffset;let radius=1.25;if(type==='cone'){const m=new THREE.Mesh(new THREE.ConeGeometry(.56,1.22,4),mat(0xe56e36));m.position.y=.62;m.rotation.y=Math.PI/4;g.add(m);radius=.68}else if(type==='gravel'){for(let i=0;i<8;i++)box(g,.25+Math.random()*.35,.15,.2+Math.random()*.4,mat(0xbbb4a3),Math.random()*1.7-.85,.11,Math.random()*1.7-.85);radius=1.15}else if(type==='bin'){box(g,1.4,1.7,1.4,mat(0x3f5b59),0,.85,0);box(g,1.6,.18,1.55,mat(0x233a3a),0,1.8,0);radius=1.05}else{box(g,3,1.1,.9,mat(0xd1a466),0,.55,0);radius=1.7}obstacles.push({g,z,xoffset,type,radius,hit:false})}const rng=mulberry32(424242);for(let z=95;z<TOTAL-65;z+=18+rng()*20){const type=['cone','gravel','bin','barrier'][Math.floor(rng()*4)];createObstacle(z,[-3.4,-1.7,0,1.7,3.4][Math.floor(rng()*5)],type)}
const keys=new Set();addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code)});addEventListener('keyup',e=>keys.delete(e.code));for(const [id,code] of [['left','ArrowLeft'],['right','ArrowRight'],['brake','Space']]){const el=document.querySelector('#'+id);el.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(code);el.setPointerCapture(e.pointerId)});for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,()=>keys.delete(code))}
let state='menu',distance=INITIAL_GAP,z=0,offset=0,v=11.0,enemyZ=-INITIAL_GAP,enemyV=13.5,enemyOffset=0,stun=0,recovery=0,seconds=0,chatTimer=0,noticeTimer=0,nearAlert=false,last=performance.now();const comments=['后面的自行车怎么还在追啊？？','主播你怎么躺着开车哈哈哈哈','别看弹幕啦看路啊！！','救命他骑得比我电驴还快','前面有垃圾桶！！','谁给主播规划的逃生路线','小胖龙：他真的不回头啊','好家伙自行车上坡更快了','主播：这是沉浸式户外直播'];let chatIndex=0;function addChat(text){const parent=document.querySelector('#chat'),el=document.createElement('p');el.innerHTML=`<b>${['小胖龙','土豆骑士','路人甲','路人乙','绮思的奶茶'][chatIndex++%5]}：</b> ${text}`;parent.append(el);while(parent.children.length>4)parent.firstChild.remove()}function notice(text){const m=document.querySelector('#message');m.textContent=text;m.style.opacity=1;noticeTimer=1.6}function reset(){nearAlert=false;state='play';distance=INITIAL_GAP;z=0;offset=0;v=11;enemyZ=-INITIAL_GAP;enemyV=13.5;enemyOffset=0;stun=0;recovery=0;seconds=0;chatTimer=0;obstacles.forEach(o=>o.hit=false);document.querySelector('#chat').innerHTML='';document.querySelector('#menu').style.display='none';addChat('主播后面怎么有人骑车追你啊！')}function finish(won){state='end';document.querySelector('#menu').style.display='flex';document.querySelector('.panel').innerHTML=`<div class="tag">${won?'● STREAM SURVIVED':'● STREAM DISCONNECTED'}</div><h1>${won?'逃出生天！':'你被追上了！'}</h1><p class="info">本次滑行 ${Math.floor(z)} 米 · ${Math.floor(seconds)} 秒。<br/>${won?'直播间已经把你的逃亡剪成名场面。':'后面的自行车终于追上了！弹幕正在疯狂截图。'}</p><button class="go" id="restart">再逃一次 →</button>`;document.querySelector('#restart').onclick=reset}document.querySelector('#start').onclick=reset;
const map=document.querySelector('#map'),ctx=map.getContext('2d');function drawMap(){const W=292,H=290;ctx.clearRect(0,0,W,H);ctx.fillStyle='#14272a';ctx.fillRect(0,0,W,H);const scale=1.02;ctx.lineJoin='round';ctx.lineCap='round';for(let z0=z-100;z0<z+200;z0+=3){const y=H*.56-(z0-z)*scale,x=W*.5+(pathX(z0)-pathX(z))*1.3;ctx.fillStyle='#536565';ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.fill()}for(let z0=z-100;z0<z+200;z0+=2){const y=H*.56-(z0-z)*scale,x=W*.5+(pathX(z0)-pathX(z))*1.3;ctx.fillStyle='#82918c';ctx.fillRect(x-7,y-2,14,5)}const marks=[[W*.5+offset*1.3,H*.56,'#58b2ff'],[W*.5+(pathX(enemyZ)-pathX(z)+enemyOffset)*1.3,H*.56-(enemyZ-z)*scale,'#ff5e68']];for(const [x,y,color] of marks){if(y<0||y>H)continue;ctx.fillStyle=color+'44';ctx.beginPath();ctx.arc(x,y,14,0,7);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,6,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke()}ctx.fillStyle='#a2bfc1';ctx.font='15px system-ui';ctx.fillText('N ↑',12,24)}
function step(dt){if(state!=='play')return;seconds+=dt;chatTimer+=dt;if(chatTimer>4.0){addChat(comments[Math.floor(rng()*comments.length)]);chatTimer=0}const steer=(keys.has('KeyA')||keys.has('ArrowLeft')?-1:0)+(keys.has('KeyD')||keys.has('ArrowRight')?1:0);offset=THREE.MathUtils.clamp(offset+steer*dt*(3.5+v*.15),-7,7);let target=playerCruiseSpeed(z);if(keys.has('Space'))target=4.7;if(Math.abs(offset)>5.1)target=Math.min(target,7.4);if(stun>0){stun=Math.max(0,stun-dt);target=1}recovery=Math.max(0,recovery-dt);v=THREE.MathUtils.damp(v,target,stun>0?2.1:(recovery>0?1.4:0.65),dt);z+=v*dt;const playerX=pathX(z)+offset;player.position.set(playerX,0.08,z);player.rotation.y=Math.atan(tangent(z));player.rotation.z=steer*-.07+(stun>0?Math.sin(seconds*24)*.14:0);rider.root.rotation.z=stun>0?Math.sin(seconds*15)*.14:0;rider.headTilt.rotation.x=.27+Math.sin(seconds*2.4)*.027+(distance<WARNING_DISTANCE?.10:0);streamerPhone.phone.rotation.z=-.12+Math.sin(seconds*4.2)*.018;for(const o of obstacles){if(!o.hit&&Math.abs(z-o.z)<1.35&&Math.abs(offset-o.xoffset)<o.radius+.4){o.hit=true;const impact=IMPACT[o.type];v*=impact.multiplier;stun=Math.max(stun,impact.stun);recovery=Math.max(recovery,impact.recovery);if(impact.stun===0){notice('⚠ 颠簸减速！');addChat('好险差点翻车！！')}else{notice('💥 翻板了！！');addChat('哈哈哈哈主播飞出去了！')}}}const pursuit=advanceCyclist({enemyZ,enemySpeed:enemyV,playerZ:z},dt);enemyZ=pursuit.enemyZ;enemyV=pursuit.enemySpeed;enemyOffset=THREE.MathUtils.damp(enemyOffset,Math.sin(seconds*.6)*.9,1,dt);chaser.position.set(pathX(enemyZ)+enemyOffset,0,enemyZ);chaser.rotation.y=Math.atan(tangent(enemyZ))+BIKE_HEADING_CORRECTION;bike.rotation.z=Math.sin(seconds*17)*.024;distance=Math.max(0,z-enemyZ);if(distance<WARNING_DISTANCE&&!nearAlert){addChat('他就在屁股后面啊啊啊！');nearAlert=true}if(distance>WARNING_DISTANCE+8)nearAlert=false;if(distance<CATCH_DISTANCE)finish(false);else if(z>=TOTAL)finish(true);document.querySelector('#speed').textContent=Math.round(v*3.6);document.querySelector('#meters').textContent=Math.min(TOTAL,Math.floor(z));const gapEl=document.querySelector('#gap');gapEl.textContent=distance<CRITICAL_DISTANCE?`🚨 危险！仅剩 ${Math.ceil(distance)}m`:`追击距离 ${Math.ceil(distance)}m`;gapEl.classList.toggle('critical',distance<CRITICAL_DISTANCE);gapEl.classList.toggle('warning',distance<WARNING_DISTANCE);document.querySelector('#viewers').textContent=Math.floor(8439+seconds*27).toLocaleString();if(noticeTimer>0){noticeTimer-=dt;if(noticeTimer<=0)document.querySelector('#message').style.opacity=0}drawMap()}
function maintainChunks(){const at=Math.floor(z/CHUNK);for(let i=Math.max(0,at-2);i<=Math.min(Math.ceil(TOTAL/CHUNK)+2,at+5);i++){if(!chunks.some(c=>c.i===i))chunks.push(makeChunk(i))}for(let i=chunks.length-1;i>=0;i--)if(Math.abs(chunks[i].i-at)>6){scene.remove(chunks[i].g);chunks[i].g.traverse(n=>{if(n.isMesh){n.geometry.dispose();if(![roadMat,shoulderMat,dirtMat,lineMat,bark,...leaves].includes(n.material))n.material.dispose()}});chunks.splice(i,1)}}const targetPos=new THREE.Vector3();function frame(now){requestAnimationFrame(frame);const dt=Math.min(.045,(now-last)/1000);last=now;if(state==='play')step(dt);maintainChunks();const bz=state==='menu'?40:z,bx=pathX(bz)+(state==='menu'?0:offset);targetPos.set(bx,7.3,bz-(state==='play'&&distance<WARNING_DISTANCE?24:13.6));camera.position.lerp(targetPos,Math.min(1,dt*3));camera.lookAt(bx,1.15,bz+13);renderer.render(scene,camera)}requestAnimationFrame(frame);addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
