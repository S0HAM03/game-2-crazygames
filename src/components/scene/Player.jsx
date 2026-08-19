import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerControls } from '../../hooks/usePlayerControls';
import { useGameStore } from '../../store';
import { playFlowerBell, startBackgroundMusic, playGrassFootstep } from '../../audio/SoundSystem';

const MOVE_SPEED = 5.2;
const EYE_HEIGHT = 1.72;

const SPAWN_POS = new THREE.Vector3(-1, EYE_HEIGHT, -5.5);
const SPAWN_YAW = 0; // Facing into the house

// Collision boxes for the house walls (absolute coordinates)
const WALLS = [
  // --- MAIN HOUSE ---
  { minX: -6.1, maxX: -0.9, minZ: -4.1, maxZ: -3.9 },   // Front wall left
  { minX: 0.9, maxX: 6.1, minZ: -4.1, maxZ: -3.9 },    // Front wall right
  { minX: -6.1, maxX: 6.1, minZ: -12.1, maxZ: -11.9 },  // Back wall
  { minX: 5.9, maxX: 6.1, minZ: -12.1, maxZ: -3.9 },   // Right wall
  { minX: -6.1, maxX: -5.9, minZ: -12.1, maxZ: -3.9 },  // Divider wall (solid)

  // --- GARAGE ---
  { minX: -10.1, maxX: -5.9, minZ: -12.1, maxZ: -11.9 },// Garage back
  { minX: -10.1, maxX: -9.9, minZ: -12.1, maxZ: -3.9 },  // Garage left
  { minX: -10.1, maxX: -9.5, minZ: -4.1, maxZ: -3.9 },   // Garage front left column
  { minX: -6.5, maxX: -5.9, minZ: -4.1, maxZ: -3.9 },    // Garage front right column

  // --- INTERIOR ROOM WALLS ---
  { minX: 2.6, maxX: 6.1, minZ: -8.1, maxZ: -7.9 },
  { minX: 1.4, maxX: 1.6, minZ: -12.1, maxZ: -7.9 },
  { minX: -6.1, maxX: -2.4, minZ: -8.1, maxZ: -7.9 },
  { minX: -2.6, maxX: -2.4, minZ: -12.1, maxZ: -9.1 },
];

// Obstacle collision boxes & circles for trees, benches, compost bin, hedges, etc.
const OBSTACLES = [
  // Trees (strictly outside house footprint)
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

  // Compost Bin
  { x: 2.5, z: 13.8, r: 0.8 },

  // Birdbath
  { x: -13.2, z: 5.0, r: 0.6 },

  // Mailbox
  { x: 1.8, z: 13.2, r: 0.4 },

  // Benches (Box bounds)
  { minX: -13.8, maxX: -12.2, minZ: 7.6, maxZ: 9.4 },
  { minX: 5.6, maxX: 7.4, minZ: 5.2, maxZ: 6.8 },

  // Patio set
  { x: 9.5, z: 9.0, r: 1.2 },

  // Piano Flower Beds
  { minX: -15.0, maxX: -12.0, minZ: 12.0, maxZ: 13.0 },
  { minX: 7.5, maxX: 10.5, minZ: 12.0, maxZ: 13.0 },

  // Hedges along fences
  { minX: -15.2, maxX: -14.0, minZ: -2.0, maxZ: 10.0 },
  { minX: 14.0, maxX: 15.2, minZ: -2.0, maxZ: 10.0 },
];

function checkWallCollision(x, z) {
  const pSize = 0.35; // Player collision radius
  for (const w of WALLS) {
    if (x + pSize > w.minX && x - pSize < w.maxX && z + pSize > w.minZ && z - pSize < w.maxZ) {
      return true;
    }
  }
  for (const obs of OBSTACLES) {
    if (obs.r) {
      const dx = x - obs.x;
      const dz = z - obs.z;
      if (dx * dx + dz * dz < (obs.r + pSize) * (obs.r + pSize)) {
        return true;
      }
    } else if (obs.minX !== undefined) {
      if (x + pSize > obs.minX && x - pSize < obs.maxX && z + pSize > obs.minZ && z - pSize < obs.maxZ) {
        return true;
      }
    }
  }
  return false;
}

