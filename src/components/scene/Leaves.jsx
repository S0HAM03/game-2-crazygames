import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, GAME_PHASES } from '../../store';
import { playLeafPick, startVacuumSound, stopVacuumSound } from '../../audio/SoundSystem';

// ── Realistic Leaf Shape Geometry ─────────────────────────────────
function createLeafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.8);
  shape.bezierCurveTo(0.48, 0.68, 0.62, 0.32, 0.38, 0.04);
  shape.bezierCurveTo(0.55, -0.06, 0.25, -0.45, 0, -0.5);
  shape.bezierCurveTo(-0.25, -0.45, -0.55, -0.06, -0.38, 0.04);
  shape.bezierCurveTo(-0.62, 0.32, -0.48, 0.68, 0, 0.8);
  return new THREE.ShapeGeometry(shape, 6);
}

// ── Procedural Canvas Leaf Texture with Veins ─────────────────────
function createLeafTexture(hexColor) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  const grad = ctx.createRadialGradient(size / 2, size * 0.35, 4, size / 2, size * 0.45, size * 0.55);
  grad.addColorStop(0, `rgba(${Math.min(r + 35, 255)},${Math.min(g + 25, 255)},${Math.min(b + 15, 255)},1)`);
  grad.addColorStop(1, `rgba(${Math.max(r - 30, 0)},${Math.max(g - 25, 0)},${Math.max(b - 20, 0)},1)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(size / 2, 6);
  ctx.bezierCurveTo(size * 0.84, size * 0.15, size * 0.92, size * 0.55, size / 2, size * 0.97);
  ctx.bezierCurveTo(size * 0.08, size * 0.55, size * 0.16, size * 0.15, size / 2, 6);
  ctx.fill();

  ctx.strokeStyle = `rgba(${Math.max(r - 45, 0)},${Math.max(g - 40, 0)},${Math.max(b - 25, 0)},0.45)`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(size / 2, 8);
  ctx.bezierCurveTo(size / 2 + 4, size * 0.45, size / 2 - 2, size * 0.75, size / 2, size * 0.94);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(${Math.max(r - 35, 0)},${Math.max(g - 30, 0)},${Math.max(b - 20, 0)},0.35)`;
  for (let i = 1; i <= 5; i++) {
    const y = size * 0.12 + i * size * 0.13;
    const spread = 18 + i * 5;
    ctx.beginPath();
    ctx.moveTo(size / 2 + 2, y);
    ctx.quadraticCurveTo(size / 2 + spread * 0.55, y + 5, size / 2 + spread, y + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size / 2 - 2, y);
    ctx.quadraticCurveTo(size / 2 - spread * 0.55, y + 5, size / 2 - spread, y + 12);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const LEAF_COLORS = [
  '#c0392b', '#e74c3c', '#e67e22', '#d35400',
  '#f39c12', '#b7950b', '#a04000', '#922b21',
  '#cb4335', '#dc7633', '#a93226', '#ca6f1e',
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

    if (x > -6.2 && x < 6.2 && z < -3.2) continue;

    data.push({
      id: Math.random().toString(36).slice(2),
      x, z,
      y: 0.035 + Math.random() * 0.06,
      rotY: Math.random() * Math.PI * 2,
      tiltX: (Math.random() - 0.5) * 0.6,
      scale: 0.15 + Math.random() * 0.22,
      colorIndex: Math.floor(Math.random() * LEAF_COLORS.length),
      swayOffset: Math.random() * Math.PI * 2,
      swaySpeed: 0.3 + Math.random() * 0.7,
      collected: false,
    });
  }
  return data;
}

export default function Leaves() {
  const [leavesData, setLeavesData] = useState(() => generateLeafData(INITIAL_LEAF_COUNT));
  const meshRefs = useRef([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const leafGeo = useMemo(() => createLeafGeometry(), []);
  const textures = useMemo(() => LEAF_COLORS.map(c => createLeafTexture(c)), []);

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
  const triggerDevCollect = useGameStore(s => s.triggerDevCollect);
  const isVacuuming = useGameStore(s => s.isVacuuming);
  const vacuumBattery = useGameStore(s => s.vacuumBattery);
  const bagCap = useGameStore(s => s.getBagCapacity());

  // Listen for resetYard
  useEffect(() => {
    if (!isGameOver) {
      // Reset all leaves
      leavesData.forEach(l => {
        l.collected = false;
        l.isSucking = false;
        l.x = l.startX || l.x;
        l.y = l.startY || l.y;
        l.z = l.startZ || l.z;
        l.suckProgress = 0;
      });
    }
  }, [isGameOver, leavesData]);

  // Dev Cheat: Auto-collect 100% of leaves
  const devTriggerRef = useRef(triggerDevCollect);
  useEffect(() => {
    if (triggerDevCollect > devTriggerRef.current) {
      let countToKeep = 0;
      leavesData.forEach(l => {
        if (!l.collected && countToKeep > 0) {
          countToKeep--;
        } else if (!l.collected) {
          l.collected = true;
          l.isSucking = false;
          useGameStore.getState().addLeaves(1);
        }
      });
      devTriggerRef.current = triggerDevCollect;
    }
  }, [triggerDevCollect, leavesData]);

  // Vacuum Sound Logic
  useEffect(() => {
    const bagNotFull = leavesInBag < bagCap;
    if (isVacuuming && vacuumBattery > 0 && bagNotFull) {
      startVacuumSound();
    } else {
      stopVacuumSound();
    }
  }, [isVacuuming, vacuumBattery, leavesInBag, bagCap]);

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

    // 1. Vacuum Logic (Find new leaves to suck)
    if (isVacuuming && vacuumBattery > 0 && bagNotFull && t - lastSuckTime.current > suckInterval) {
      let closest = null;
      let minD = 16; // 4.0 radius squared (Nerfed from 8.0)
      const cx = camera.position.x;
      const cz = camera.position.z;
      
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

    // 2. Animate and update matrices
    LEAF_COLORS.forEach((_, colorIdx) => {
      const mesh = meshRefs.current[colorIdx];
      if (!mesh) return;

      const group = leavesByColor[colorIdx];

      for (let i = 0; i < group.length; i++) {
        const item = group[i];

        if (item.isSucking) {
          item.suckProgress += delta * 2.5; // Vacuum speed
          if (item.suckProgress >= 1.0) {
            item.isSucking = false;
            item.collected = true; // Fast path mutation
            collectedQueue.current.push(item.id);
          } else {
            const camPos = camera.position;
            const nx = item.startX + (camPos.x - item.startX) * item.suckProgress;
            const ny = item.startY + (camPos.y - 0.5 - item.startY) * item.suckProgress;
            const nz = item.startZ + (camPos.z - item.startZ) * item.suckProgress;
            dummy.position.set(nx, ny, nz);
            dummy.rotation.set(item.suckProgress * 15, item.suckProgress * 20, 0); // Spin!
          }
        } else {
          dummy.position.set(item.x, item.y, item.z);
          dummy.rotation.set(item.tiltX, item.rotY, 0);
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

  // Expose precise group index raycast pick handler
  useEffect(() => {
    window.__collectLeafByGroupIndex = (colorIdx, instanceId) => {
      collectLeafByGroupIndex(colorIdx, instanceId);
    };
  }, [collectLeafByGroupIndex]);

  return (
    <group>
      {LEAF_COLORS.map((_, colorIdx) => (
        <instancedMesh
          key={colorIdx}
          ref={el => (meshRefs.current[colorIdx] = el)}
          args={[leafGeo, null, INITIAL_LEAF_COUNT]}
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
