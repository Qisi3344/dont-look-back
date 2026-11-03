/** Procedural park furniture, pedestrians and livestream easter eggs.
 * All geometry and textures are made at runtime, with no downloaded image/model.
 */
export function createRoadsideKit(THREE,{box,mat,pathX,roadY}){
  const palette={
    wood:mat(0x806350),metal:mat(0x4c5c64),dark:mat(0x262c38),seat:mat(0x9e8172),
    pale:mat(0xf0c8a1),hair:mat(0x302b35),blue:mat(0x668ed3),rose:mat(0xe989ab),
    mint:mat(0x88b9a7),yellow:mat(0xf9d16b),purple:mat(0x9146ff),white:mat(0xece5ff),
    dog:mat(0x91654f),flower:mat(0xd2a2c9),leaf:mat(0x628d68),bottle:mat(0x6fc9d3)
  };
  const signs=new Map();
  const signLabels=['TWITCH','SUB GOAL','BITS +100','HYPE TRAIN','RAID INCOMING'];
  function signMat(text){
    if(signs.has(text))return signs.get(text);
    const cv=document.createElement('canvas');cv.width=512;cv.height=256;
    const c=cv.getContext('2d');
    c.fillStyle='#24123d';c.fillRect(0,0,512,256);
    c.fillStyle='#9146ff';c.fillRect(13,13,486,230);
    c.fillStyle='#281248';c.fillRect(25,27,461,202);
    // Chat bubble motif intentionally composed out of code, no official image asset.
    c.fillStyle='#f9f5ff';c.fillRect(43,73,92,78);c.fillRect(57,151,20,19);
    c.fillStyle='#9146ff';c.fillRect(60,85,13,40);c.fillRect(91,85,13,40);
    c.textAlign='center';c.fillStyle='#f9f5ff';c.font=`900 ${text.length>9?42:60}px Arial, sans-serif`;
    c.fillText(text,309,137);
    c.fillStyle='#ceb4ff';c.font='bold 18px Arial';c.fillText('wenevergetyounger  ·  LIVE',305,187);
    const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
    signs.set(text,material);return material;
  }
  const plane=new THREE.PlaneGeometry(3.4,1.7);
  function person(group,x=0,z=0,shirt=palette.blue,seated=false){
    const npc=new THREE.Group();npc.position.set(x,0,z);group.add(npc);
    const bodyY=seated?1.03:1.50;
    box(npc,.62,.86,.40,shirt,0,bodyY,0);
    box(npc,.42,.44,.42,palette.pale,0,bodyY+.66,0);
    box(npc,.46,.15,.45,palette.hair,0,bodyY+.9,0);
    const arm=box(npc,.20,.72,.24,palette.pale,-.42,bodyY+.06,0);
    box(npc,.20,.70,.24,palette.pale,.42,bodyY+.06,0);
    for(const side of [-.17,.17]){
      const leg=box(npc,.23,seated?.42:.76,.28,palette.dark,side,seated?.53:.65,seated?.19:0);
      if(seated)leg.rotation.x=-.5;
    }
    return {npc,arm};
  }
  function bench(group){
    for(const x of [-.95,.95]){
      box(group,.16,.92,.18,palette.metal,x,.46,0);
      box(group,.16,.9,.18,palette.metal,x,.60,.43);
    }
    for(let k=0;k<3;k++)box(group,2.35,.12,.29,palette.wood,0,.97,(k-1)*.34);
    for(let k=0;k<3;k++)box(group,2.35,.24,.12,palette.seat,0,1.21+k*.30,.52);
  }
  function gift(group){
    box(group,1.08,1.05,1.08,palette.purple,0,.55,0);
    box(group,.17,1.07,1.11,palette.white,0,.56,0);
    box(group,1.11,1.06,.17,palette.white,0,.55,0);
    box(group,1.17,.14,1.17,palette.purple,0,1.13,0);
    const bow1=box(group,.27,.36,.16,palette.white,-.16,1.35,0);bow1.rotation.z=.55;
    const bow2=box(group,.27,.36,.16,palette.white,.16,1.35,0);bow2.rotation.z=-.55;
  }
  function billboard(group,index){
    for(const x of [-1.4,1.4])box(group,.15,3.25,.20,palette.metal,x,1.62,0);
    box(group,3.55,1.87,.16,palette.dark,0,3.10,0);
    const sign=new THREE.Mesh(plane,signMat(signLabels[index%signLabels.length]));
    sign.position.set(0,3.1,-.11);sign.rotation.y=Math.PI;
    group.add(sign);
  }
  function vending(group){
    box(group,1.35,2.4,.82,palette.purple,0,1.20,0);
    box(group,1.13,1.45,.04,palette.dark,0,1.58,-.43);
    for(let x of [-.3,0,.3])for(let y of [1.1,1.6,2.05]){
      box(group,.17,.34,.10,x===0?palette.bottle:palette.yellow,x,y,-.48);
    }
    box(group,.48,.13,.08,palette.white,.25,.52,-.48);
  }
  function dog(group){
    box(group,.58,.40,.93,palette.dog,0,.50,0);
    box(group,.49,.46,.45,palette.dog,0,.70,-.47);
    for(const x of [-.2,.2])for(const z of [-.28,.28])box(group,.13,.38,.14,palette.dog,x,.20,z);
    const tail=box(group,.18,.2,.47,palette.dog,0,.73,.55);tail.rotation.x=-.50;
    for(const x of [-.17,.17])box(group,.13,.20,.15,palette.dark,x,1.0,-.57);
  }
  function shrub(group){
    box(group,1.5,.54,.6,palette.metal,0,.26,0);
    for(const x of [-.4,0,.4]){
      const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.48,0),palette.leaf);
      leaf.position.set(x,.65,0);group.add(leaf);
      box(group,.11,.20,.10,palette.flower,x,.96,0);
    }
  }
  function populate(chunk,index,random,mapId){
    chunk.userData.npcs=[];
    const base=index*65;
    // All scenery stays beyond the shoulder. It never becomes an untelegraphed road hazard.
    for(let k=0;k<7;k++){
      const z=base+4+k*8.8+random()*3;
      const side=(k+index)%2?1:-1;
      const lateral=9.7+random()*2.0;
      const root=new THREE.Group();root.position.set(pathX(z)+side*lateral,roadY(z),z);
      root.rotation.y=side===1?-.14:.14;chunk.add(root);
      const kind=(index*7+k)%10;
      if(kind===0||kind===6){bench(root);if(kind===0){const p=person(root,0,0,palette.blue,true);chunk.userData.npcs.push({...p,z})}}
      else if(kind===1||kind===7){const p=person(root,0,0,kind===1?palette.rose:palette.mint);chunk.userData.npcs.push({...p,z})}
      else if(kind===2){billboard(root,index+k)}
      else if(kind===3){gift(root)}
      else if(kind===4){vending(root)}
      else if(kind===5){dog(root);const p=person(root,1.4,.25,palette.yellow);chunk.userData.npcs.push({...p,z})}
      else if(kind===8){shrub(root)}
      else{const p=person(root,0,0,palette.blue);chunk.userData.npcs.push({...p,z})}
    }
  }
  function animate(chunk,progress,time){
    for(const p of chunk.userData.npcs||[]){
      const close=Math.abs(progress-p.z)<13;
      p.arm.rotation.z=close?Math.sin(time*6+p.z)*.43:0;
      p.npc.rotation.y=close?.4:0;
    }
  }
  return {populate,animate};
}
