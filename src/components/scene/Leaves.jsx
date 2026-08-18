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
  '#a93226', '#cb4335', '#d35400', '#dc7633',
  '#e67e22', '#f39c12', '#f4d03f', '#b7950b',
  '#a04000', '#922b21', '#82e0aa', '#ca6f1e',
];

const GARDEN_BOUNDS = { minX: -14.2, maxX: 14.2, minZ: -4.8, maxZ: 13.8 };
const INITIAL_LEAF_COUNT = 4400;

function generateLeafData(count) {
  const data = [];
  let attempts = 0;
  while (data.length < count && attempts < count * 10) {
    attempts++;
    const x = GARDEN_BOUNDS.minX + Math.random() * (GARDEN_BOUNDS.maxX - GARDEN_BOUNDS.minX);
    const z = GARDEN_BOUNDS.minZ + Math.random() * (GARDEN_BOUNDS.maxZ - GARDEN_BOUNDS.minZ);

    if (x > -10.2 && x < 6.2 && z < -3.6) continue;

    // Resting tilt angles so leaves lay flat on grass blades with minor variations
    const restTiltX = (Math.random() - 0.5) * 0.55; // up to 15 degrees tilt
    const restTiltZ = (Math.random() - 0.5) * 0.55;

    data.push({
      id: Math.random().toString(36).slice(2),
      x, z,
      y: 0.012 + Math.random() * 0.015, // Raised slightly off ground for realistic shadow casting
      restTiltX,
      restTiltZ,
      rotX: restTiltX,
      rotY: Math.random() * Math.PI * 2,
      rotZ: restTiltZ,
      scale: 0.17 + Math.random() * 0.13, // Larger size
      colorIndex: Math.floor(Math.random() * LEAF_COLORS.length),
      vx: 0,
      vy: 0,
      vz: 0,
      rotVx: 0,
      rotVy: 0,
      rotVz: 0,
      collected: false,
    });
  }
  return data;
}

export default function Leaves() {
  const [leavesData, setLeavesData] = useState(() => generateLeafData(INITIAL_LEAF_COUNT));
  const meshRefs = useRef([]);
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
      }
    }

    // 2.5 Broom Sweeping Physics (Push leaves away from player front)
    const isSweeping = state.isSweeping;
    if (isSweeping && !isInsideHouse) {
      const dirX = -Math.sin(camera.rotation.y);
      const dirZ = -Math.cos(camera.rotation.y);
      
      for (const l of leavesData) {
        if (!l.collected && !l.isSucking) {
          const dx = l.x - cx;
          const dz = l.z - cz;
          const dist = Math.sqrt(dx * dx + dz * dz);
          
          if (dist < 2.6) { // Broom sweep radius
            const nx = dx / dist;
            const nz = dz / dist;
            const dot = nx * dirX + nz * dirZ;
            
            if (dot > 0.35) { // 70 degree cone in front of camera
              const pushForce = (2.6 - dist) * 0.28;
              l.vx += (dirX * 0.75 + nx * 0.25) * pushForce;
              l.vz += (dirZ * 0.75 + nz * 0.25) * pushForce;
            }
          }
        }
      }
    }

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
            // Swirl spiral physics math
            const angle = item.suckProgress * Math.PI * 6.0; // 3 full loops
            const radius = (1.0 - item.suckProgress) * 0.85; // spiral gets tighter
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
          // Broom physics integration (Decelerate and boundaries clamp)
          if (Math.abs(item.vx) > 0.001 || Math.abs(item.vz) > 0.001) {
            item.x += item.vx * delta;
            item.z += item.vz * delta;
            
            // Decelerate with friction
            item.vx *= Math.max(0, 1 - delta * 4.5);
            item.vz *= Math.max(0, 1 - delta * 4.5);
            
            // Bounds clamping
            item.x = Math.max(GARDEN_BOUNDS.minX, Math.min(GARDEN_BOUNDS.maxX, item.x));
            item.z = Math.max(GARDEN_BOUNDS.minZ, Math.min(GARDEN_BOUNDS.maxZ, item.z));
            
            // House bounce
            if (item.x > -10.2 && item.x < 6.2 && item.z < -3.6) {
              item.z = -3.6;
              item.vz = -item.vz * 0.5;
            }
          }
          dummy.position.set(item.x, item.y, item.z);
          dummy.rotation.set(item.rotX, item.rotY + item.vx * 0.1, item.rotZ);
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
        state.setGameOver(true);
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
