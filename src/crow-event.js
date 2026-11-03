/** Click-to-clear camera blocker. No DOM or Three dependency in the event rules. */
export const CROW_MARKERS=Object.freeze([260,760,1280]);
export const CROW_TAPS=3;
export const CROW_TIMEOUT=10;
export function shouldReleaseCrow(progress,nextIndex,active){
  return !active&&nextIndex<CROW_MARKERS.length&&progress>=CROW_MARKERS[nextIndex];
}
export function crowTapStatus(taps){
  const next=Math.max(0,Math.min(CROW_TAPS,taps+1));
  return {taps:next,cleared:next>=CROW_TAPS,remaining:CROW_TAPS-next};
}
export function createCrowActor(THREE,camera){
  const root=new THREE.Group();root.name='interactive-crow';camera.add(root);
  const feather=new THREE.MeshStandardMaterial({color:0x161621,roughness:.76,metalness:.08,flatShading:true});
  const edge=new THREE.MeshStandardMaterial({color:0x333848,roughness:.8,flatShading:true});
  const beak=new THREE.MeshStandardMaterial({color:0x31333a,roughness:1,flatShading:true});
  const eye=new THREE.MeshBasicMaterial({color:0xffc974});
  const add=(parent,geometry,material,x,y,z,sx=1,sy=1,sz=1)=>{
    const obj=new THREE.Mesh(geometry,material);obj.position.set(x,y,z);obj.scale.set(sx,sy,sz);parent.add(obj);return obj;
  };
  const icosa=new THREE.IcosahedronGeometry(1,0),cone=new THREE.ConeGeometry(1,1,4);
  add(root,icosa,feather,0,-.08,0,.44,.51,.32);
  add(root,icosa,feather,.07,.38,.07,.31,.30,.29);
  const bill=add(root,cone,beak,.11,.30,-.28,.14,.30,.15);bill.rotation.x=-Math.PI/2;
  for(const sx of [-1,1]){
    add(root,icosa,eye,sx*.20,.44,-.19,.045,.045,.036);
    const wing=new THREE.Group();wing.position.set(sx*.31,.14,0);root.add(wing);
    const base=add(wing,icosa,edge,sx*.45,-.02,.0,.60,.16,.27);base.rotation.z=sx*.14;
    for(let i=0;i<3;i++){
      const tip=add(wing,icosa,feather,sx*(.58+i*.17),-.18-i*.04,.04,.27,.10,.18);
      tip.rotation.z=-sx*.22;
    }
    if(sx<0)root.userData.leftWing=wing;else root.userData.rightWing=wing;
  }
  for(let i=0;i<3;i++){
    const tail=add(root,icosa,feather,(i-1)*.15,-.38,.23,.14,.37,.12);tail.rotation.x=.40;
  }
  // Invisible but raycastable: generous hit zone, particularly on mobile.
  const hitPlane=new THREE.Mesh(new THREE.PlaneGeometry(2.55,2.15),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  hitPlane.position.z=-.05;root.add(hitPlane);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let active=false,timer=0,taps=0;
  root.visible=false;
  function clear(){active=false;root.visible=false;taps=0;timer=0}
  return {
    get active(){return active},
    get taps(){return taps},
    start(){active=true;timer=0;taps=0;root.visible=true;root.position.set(-2.3,.18,-3.0)},
    clear,
    update(dt){
      if(!active)return false;
      timer+=dt;
      root.position.x=THREE.MathUtils.damp(root.position.x,Math.sin(timer*2.0)*.20,2.9,dt);
      root.position.y=.10+Math.sin(timer*5)*.13;
      root.rotation.z=Math.sin(timer*3.1)*.12;
      root.userData.leftWing.rotation.z=-Math.sin(timer*19)*.40;
      root.userData.rightWing.rotation.z=Math.sin(timer*19)*.40;
      if(timer>CROW_TIMEOUT){clear();return true}
      return false;
    },
    tap(x,y,canvas){
      if(!active)return null;
      const rect=canvas.getBoundingClientRect();
      pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);
      camera.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer,camera);
      if(!raycaster.intersectObject(hitPlane,false).length)return null;
      const status=crowTapStatus(taps);taps=status.taps;
      if(status.cleared)clear();
      return status;
    }
  };
}
