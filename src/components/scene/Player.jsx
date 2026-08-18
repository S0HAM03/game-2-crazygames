import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerControls } from '../../hooks/usePlayerControls';
import { useGameStore } from '../../store';
import { playFlowerBell, startBackgroundMusic, playGrassFootstep } from '../../audio/SoundSystem';

const MOVE_SPEED = 5.2;
const BOUNDS = { minX: -14.5, maxX: 14.5, minZ: -4.8, maxZ: 14.2 };
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
  // Bedroom Z = -8.0 divider
  { minX: 2.6, maxX: 6.1, minZ: -8.1, maxZ: -7.9 },
  // Bedroom X = 1.5 divider
  { minX: 1.4, maxX: 1.6, minZ: -12.1, maxZ: -7.9 },
  // Bathroom Z = -8.0 divider
  { minX: -6.1, maxX: -2.4, minZ: -8.1, maxZ: -7.9 },
  // Bathroom X = -2.5 divider
  { minX: -2.6, maxX: -2.4, minZ: -12.1, maxZ: -9.1 },
];

function checkWallCollision(x, z) {
  const pSize = 0.3; // Player collision radius
  for (const w of WALLS) {
    if (x + pSize > w.minX && x - pSize < w.maxX && z + pSize > w.minZ && z - pSize < w.maxZ) {
      return true;
    }
  }
  return false;
}

