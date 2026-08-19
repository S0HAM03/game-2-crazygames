import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useGameStore, GAME_PHASES } from '../../store';
import { playBinDeposit } from '../../audio/SoundSystem';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

// Absolute wall boundaries for line of sight occluding
const OCCLUSION_WALLS = [
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

function isLineOfSightBlocked(p1, p2) {
  const x1 = p1.x;
  const z1 = p1.z;
  const x2 = p2.x;
  const z2 = p2.z;

  for (const w of OCCLUSION_WALLS) {
    // 1. Vertical wall (X constant)
    const wallX = (w.minX + w.maxX) / 2;
    if ((x1 < wallX && x2 > wallX) || (x1 > wallX && x2 < wallX)) {
      if (Math.abs(x2 - x1) > 0.0001) {
        const t = (wallX - x1) / (x2 - x1);
        const zInterp = z1 + (z2 - z1) * t;
        if (zInterp >= w.minZ && zInterp <= w.maxZ) {
          return true;
        }
      }
    }

    // 2. Horizontal wall (Z constant)
    const wallZ = (w.minZ + w.maxZ) / 2;
    if ((z1 < wallZ && z2 > wallZ) || (z1 > wallZ && z2 < wallZ)) {
      if (Math.abs(z2 - z1) > 0.0001) {
        const t = (wallZ - z1) / (z2 - z1);
        const xInterp = x1 + (x2 - x1) * t;
        if (xInterp >= w.minX && xInterp <= w.maxX) {
          return true;
        }
      }
    }
  }
  return false;
}

function ProximityTooltip({ position, text, showDistance = 4 }) {
  const [opacity, setOpacity] = useState(0);
  const ref = useRef();
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  
  useFrame(({ camera }) => {
    if (ref.current) {
      const tooltipPos = ref.current.getWorldPosition(worldPos);
      const dist = camera.position.distanceTo(tooltipPos);
      let target = dist < showDistance ? 1 : 0;
      
      // If close, check line-of-sight to prevent displaying label through walls
      if (target === 1 && isLineOfSightBlocked(camera.position, tooltipPos)) {
        target = 0;
      }
      
      setOpacity(prev => THREE.MathUtils.lerp(prev, target, 0.15));
    }
  });

  if (opacity < 0.01) return <group ref={ref} position={position} />;

  return (
    <group ref={ref} position={position}>
      <Html center>
        <div style={{
          background: 'rgba(20, 25, 30, 0.75)',
          backdropFilter: 'blur(12px)',
          padding: '8px 16px',
          borderRadius: '16px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          opacity: opacity,
          transform: `scale(${0.8 + 0.2 * opacity}) translateY(${(1 - opacity) * 10}px)`,
          transition: 'none',
          fontFamily: "'Segoe UI', sans-serif"
        }}>
          {text}
        </div>
      </Html>
    </group>
  );
}

export default function CompostBin() {
  const sellLeaves = useGameStore(s => s.sellLeaves);
  const leavesInBag = useGameStore(s => s.leavesInBag);
  const addNotification = useGameStore(s => s.addNotification);
  const binRef = useRef();

  const handleSell = (e) => {
    e.stopPropagation();
    if (leavesInBag === 0) {
      addNotification('Your bag is empty!');
      return;
    }
    
    const state = useGameStore.getState();
    const isFirstSell = !state.tutorialFlags.soldLeaves;

    playBinDeposit(leavesInBag);
    addNotification(`+${leavesInBag} 🪙 Leaves sold!`);
    sellLeaves();

    if (isFirstSell) {
      state.completeTutorialFlag('soldLeaves');
      state.triggerVoiceOver(
        "Nice, some coins in my pocket. Time to check the upgrades in my inventory (TAB) or the garage!",
        "Nice, some coins in my pocket. Time to check the upgrades in my inventory or the garage!"
      );
    }
  };

  return (
    <group
      position={[2.4, 0, 13.6]}
      onClick={handleSell}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'default'}
    >
      <ProximityTooltip position={[0, 3.0, 0]} text="🗑️ Deposit Leaves" />

      {/* Bin body */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow ref={binRef}>
        <cylinderGeometry args={[0.7, 0.55, 1.7, 10]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.9} />
      </mesh>

      {/* Bin lid */}
      <mesh position={[0, 1.78, 0]} castShadow>
        <cylinderGeometry args={[0.76, 0.76, 0.12, 10]} />
        <meshStandardMaterial color="#3d2610" roughness={0.9} />
      </mesh>

      {/* Bin handle */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <torusGeometry args={[0.2, 0.04, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#2c1d0e" roughness={0.8} />
      </mesh>

      {/* Bin label — a small sign post */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[1.2, 0.5, 0.06]} />
        <meshStandardMaterial color="#f5deb3" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.25, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
        <meshStandardMaterial color="#7a5c30" roughness={0.8} />
      </mesh>

      {/* Glowing ring on ground to indicate interaction zone */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.2, 32]} />
        <meshBasicMaterial color="#ffe066" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
