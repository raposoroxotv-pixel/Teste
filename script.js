import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

const WORLD_SIZE = 30;
const WORLD_VOLUME = WORLD_SIZE * WORLD_SIZE * WORLD_SIZE;
const BLOCK = {
  EMPTY: 0,
  GRASS: 1,
  DIRT: 2,
};

const PLAYER = {
  width: 0.6,
  height: 1.8,
  eyeHeight: 1.62,
  acceleration: 25,
  friction: 10,
  gravity: 32,
  jumpSpeed: 11,
  maxSpeed: 7,
};

const canvas = document.getElementById("game");
const selectedBlockEl = document.getElementById("selectedBlock");
const placedCountEl = document.getElementById("placedCount");
const coordsEl = document.getElementById("coords");
const hintEl = document.getElementById("hint");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87c8ff);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

const light = new THREE.DirectionalLight(0xffffff, 1.1);
light.position.set(20, 25, 12);
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
light.shadow.camera.left = -40;
light.shadow.camera.right = 40;
light.shadow.camera.top = 40;
light.shadow.camera.bottom = -40;
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.45));

const worldGroup = new THREE.Group();
scene.add(worldGroup);

const world = new Uint8Array(WORLD_VOLUME);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

function makePixelTexture(c1, c2) {
  const size = 16;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const useAlt = ((x >> 2) + (y >> 2)) % 2 === 0;
      ctx.fillStyle = useAlt ? c1 : c2;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

const grassMat = new THREE.MeshStandardMaterial({ map: makePixelTexture("#3f9e3f", "#4ebf4e") });
const dirtMat = new THREE.MeshStandardMaterial({ map: makePixelTexture("#8a5a2b", "#704421") });

let grassMesh = null;
let dirtMesh = null;

function indexOf(x, y, z) {
  return x + WORLD_SIZE * (y + WORLD_SIZE * z);
}

function insideWorld(x, y, z) {
  return x >= 0 && y >= 0 && z >= 0 && x < WORLD_SIZE && y < WORLD_SIZE && z < WORLD_SIZE;
}

function getBlock(x, y, z) {
  if (!insideWorld(x, y, z)) return BLOCK.EMPTY;
  return world[indexOf(x, y, z)];
}

function setBlock(x, y, z, type) {
  if (!insideWorld(x, y, z)) return false;
  world[indexOf(x, y, z)] = type;
  return true;
}

function buildBaseWorld() {
  for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
      setBlock(x, 0, z, BLOCK.DIRT);
      setBlock(x, 1, z, BLOCK.GRASS);
    }
  }
}

function rebuildMeshes() {
  if (grassMesh) worldGroup.remove(grassMesh);
  if (dirtMesh) worldGroup.remove(dirtMesh);

  const grassCount = countBlocks(BLOCK.GRASS);
  const dirtCount = countBlocks(BLOCK.DIRT);

  grassMesh = new THREE.InstancedMesh(boxGeo, grassMat, grassCount || 1);
  dirtMesh = new THREE.InstancedMesh(boxGeo, dirtMat, dirtCount || 1);

  grassMesh.count = grassCount;
  dirtMesh.count = dirtCount;

  grassMesh.castShadow = true;
  grassMesh.receiveShadow = true;
  dirtMesh.castShadow = true;
  dirtMesh.receiveShadow = true;

  const matrix = new THREE.Matrix4();
  let g = 0;
  let d = 0;

  for (let x = 0; x < WORLD_SIZE; x++) {
    for (let y = 0; y < WORLD_SIZE; y++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        const t = getBlock(x, y, z);
        if (t === BLOCK.EMPTY) continue;
        matrix.makeTranslation(x + 0.5, y + 0.5, z + 0.5);
        if (t === BLOCK.GRASS) {
          grassMesh.setMatrixAt(g++, matrix);
        } else if (t === BLOCK.DIRT) {
          dirtMesh.setMatrixAt(d++, matrix);
        }
      }
    }
  }

  grassMesh.instanceMatrix.needsUpdate = true;
  dirtMesh.instanceMatrix.needsUpdate = true;

  worldGroup.add(grassMesh);
  worldGroup.add(dirtMesh);
}

function countBlocks(type) {
  let count = 0;
  for (let i = 0; i < world.length; i++) {
    if (world[i] === type) count++;
  }
  return count;
}

const keys = new Set();
let yaw = 0;
let pitch = 0;
let onGround = false;
let placedCount = 0;
let selectedBlock = BLOCK.GRASS;

const player = {
  position: new THREE.Vector3(15, 4, 15),
  velocity: new THREE.Vector3(0, 0, 0),
};

function playerAABB(position = player.position) {
  return {
    min: new THREE.Vector3(position.x - PLAYER.width / 2, position.y, position.z - PLAYER.width / 2),
    max: new THREE.Vector3(position.x + PLAYER.width / 2, position.y + PLAYER.height, position.z + PLAYER.width / 2),
  };
}

