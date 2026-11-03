import * as THREE from 'three';
import './style.css';
import './menu-pages.css';
import {roadX,roadY,roadTangent,roadPitch} from './road-geometry.js';
import {createRoadsideKit} from './roadside.js';
import {CROW_MARKERS,shouldReleaseCrow,createCrowActor} from './crow-event.js';
import { MAPS,STREAMER_SKINS,CYCLIST_SKINS,findMap,findSkin,classifySwipe,shiftLaneIndex,LANE_OFFSETS,approachLaneOffset } from './game-content.js';
import { renderShell,createInterface } from './interface.js';
import { INITIAL_GAP, CATCH_DISTANCE, WARNING_DISTANCE, CRITICAL_DISTANCE, IMPACT, playerCruiseSpeed, advanceCyclist, LAUNCH_SPRINT_SPEED, LAUNCH_CYCLIST_SPEED, BOOST_SPEED, BRAKE_SPEED, ROAD_EDGE_SPEED } from './chase.js';
import { BIKE_HEADING_CORRECTION, STREAMER_HEAD_Z, STREAMER_FEET_Z, STREAMER_HEAD_PITCH, STREAMER_FACE_Y, STREAMER_GAZE_BACK_EXTRA, STREAMER_BOARD_YAW, STREAMER_BOARD_CENTER_OFFSET_Z, STREAMER_REST_ARM_SHOULDER_X, STREAMER_REST_ARM_ELBOW_X, STREAMER_REST_ARM_HAND_X } from './pose.js';