export default function FPPlayer() {
  const keys = usePlayerControls();
  const { camera, gl, scene, raycaster } = useThree();
  const hasVacuum = useGameStore(s => s.hasVacuum);
  const hasBroom = useGameStore(s => s.hasBroom);
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

  // ── Tab Key Listener for Inventory / Shop ──────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShopOpen(!useGameStore.getState().isShopOpen);
      }
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [setShopOpen]);

  // ── Pointer Lock & Raycaster & Vacuum ─────────────────────────
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

      // Handle Sweeping Hold (Left Click)
      if (e.button === 0) {
        const state = useGameStore.getState();
        if (state.hasBroom) {
          holdingLeftClick.current = true;
        }
      }

      // Handle Vacuum (Right Click)
      if (e.button === 2) {
        const state = useGameStore.getState();
        if (state.hasVacuum) {
          holdingVacuum.current = true;
          if (vacuumDelayTimer.current) clearTimeout(vacuumDelayTimer.current);
          vacuumDelayTimer.current = setTimeout(() => {
            if (holdingVacuum.current) {
              useGameStore.getState().setVacuuming(true);
            }
          }, 1200); // 1.2 second delay
        }
        return;
      }

      // Handle Left Click
      if (e.button === 0) {
        const centerNDC = new THREE.Vector2(0, 0);
        raycaster.setFromCamera(centerNDC, camera);
        const hits = raycaster.intersectObjects(scene.children, true);

        for (const hit of hits) {
          const obj = hit.object;

          if (obj.userData?.type === 'leaf-group' && hit.distance < 2.8) {
            if (isInsideHouse) break; // Block collecting through walls!
            const state = useGameStore.getState();
            if (state.isVacuuming) break; // Disable hand collect while vacuuming
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
            if (isInsideHouse) break; // Block collecting through walls!
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

          if (obj.userData?.type === 'bed' && hit.distance < 6.0) {
            const state = useGameStore.getState();
            state.sleep();
            state.addNotification('💤 You slept and fully restored Energy!');
            break;
          }

          if (obj.userData?.type === 'food' && hit.distance < 6.0) {
            const state = useGameStore.getState();
            if (state.coins >= 20) {
              state.eatFood(20, 25);
              state.addNotification('🥪 Ate a snack! (+25 Energy)');
            } else {
              state.addNotification('❌ Not enough coins for a snack! (20 coins)');
            }
            break;
          }

          if (obj.userData?.type === 'energydrink' && hit.distance < 6.0) {
            const state = useGameStore.getState();
            if (state.coins >= 50) {
              state.buyEnergyDrink();
              state.addNotification('⚡ Drank Energy Drink! 2x Speed for 60s!');
            } else {
              state.addNotification('❌ Not enough coins for Energy Drink! (50 coins)');
            }
            break;
          }

          if (obj.userData?.type === 'vacuum' && hit.distance < 6.0) {
            const state = useGameStore.getState();
            if (state.hasVacuum) {
              state.addNotification('✅ Vacuum is equipped! Hold RMB to use.');
            } else if (state.coins >= 500) {
              state.buyVacuum();
              state.addNotification('🎉 Vacuum Purchased! Hold RMB to vacuum.');
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
    if (state.isShopOpen || state.isSettingsOpen || state.isGameOver) return;
    
    // Update sweeping state based on mouse hold
    if (holdingLeftClick.current && state.hasBroom) {
      if (!state.isShopOpen && !state.isSettingsOpen && !state.isGameOver) {
        state.setSweeping(true);
      }
    } else {
      state.setSweeping(false);
    }

    // Passive Energy Drain
    if (t - lastEnergyDrain.current > 2.0) {
      state.consumeEnergy(1);
      lastEnergyDrain.current = t;
    }

    // Tick Boost Timer
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
      // Calculate speed based on energy and boost
      const energyRatio = state.energy / state.maxEnergy;
      // Normal speed scales from 0.4x to 1.0x depending on energy
      let speedMult = 0.4 + (energyRatio * 0.6);
      if (state.isBoosted) speedMult *= 1.5;

      const currentSpeed = MOVE_SPEED * speedMult;
      const nextX = posRef.current.x + move.x * currentSpeed * delta;
      const nextZ = posRef.current.z + move.z * currentSpeed * delta;

      // Expand bounds to allow entering the house back to z: -11.8
      // Expanded BOUNDS internally: minX: -14.5, maxX: 14.5, minZ: -11.8, maxZ: 14.2
      const clampedX = Math.max(-14.5, Math.min(14.5, nextX));
      const clampedZ = Math.max(-11.8, Math.min(14.2, nextZ));

      // Check wall collisions (slide along walls)
      if (!checkWallCollision(clampedX, posRef.current.z)) {
        posRef.current.x = clampedX;
      }
      if (!checkWallCollision(posRef.current.x, clampedZ)) {
        posRef.current.z = clampedZ;
      }

      // Play grass footstep sounds when outside
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

    if (vacuumMeshRef.current) {
      // Animate the vacuum nozzle downwards while holding RMB
      const targetPitch = holdingVacuum.current ? -Math.PI / 4 : 0;
      vacuumPitchOffset.current = THREE.MathUtils.lerp(vacuumPitchOffset.current, targetPitch, 0.08);

      vacuumMeshRef.current.position.copy(camera.position);
      vacuumMeshRef.current.quaternion.copy(camera.quaternion);
      vacuumMeshRef.current.rotateX(vacuumPitchOffset.current);
    }

    if (broomMeshRef.current) {
      const isSweeping = state.isSweeping;
      // Animate broom: swing left/right using a sine wave, lower it down while sweeping
      const swingAngle = isSweeping ? Math.sin(t * 12) * 0.45 : 0;
      const targetPitch = isSweeping ? -Math.PI / 6 : -Math.PI / 12;
      
      broomPitchOffset.current = THREE.MathUtils.lerp(broomPitchOffset.current, targetPitch, 0.1);
      broomSwingOffset.current = THREE.MathUtils.lerp(broomSwingOffset.current, swingAngle, 0.15);

      broomMeshRef.current.position.copy(camera.position);
      broomMeshRef.current.quaternion.copy(camera.quaternion);
      broomMeshRef.current.rotateX(broomPitchOffset.current);
      broomMeshRef.current.rotateY(broomSwingOffset.current);
    }
  });

  return (
    <>
      {hasVacuum && (
        <group ref={vacuumMeshRef}>
          {/* Vacuum Hose extending from bottom right */}
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

      {hasBroom && !isVacuuming && (
        <group ref={broomMeshRef}>
          {/* Wooden Broom Handle extending from bottom right */}
          <mesh position={[0.4, -0.7, -0.7]} rotation={[-Math.PI / 6, -Math.PI / 12, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 1.6, 8]} />
            <meshStandardMaterial color="#8d6e63" roughness={0.9} />
          </mesh>
          {/* Wooden Brush Head Block */}
          <mesh position={[0.4, -1.5, -1.3]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.4, 0.08, 0.12]} />
            <meshStandardMaterial color="#5d4037" roughness={0.9} />
          </mesh>
          {/* Yellow Bristles */}
          <mesh position={[0.4, -1.6, -1.3]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.38, 0.12, 0.1]} />
            <meshStandardMaterial color="#ffee58" roughness={0.9} />
          </mesh>
        </group>
      )}
    </>
  );
}