function collidesWithWorld(aabb) {
  const minX = Math.floor(aabb.min.x);
  const maxX = Math.floor(aabb.max.x);
  const minY = Math.floor(aabb.min.y);
  const maxY = Math.floor(aabb.max.y);
  const minZ = Math.floor(aabb.min.z);
  const maxZ = Math.floor(aabb.max.z);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (getBlock(x, y, z) === BLOCK.EMPTY) continue;
        if (
          aabb.max.x > x &&
          aabb.min.x < x + 1 &&
          aabb.max.y > y &&
          aabb.min.y < y + 1 &&
          aabb.max.z > z &&
          aabb.min.z < z + 1
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function resolveAxis(axis, amount) {
  const dir = Math.sign(amount);
  const steps = Math.ceil(Math.abs(amount) / 0.05);
  const delta = amount / Math.max(steps, 1);

  for (let i = 0; i < steps; i++) {
    player.position[axis] += delta;

    if (axis === "x") {
      const min = PLAYER.width / 2;
      const max = WORLD_SIZE - PLAYER.width / 2;
      player.position.x = Math.max(min, Math.min(max, player.position.x));
    } else if (axis === "y") {
      const min = 0;
      const max = WORLD_SIZE - PLAYER.height;
      player.position.y = Math.max(min, Math.min(max, player.position.y));
    } else {
      const min = PLAYER.width / 2;
      const max = WORLD_SIZE - PLAYER.width / 2;
      player.position.z = Math.max(min, Math.min(max, player.position.z));
    }

    const aabb = playerAABB();
    if (collidesWithWorld(aabb)) {
      player.position[axis] -= delta;
      if (axis === "y" && dir < 0) {
        onGround = true;
      }
      player.velocity[axis] = 0;
      break;
    }
  }
}

function updatePlayer(dt) {
  onGround = false;

  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x);

  const input = new THREE.Vector3(0, 0, 0);
  if (keys.has("KeyW")) input.add(forward);
  if (keys.has("KeyS")) input.sub(forward);
  if (keys.has("KeyA")) input.sub(right);
  if (keys.has("KeyD")) input.add(right);

  if (input.lengthSq() > 0) {
    input.normalize().multiplyScalar(PLAYER.acceleration * dt);
    player.velocity.x += input.x;
    player.velocity.z += input.z;
  }

  const horizontalSpeed = Math.hypot(player.velocity.x, player.velocity.z);
  if (horizontalSpeed > PLAYER.maxSpeed) {
    const scale = PLAYER.maxSpeed / horizontalSpeed;
    player.velocity.x *= scale;
    player.velocity.z *= scale;
  }

  const damping = Math.max(0, 1 - PLAYER.friction * dt);
  player.velocity.x *= damping;
  player.velocity.z *= damping;

  player.velocity.y -= PLAYER.gravity * dt;

  resolveAxis("x", player.velocity.x * dt);
  resolveAxis("z", player.velocity.z * dt);
  resolveAxis("y", player.velocity.y * dt);

  camera.position.set(player.position.x, player.position.y + PLAYER.eyeHeight, player.position.z);
  camera.rotation.set(pitch, yaw, 0, "YXZ");
}

const raycaster = new THREE.Raycaster();

function getTargetBlock() {
  const origin = camera.position.clone();
  const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation).normalize();

  let lastEmpty = null;
  for (let dist = 0; dist <= 6; dist += 0.05) {
    const p = origin.clone().addScaledVector(dir, dist);
    const bx = Math.floor(p.x);
    const by = Math.floor(p.y);
    const bz = Math.floor(p.z);

    if (!insideWorld(bx, by, bz)) continue;
    const block = getBlock(bx, by, bz);
    if (block !== BLOCK.EMPTY) {
      return { hit: { x: bx, y: by, z: bz }, adjacent: lastEmpty };
    }
    lastEmpty = { x: bx, y: by, z: bz };
  }
  return null;
}

function intersectsPlayerBlock(x, y, z) {
  const p = playerAABB();
  return (
    p.max.x > x &&
    p.min.x < x + 1 &&
    p.max.y > y &&
    p.min.y < y + 1 &&
    p.max.z > z &&
    p.min.z < z + 1
  );
}

function removeBlock() {
  const target = getTargetBlock();
  if (!target?.hit) return;
  const { x, y, z } = target.hit;

  if (y <= 0) return;
  setBlock(x, y, z, BLOCK.EMPTY);
  rebuildMeshes();
}

function placeBlock() {
  const target = getTargetBlock();
  if (!target?.adjacent) return;
  const { x, y, z } = target.adjacent;

  if (!insideWorld(x, y, z)) return;
  if (getBlock(x, y, z) !== BLOCK.EMPTY) return;
  if (intersectsPlayerBlock(x, y, z)) return;

  setBlock(x, y, z, selectedBlock);
  placedCount++;
  rebuildMeshes();
}

function updateHud() {
  selectedBlockEl.textContent = `Bloco selecionado: ${selectedBlock === BLOCK.GRASS ? "Grama" : "Terra"}`;
  placedCountEl.textContent = `Blocos colocados: ${placedCount}`;
  coordsEl.textContent = `Posição: (${player.position.x.toFixed(2)}, ${player.position.y.toFixed(2)}, ${player.position.z.toFixed(2)})`;
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("keydown", (e) => {
  keys.add(e.code);

  if (e.code === "Space" && onGround) {
    player.velocity.y = PLAYER.jumpSpeed;
    onGround = false;
  }

  if (e.code === "KeyQ") {
    selectedBlock = selectedBlock === BLOCK.GRASS ? BLOCK.DIRT : BLOCK.GRASS;
  }
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
});

canvas.addEventListener("click", () => {
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  }
});

window.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== canvas) return;
  yaw -= e.movementX * 0.0025;
  pitch -= e.movementY * 0.0025;
  pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("mousedown", (e) => {
  if (document.pointerLockElement !== canvas) return;
  if (e.button === 0) removeBlock();
  if (e.button === 2) placeBlock();
});

document.addEventListener("pointerlockchange", () => {
  hintEl.textContent =
    document.pointerLockElement === canvas
      ? "Mouse capturado. Pressione ESC para soltar."
      : "Clique na tela para capturar o mouse.";
});

scene.add(new THREE.Mesh(
  new THREE.BoxGeometry(WORLD_SIZE, WORLD_SIZE, WORLD_SIZE),
  new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, visible: false })
));

buildBaseWorld();
rebuildMeshes();

let previousTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;

  updatePlayer(dt);
  updateHud();
  renderer.render(scene, camera);
}

animate(previousTime);
