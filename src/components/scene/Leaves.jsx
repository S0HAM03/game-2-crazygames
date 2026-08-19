import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, GAME_PHASES } from '../../store';
import { playLeafPick, startVacuumSound, stopVacuumSound, startBroomSound, stopBroomSound } from '../../audio/SoundSystem';

// ── Realistic Leaf Shapes (Maple, Oak, Birch) Geometries ──────────
function createMapleGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.85);
  shape.lineTo(0.15, 0.55);
  shape.lineTo(0.38, 0.65); // Upper-right lobe peak
  shape.lineTo(0.28, 0.4);
  shape.lineTo(0.55, 0.42); // Mid-right lobe peak
  shape.lineTo(0.35, 0.15);
  shape.lineTo(0.48, 0.08); // Lower-right lobe peak
  shape.lineTo(0.2, -0.1);
  shape.lineTo(0.08, -0.38); // Base right
  shape.lineTo(0, -0.45); // Stem base
  shape.lineTo(-0.08, -0.38);
  shape.lineTo(-0.2, -0.1);
  shape.lineTo(-0.48, 0.08); // Lower-left lobe peak
  shape.lineTo(-0.35, 0.15);
  shape.lineTo(-0.55, 0.42); // Mid-left lobe peak
  shape.lineTo(-0.28, 0.4);
  shape.lineTo(-0.38, 0.65); // Upper-left lobe peak
  shape.lineTo(-0.15, 0.55);
  shape.lineTo(0, 0.85);

  const geo = new THREE.ShapeGeometry(shape, 6);
  geo.rotateX(-Math.PI / 2); // Lay flat on XZ plane
  return geo;
}

function createOakGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.82);
  shape.bezierCurveTo(0.22, 0.72, 0.32, 0.62, 0.25, 0.5); // Lobe 1
  shape.bezierCurveTo(0.35, 0.42, 0.42, 0.28, 0.29, 0.16); // Lobe 2
  shape.bezierCurveTo(0.35, 0.06, 0.32, -0.12, 0.18, -0.23); // Lobe 3
  shape.bezierCurveTo(0.1, -0.3, 0.04, -0.4, 0, -0.48); // Base right
  shape.bezierCurveTo(-0.04, -0.4, -0.1, -0.3, -0.18, -0.23); // Lobe 3 left
  shape.bezierCurveTo(-0.32, -0.12, -0.35, 0.06, -0.29, 0.16); // Lobe 2 left
  shape.bezierCurveTo(-0.42, 0.28, -0.35, 0.42, -0.25, 0.5); // Lobe 1 left
  shape.bezierCurveTo(-0.32, 0.62, -0.22, 0.72, 0, 0.82);

  const geo = new THREE.ShapeGeometry(shape, 6);
  geo.rotateX(-Math.PI / 2); // Lay flat on XZ plane
  return geo;
}

function createBirchGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.85); // Tip
  shape.quadraticCurveTo(0.4, 0.45, 0.34, 0.08); // Right side
  shape.quadraticCurveTo(0.24, -0.28, 0, -0.44); // Base right
  shape.quadraticCurveTo(-0.24, -0.28, -0.34, 0.08); // Left base
  shape.quadraticCurveTo(-0.4, 0.45, 0, 0.85); // Tip left

  const geo = new THREE.ShapeGeometry(shape, 6);
  geo.rotateX(-Math.PI / 2); // Lay flat on XZ plane
  return geo;
}

