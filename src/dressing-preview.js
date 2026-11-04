import * as THREE from 'three';

// Independent dressing-room viewer. Niu Lai uses an optimized user-supplied GLB.
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const torusGeometry = new THREE.TorusGeometry(0.45, 0.075, 8, 24);
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);

function createBox(parent, size, location, material) {
  const mesh = new THREE.Mesh(cubeGeometry, material);
  mesh.scale.set(...size);
  mesh.position.set(...location);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function connect(parent, start, end, thickness, material) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const mesh = new THREE.Mesh(cylinderGeometry, material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.scale.set(thickness, direction.length(), thickness);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
}
function mat(color, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.79, metalness });
}
function buildBody(group, role, skin) {
  const skinTone = mat(role === 'streamer' ? skin.skin : 0xd5a883);
  const shirt = mat(skin.shirt), shirtLight = mat(skin.shirtHi ?? skin.shirt);
  const trousers = mat(skin.pants), dark = mat(0x111924), sole = mat(0x0a0e14), white = mat(0xe7e9e7);
  const hair = mat(role === 'streamer' ? skin.hair : 0x272d35);

  // Game-matching blocky silhouette, presented standing to expose the full outfit.
  createBox(group, [0.93, 1.18, 0.57], [0, 2.10, 0], shirt);
  createBox(group, [0.78, 0.27, 0.605], [0, 2.46, 0.012], shirtLight);
  createBox(group, [0.96, 0.34, 0.59], [0, 1.43, 0], trousers);
  for (const side of [-1, 1]) {
    const x = side * 0.25;
    createBox(group, [0.37, 0.85, 0.47], [x, 0.88, 0], trousers);
    createBox(group, [0.42, 0.2, 0.68], [x, 0.37, 0.12], sole);
    createBox(group, [0.28, 0.78, 0.43], [side * 0.68, 2.08, 0], shirt);
    createBox(group, [0.30, 0.17, 0.45], [side * 0.68, 1.62, 0], skinTone);
  }
  createBox(group, [0.31, 0.19, 0.34], [0, 2.77, 0], skinTone);
  createBox(group, [0.77, 0.79, 0.73], [0, 3.23, 0.015], skinTone);
  createBox(group, [0.82, 0.18, 0.76], [0, 3.68, -0.02], hair);
  createBox(group, [0.11, 0.41, 0.68], [-0.38, 3.33, -0.01], hair);
  createBox(group, [0.11, 0.41, 0.68], [0.38, 3.33, -0.01], hair);
  for (const x of [-0.18, 0.18]) {
    createBox(group, [0.17, 0.12, 0.04], [x, 3.31, 0.40], white);
    createBox(group, [0.085, 0.085, 0.052], [x, 3.31, 0.43], dark);
    createBox(group, [0.18, 0.052, 0.05], [x, 3.45, 0.41], hair);
  }
  createBox(group, [0.19, 0.06, 0.04], [0, 3.05, 0.39], mat(0x8f5860));

  if (role === 'streamer') {
    if (skin.accessory === 'horns' || skin.accessory === 'dragon') {
      const horn = mat(skin.accessory === 'horns' ? 0x20252b : 0xfff0c0);
      for (const side of [-1, 1]) {
        const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.44, 5), horn);
        mesh.position.set(side * 0.31, 3.88, 0);
        mesh.rotation.z = -side * 0.17;
        mesh.castShadow = true;
        group.add(mesh);
      }
    }
    // Small phone on the streamer belt, to preserve livestream identity.
    createBox(group, [0.22, 0.39, 0.085], [0.54, 2.17, 0.30], dark);
    createBox(group, [0.18, 0.32, 0.02], [0.54, 2.17, 0.36], mat(0x79cbe7));
  } else {
    createBox(group, [0.77, 0.14, 0.73], [0, 3.73, 0], mat(0x27313a));
    // Contrasting reflective chest stripe on the neon cycling jersey.
    createBox(group, [0.78, 0.07, 0.035], [0, 2.27, 0.303], mat(0xf2f7d6));
  }
}

function buildSkateboard(group) {
  const board = new THREE.Group();
  board.position.set(0.0, 0.11, 0.9);
  board.rotation.y = -0.2;
  group.add(board);
  createBox(board, [0.86, 0.11, 1.83], [0, 0.11, 0], mat(0x8367bd));
  createBox(board, [0.75, 0.035, 1.67], [0, 0.19, 0], mat(0x2c293c));
  for (const x of [-0.4, 0.4]) for (const z of [-0.57, 0.57]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 12), mat(0x12191e));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, -0.015, z);
    board.add(wheel);
  }
}
function buildBike(group, skin) {
  const bike = new THREE.Group();
  bike.position.set(1.05, 0.14, 0.03);
  bike.rotation.y = -0.17;
  bike.scale.setScalar(0.72);
  group.add(bike);
  const tire = mat(0x111721), frame = mat(skin.bike || 0x363c43, 0.15), chrome = mat(0xc1cbd0, 0.4);
  for (const z of [-0.8, 0.8]) {
    const tireMesh = new THREE.Mesh(torusGeometry, tire);
    tireMesh.rotation.y = Math.PI / 2;
    tireMesh.position.set(0, 0.56, z);
    bike.add(tireMesh);
  }
  [[0, .68, -.8, 0, 1.2, 0], [0, 1.2, 0, 0, .68, .8], [0, .68, -.8, 0, .68, .8], [0, 1.2, 0, 0, .68, .8]].forEach(p => {
    connect(bike, p.slice(0,3), p.slice(3,6), 0.055, frame);
  });
  connect(bike, [0, 1.22, -0.79], [0, 1.65, -0.79], .05, chrome);
  connect(bike, [-.33, 1.65, -.79], [.33, 1.65, -.79], .043, chrome);
  createBox(bike, [.44, .08, .38], [0, 1.31, .13], tire);
}