const app=document.querySelector('#app');
app.innerHTML=renderShell();
const speedFx=document.querySelector('#speed-fx');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x7e9aa0);scene.fog=new THREE.FogExp2(0x819994,.0105);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.1,650);const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;document.querySelector('#world').append(renderer.domElement);scene.add(camera);
const ambient=new THREE.HemisphereLight(0xd4e5ea,0x3d4c38,2.1);scene.add(ambient);const sun=new THREE.DirectionalLight(0xffdfb8,2.3);sun.position.set(-40,75,-20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-75;sun.shadow.camera.right=75;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;scene.add(sun);
let currentMap=MAPS[0];
const mat=(color,roughness=1)=>new THREE.MeshStandardMaterial({color,roughness});const roadMat=mat(0x555d5c), shoulderMat=mat(0x918c78), dirtMat=mat(0x486348), lineMat=mat(0xe8dcb4), bark=mat(0x594b3b), leaves=[mat(0x47664e),mat(0x67846c),mat(0x385b50)];
const geoBox=new THREE.BoxGeometry(1,1,1);const geoSphere=new THREE.IcosahedronGeometry(1,0);
const reflectorMat=mat(0xd8e7d4),postMat=mat(0x566169),postStripeMat=mat(0xd2ff95);function box(parent,w,h,d,color,x=0,y=0,z=0){const mesh=new THREE.Mesh(geoBox,typeof color==='number'?mat(color):color);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}function sphere(parent,r,color,x,y,z){const m=new THREE.Mesh(geoSphere,color);m.scale.setScalar(r);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
function pathX(z){return roadX(z)}function tangent(z){return roadTangent(z)}function terrain(z){return roadY(z,currentMap.id)}function centerGroup(z){const g=new THREE.Group();g.position.set(pathX(z),terrain(z),z);g.rotation.y=Math.atan(tangent(z));scene.add(g);return g}
const roadside=createRoadsideKit(THREE,{box,mat,pathX,roadY:terrain});const crow=createCrowActor(THREE,camera);const crowHint=document.querySelector('#crow-hint');let nextCrowIndex=0;
const CHUNK=65,TOTAL=1800;const chunks=[];function makeChunk(i){const start=i*CHUNK,g=new THREE.Group();scene.add(g);const parts=Math.ceil(CHUNK/5);for(let j=0;j<parts;j++){const z=start+j*5+2.5,cx=pathX(z),y=terrain(z),pitch=roadPitch(z,currentMap.id);box(g,200,.1,5,dirtMat,cx,y-.25,z);const angle=Math.atan(tangent(z));const road=box(g,11,.18,5.12,roadMat,cx,y-.105,z);road.rotation.y=angle;road.rotation.x=pitch;for(const side of [-1,1]){const sh=box(g,1.3,.12,5.1,shoulderMat,cx+side*6.1,y-.105,z);sh.rotation.y=angle;sh.rotation.x=pitch;}if(j%2===0){const line=box(g,.16,.015,3.15,lineMat,cx,y+.003,z);line.rotation.y=angle;line.rotation.x=pitch;}
      // Real roadside speed cues: fixed in world space, pass the camera rapidly.
      if(j%2===0)for(const side of [-1,1]){
        const px=cx+side*7.5,post=box(g,.22,.78,.22,postMat,px,y+.35,z);
        post.castShadow=false;
        const reflect=box(g,.245,.21,.26,reflectorMat,px,y+.63,z);
        reflect.castShadow=false;
        if((i+j)%4===0){const stripe=box(g,.29,.075,.28,postStripeMat,px,y+.46,z);stripe.castShadow=false;}
      }}const random=mulberry32(i*919+113);for(let j=0;j<22;j++){const z=start+random()*CHUNK,side=random()<.5?-1:1;const x=pathX(z)+side*(10+random()*48),baseY=terrain(z);if(random()<.22){box(g,2,2+random()*3,2,mat(0x6c7068),x,baseY+1,z);continue;}const h=6+random()*9;box(g,.85,h*.55,.85,bark,x,baseY+h*.275,z);for(let k=0;k<3;k++)sphere(g,2+random()*1.4,leaves[Math.floor(random()*3)],x+(random()-.5)*1.3,baseY+h*(.52+k*.13),z+(random()-.5)*1.2)}if(currentMap.id==='coast'){
    const rail=mat(0xdad5b8),trunk=mat(0x8b7b61),frond=mat(0x3e9379);
    for(let k=0;k<5;k++){
      const z=start+k*14,x=pathX(z)+8.6,y=terrain(z);
      box(g,.13,1.2,.15,rail,x,y+.65,z);box(g,.12,.1,14,rail,x,y+1.15,z+7);
      if(k%2===0){const px=pathX(z)-13;box(g,.48,5,.48,trunk,px,y+2.5,z);
        for(let v=0;v<4;v++){const leaf=box(g,4.3,.18,.7,frond,px,y+5.2,z);leaf.rotation.y=v*Math.PI/2;leaf.rotation.z=(v%2?-.13:.13)}
      }
    }
  }
  if(currentMap.id==='night'){
    const building=mat(0x252b43),lit=mat(0xdcb7ff),pole=mat(0x61637a);
    for(let k=0;k<5;k++){
      const z=start+k*15,x=pathX(z)+8.4,y=terrain(z);
      box(g,.17,5.3,.17,pole,x,y+2.65,z);box(g,1.4,.18,.55,lit,x-.55,y+5.35,z);
      box(g,4.1,7+k%3*3,4.2,building,pathX(z)-19,y+4.0+k%3*1.5,z+7);
      for(let y=3;y<9;y+=2)box(g,.9,.28,.08,lit,pathX(z)-16.95,terrain(z)+y,z+7);
    }
  }
  roadside.populate(g,i,random,currentMap.id);
  return {g,i}}
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
// World-forward is +Z. The streamer remains FACE UP (+Y), but its model is turned 180 degrees on the board, independently of travel direction.
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
  const skin=mat(0xe6bc9b),skinLight=mat(0xf1c9a6),shirt=mat(0x8665b1),shirtHi=mat(0xa18acb),pants=mat(0x262e38),hair=mat(0x22272c),shoe=mat(0x191d25),eye=mat(0x12161d),eyeWhite=mat(0xf1f4ee),lip=mat(0x905963);
  // Relaxed supine pose. Behind camera = -Z; his head is visibly the closest body part to the viewer.
  box(root,.97,.33,1.38,shirt,0,.62,.10);
  const chest=box(root,.88,.075,.54,shirtHi,0,.81,-.16);chest.rotation.x=-.08;
  box(root,.56,.22,.30,shirt,0,.67,-.70); // neck / neck support
  // Screenshot reference: the streamer lies on their BACK, with the face on the TOP (+Y) of the head.
  // Tilt the skull toward the trailing camera (-Z), not forward into the pavement.
  const headTilt=new THREE.Group();headTilt.position.set(0,1.02,STREAMER_HEAD_Z);
  headTilt.rotation.x=STREAMER_HEAD_PITCH;root.add(headTilt);
  // Rear skull and side hair frame the face; NO opaque hair cap can cover the upward-facing face.
  box(headTilt,.88,.48,.77,skin,0,.065,-.24);
  box(headTilt,.91,.16,.78,hair,0,-.16,-.27); // back of head, beneath face
  for (const x of [-.43,.43])box(headTilt,.105,.32,.74,hair,x,.10,-.27); // sideburns / hair edges
  box(headTilt,.82,.09,.12,hair,0,.292,-.583); // fringe outside the eyes
  // All facial features lie on the top horizontal plane. This is the crucial supine-vs-prone fix.
  box(headTilt,.70,.025,.53,skinLight,0,STREAMER_FACE_Y,-.22);
  for (const x of [-.19,.19]) {
    box(headTilt,.185,.020,.12,eyeWhite,x,STREAMER_FACE_Y+.024,-.42);
    box(headTilt,.078,.027,.081,eye,x,STREAMER_FACE_Y+.043,-.45);
    box(headTilt,.20,.025,.047,hair,x,STREAMER_FACE_Y+.026,-.54); // brows
  }
  box(headTilt,.13,.049,.11,skin,0,STREAMER_FACE_Y+.041,-.25); // nose faces the sky
  box(headTilt,.23,.016,.047,lip,0,STREAMER_FACE_Y+.022,-.055); // mouth on skyward plane
  // Under-neck pillow-like lift: face visible, while the body stays flat on the longboard.
  box(root,.55,.24,.40,skin,0,.80,-.70);
  box(root,.42,.14,.28,shirtHi,0,.90,-.46);
  // Mirror the whole pose horizontally so the resting arm appears on the opposite side.
  // This matches the user's reference more closely.
  const restShoulder=[STREAMER_REST_ARM_SHOULDER_X,.70,-.40],restElbow=[STREAMER_REST_ARM_ELBOW_X,.98,-.95],restHand=[STREAMER_REST_ARM_HAND_X,1.08,-1.34];
  segmentBox(root,restShoulder,restElbow,.32,.31,shirt);
  segmentBox(root,restElbow,restHand,.27,.27,skin);
  box(root,.28,.18,.27,skin,...restHand);
  // The opposite arm lies relaxed along the body.
  const freeShoulder=[.53,.67,-.28],freeElbow=[.79,.55,.27],freeHand=[.65,.56,.88];
  segmentBox(root,freeShoulder,freeElbow,.30,.29,shirt);
  segmentBox(root,freeElbow,freeHand,.25,.24,skin);
  box(root,.25,.16,.25,skin,...freeHand);
  box(root,.91,.33,.86,pants,0,.57,.97);
  for(const x of [-.25,.25]){
    const leg=box(root,.35,.30,1.20,pants,x,.56,1.57);
    leg.rotation.x=.07;
    box(root,.38,.16,.48,shoe,x,.43,STREAMER_FEET_Z);
  }
  const cowHorns=new THREE.Group();headTilt.add(cowHorns);
  const hornMat=mat(0xedeae2);for(const hx of [-.4,.4]){
    const horn=box(cowHorns,.18,.27,.18,hornMat,hx,.39,-.46);horn.rotation.z=hx<0?-.35:.35;
  }
  const dragonHorns=new THREE.Group();headTilt.add(dragonHorns);
  const dragonMat=mat(0xf1b852);for(const hx of [-.32,.32]){
    const horn=box(dragonHorns,.2,.25,.27,dragonMat,hx,.40,-.52);horn.rotation.z=hx<0?-.28:.28;
  }
  cowHorns.visible=false;dragonHorns.visible=false;
  return {root,headTilt,restShoulder,restElbow,restHand,materials:{skin,shirt,shirtHi,pants,hair},cowHorns,dragonHorns};
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
const player=new THREE.Group();scene.add(player);const deck=box(player,1.45,.16,3.45,mat(0x252a30),0,.32,0);box(player,1.32,.035,3.2,mat(0x8264b4),0,.42,0);for(const x of [-.69,.69])for(const z of [-1.17,1.17]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.15,12),mat(0x13161b));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.22,z);wheel.castShadow=true;player.add(wheel)}const rider=createStreamer(player);rider.root.rotation.y=STREAMER_BOARD_YAW;rider.root.position.z=STREAMER_BOARD_CENTER_OFFSET_Z;const streamerPhone=createStreamingPhone(player);
const chaser=new THREE.Group();scene.add(chaser);const bike=new THREE.Group();chaser.add(bike);const tire=mat(0x171819),metal=mat(0xb8c3c3),red=mat(0x27323b),cyclistShirt=mat(0xc0ff27),cyclistPants=mat(0x242c2e);for(const z of [-1.05,1.05]){const w=new THREE.Mesh(new THREE.TorusGeometry(.69,.095,7,16),tire);w.rotation.y=Math.PI/2;w.position.set(0,.82,z);bike.add(w)}const bikeFrame=[[0,.95,-1.05,0,1.45,0],[0,1.45,0,0,.95,1.05],[0,.95,-1.05,0,.95,1.05],[0,1.45,0,0,.95,1.05]];function rod(parent,a,b,r,material){const v1=new THREE.Vector3(...a),v2=new THREE.Vector3(...b),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v1.distanceTo(v2),8),material);m.position.copy(v1).add(v2).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v2.sub(v1).normalize());parent.add(m)}bikeFrame.forEach(([x,y,z,X,Y,Z])=>rod(bike,[x,y,z],[X,Y,Z],.072,red));rod(bike,[0,1.4,-1],[0,1.9,-1.05],.065,metal);rod(bike,[-.55,1.9,-1.05],[.55,1.9,-1.05],.065,metal);box(bike,.45,.08,.58,tire,0,1.6,.13);box(bike,.82,.96,.55,cyclistShirt,0,2.48,.3);box(bike,.65,.65,.62,mat(0xd0aa83),0,3.27,-.22);box(bike,.7,.15,.65,mat(0x34312d),0,3.64,-.25);for(const x of [-.16,.16])box(bike,.12,.075,.03,mat(0x1a1c20),x,3.32,-.548);box(bike,.22,.06,.035,mat(0x6b3938),0,3.16,-.55);for(const x of [-.42,.42]){rod(bike,[x,2.65,.12],[x*.8,1.7,-.65],.14,mat(0xd0aa83));rod(bike,[x*.55,1.9,.58],[x*.55,1.13,.26],.18,cyclistPants)}
function applyStreamerSkin(id){
  const skin=findSkin(STREAMER_SKINS,id),m=rider.materials;
  m.shirt.color.setHex(skin.shirt);m.shirtHi.color.setHex(skin.shirtHi);
  m.pants.color.setHex(skin.pants);m.hair.color.setHex(skin.hair);m.skin.color.setHex(skin.skin);
  rider.cowHorns.visible=skin.accessory==='horns';rider.dragonHorns.visible=skin.accessory==='dragon';
}
function applyCyclistSkin(id){
  const skin=findSkin(CYCLIST_SKINS,id);
  cyclistShirt.color.setHex(skin.shirt);cyclistPants.color.setHex(skin.pants);red.color.setHex(skin.bike);
}
function clearChunkVisuals(){
  for(const c of chunks){scene.remove(c.g);c.g.traverse(n=>{
    if(n.isMesh && n.geometry!==geoBox && n.geometry!==geoSphere)n.geometry.dispose();
  });}
  chunks.length=0;
}
function applyMap(id){
  currentMap=findMap(id);
  scene.background=new THREE.Color(currentMap.sky);
  scene.fog=new THREE.FogExp2(currentMap.fog,currentMap.fogDensity);
  roadMat.color.setHex(currentMap.road);shoulderMat.color.setHex(currentMap.shoulder);
  dirtMat.color.setHex(currentMap.ground);bark.color.setHex(currentMap.bark);
  for(let i=0;i<3;i++)leaves[i].color.setHex(currentMap.foliage[i]);
  sun.intensity=currentMap.id==='night'?.95:2.3;
  ambient.intensity=currentMap.id==='night'?1.2:2.1;
  clearChunkVisuals();
  // Existing obstacles are persistent: shift them onto the newly selected terrain, too.
  for(const obstacle of obstacles)obstacle.g.position.y=terrain(obstacle.z);
}
const obstacles=[];
function createObstacle(z,xoffset,type){
  const g=centerGroup(z);g.position.x+=xoffset;
  let radius=1.2;
  if(type==='cone'){
    const m=new THREE.Mesh(new THREE.ConeGeometry(.56,1.22,4),mat(0xe56e36));m.position.y=.62;m.rotation.y=Math.PI/4;g.add(m);radius=.72;
  }else if(type==='gravel'){
    for(let i=0;i<8;i++)box(g,.25+Math.random()*.35,.15,.2+Math.random()*.4,mat(0xbbb4a3),Math.random()*1.7-.85,.11,Math.random()*1.7-.85);radius=1.1;
  }else if(type==='banana'){
    const yellow=mat(0xffd02f),tip=mat(0x6f6238);
    for(let i=0;i<4;i++){const b=box(g,.23,.12,.40,yellow,(i-1.5)*.20,.10,Math.sin(i*.8)*.13);b.rotation.y=(i-1.5)*.26;}
    box(g,.10,.10,.13,tip,.49,.10,.10);radius=.72;
  }else if(type==='cup'){
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.34,.25,.73,7),mat(0xd7a9e5));cup.position.y=.36;cup.rotation.z=.18;g.add(cup);
    box(g,.52,.06,.52,mat(0xf8eee7),0,.76,0);box(g,.07,.38,.07,mat(0xf1f1e8),.12,.94,0);radius=.68;
  }else if(type==='bag'){
    box(g,.90,.70,.55,mat(0xcda97b),0,.36,0);
    for(const x of [-.25,.25])box(g,.12,.25,.12,mat(0xb18b63),x,.80,0);radius=.84;
  }else if(type==='tripod'){
    const metal=mat(0x3f4951),screen=mat(0x8bd8ed);
    box(g,.52,.80,.17,metal,0,1.15,0);box(g,.43,.55,.04,screen,0,1.18,-.11);box(g,.08,.95,.08,metal,0,.47,0);
    for(const x of [-.45,.45]){const leg=box(g,.07,.85,.08,metal,x*.5,.33,0);leg.rotation.z=x<0?-.5:.5;}radius=1.0;
  }else if(type==='bin'){
    box(g,1.4,1.7,1.4,mat(0x3f5b59),0,.85,0);box(g,1.6,.18,1.55,mat(0x233a3a),0,1.8,0);radius=1.05;
  }else{box(g,3,1.1,.9,mat(0xd1a466),0,.55,0);radius=1.7;}
  obstacles.push({g,z,xoffset,type,radius,hit:false});
}
const rng=mulberry32(424242);
for(let obstacleZ=95;obstacleZ<TOTAL-65;obstacleZ+=19+rng()*17){
  const types=['cone','gravel','banana','cup','bag','tripod','bin','barrier'];
  const type=types[Math.floor(rng()*types.length)];
  createObstacle(obstacleZ,[-3.4,0,3.4][Math.floor(rng()*3)],type);
}
const keys=new Set();addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','KeyA','KeyD','Space'].includes(e.code))e.preventDefault();
  if(keys.has(e.code))return; // one keypress = one lane; avoid operating-system auto-repeat
  keys.add(e.code);
  if(e.code==='KeyA'||e.code==='ArrowLeft')onSwipe('left');
  else if(e.code==='KeyD'||e.code==='ArrowRight')onSwipe('right');
});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
let state='menu',distance=INITIAL_GAP,z=0,offset=0,v=11,enemyZ=0,enemyV=0,enemyOffset=-2.5,stun=0,recovery=0,
    seconds=0,chatTimer=0,noticeTimer=0,nearAlert=false,last=performance.now(),introTimer=0,introPhase=-1,
    laneIndex=1,swipeBrakeUntil=0,swipeBoostUntil=0,boostCooldownUntil=0,streamMilestone=0,bananaSlip=0;
