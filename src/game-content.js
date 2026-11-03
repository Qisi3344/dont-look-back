/** Data is intentionally pure: the game and interface share one source of truth. */
export const MAPS = [
  {id:'forest', name:'迷雾林道', en:'FOREST RUN', type:'林道 · 经典追逐', difficulty:'入门', description:'弯弯绕绕的自行车道，树影和路障都不太友好。', accent:'#b8fa5d', sky:0x859c9b, fog:0x879e97, fogDensity:.0105, road:0x555d5c, shoulder:0xa4a08d, ground:0x486348, bark:0x594b3b, foliage:[0x47664e,0x67846c,0x385b50]},
  {id:'coast', name:'海风栈道', en:'COASTLINE', type:'滨海 · 开阔疾驰', difficulty:'中等', description:'海风、沙丘、棕榈树，路很美但没有时间看海。', accent:'#91f3ff', sky:0xa4dce5, fog:0x9fd9dc, fogDensity:.0055, road:0x727b7b, shoulder:0xd3cbab, ground:0xc5b997, bark:0x806953, foliage:[0x377d6a,0x559d75,0x7aaa83]},
  {id:'night', name:'午夜绿道', en:'AFTER HOURS', type:'城市 · 夜间惊魂', difficulty:'困难', description:'空荡的绿道、暗紫的夜色，荧光衣在远处格外刺眼。', accent:'#e2b4ff', sky:0x16192c, fog:0x24263e, fogDensity:.009, road:0x363845, shoulder:0x626579, ground:0x263047, bark:0x2c3142, foliage:[0x2d4551,0x33465b,0x253348]}
];
export const STREAMER_SKINS = [
  {id:'purple',name:'紫衣主播',detail:'默认 · 直播老熟人',color:'#9478dc', shirt:0x8665b1, shirtHi:0xb7a4e3, pants:0x273044, hair:0x27272d, skin:0xe6bc9b, accessory:'none'},
  {id:'mocha',name:'摩卡街头',detail:'奶咖帽衫',color:'#c5a68b', shirt:0xb79b83, shirtHi:0xe4c3a1, pants:0x4a3d46, hair:0x27272d, skin:0xe8bc9c, accessory:'none'},
  {id:'cow',name:'牛角团子',detail:'原创牛角装',color:'#f4efe4', shirt:0xf0eadf, shirtHi:0x2b2e38, pants:0x34313b, hair:0x28252a, skin:0xecd3b0, accessory:'horns'},
  {id:'dragon',name:'奶油小龙',detail:'原创龙角装',color:'#ffd966', shirt:0xffd45e, shirtHi:0xffedb2, pants:0xe8ab4b, hair:0x936f46, skin:0xffdbab, accessory:'dragon'}
];
export const CYCLIST_SKINS = [
  {id:'neon',name:'荧光绿',detail:'默认 · 夺命显眼包',color:'#c7ff24', shirt:0xc0ff27, pants:0x242c2e, bike:0x27323b},
  {id:'shadow',name:'深夜黑衣',detail:'隐匿骑手',color:'#3d4255', shirt:0x34394e, pants:0x23232d, bike:0x9d4f5b},
  {id:'orange',name:'交通橘',detail:'醒目到离谱',color:'#ff904c', shirt:0xf78235, pants:0x373d4c, bike:0x444b53},
  {id:'rose',name:'粉色刺客',detail:'非常不严肃',color:'#ff87b1', shirt:0xef83b0, pants:0x43364d, bike:0x533b60}
];
export function findMap(id){return MAPS.find(x=>x.id===id)||MAPS[0]}
export function findSkin(list,id){return list.find(x=>x.id===id)||list[0]}

// The follow camera looks toward +Z. On screen, -worldX appears on the RIGHT.
export function steerFromScreen(left,right){return (left?1:0)-(right?1:0)}
export function classifySwipe(dx,dy,threshold=30){
  if(Math.max(Math.abs(dx),Math.abs(dy))<threshold)return null;
  if(Math.abs(dx)>=Math.abs(dy)*1.1)return dx<0?'left':'right';
  return dy>0?'brake':'boost';
}
// Our lane array is sorted by world X. Screen-left means increasing world X.
// Endless runner lanes: one swipe always advances one full lane, whatever the drag length.
// Three lane centers fit the current 11m-wide road and its obstacle collision radii.
export const LANE_OFFSETS=Object.freeze([-3.4,0,3.4]);
export const LANE_SHIFT_LAMBDA=22; // around 0.14 s to reach 95% of a lane change
export function approachLaneOffset(current,target,dt){
  if(dt<=0)return current;
  const next=current+(target-current)*(1-Math.exp(-LANE_SHIFT_LAMBDA*dt));
  return Math.abs(next-target)<.025?target:next;
}
export function shiftLaneIndex(index,gesture,laneCount=LANE_OFFSETS.length){
  const delta=gesture==='left'?1:gesture==='right'?-1:0;
  return Math.max(0,Math.min(laneCount-1,index+delta));
}