export function createDressingPreview(stage, { role, skin }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(6.3, 4.2, 9.8);
  camera.lookAt(0, 1.92, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.domElement.className = 'dlb-dress-canvas';
  stage.appendChild(renderer.domElement);
  const prompt = stage.querySelector('.dlb-preview-prompt');
  if (prompt) prompt.remove();
  scene.add(new THREE.HemisphereLight(0xbcd7fa, 0x38364b, 3.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.0); key.position.set(-3, 9, 7); scene.add(key);
  const rim = new THREE.PointLight(0xc8ff78, 65, 16); rim.position.set(4, 5.2, -3.5); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.82, 0.22, 56), mat(0x323643, 0.18));
  ground.position.y = .10; scene.add(ground);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.48, .026, 6, 72), new THREE.MeshBasicMaterial({ color: 0xbffb73 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = .23; scene.add(ring);
  const grid = new THREE.GridHelper(5.2, 16, 0x79856d, 0x46505b);
  grid.position.y = .24; grid.material.transparent = true; grid.material.opacity = .14;
  scene.add(grid);
  let model = new THREE.Group();scene.add(model);
  let angle = -0.23, pointer = null, dragAt = 0;
  let disposed=false, selectionGeneration=0;
  function disposeModelMaterials(target){
    target.traverse(o=>{
      if(!o.material||o.userData.dlbSharedAsset)return;
      if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());
      else o.material.dispose();
    });
  }
  function setCharacter(nextRole, nextSkin) {
    const selection=++selectionGeneration;
    scene.remove(model);
    disposeModelMaterials(model);
    model = new THREE.Group();
    const character = new THREE.Group();
    character.position.set(nextRole === 'cyclist' ? -0.53 : 0, 0, 0);
    model.add(character);
    buildBody(character, nextRole, nextSkin);
    if(nextRole==='streamer'&&nextSkin.model==='niulai'){
      import('./bull-model.js').then(({loadBullInstance})=>loadBullInstance()).then(bull=>{
        if(disposed||selection!==selectionGeneration)return;
        disposeModelMaterials(character);
        character.clear();
        bull.scale.setScalar(3.30);
        bull.position.set(0,.25,0);
        character.add(bull);
      }).catch(error=>console.warn('Niu Lai dressing preview failed',error));
    }
    if (nextRole === 'streamer') buildSkateboard(model);
    else buildBike(model, nextSkin);
    scene.add(model);
  }
  setCharacter(role, skin);
  const resize = () => {
    const width = Math.max(200, stage.clientWidth || 450);
    const height = Math.max(250, stage.clientHeight || 480);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(stage);
  window.addEventListener('resize', resize);
  const pointerDown = e => { pointer = e.pointerId; dragAt = e.clientX; stage.setPointerCapture?.(e.pointerId); };
  const pointerMove = e => {
    if (pointer !== e.pointerId) return;
    angle += (e.clientX - dragAt) * 0.011;
    dragAt = e.clientX;
  };
  const pointerUp = e => { if (e.pointerId === pointer) pointer = null; };
  stage.addEventListener('pointerdown', pointerDown);
  stage.addEventListener('pointermove', pointerMove);
  stage.addEventListener('pointerup', pointerUp);
  stage.addEventListener('pointercancel', pointerUp);
  let frame = 0, last = performance.now();
  function animate(time) {
    if (disposed) return;
    const dt = Math.min(.04, Math.max(0, (time - last) / 1000)); last = time;
    if (pointer === null) angle += dt * .23;
    model.rotation.y = angle;
    model.position.y = Math.sin(time * 0.0014) * .025;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }
  frame = requestAnimationFrame(animate);
  return {
    setCharacter,
    dispose() {
      if (disposed) return;
      disposed = true;
      selectionGeneration++;
      cancelAnimationFrame(frame);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', resize);
      stage.removeEventListener('pointerdown', pointerDown);
      stage.removeEventListener('pointermove', pointerMove);
      stage.removeEventListener('pointerup', pointerUp);
      stage.removeEventListener('pointercancel', pointerUp);
      disposeModelMaterials(model);
      scene.remove(model);
      ground.material.dispose(); ring.material.dispose(); grid.material.dispose();
      renderer.dispose(); renderer.domElement.remove();
    }
  };
}