export default function FPPlayer() {
  const keys = usePlayerControls();
  const { camera, gl, scene, raycaster } = useThree();
  const hasVacuum = useGameStore(s => s.hasVacuum);
  const hasBroom = useGameStore(s => s.hasBroom);
  const activeTool = useGameStore(s => s.activeTool);
  const isVacuuming = useGameStore(s => s.isVacuuming);

  const posRef = useRef(SPAWN_POS.clone());
  const yawRef = useRef(SPAWN_YAW);
  const pitchRef = useRef(-0.05);
  const isLockedRef = useRef(false);
  const vacuumMeshRef = useRef();
  const vacuumDelayTimer = useRef(null);
  const holdingVacuum = useRef(false);
  const vacuumPitchOffset = useRef(0);
  
  const broomMeshRef = useRef();
  const broomPitchOffset = useRef(-Math.PI / 12);
  const broomSwingOffset = useRef(0);
  const holdingLeftClick = useRef(false);
  const lastFootstepTime = useRef(0);
  
  const audioStarted = useRef(false);

  const setShopOpen = useGameStore(s => s.setShopOpen);
  const isShopOpen = useGameStore(s => s.isShopOpen);
  const isSettingsOpen = useGameStore(s => s.isSettingsOpen);
  const mouseSensitivity = useGameStore(s => s.mouseSensitivity);

  // ── Key Listener for Tab and Tool switching (1=Broom, 2=Vacuum) ──
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShopOpen(!useGameStore.getState().isShopOpen);
      }
      if (e.code === 'Digit1') {
        const state = useGameStore.getState();
        if (state.hasBroom) state.setActiveTool('broom');
      }
      if (e.code === 'Digit2') {
        const state = useGameStore.getState();
        if (state.hasVacuum) state.setActiveTool('vacuum');
      }
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [setShopOpen]);

  // ── Pointer Lock & Mouse Listeners ─────────────────────────
  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseMove = (e) => {
      if (!isLockedRef.current) return;
      const sensitivity = useGameStore.getState().mouseSensitivity;
      yawRef.current -= e.movementX * sensitivity;
      pitchRef.current = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitchRef.current - e.movementY * sensitivity));
    };

    const onLockChange = () => {
      isLockedRef.current = document.pointerLockElement === canvas;
      if (!isLockedRef.current) {
        useGameStore.getState().setVacuuming(false);
        useGameStore.getState().setSweeping(false);
        holdingLeftClick.current = false;
        holdingVacuum.current = false;
      }
    };

    const onMouseDown = (e) => {
      if (!audioStarted.current) {
        audioStarted.current = true;
        startBackgroundMusic();
      }

      if (!isLockedRef.current) {
        canvas.requestPointerLock();
        return;
      }

      const isInsideHouse = posRef.current.z < -4.0 && posRef.current.x > -10.0 && posRef.current.x < 6.0;

      // Handle Sweeping Hold (Left Click) — Only when Broom is active!
      if (e.button === 0) {
        const state = useGameStore.getState();
        if (state.hasBroom && state.activeTool === 'broom') {
          holdingLeftClick.current = true;
        }
      }

      // Handle Vacuum (Right Click) — Only when Vacuum is active!
      if (e.button === 2) {
        const state = useGameStore.getState();
        if (state.hasVacuum && state.activeTool === 'vacuum') {
          holdingVacuum.current = true;
          if (vacuumDelayTimer.current) clearTimeout(vacuumDelayTimer.current);
          vacuumDelayTimer.current = setTimeout(() => {
            if (holdingVacuum.current) {
              useGameStore.getState().setVacuuming(true);
            }
          }, 1000); // 1 sec spin up delay
        }
        return;
      }

      // Handle Raycasting Left Click
      if (e.button === 0) {
        const centerNDC = new THREE.Vector2(0, 0);
        raycaster.setFromCamera(centerNDC, camera);
        const hits = raycaster.intersectObjects(scene.children, true);

        for (const hit of hits) {
          const obj = hit.object;

          if (obj.userData?.type === 'leaf-group' && hit.distance < 2.8) {
            if (isInsideHouse) break;
            const state = useGameStore.getState();
            if (state.isVacuuming) break;
            const colorIdx = obj.userData.colorIdx;
            const instanceId = hit.instanceId;
            if (colorIdx !== undefined && instanceId !== undefined) {
              if (window.__collectLeafByGroupIndex) {
                window.__collectLeafByGroupIndex(colorIdx, instanceId);
              }
            }
            break;
          }

          if (obj.userData?.type === 'leaf' && hit.distance < 2.8) {
            if (isInsideHouse) break;
            const state = useGameStore.getState();
            if (!state.isVacuuming && window.__collectLeaf) window.__collectLeaf(obj.userData.leafId);
            break;
          }

          if (obj.userData?.type === 'bag' && hit.distance < 6.0) {
            if (window.__pickupBag) window.__pickupBag();
            break;
          }

          if (obj.userData?.type === 'flower' && hit.distance < 6.5) {
            playFlowerBell(obj.userData.noteIndex);
            break;
          }

          if (obj.userData?.type === 'vacuum' && hit.distance < 6.0) {
            const state = useGameStore.getState();
            if (state.hasVacuum) {
              state.setActiveTool('vacuum');
              state.addNotification('✅ Vacuum equipped! Hold RMB to use.');
            } else if (state.coins >= 500) {
              state.buyVacuum();
              state.addNotification('🎉 Vacuum Purchased & Equipped! Hold RMB to vacuum.');
            } else {
              state.addNotification('❌ Not enough coins to buy Vacuum! (500 coins)');
            }
            break;
          }

          if (obj.userData?.type === 'battery' && hit.distance < 6.0) {
            const state = useGameStore.getState();
            if (!state.hasVacuum) {
              state.addNotification('❌ You need to buy the Vacuum first!');
            } else if (state.vacuumBattery >= state.maxVacuumBattery) {
              state.addNotification('✅ Battery is already full!');
            } else if (state.coins >= 100) {
              state.buyBattery();
              state.addNotification('🔋 Battery Recharged! (100 coins)');
            } else {
              state.addNotification('❌ Not enough coins for Battery! (100 coins)');
            }
            break;
          }
        }
      }
    };

    const onMouseUp = (e) => {
      if (e.button === 2) {
        holdingVacuum.current = false;
        if (vacuumDelayTimer.current) clearTimeout(vacuumDelayTimer.current);
        useGameStore.getState().setVacuuming(false);
      }
      if (e.button === 0) {
        holdingLeftClick.current = false;
        useGameStore.getState().setSweeping(false);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onLockChange);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onLockChange);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
    };
  }, [gl, camera, scene, raycaster]);

  const lastEnergyDrain = useRef(0);

  // ── Frame updates ─────────────────────────────────────────────
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const state = useGameStore.getState();
    if (state.gamePhase === 'start_menu' || state.isShopOpen || state.isSettingsOpen || state.isGameOver) return;
    
    // Update sweeping state based on mouse hold & active tool
    if (holdingLeftClick.current && state.hasBroom && state.activeTool === 'broom') {
      state.setSweeping(true);
    } else {
      state.setSweeping(false);
    }

    // Passive Energy Drain & 8-Hour Speedrun Timer Tick
    state.tickTimer(delta);

    if (t - lastEnergyDrain.current > 2.0) {
      state.consumeEnergy(1);
      lastEnergyDrain.current = t;
    }

    if (state.isBoosted) state.tickBoost(delta);

    const k = keys.current;
    const yaw = yawRef.current;

    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const move = new THREE.Vector3();

    if (k['KeyW'] || k['ArrowUp']) move.add(forward);
    if (k['KeyS'] || k['ArrowDown']) move.sub(forward);
    if (k['KeyA'] || k['ArrowLeft']) move.sub(right);
    if (k['KeyD'] || k['ArrowRight']) move.add(right);

    if (move.lengthSq() > 0) {
      move.normalize();
      const energyRatio = state.energy / state.maxEnergy;
      let speedMult = 0.4 + (energyRatio * 0.6);
      if (state.isBoosted) speedMult *= 1.5;

      const currentSpeed = MOVE_SPEED * speedMult;
      const nextX = posRef.current.x + move.x * currentSpeed * delta;
      const nextZ = posRef.current.z + move.z * currentSpeed * delta;

      const clampedX = Math.max(-14.5, Math.min(14.5, nextX));
      const clampedZ = Math.max(-11.8, Math.min(14.2, nextZ));

      // Check wall & obstacle collisions (slide along obstacles)
      if (!checkWallCollision(clampedX, posRef.current.z)) {
        posRef.current.x = clampedX;
      }
      if (!checkWallCollision(posRef.current.x, clampedZ)) {
        posRef.current.z = clampedZ;
      }

      // Footsteps
      const isInside = posRef.current.z < -4.0 && posRef.current.x > -10.0 && posRef.current.x < 6.0;
      if (!isInside && t - lastFootstepTime.current > 0.42) {
        playGrassFootstep();
        lastFootstepTime.current = t;
      }
    }

    camera.position.copy(posRef.current);
    const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);
    const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRef.current);
    camera.quaternion.copy(qY).multiply(qX);

    // ── Vacuum Tool Motion & Animation ──
    if (vacuumMeshRef.current && state.activeTool === 'vacuum') {
      const targetPitch = holdingVacuum.current ? -Math.PI / 4 : 0;
      vacuumPitchOffset.current = THREE.MathUtils.lerp(vacuumPitchOffset.current, targetPitch, 0.08);

      vacuumMeshRef.current.position.copy(camera.position);
      vacuumMeshRef.current.quaternion.copy(camera.quaternion);
      vacuumMeshRef.current.rotateX(vacuumPitchOffset.current);
    }

    // ── Realistic Broom Sweeping Animation ──
    if (broomMeshRef.current && state.activeTool === 'broom') {
      const isSweeping = state.isSweeping;
      // Fluid sweeping arc: when sweeping, lower broom down and swing back and forth
      const swingAngle = isSweeping ? Math.sin(t * 10) * 0.55 : Math.sin(t * 1.5) * 0.03;
      const targetPitch = isSweeping ? -Math.PI / 5 : -Math.PI / 10;
      
      broomPitchOffset.current = THREE.MathUtils.lerp(broomPitchOffset.current, targetPitch, 0.12);
      broomSwingOffset.current = THREE.MathUtils.lerp(broomSwingOffset.current, swingAngle, 0.18);

      broomMeshRef.current.position.copy(camera.position);
      broomMeshRef.current.quaternion.copy(camera.quaternion);
      broomMeshRef.current.rotateX(broomPitchOffset.current);
      broomMeshRef.current.rotateY(broomSwingOffset.current);
    }
  });

  return (
    <>
      {/* Vacuum Cleaner — Render ONLY when activeTool === 'vacuum' */}
      {hasVacuum && activeTool === 'vacuum' && (
        <group ref={vacuumMeshRef}>
          <mesh position={[0.5, -0.6, -0.8]} rotation={[-Math.PI / 8, -Math.PI / 16, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 12]} />
            <meshStandardMaterial color="#222222" roughness={0.7} />
          </mesh>
          <mesh position={[0.5, -1.1, -1.3]} rotation={[Math.PI / 8, -Math.PI / 16, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.25, 0.4, 12]} />
            <meshStandardMaterial color="#ff9800" metalness={0.6} />
          </mesh>
        </group>
      )}

      {/* Realistic Wooden Broom — Render ONLY when activeTool === 'broom' */}
      {hasBroom && activeTool === 'broom' && (
        <group ref={broomMeshRef}>
          {/* Tapered Wooden Broom Handle */}
          <mesh position={[0.35, -0.65, -0.75]} rotation={[-Math.PI / 5, -Math.PI / 12, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.028, 1.7, 12]} />
            <meshStandardMaterial color="#7a5230" roughness={0.8} />
          </mesh>
          {/* Metal Collar Clamp */}
          <mesh position={[0.38, -1.35, -1.22]} rotation={[-Math.PI / 5, -Math.PI / 12, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.045, 0.12, 12]} />
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Angled Wooden Brush Head Block */}
          <mesh position={[0.38, -1.45, -1.28]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.48, 0.09, 0.14]} />
            <meshStandardMaterial color="#4a2e16" roughness={0.85} />
          </mesh>
          {/* Multi-layer Straw Bristles */}
          <mesh position={[0.38, -1.58, -1.28]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.46, 0.18, 0.11]} />
            <meshStandardMaterial color="#d4b046" roughness={0.95} />
          </mesh>
          <mesh position={[0.38, -1.60, -1.28]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.48, 0.14, 0.08]} />
            <meshStandardMaterial color="#e5c360" roughness={0.9} />
          </mesh>
        </group>
      )}
    </>
  );
}