// ── Stylized Autumn Leaf Texture Generator ────────────────────────
function createLeafTexture(hexColor) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Convert hex to rgb
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // 1. Shaded Background: Center light highlight, dark bottom-right shadow (3D volume)
  const grad = ctx.createRadialGradient(
    size * 0.4, size * 0.35, 2, // offset light center to top-left
    size * 0.5, size * 0.5, size * 0.55
  );
  const rCenter = Math.min(r + 55, 255);
  const gCenter = Math.min(g + 60, 255);
  const bCenter = Math.max(b - 10, 0);

  grad.addColorStop(0, `rgba(${rCenter}, ${gCenter}, ${bCenter}, 1)`); // Top-left highlights
  grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, 1)`); // Main color
  grad.addColorStop(1, `rgba(${Math.max(r - 55, 0)}, ${Math.max(g - 50, 0)}, ${Math.max(b - 45, 0)}, 1)`); // Darker bottom-right edges

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size); // Shape geometry acts as mask, fill texture fully

  // 2. Micro cellular organic noise (rough leaf feel)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 400; i++) {
    const nx = Math.random() * size;
    const ny = Math.random() * size;
    ctx.fillRect(nx, ny, 1, 1);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  for (let i = 0; i < 400; i++) {
    const nx = Math.random() * size;
    const ny = Math.random() * size;
    ctx.fillRect(nx, ny, 1, 1);
  }

  // Helper to draw vein with a dark drop shadow slightly offset
  const drawVein = (strokeColor, shadowColor, width, startX, startY, isCurve, p1, p2, p3, p4) => {
    // Shadow first (offset +1.2px down and right)
    ctx.strokeStyle = shadowColor;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(startX + 1.2, startY + 1.2);
    if (isCurve) {
      ctx.quadraticCurveTo(p1 + 1.2, p2 + 1.2, p3 + 1.2, p4 + 1.2);
    } else {
      ctx.lineTo(p1 + 1.2, p2 + 1.2);
    }
    ctx.stroke();

    // Vein itself
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    if (isCurve) {
      ctx.quadraticCurveTo(p1, p2, p3, p4);
    } else {
      ctx.lineTo(p1, p2);
    }
    ctx.stroke();
  };

  // Vein Colors
  const veinColor = `rgba(${Math.min(r + 85, 255)}, ${Math.min(g + 95, 255)}, ${Math.min(b + 40, 255)}, 0.8)`;
  const shadowColor = `rgba(${Math.max(r - 70, 0)}, ${Math.max(g - 65, 0)}, ${Math.max(b - 55, 0)}, 0.7)`;
  ctx.lineCap = 'round';

  // Draw central vein
  drawVein(veinColor, shadowColor, 3.2, size / 2, size * 0.08, false, size / 2, size * 0.92);

  // Draw lateral branching veins
  for (let i = 0; i < 6; i++) {
    const y = size * 0.22 + i * size * 0.11;
    const spread = 20 + i * 4.5;
    
    // Left branch
    drawVein(veinColor, shadowColor, 1.4, size / 2, y, true, size / 2 + spread * 0.45, y - 2, size / 2 + spread, y - 8);
    // Right branch
    drawVein(veinColor, shadowColor, 1.4, size / 2, y, true, size / 2 - spread * 0.45, y - 2, size / 2 - spread, y - 8);
  }

  // 3. Organic decay details/spots
  ctx.fillStyle = 'rgba(60, 35, 10, 0.45)';
  for (let j = 0; j < 5; j++) {
     const spotX = size * 0.25 + Math.random() * size * 0.5;
     const spotY = size * 0.2 + Math.random() * size * 0.6;
     const spotSize = 1.2 + Math.random() * 2.8;
     ctx.beginPath();
     ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
     ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const LEAF_COLORS = [
  '#f5b041', // Bright Golden Amber
  '#f39c12', // Warm Autumn Yellow
  '#eb984e', // Soft Ochre
  '#e67e22', // Deep Orange
  '#d35400', // Burnt Orange
  '#dc7633', // Terracotta
  '#c0392b', // Crimson Maple
  '#a93226', // Chestnut Red
  '#f7dc6f', // Light Birch Yellow
  '#f0b27a', // Fallen Oak Tan
  '#ca6f1e', // Warm Rust
  '#e59866', // Dry Autumn Leaf
];

function createSeededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const GARDEN_BOUNDS = { minX: -14.2, maxX: 14.2, minZ: -4.8, maxZ: 13.8 };
const INITIAL_LEAF_COUNT = 4400;

function generateLeafData(count) {
  const state = useGameStore.getState();
  const collectedSet = new Set(state.collectedLeafIds || []);
  const random = createSeededRandom(12345);
  const data = [];
  let attempts = 0;
  while (data.length < count && attempts < count * 10) {
    attempts++;
    const x = GARDEN_BOUNDS.minX + random() * (GARDEN_BOUNDS.maxX - GARDEN_BOUNDS.minX);
    const z = GARDEN_BOUNDS.minZ + random() * (GARDEN_BOUNDS.maxZ - GARDEN_BOUNDS.minZ);

    if (x > -10.2 && x < 6.2 && z < -3.6) continue;

    const restTiltX = (random() - 0.5) * 0.55;
    const restTiltZ = (random() - 0.5) * 0.55;
    const leafId = data.length;

    data.push({
      id: leafId,
      x, z,
      y: 0.012 + random() * 0.015,
      restTiltX,
      restTiltZ,
      rotX: restTiltX,
      rotY: random() * Math.PI * 2,
      rotZ: restTiltZ,
      scale: 0.17 + random() * 0.13,
      colorIndex: Math.floor(random() * LEAF_COLORS.length),
      vx: 0,
      vy: 0,
      vz: 0,
      rotVx: 0,
      rotVy: 0,
      rotVz: 0,
      collected: collectedSet.has(leafId),
    });
  }
  return data;
}

export default function Leaves() {
  const [leavesData, setLeavesData] = useState(() => generateLeafData(INITIAL_LEAF_COUNT));
  const meshRefs = useRef([]);

  const collectedLeafIds = useGameStore(s => s.collectedLeafIds);
  const collectLeafIds = useGameStore(s => s.collectLeafIds);

  // Sync collected status reactively (essential for tab reload / yard resets)
  useEffect(() => {
    const collectedSet = new Set(collectedLeafIds);
    setLeavesData(prev => prev.map(l => {
      const isCollectedNow = collectedSet.has(l.id);
      if (l.collected !== isCollectedNow) {
        return { ...l, collected: isCollectedNow };
      }
      return l;
    }));
  }, [collectedLeafIds]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const leafGeometries = useMemo(() => [
    createMapleGeometry(),
    createOakGeometry(),
    createBirchGeometry()
  ], []);
  const textures = useMemo(() => LEAF_COLORS.map(c => createLeafTexture(c)), []);

  const getGeometryForColor = useCallback((colorIdx) => {
    return leafGeometries[colorIdx % 3];
  }, [leafGeometries]);

  const gamePhase = useGameStore(s => s.gamePhase);
  const leavesInBag = useGameStore(s => s.leavesInBag);
  const bagLevel = useGameStore(s => s.bagLevel);
  const powerLevel = useGameStore(s => s.powerLevel); // Add this to trigger reactivity!
  const addLeaves = useGameStore(s => s.addLeaves);
  const pickingPower = useGameStore(s => s.pickingPower);
  const addNotification = useGameStore(s => s.addNotification);

  const BAG_CAPS = [20, 35, 55, 80, 120, 200];
  const bagCapacity = BAG_CAPS[bagLevel];
  const canCollect = gamePhase === GAME_PHASES.PLAYING;

  // Group active uncollected leaves by color index
  const leavesByColor = useMemo(() => {
    const groups = Array.from({ length: LEAF_COLORS.length }, () => []);
    leavesData.forEach((leaf) => {
      if (!leaf.collected) {
        groups[leaf.colorIndex].push(leaf);
      }
    });
    return groups;
  }, [leavesData]);

  // Reactive State from Zustand
  const isGameOver = useGameStore(s => s.isGameOver);
  const isVacuuming = useGameStore(s => s.isVacuuming);
  const vacuumBattery = useGameStore(s => s.vacuumBattery);
  const bagCap = useGameStore(s => s.getBagCapacity());

  const prevIsGameOver = useRef(isGameOver);

  // Listen for resetYard
  useEffect(() => {
    if (prevIsGameOver.current && !isGameOver) {
      // Game transitioned from Game Over to Playing (Reset Yard)
      setLeavesData(prev => prev.map(l => ({
        ...l,
        collected: false,
        isSucking: false,
        x: l.startX || l.x,
        y: 0.002,
        z: l.startZ || l.z,
        rotX: l.restTiltX,
        rotY: Math.random() * Math.PI * 2,
        rotZ: l.restTiltZ,
        vx: 0,
        vy: 0,
        vz: 0,
        rotVx: 0,
        rotVy: 0,
        rotVz: 0,
        suckProgress: 0
      })));
    }
    prevIsGameOver.current = isGameOver;
  }, [isGameOver]);


  // Vacuum Sound Logic
  useEffect(() => {
    const bagNotFull = leavesInBag < bagCap;
    if (isVacuuming && vacuumBattery > 0 && bagNotFull) {
      startVacuumSound();
    } else {
      stopVacuumSound();
    }
  }, [isVacuuming, vacuumBattery, leavesInBag, bagCap]);

  // Broom Sound Logic
  const isSweeping = useGameStore(s => s.isSweeping);
  useEffect(() => {
    if (isSweeping) {
      startBroomSound();
    } else {
      stopBroomSound();
    }
  }, [isSweeping]);

  const lastSuckTime = useRef(0);
  const collectedQueue = useRef([]);
  const lastFlushTime = useRef(0);
  const { camera } = useThree();

  // Update InstancedMesh matrices and handle vacuum logic
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const state = useGameStore.getState();
    const isVacuuming = state.isVacuuming;
    const vacuumBattery = state.vacuumBattery;
    const vacuumPower = state.getVacuumPower();
    const suckInterval = 1.0 / vacuumPower;
    const bagNotFull = state.leavesInBag < state.getBagCapacity();

    const cx = camera.position.x;
    const cz = camera.position.z;

    // 2. Vacuum Logic (Find new leaves to suck)
    const isInsideHouse = cz < -4.0 && cx > -10.0 && cx < 6.0;
    if (!isInsideHouse && isVacuuming && vacuumBattery > 0 && bagNotFull && t - lastSuckTime.current > suckInterval) {
      let closest = null;
      let minD = 5.0; // 2.23m radius squared (reduced from 16.0)
      
      for (const l of leavesData) {
        if (!l.collected && !l.isSucking) {
          const dx = l.x - cx;
          const dz = l.z - cz;
          const dSq = dx * dx + dz * dz;
          if (dSq < minD) {
            minD = dSq;
            closest = l;
          }
        }
      }

      if (closest) {
        closest.isSucking = true;
        closest.suckProgress = 0;
        closest.startX = closest.x;
        closest.startY = closest.y;
        closest.startZ = closest.z;
        lastSuckTime.current = t;
        state.consumeBattery(suckInterval);
        if (!state.tutorialFlags.sweptLeaves) {
          state.completeTutorialFlag('sweptLeaves');
        }
      }
    }

    // 2.5 Broom Sweeping Physics (Tuned radius & gentle push force)
    const isSweeping = state.isSweeping;
    if (isSweeping && !isInsideHouse) {
      if (!state.tutorialFlags.sweptLeaves) {
        state.completeTutorialFlag('sweptLeaves');
      }
      
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const dirX = camDir.x;
      const dirZ = camDir.z;
      
      for (const l of leavesData) {
        if (!l.collected && !l.isSucking) {
          const dx = l.x - cx;
          const dz = l.z - cz;
          const dist = Math.sqrt(dx * dx + dz * dz);
          
          const SWEEP_RADIUS = 1.35; // Gentle, tactile broom cleaning radius
          if (dist > 0.05 && dist < SWEEP_RADIUS) {
            const nx = dx / dist;
            const nz = dz / dist;
            const dot = nx * dirX + nz * dirZ;
            
            if (dot > 0.35) { // 70 degree cone in front of camera
              const pushForce = (SWEEP_RADIUS - dist) * 0.22;
              l.vx += (dirX * 0.70 + nx * 0.30) * pushForce * 1.15;
              l.vz += (dirZ * 0.70 + nz * 0.30) * pushForce * 1.15;
            }
          }
        }
      }
    }

    // 2.6 Spatial Repulsion & Volumetric 3D Stack Mound Physics
    // Prevents leaves from collapsing into the exact same spot and stacks them into a 3D pile
    const CELL_SIZE = 0.4;
    const grid = new Map();
    
    // Hash leaves into 2D spatial grid
    for (let i = 0; i < leavesData.length; i++) {
      const l = leavesData[i];
      if (!l.collected && !l.isSucking) {
        const gx = Math.floor(l.x / CELL_SIZE);
        const gz = Math.floor(l.z / CELL_SIZE);
        const key = `${gx},${gz}`;
        let cell = grid.get(key);
        if (!cell) {
          cell = [];
          grid.set(key, cell);
        }
        cell.push(l);
      }
    }

    // Solve spatial repulsion & compute pile density for 3D stacking
    for (const [key, cell] of grid.entries()) {
      const [gx, gz] = key.split(',').map(Number);
      
      // Get all neighboring leaves in 3x3 adjacent grid cells
      const neighbors = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nKey = `${gx + dx},${gz + dz}`;
          const nCell = grid.get(nKey);
          if (nCell) {
            for (let k = 0; k < nCell.length; k++) neighbors.push(nCell[k]);
          }
        }
      }

      // Sort cell leaves deterministically by ID to determine stack order
      cell.sort((a, b) => a.id - b.id);

      for (let i = 0; i < cell.length; i++) {
        const leafA = cell[i];
        let stackRank = 0;

        for (let j = 0; j < neighbors.length; j++) {
          const leafB = neighbors[j];
          if (leafA.id === leafB.id) continue;

          const dx = leafA.x - leafB.x;
          const dz = leafA.z - leafB.z;
          const distSq = dx * dx + dz * dz;

          if (distSq < 0.04) { // within 0.2m stack column
            if (leafB.id < leafA.id) {
              stackRank++;
            }
            if (distSq < 0.012 && distSq > 0.00001) { // subtle soft repulsion within 0.11m
              const dist = Math.sqrt(distSq);
              const repForce = (0.11 - dist) * 0.012;
              const rnx = dx / dist;
              const rnz = dz / dist;

              leafA.vx += rnx * repForce;
              leafA.vz += rnz * repForce;
            }
          }
        }

        // Layer 0 leaves sit 100% flush on ground (y = 0.008). Upper leaves stack in tight 0.005m steps up to 0.12m max height.
        leafA.stackRank = stackRank;
        leafA.targetY = 0.008 + Math.min(0.12, stackRank * 0.005);
      }
    }

    // Obstacle lists for leaf collision (strictly outside house footprint)
    const LEAF_TREE_OBSTACLES = [
      { x: -14.8, z: 2.0, r: 0.8 },
      { x: -14.8, z: 8.0, r: 0.8 },
      { x: -7.5, z: -14.5, r: 0.8 },
      { x: -1.5, z: -14.5, r: 0.8 },
      { x: 4.5, z: -14.5, r: 0.8 },
      { x: 13.5, z: -5.0, r: 0.8 },
      { x: 13.5, z: 1.5, r: 0.8 },
      { x: 13.5, z: 7.5, r: 0.8 },
      { x: 8.5, z: 9.5, r: 0.7 },
      { x: 11.5, z: 11.0, r: 0.7 },
      { x: -13.2, z: 5.0, r: 0.6 }, // Birdbath
      { x: 2.5, z: 13.8, r: 0.8 },  // Compost bin
    ];

    // 3. Update matrices and animations
    LEAF_COLORS.forEach((_, colorIdx) => {
      const mesh = meshRefs.current[colorIdx];
      if (!mesh) return;

      const group = leavesByColor[colorIdx];

      for (let i = 0; i < group.length; i++) {
        const item = group[i];

        if (item.isSucking) {
          item.suckProgress += delta * 2.8; // Vacuum speed
          if (item.suckProgress >= 1.0) {
            item.isSucking = false;
            item.collected = true; // Fast path mutation
            collectedQueue.current.push(item.id);
          } else {
            const camPos = camera.position;
            const angle = item.suckProgress * Math.PI * 6.0;
            const radius = (1.0 - item.suckProgress) * 0.85;
            const swirlX = Math.sin(angle) * radius;
            const swirlZ = Math.cos(angle) * radius;
            const swirlY = Math.sin(angle * 2) * radius * 0.25;

            const nx = item.startX + (camPos.x - item.startX) * item.suckProgress + swirlX;
            const ny = item.startY + (camPos.y - 0.55 - item.startY) * item.suckProgress + swirlY;
            const nz = item.startZ + (camPos.z - item.startZ) * item.suckProgress + swirlZ;

            dummy.position.set(nx, ny, nz);
            dummy.rotation.set(
              item.rotX + item.suckProgress * 15,
              item.rotY + item.suckProgress * 18,
              item.rotZ + item.suckProgress * 12
            );
          }
        } else {
          // Broom physics integration (Decelerate and obstacle boundary collision)
          if (Math.abs(item.vx) > 0.001 || Math.abs(item.vz) > 0.001) {
            const nextX = item.x + item.vx * delta;
            const nextZ = item.z + item.vz * delta;

            // Tree & round obstacle collision for leaves
            let hitTree = false;
            for (const obs of LEAF_TREE_OBSTACLES) {
              const dx = nextX - obs.x;
              const dz = nextZ - obs.z;
              if (dx * dx + dz * dz < obs.r * obs.r) {
                hitTree = true;
                item.vx = -item.vx * 0.3;
                item.vz = -item.vz * 0.3;
                break;
              }
            }

            if (!hitTree) {
              item.x = nextX;
              item.z = nextZ;
            }
            
            // Decelerate with friction
            item.vx *= Math.max(0, 1 - delta * 4.5);
            item.vz *= Math.max(0, 1 - delta * 4.5);
            
            // Outer Garden Bounds clamping
            item.x = Math.max(GARDEN_BOUNDS.minX, Math.min(GARDEN_BOUNDS.maxX, item.x));
            item.z = Math.max(GARDEN_BOUNDS.minZ, Math.min(GARDEN_BOUNDS.maxZ, item.z));
            
            // House wall bounce for leaves
            if (item.x > -10.2 && item.x < 6.2 && item.z < -3.6) {
              item.z = -3.6;
              item.vz = -item.vz * 0.5;
            }
          }

          // Smoothly stack height (Y) and subtle 3D tilt based on stack rank
          const pileY = item.targetY || 0.008;
          item.y = THREE.MathUtils.lerp(item.y, pileY, delta * 8.0);

          const rank = item.stackRank || 0;
          const pileTiltX = rank > 0 ? item.restTiltX + Math.sin(item.id * 1.5) * Math.min(0.35, rank * 0.04) : item.restTiltX;
          const pileTiltZ = rank > 0 ? item.restTiltZ + Math.cos(item.id * 1.5) * Math.min(0.35, rank * 0.04) : item.restTiltZ;

          dummy.position.set(item.x, item.y, item.z);
          dummy.rotation.set(pileTiltX, item.rotY + item.vx * 0.1, pileTiltZ);
        }

        if (item.collected) {
          dummy.scale.set(0, 0, 0);
        } else {
          dummy.scale.set(item.scale, item.scale, item.scale);
        }

        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      if (group.length > 0) {
        mesh.count = group.length;
        mesh.instanceMatrix.needsUpdate = true;
      } else {
        mesh.count = 0;
      }
    });

    // 3. Game Over Check
    if (t - lastFlushTime.current > 1.0) {
      let uncollected = 0;
      for (const l of leavesData) {
        if (!l.collected) uncollected++;
      }
      if (uncollected === 0 && state.leavesInBag === 0 && !state.isGameOver) {
        state.triggerVictory();
        if (document.pointerLockElement) document.exitPointerLock();
      }
    }

    // 4. Batch Flush to React State (Performance optimization)
    if (collectedQueue.current.length > 0 && t - lastFlushTime.current > 0.05) {
      const idsToFlush = [...collectedQueue.current];
      collectedQueue.current = [];
      lastFlushTime.current = t;
      
      const space = state.getBagCapacity() - state.leavesInBag;
      const actualCount = Math.min(idsToFlush.length, space);
      if (actualCount > 0) {
        state.addLeaves(actualCount);
        const flushSet = new Set(idsToFlush.slice(0, actualCount));
        
        // Add collected IDs to Zustand store to auto-save them
        state.collectLeafIds(idsToFlush.slice(0, actualCount));

        setLeavesData(prev => prev.map(l => {
          if (flushSet.has(l.id)) return { ...l, collected: true, isSucking: false };
          return l;
        }));
      }
    }
  });

  // Collect leaf action
  const collectLeafByGroupIndex = useCallback((colorIdx, instanceId) => {
    // Get bulletproof fresh values from the store
    const state = useGameStore.getState();
    const currentPower = state.getPickingPower();
    const currentBagCapacity = state.getBagCapacity();
    const currentLeavesInBag = state.leavesInBag;

    if (!canCollect) {
      state.addNotification('⚠️ Pick up the bag first!');
      return;
    }
    const space = currentBagCapacity - currentLeavesInBag;
    if (space <= 0) {
      state.addNotification('🎒 Bag Full! Go sell at the compost bin →');
      return;
    }

    const group = leavesByColor[colorIdx];
    if (!group || !group[instanceId]) return;

    const clicked = group[instanceId];
    let toCollectIds = [clicked.id];

    if (currentPower > 1) {
      const nearby = leavesData
        .filter(l => !l.collected && l.id !== clicked.id)
        .map(l => {
          const dx = l.x - clicked.x;
          const dz = l.z - clicked.z;
          return { leaf: l, distSq: dx * dx + dz * dz };
        })
        .filter(item => item.distSq < 36.0) // 6.0 radius
        .sort((a, b) => a.distSq - b.distSq) // Sort by closest distance!
        .slice(0, Math.min(currentPower - 1, space - 1))
        .map(item => item.leaf);

      toCollectIds.push(...nearby.map(l => l.id));
    }

    const actualCount = Math.min(toCollectIds.length, space);
    const collectedSet = new Set(toCollectIds.slice(0, actualCount));

    // Execute side effects ONCE, outside the React updater function!
    playLeafPick();
    state.addLeaves(actualCount);
    state.addNotification(`+${actualCount} 🍃`);

    // Add collected IDs to Zustand store to auto-save them
    state.collectLeafIds(toCollectIds.slice(0, actualCount));

    setLeavesData(prev => prev.map(l => collectedSet.has(l.id) ? { ...l, collected: true } : l));
  }, [canCollect, leavesByColor, leavesData]);

  // Expose precise group index raycast pick handler via ref to prevent stale closures
  const collectLeafRef = useRef(collectLeafByGroupIndex);
  useEffect(() => {
    collectLeafRef.current = collectLeafByGroupIndex;
  }, [collectLeafByGroupIndex]);

  useEffect(() => {
    window.__collectLeafByGroupIndex = (colorIdx, instanceId) => {
      collectLeafRef.current(colorIdx, instanceId);
    };
    return () => {
      delete window.__collectLeafByGroupIndex;
    };
  }, []);

  return (
    <group>
      {LEAF_COLORS.map((_, colorIdx) => (
        <instancedMesh
          key={colorIdx}
          ref={el => (meshRefs.current[colorIdx] = el)}
          args={[getGeometryForColor(colorIdx), null, INITIAL_LEAF_COUNT]}
          userData={{ type: 'leaf-group', colorIdx }}
        >
          <meshStandardMaterial
            map={textures[colorIdx]}
            side={THREE.DoubleSide}
            transparent
            alphaTest={0.08}
            roughness={0.85}
          />
        </instancedMesh>
      ))}
    </group>
  );
}