const LANES=LANE_OFFSETS;
const comments=['乌鸦也有自己的直播间了？！','路边的礼物箱比主播都大','这条路居然还是上下坡','后面的自行车怎么还在追啊？？','主播你怎么躺着开车哈哈哈哈','别看弹幕啦看路啊！！','救命他骑得比我电驴还快','前面有垃圾桶！！','谁给主播规划的逃生路线','小胖龙：他真的不回头啊','好家伙自行车上坡更快了','主播：这是沉浸式户外直播'];
let chatIndex=0;const gameUI=createInterface({onStart:beginOpening,onPreviewMap:applyMap,onSkipIntro:launchEscape,onReplay:()=>beginOpening(gameUI.config),onHome:()=>{state='menu';z=0;offset=0;crow.clear();crowHint.classList.add('is-hidden');gameUI.showHome()}});
function addChat(text){const parent=document.querySelector('#chat'),el=document.createElement('p');
  const people=['小胖龙','土豆骑士','路人甲','路人乙','绮思的奶茶'];
  const label=document.createElement('b');label.textContent=people[chatIndex++%people.length]+'：';
  el.append(label,document.createTextNode(' '+text));parent.append(el);while(parent.children.length>4)parent.firstChild.remove();
}
function notice(text){const m=document.querySelector('#message');m.textContent=text;m.style.opacity=1;noticeTimer=1.6}
function resetRun(){
  state='intro';distance=0;z=0;offset=1.6;v=1.5;enemyZ=0;enemyV=1.5;enemyOffset=-2.4;
  stun=0;recovery=0;seconds=0;chatTimer=0;nearAlert=false;introTimer=0;introPhase=-1;laneIndex=1;
  swipeBrakeUntil=swipeBoostUntil=boostCooldownUntil=0;noticeTimer=0;streamMilestone=0;bananaSlip=0;nextCrowIndex=0;crow.clear();crowHint.classList.add('is-hidden');
  document.querySelector('#chat').replaceChildren();document.querySelector('#message').style.opacity=0;
  for(const o of obstacles)o.hit=false;
  player.position.set(pathX(0)+offset,terrain(0)+.08,0);
  chaser.position.set(pathX(0)+enemyOffset,terrain(0),0);chaser.rotation.y=BIKE_HEADING_CORRECTION;
  gameUI.showIntro();
}
function beginOpening(config){
  applyMap(config.map);applyStreamerSkin(config.streamer);applyCyclistSkin(config.cyclist);
  resetRun();
}
const INTRO_LINES=[
  {who:'骑车男',line:'你在直播吗？你这滑板……怎么躺着骑？'},
  {who:'主播',line:'啊？……等等，你怎么一直跟着我？'},
  {who:'直播弹幕',line:'？？？主播快溜！！别回头！！'}
];
function updateIntro(dt){
  introTimer+=dt;
  const phase=Math.min(2,Math.floor(introTimer/1.55));
  if(phase!==introPhase){introPhase=phase;gameUI.setStory(INTRO_LINES[phase].who,INTRO_LINES[phase].line)}
  if(introTimer>=4.75)launchEscape();
}
function launchEscape(){
  if(state!=='intro')return;
  state='launch';introTimer=0;
  gameUI.launch();notice('主播：溜了溜了！！！');addChat('主播？？你怎么突然加速了哈哈哈哈');
}
function finish(won){
  state='end';crow.clear();crowHint.classList.add('is-hidden');gameUI.showEnd(won,z,seconds);
}
function onSwipe(gesture){
  if(state!=='play'&&state!=='launch')return;
  if(gesture==='left'||gesture==='right'){
    laneIndex=shiftLaneIndex(laneIndex,gesture,LANES.length);
    if(navigator.vibrate)navigator.vibrate(10);
  }else if(gesture==='brake'){
    swipeBrakeUntil=seconds+1.15;
  }else if(gesture==='boost'&&seconds>=boostCooldownUntil){
    swipeBoostUntil=seconds+.85;boostCooldownUntil=seconds+6.0;
    notice('⚡ 短暂冲刺！');
  }
}
function bindSwipeSurface(canvas){
  let gesture=null;
  canvas.addEventListener('pointerdown',event=>{
    if(state==='play'&&crow.active){
      const hit=crow.tap(event.clientX,event.clientY,canvas);
      if(hit){event.preventDefault();if(hit.cleared){crowHint.classList.add('is-hidden');notice('🐦 乌鸦被赶跑了！');addChat('乌鸦：不打扰了，您继续逃！');}else{crowHint.textContent='🐦 乌鸦挡镜头！还差 '+hit.remaining+' 次';}return;}
    }
    if(event.pointerType==='mouse'||(state!=='play'&&state!=='launch'))return;
    gesture={id:event.pointerId,x:event.clientX,y:event.clientY,consumed:false};
    canvas.setPointerCapture(event.pointerId);event.preventDefault();
  },{passive:false});
  function recognizeSwipe(event){
    if(!gesture||gesture.id!==event.pointerId||gesture.consumed)return;
    const action=classifySwipe(event.clientX-gesture.x,event.clientY-gesture.y);
    if(action){gesture.consumed=true;onSwipe(action);} // one drag cannot trigger two lane shifts
  }
  canvas.addEventListener('pointermove',event=>{
    if(!gesture||gesture.id!==event.pointerId)return;
    recognizeSwipe(event);event.preventDefault(); // move before the finger is released
  },{passive:false});
  canvas.addEventListener('pointerup',event=>{
    if(!gesture||gesture.id!==event.pointerId)return;
    recognizeSwipe(event);gesture=null;event.preventDefault();
  },{passive:false});
  canvas.addEventListener('pointercancel',()=>gesture=null);
}
bindSwipeSurface(renderer.domElement);
gameUI.showHome();
const map=document.querySelector('#map'),ctx=map.getContext('2d');function drawMap(){const W=292,H=290;ctx.clearRect(0,0,W,H);ctx.fillStyle='#14272a';ctx.fillRect(0,0,W,H);const scale=1.02;ctx.lineJoin='round';ctx.lineCap='round';for(let z0=z-100;z0<z+200;z0+=3){const y=H*.56-(z0-z)*scale,x=W*.5+(pathX(z0)-pathX(z))*1.3;ctx.fillStyle='#536565';ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.fill()}for(let z0=z-100;z0<z+200;z0+=2){const y=H*.56-(z0-z)*scale,x=W*.5+(pathX(z0)-pathX(z))*1.3;ctx.fillStyle='#82918c';ctx.fillRect(x-7,y-2,14,5)}const marks=[[W*.5+offset*1.3,H*.56,'#58b2ff'],[W*.5+(pathX(enemyZ)-pathX(z)+enemyOffset)*1.3,H*.56-(enemyZ-z)*scale,'#ff5e68']];for(const [x,y,color] of marks){if(y<0||y>H)continue;ctx.fillStyle=color+'44';ctx.beginPath();ctx.arc(x,y,14,0,7);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,6,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke()}ctx.fillStyle='#a2bfc1';ctx.font='15px system-ui';ctx.fillText('N ↑',12,24)}
function step(dt){
  if(state!=='play'&&state!=='launch')return;
  seconds+=dt;chatTimer+=dt;
  if(chatTimer>4){addChat(comments[Math.floor(rng()*comments.length)]);chatTimer=0}
  if(state==='play'&&Math.floor(z/230)>streamMilestone){streamMilestone=Math.floor(z/230);addChat('💜 Twitch HYPE TRAIN：礼物列车开过来了！')}
  const steer=Math.max(-1,Math.min(1,(LANES[laneIndex]-offset)/.75));
  if(state==='launch'){
    // Stage the opening with two real moving bodies, not an instant 46m teleport.
    v=THREE.MathUtils.damp(v,LAUNCH_SPRINT_SPEED,1.85,dt);
    enemyV=THREE.MathUtils.damp(enemyV,LAUNCH_CYCLIST_SPEED,1.10,dt);
    z+=v*dt;enemyZ+=enemyV*dt;
    offset=approachLaneOffset(offset,LANES[laneIndex],dt);
    enemyOffset=THREE.MathUtils.damp(enemyOffset,0,1.2,dt);
    if(z-enemyZ>=INITIAL_GAP){state='play';enemyV=playerCruiseSpeed(z)-.4;notice('🚨 追逐开始！');}
  }else{
    offset=approachLaneOffset(offset,LANES[laneIndex],dt);
    let target=playerCruiseSpeed(z);
    if(keys.has('Space')||seconds<swipeBrakeUntil)target=BRAKE_SPEED;
    if(seconds<swipeBoostUntil)target=Math.max(target,BOOST_SPEED);
    if(Math.abs(offset)>5.1)target=Math.min(target,ROAD_EDGE_SPEED);
    if(stun>0){stun=Math.max(0,stun-dt);target=1}
    recovery=Math.max(0,recovery-dt);
    v=THREE.MathUtils.damp(v,target,stun>0?2.4:recovery>0?1.8:1.10,dt);
    z+=v*dt;
    for(const o of obstacles){
      if(!o.hit&&Math.abs(z-o.z)<1.35&&Math.abs(offset-o.xoffset)<o.radius+.4){
        o.hit=true;const impact=IMPACT[o.type];v*=impact.multiplier;if(o.type==='banana')bananaSlip=1.0;stun=Math.max(stun,impact.stun);recovery=Math.max(recovery,impact.recovery);
        if(impact.stun===0){notice(o.type==='banana'?'🍌 香蕉皮！滑板打滑！':o.type==='cup'?'🥤 奶茶洒啦！':'⚠ 颠簸减速！');addChat(o.type==='banana'?'谁在逃亡路上丢香蕉啊哈哈哈':'好险差点翻车！！')}
        else{notice('💥 翻板了！！');addChat('哈哈哈哈主播飞出去了！')}
      }
    }
    const pursuit=advanceCyclist({enemyZ,enemySpeed:enemyV,playerZ:z},dt);
    enemyZ=pursuit.enemyZ;enemyV=pursuit.enemySpeed;
    enemyOffset=THREE.MathUtils.damp(enemyOffset,Math.sin(seconds*.6)*.9,1,dt);
  }
  player.position.set(pathX(z)+offset,terrain(z)+.08,z);
  player.rotation.y=Math.atan(tangent(z));
  bananaSlip=Math.max(0,bananaSlip-dt);
  player.rotation.z=steer*-.07+(stun>0?Math.sin(seconds*24)*.14:0)+Math.sin(seconds*25)*bananaSlip*.19;
  rider.root.rotation.z=stun>0?Math.sin(seconds*15)*.14:0;
  rider.headTilt.rotation.x=STREAMER_HEAD_PITCH+Math.sin(seconds*2.4)*.02+(distance<WARNING_DISTANCE?STREAMER_GAZE_BACK_EXTRA:0);
  streamerPhone.phone.rotation.z=-.12+Math.sin(seconds*4.2)*.018;
  chaser.position.set(pathX(enemyZ)+enemyOffset,terrain(enemyZ),enemyZ);
  chaser.rotation.y=Math.atan(tangent(enemyZ))+BIKE_HEADING_CORRECTION;
  bike.rotation.z=Math.sin(seconds*17)*.024;
  distance=Math.max(0,z-enemyZ);
  if(state==='play'){
    if(distance<WARNING_DISTANCE&&!nearAlert){addChat('他就在屁股后面啊啊啊！');nearAlert=true}
    if(distance>WARNING_DISTANCE+8)nearAlert=false;
    if(distance<CATCH_DISTANCE)finish(false);else if(z>=TOTAL)finish(true);
  }
  if(state==='play'&&shouldReleaseCrow(z,nextCrowIndex,crow.active)){
    crow.start();nextCrowIndex++;crowHint.textContent='🐦 乌鸦挡镜头！点击赶走 · 还差 3 次';crowHint.classList.remove('is-hidden');addChat('啊啊啊镜头上飞来一只乌鸦！！');
  }
  if(crow.update(dt)){crowHint.classList.add('is-hidden');addChat('乌鸦终于自行离开直播间了！')}
  document.querySelector('#speed').textContent=Math.round(v*3.6);
  speedFx.style.setProperty('--rush',state==='launch'||state==='play'?Math.min(.30,Math.max(0,(v-15)/20)*.3).toFixed(3):'0');
  document.querySelector('#meters').textContent=Math.min(TOTAL,Math.floor(z));
  const gapEl=document.querySelector('#gap');gapEl.textContent=distance<CRITICAL_DISTANCE?`🚨 仅剩 ${Math.ceil(distance)}m`:`追击距离 ${Math.ceil(distance)}m`;
  gapEl.classList.toggle('critical',distance<CRITICAL_DISTANCE);gapEl.classList.toggle('warning',distance<WARNING_DISTANCE);
  document.querySelector('#viewers').textContent=Math.floor(8439+seconds*27).toLocaleString();
  if(noticeTimer>0){noticeTimer-=dt;if(noticeTimer<=0)document.querySelector('#message').style.opacity=0}
  drawMap();
}
function maintainChunks(){const at=Math.floor(z/CHUNK);for(let i=Math.max(0,at-2);i<=Math.min(Math.ceil(TOTAL/CHUNK)+2,at+5);i++){if(!chunks.some(c=>c.i===i))chunks.push(makeChunk(i))}for(let i=chunks.length-1;i>=0;i--)if(Math.abs(chunks[i].i-at)>6){scene.remove(chunks[i].g);chunks[i].g.traverse(n=>{if(n.isMesh && n.geometry!==geoBox && n.geometry!==geoSphere)n.geometry.dispose()});chunks.splice(i,1)}}const targetPos=new THREE.Vector3();function frame(now){requestAnimationFrame(frame);const dt=Math.min(.045,(now-last)/1000);last=now;if(state==='intro')updateIntro(dt);if(state==='play'||state==='launch')step(dt);maintainChunks();const bz=state==='menu'?40:z,bx=pathX(bz)+(state==='menu'?0:offset);// Arcade chase camera: low and close, dynamically widens FOV as world speed rises.
  // Suppress camera vibration on menu/intro and when nearly stopped to avoid motion sickness.
  const isChasing=state==='play'||state==='launch';
  const speedBlend=isChasing?THREE.MathUtils.smoothstep(v,10,33):0;
  const danger=state==='play'&&distance<WARNING_DISTANCE;
  const cameraBehind=state==='intro'?10.0:danger?7.1:5.6;
  const cameraHeight=state==='intro'?5.7:danger?4.2:3.4;
  const vibration=isChasing?Math.max(0,speedBlend-.22)*.045:0;
  targetPos.set(bx+Math.sin(now*.024)*vibration,terrain(bz)+cameraHeight+Math.cos(now*.018)*vibration,bz-cameraBehind);
  camera.position.lerp(targetPos,Math.min(1,dt*(isChasing?5.8:3)));
  const fovTarget=isChasing?73+speedBlend*7:68;
  const updatedFov=THREE.MathUtils.damp(camera.fov,fovTarget,3.5,dt);
  if(Math.abs(updatedFov-camera.fov)>.012){camera.fov=updatedFov;camera.updateProjectionMatrix();}
  camera.lookAt(bx,terrain(bz)+1.10,bz+(state==='intro'?6:11.5));
  for(const item of chunks)roadside.animate(item.g,z,now*.001);
  renderer.render(scene,camera)}requestAnimationFrame(frame);addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
