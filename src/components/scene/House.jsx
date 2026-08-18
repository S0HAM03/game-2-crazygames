import { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store';
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

// Procedural Wall Brick Texture (Exterior)
function createWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e8dcc8';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#d4c4af';
  ctx.lineWidth = 2;
  for (let y = 0; y < 256; y += 16) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

// Procedural Roof Shingle Texture
function createRoofTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7a3b1e';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#5a2a12';
  ctx.lineWidth = 3;
  for (let y = 0; y < 256; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

// Procedural Wood Floor Texture
function createWoodFloor() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#6b421a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 256; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

// Simple Helper for walls
function Wall({ args, position, rotation = [0, 0, 0], mat }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ── Simple Model Components ──────────────────────────────────────────
function Sofa({ position, rotation }) {
  return (
    <group position={position} rotation={rotation} castShadow receiveShadow>
      {/* Base Cushion */}
      <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[2.0, 0.35, 0.85]} /><meshStandardMaterial color="#2d4059" roughness={0.8} /></mesh>
      {/* Backrest */}
      <mesh position={[0, 0.6, -0.325]} castShadow><boxGeometry args={[2.0, 0.75, 0.2]} /><meshStandardMaterial color="#2d4059" roughness={0.8} /></mesh>
      {/* Armrests */}
      <mesh position={[-0.925, 0.45, 0.025]} castShadow><boxGeometry args={[0.15, 0.45, 0.8]} /><meshStandardMaterial color="#1a2536" roughness={0.8} /></mesh>
      <mesh position={[0.925, 0.45, 0.025]} castShadow><boxGeometry args={[0.15, 0.45, 0.8]} /><meshStandardMaterial color="#1a2536" roughness={0.8} /></mesh>
    </group>
  );
}

// Coffee Table Helper
function CoffeeTable({ position }) {
  return (
    <mesh position={[position[0], 0.2, position[2]]} castShadow receiveShadow>
      <boxGeometry args={[1.2, 0.4, 0.6]} />
      <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
    </mesh>
  );
}

function TV({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Media Console Table */}
      <mesh position={[0, 0.225, 0]} castShadow><boxGeometry args={[1.6, 0.45, 0.45]} /><meshStandardMaterial color="#3e2723" roughness={0.7} /></mesh>
      {/* TV Screen Stand */}
      <mesh position={[0, 0.525, 0]} castShadow><boxGeometry args={[0.3, 0.15, 0.25]} /><meshStandardMaterial color="#111111" metalness={0.9} /></mesh>
      {/* TV Screen Frame */}
      <mesh position={[0, 0.95, 0.02]} castShadow><boxGeometry args={[1.5, 0.75, 0.05]} /><meshStandardMaterial color="#222222" metalness={0.85} /></mesh>
      {/* Glass Panel Screen */}
      <mesh position={[0, 0.95, 0.05]}><boxGeometry args={[1.44, 0.68, 0.01]} /><meshStandardMaterial color="#0a0a0a" roughness={0.1} /></mesh>
    </group>
  );
}

function Bed({ position, rotation }) {
  const sleep = useGameStore(s => s.sleep);
  const addNotification = useGameStore(s => s.addNotification);

  const handleSleep = (e) => {
    e.stopPropagation();
    if (e.distance > 5) return;
    sleep();
    addNotification('💤 You slept and fully restored Energy!');
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Tooltip */}
      <ProximityTooltip position={[0, 1.4, 0]} text="🛏️ Sleep (Free) - Restores Energy" />

      {/* Invisible Hitbox for easy clicking */}
      <mesh userData={{ type: 'bed' }} visible={false} position={[0, 0.45, 0]} onClick={handleSleep}>
        <boxGeometry args={[1.8, 1.2, 2.2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Wooden Frame */}
      <mesh position={[0, 0.225, 0]} castShadow><boxGeometry args={[1.6, 0.45, 2.05]} /><meshStandardMaterial color="#5d4037" roughness={0.8} /></mesh>
      {/* Headboard */}
      <mesh position={[0, 0.7, -0.975]} castShadow><boxGeometry args={[1.6, 0.6, 0.1]} /><meshStandardMaterial color="#4e342e" roughness={0.85} /></mesh>
      {/* Mattress */}
      <mesh position={[0, 0.375, 0.05]} castShadow><boxGeometry args={[1.5, 0.2, 1.9]} /><meshStandardMaterial color="#eceff1" roughness={0.9} /></mesh>
      {/* Pillows */}
      <mesh position={[0, 0.5, -0.68]} castShadow><boxGeometry args={[1.1, 0.08, 0.38]} /><meshStandardMaterial color="#ffffff" roughness={0.95} /></mesh>
    </group>
  );
}

function KitchenCounter({ position, rotation }) {
  const eatFood = useGameStore(s => s.eatFood);
  const addNotification = useGameStore(s => s.addNotification);
  const coins = useGameStore(s => s.coins);

  const handleEat = (e) => {
    e.stopPropagation();
    if (e.distance > 5) return;
    if (coins < 20) {
      addNotification('❌ Not enough coins for a snack! (20 coins)');
      return;
    }
    eatFood(20, 25);
    addNotification('🥪 Ate a snack! (+25 Energy)');
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Invisible Hitbox for easy clicking */}
      <mesh userData={{ type: 'food' }} visible={false} position={[0, 0.5, 0]} onClick={handleEat}>
        <boxGeometry args={[1.0, 1.5, 2.6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Main Counter Base */}
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.7, 0.9, 2.5]} /><meshStandardMaterial color="#5d4037" roughness={0.85} /></mesh>
      {/* Countertop */}
      <mesh position={[0, 0.925, 0]} castShadow><boxGeometry args={[0.75, 0.05, 2.55]} /><meshStandardMaterial color="#eceff1" roughness={0.25} /></mesh>
      
      {/* Sink Basin */}
      <mesh position={[0, 0.94, -0.6]} castShadow><boxGeometry args={[0.45, 0.05, 0.65]} /><meshStandardMaterial color="#b0bec5" metalness={0.8} roughness={0.2} /></mesh>
      {/* Faucet */}
      <mesh position={[-0.2, 1.1, -0.6]} castShadow><cylinderGeometry args={[0.02, 0.02, 0.28]} /><meshStandardMaterial color="#cfd8dc" metalness={0.9} roughness={0.1} /></mesh>
      <mesh position={[-0.1, 1.22, -0.6]} castShadow rotation={[0, 0, Math.PI/2]}><cylinderGeometry args={[0.02, 0.02, 0.18]} /><meshStandardMaterial color="#cfd8dc" metalness={0.9} roughness={0.1} /></mesh>

      {/* Snack prop */}
      <ProximityTooltip position={[0, 1.3, 0.1]} text="🥪 Snack (20 Coins) - +25 Energy" />
      <mesh position={[0, 0.98, 0.1]} castShadow><boxGeometry args={[0.22, 0.06, 0.22]} /><meshStandardMaterial color="#ff7043" /></mesh>
      
      {/* Energy Drink prop */}
      <ProximityTooltip position={[0, 1.4, 0.7]} text="⚡ Energy Drink (50 Coins) - 15s Boost" />
      <mesh position={[0, 1.05, 0.7]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.2, 12]} />
        <meshStandardMaterial color="#00ffff" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Fridge({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Main Fridge Body */}
      <mesh position={[0, 1.1, 0]} castShadow><boxGeometry args={[1.0, 2.2, 0.95]} /><meshStandardMaterial color="#cfd8dc" metalness={0.5} roughness={0.25} /></mesh>
      {/* Freezer Door */}
      <mesh position={[0, 1.62, 0.49]} castShadow><boxGeometry args={[0.95, 0.9, 0.03]} /><meshStandardMaterial color="#eceff1" metalness={0.4} roughness={0.2} /></mesh>
      {/* Fridge Door */}
      <mesh position={[0, 0.55, 0.49]} castShadow><boxGeometry args={[0.95, 1.1, 0.03]} /><meshStandardMaterial color="#eceff1" metalness={0.4} roughness={0.2} /></mesh>
      {/* Door Handles */}
      <mesh position={[-0.38, 1.5, 0.53]} castShadow><boxGeometry args={[0.03, 0.35, 0.03]} /><meshStandardMaterial color="#78909c" metalness={0.8} /></mesh>
      <mesh position={[-0.38, 0.85, 0.53]} castShadow><boxGeometry args={[0.03, 0.35, 0.03]} /><meshStandardMaterial color="#78909c" metalness={0.8} /></mesh>
    </group>
  );
}

function Stove({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.85, 0.9, 0.85]} /><meshStandardMaterial color="#37474f" roughness={0.3} /></mesh>
      {/* Oven Door Glass */}
      <mesh position={[0, 0.42, 0.44]} castShadow><boxGeometry args={[0.62, 0.48, 0.03]} /><meshStandardMaterial color="#0a0a0a" transparent opacity={0.85} /></mesh>
      {/* Metal Stove Cooktop */}
      <mesh position={[0, 0.925, 0]} castShadow><boxGeometry args={[0.88, 0.05, 0.88]} /><meshStandardMaterial color="#212121" metalness={0.8} /></mesh>
      {/* Burner elements */}
      {[-0.2, 0.2].map((x, i) => (
        [-0.2, 0.2].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.96, z]}><cylinderGeometry args={[0.13, 0.13, 0.02, 12]} /><meshStandardMaterial color={j > 0 ? "#ff3d00" : "#111111"} /></mesh>
        ))
      ))}
    </group>
  );
}

function Plant({ position }) {
  return (
    <group position={position}>
      {/* Clay Pot */}
      <mesh position={[0, 0.18, 0]} castShadow><cylinderGeometry args={[0.18, 0.13, 0.36, 10]} /><meshStandardMaterial color="#d84315" roughness={0.9} /></mesh>
      {/* Soil */}
      <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.16, 0.16, 0.03, 10]} /><meshStandardMaterial color="#3e2723" /></mesh>
      {/* Stylized Shrub Spheres */}
      <mesh position={[0, 0.58, 0]} castShadow><sphereGeometry args={[0.3, 8, 8]} /><meshStandardMaterial color="#2e7d32" roughness={0.85} /></mesh>
      <mesh position={[0.16, 0.48, 0.1]} castShadow><sphereGeometry args={[0.22, 8, 8]} /><meshStandardMaterial color="#388e3c" roughness={0.85} /></mesh>
      <mesh position={[-0.12, 0.65, -0.1]} castShadow><sphereGeometry args={[0.22, 8, 8]} /><meshStandardMaterial color="#1b5e20" roughness={0.85} /></mesh>
    </group>
  );
}

// ── New House Rooms Interior Components ──────────────────────────────
function Toilet({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Bowl Base */}
      <mesh position={[0, 0.2, 0.08]} castShadow><boxGeometry args={[0.38, 0.4, 0.55]} /><meshStandardMaterial color="#ffffff" roughness={0.1} /></mesh>
      {/* Seat Cover */}
      <mesh position={[0, 0.415, 0.1]} castShadow><boxGeometry args={[0.36, 0.03, 0.46]} /><meshStandardMaterial color="#e0e0e0" roughness={0.2} /></mesh>
      {/* Tank */}
      <mesh position={[0, 0.65, -0.22]} castShadow><boxGeometry args={[0.42, 0.5, 0.2]} /><meshStandardMaterial color="#ffffff" roughness={0.1} /></mesh>
      {/* Flush button */}
      <mesh position={[0.12, 0.88, -0.22]} rotation={[Math.PI/2, 0, 0]} castShadow><cylinderGeometry args={[0.02, 0.02, 0.05]} /><meshStandardMaterial color="#cccccc" metalness={0.9} /></mesh>
    </group>
  );
}

function BathroomSink({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Cabinet Vanity */}
      <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.85, 0.8, 0.5]} /><meshStandardMaterial color="#cfd8dc" roughness={0.8} /></mesh>
      {/* Ceramic Basin */}
      <mesh position={[0, 0.825, 0]} castShadow><boxGeometry args={[0.8, 0.06, 0.48]} /><meshStandardMaterial color="#ffffff" roughness={0.1} /></mesh>
      {/* Mirror Frame */}
      <mesh position={[0, 1.45, -0.23]} castShadow><boxGeometry args={[0.62, 0.8, 0.04]} /><meshStandardMaterial color="#37474f" roughness={0.85} /></mesh>
      {/* Reflective Mirror Pane */}
      <mesh position={[0, 1.45, -0.20]}><boxGeometry args={[0.56, 0.74, 0.01]} /><meshStandardMaterial color="#90caf9" metalness={0.95} roughness={0.05} /></mesh>
      {/* Faucet */}
      <mesh position={[0, 0.89, -0.15]} castShadow><cylinderGeometry args={[0.018, 0.018, 0.1]} /><meshStandardMaterial color="#cfd8dc" metalness={0.9} /></mesh>
    </group>
  );
}

function ShowerStall({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Base Tray */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow><boxGeometry args={[1.05, 0.1, 1.05]} /><meshStandardMaterial color="#e0e0e0" roughness={0.3} /></mesh>
      {/* Glass Enclosures (transparent) */}
      <mesh position={[-0.51, 0.95, 0]} castShadow><boxGeometry args={[0.02, 1.8, 1.0]} /><meshStandardMaterial color="#b3e5fc" transparent opacity={0.3} roughness={0.1} /></mesh>
      <mesh position={[0, 0.95, 0.51]} castShadow><boxGeometry args={[1.0, 1.8, 0.02]} /><meshStandardMaterial color="#b3e5fc" transparent opacity={0.3} roughness={0.1} /></mesh>
      {/* Shower Head fixture */}
      <mesh position={[0, 1.75, -0.32]} castShadow><cylinderGeometry args={[0.015, 0.015, 0.3]} /><meshStandardMaterial color="#b0bec5" metalness={0.95} /></mesh>
      <mesh position={[0, 1.85, -0.18]} rotation={[Math.PI/2.3, 0, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.14]} /><meshStandardMaterial color="#b0bec5" metalness={0.95} /></mesh>
    </group>
  );
}

function StudyDesk({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Wooden Table Top */}
      <mesh position={[0, 0.725, 0]} castShadow><boxGeometry args={[1.25, 0.04, 0.55]} /><meshStandardMaterial color="#4e342e" roughness={0.8} /></mesh>
      {/* Metal Legs */}
      {[-0.56, 0.56].map((x, i) => (
        [-0.22, 0.22].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.35, z]} castShadow><cylinderGeometry args={[0.02, 0.02, 0.7]} /><meshStandardMaterial color="#212121" metalness={0.6} /></mesh>
        ))
      ))}
      {/* Laptop Keyboard */}
      <mesh position={[0, 0.76, -0.05]} castShadow><boxGeometry args={[0.25, 0.02, 0.16]} /><meshStandardMaterial color="#37474f" metalness={0.8} /></mesh>
      {/* Laptop Screen (opened) */}
      <mesh position={[0, 0.85, -0.14]} rotation={[0.2, 0, 0]} castShadow><boxGeometry args={[0.25, 0.16, 0.02]} /><meshStandardMaterial color="#212121" metalness={0.8} /></mesh>
    </group>
  );
}

function DeskChair({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.38, 0.04, 0.38]} /><meshStandardMaterial color="#1a252c" roughness={0.9} /></mesh>
      {/* Backrest */}
      <mesh position={[0, 0.74, -0.17]} castShadow><boxGeometry args={[0.36, 0.45, 0.04]} /><meshStandardMaterial color="#1a252c" roughness={0.9} /></mesh>
      {/* Central Stand Column */}
      <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.4]} /><meshStandardMaterial color="#b0bec5" metalness={0.8} /></mesh>
      {/* Base spokes */}
      <mesh position={[0, 0.025, 0]} castShadow><boxGeometry args={[0.42, 0.04, 0.42]} /><meshStandardMaterial color="#212121" /></mesh>
    </group>
  );
}

function Wardrobe({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Closet body */}
      <mesh position={[0, 0.95, 0]} castShadow><boxGeometry args={[1.05, 1.9, 0.5]} /><meshStandardMaterial color="#3e2723" roughness={0.85} /></mesh>
      {/* Metal Handles */}
      <mesh position={[-0.04, 1.0, 0.26]} castShadow><boxGeometry args={[0.02, 0.22, 0.02]} /><meshStandardMaterial color="#b0bec5" metalness={0.9} /></mesh>
      <mesh position={[0.04, 1.0, 0.26]} castShadow><boxGeometry args={[0.02, 0.22, 0.02]} /><meshStandardMaterial color="#b0bec5" metalness={0.9} /></mesh>
    </group>
  );
}

function Bookshelf({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Frame casing */}
      <mesh position={[0, 0.85, 0]} castShadow><boxGeometry args={[1.1, 1.7, 0.3]} /><meshStandardMaterial color="#4e342e" roughness={0.9} /></mesh>
      {/* Horizontal Shelves & Books */}
      <mesh position={[0, 0.42, 0.02]} castShadow><boxGeometry args={[1.0, 0.22, 0.25]} /><meshStandardMaterial color="#cca87a" /></mesh>
      <mesh position={[0.15, 0.85, 0.02]} castShadow><boxGeometry args={[0.6, 0.22, 0.25]} /><meshStandardMaterial color="#3f51b5" /></mesh>
      <mesh position={[-0.18, 1.28, 0.02]} castShadow><boxGeometry args={[0.55, 0.22, 0.25]} /><meshStandardMaterial color="#4caf50" /></mesh>
    </group>
  );
}

function DiningSet({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Dining Table */}
      <mesh position={[0, 0.36, 0]} castShadow><boxGeometry args={[1.1, 0.72, 0.75]} /><meshStandardMaterial color="#5c3a21" roughness={0.8} /></mesh>
      {/* Tabletop Wood Trim */}
      <mesh position={[0, 0.73, 0]} castShadow><boxGeometry args={[1.15, 0.03, 0.8]} /><meshStandardMaterial color="#8b5a2b" roughness={0.7} /></mesh>
      {/* Two Dining Chairs */}
      <group position={[0, 0, -0.6]} rotation={[0, 0, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[0.34, 0.4, 0.34]} /><meshStandardMaterial color="#3e2723" /></mesh>
        <mesh position={[0, 0.54, -0.15]} castShadow><boxGeometry args={[0.34, 0.38, 0.04]} /><meshStandardMaterial color="#3e2723" /></mesh>
      </group>
      <group position={[0, 0, 0.6]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow><boxGeometry args={[0.34, 0.4, 0.34]} /><meshStandardMaterial color="#3e2723" /></mesh>
        <mesh position={[0, 0.54, -0.15]} castShadow><boxGeometry args={[0.34, 0.38, 0.04]} /><meshStandardMaterial color="#3e2723" /></mesh>
      </group>
    </group>
  );
}

// ── Garage Workshop Upgraded Items ──────────────────────────────────
function GarageWorkbench({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Workbench Table */}
      <mesh position={[0, 0.425, 0]} castShadow receiveShadow><boxGeometry args={[1.4, 0.85, 0.55]} /><meshStandardMaterial color="#37474f" metalness={0.6} roughness={0.4} /></mesh>
      {/* Wall pegboard Backdrop */}
      <mesh position={[0, 1.2, -0.26]} castShadow><boxGeometry args={[1.4, 0.7, 0.03]} /><meshStandardMaterial color="#90a4ae" roughness={0.95} /></mesh>
      {/* Workbench Vise */}
      <mesh position={[-0.45, 0.9, 0.15]} castShadow><boxGeometry args={[0.18, 0.12, 0.12]} /><meshStandardMaterial color="#263238" metalness={0.8} /></mesh>
    </group>
  );
}

function StorageShelves({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Shelves Upright Corner Posts */}
      {[-0.52, 0.52].map((x, i) => (
        [-0.22, 0.22].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.85, z]} castShadow><cylinderGeometry args={[0.015, 0.015, 1.7]} /><meshStandardMaterial color="#90a4ae" metalness={0.75} /></mesh>
        ))
      ))}
      {/* Metal Shelves & Crates */}
      {[0.1, 0.8, 1.5].map((y, idx) => (
        <group key={idx}>
          <mesh position={[0, y, 0]} castShadow><boxGeometry args={[1.1, 0.03, 0.48]} /><meshStandardMaterial color="#b0bec5" metalness={0.8} /></mesh>
          {/* Cardboard Boxes */}
          <mesh position={[-0.2, y + 0.14, 0]} castShadow><boxGeometry args={[0.38, 0.24, 0.38]} /><meshStandardMaterial color="#bda27f" roughness={0.95} /></mesh>
          <mesh position={[0.22, y + 0.12, 0.02]} castShadow><boxGeometry args={[0.32, 0.22, 0.34]} /><meshStandardMaterial color="#a1887f" roughness={0.95} /></mesh>
        </group>
      ))}
    </group>
  );
}

function TireStack({ position }) {
  return (
    <group position={position}>
      {[0.08, 0.24, 0.4].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]} rotation={[0, idx * 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function RedToolbox({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body Frame */}
      <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.5, 0.8, 0.38]} /><meshStandardMaterial color="#b71c1c" roughness={0.3} /></mesh>
      {/* Drawer slide trim lines */}
      {[0.12, 0.26, 0.4, 0.54, 0.68].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0.195]} castShadow><boxGeometry args={[0.44, 0.02, 0.02]} /><meshStandardMaterial color="#cfd8dc" metalness={0.9} /></mesh>
      ))}
    </group>
  );
}

function OilDrum({ position }) {
  return (
    <group position={position}>
      {/* Steel Cylinder */}
      <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.26, 0.26, 0.84, 12]} /><meshStandardMaterial color="#1b5e20" roughness={0.5} metalness={0.4} /></mesh>
      {/* Structural Ribs */}
      <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.27, 0.27, 0.02, 12]} /><meshStandardMaterial color="#1b5e20" /></mesh>
      <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.27, 0.27, 0.02, 12]} /><meshStandardMaterial color="#1b5e20" /></mesh>
    </group>
  );
}

function VacuumProp({ position }) {
  const hasVacuum = useGameStore(s => s.hasVacuum);
  const buyVacuum = useGameStore(s => s.buyVacuum);
  const addNotification = useGameStore(s => s.addNotification);
  const coins = useGameStore(s => s.coins);

  const handleInteract = (e) => {
    e.stopPropagation();
    if (e.distance > 5) return;
    if (hasVacuum) {
      addNotification('✅ Vacuum is equipped! Hold RMB to use.');
      return;
    }
    if (coins < 500) {
      addNotification('❌ Not enough coins to buy Vacuum! (500 coins)');
      return;
    }
    buyVacuum();
    addNotification('🎉 Vacuum Purchased! Hold RMB to vacuum.');
  };

  return (
    <group position={position}>
      {/* Vacuum Prop - Disappears when purchased */}
      {!hasVacuum && (
        <group>
          <ProximityTooltip position={[0, 1.8, 0]} text="🌪️ Vacuum (500 Coins) - Buy" />
          {/* Invisible Hitbox for easy clicking */}
          <mesh userData={{ type: 'vacuum' }} visible={false} onClick={handleInteract}>
            <boxGeometry args={[1.2, 2.0, 1.2]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          
          {/* Vacuum Body */}
          <mesh position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.18, 0.18, 0.8, 12]} /><meshStandardMaterial color="#ff9800" metalness={0.6} /></mesh>
          <mesh position={[0, 0.8, 0]} castShadow><cylinderGeometry args={[0.1, 0.18, 0.3, 12]} /><meshStandardMaterial color="#212121" /></mesh>
          <mesh position={[0, 1.2, 0.1]} rotation={[0.4, 0, 0]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.6, 8]} /><meshStandardMaterial color="#212121" /></mesh>
        </group>
      )}

      {/* Battery prop (sold separately) */}
      <ProximityTooltip position={[1.0, 1.0, 0]} text="🔋 Battery (100 Coins) - Full Recharge" />
      <mesh userData={{ type: 'battery' }} visible={false} position={[1.0, 0.5, 0]}>
        <boxGeometry args={[1.0, 1.5, 1.0]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh position={[1.0, 0.1, 0]} castShadow userData={{ type: 'battery' }}>
        <boxGeometry args={[0.3, 0.2, 0.2]} />
        <meshStandardMaterial color="#e74c3c" />
      </mesh>
      <mesh position={[1.1, 0.25, 0]} castShadow userData={{ type: 'battery' }}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} />
      </mesh>
    </group>
  );
}

function BroomProp({ position }) {
  const hasBroom = useGameStore(s => s.hasBroom);
  const buyBroom = useGameStore(s => s.buyBroom);
  const addNotification = useGameStore(s => s.addNotification);
  const coins = useGameStore(s => s.coins);

  const handleInteract = (e) => {
    e.stopPropagation();
    if (e.distance > 5) return;
    if (hasBroom) {
      addNotification('✅ Broom is equipped! Hold LMB to sweep.');
      return;
    }
    if (coins < 80) {
      addNotification('❌ Not enough coins to buy Broom! (80 coins)');
      return;
    }
    buyBroom();
    addNotification('🎉 Broom Purchased! Hold LMB to sweep leaves.');
  };

  return (
    <group position={position}>
      {!hasBroom && (
        <group>
          <ProximityTooltip position={[0, 1.8, 0]} text="🧹 Broom (80 Coins) - Buy" />
          {/* Invisible Hitbox for easy clicking */}
          <mesh visible={false} onClick={handleInteract}>
            <boxGeometry args={[1.0, 2.0, 1.0]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {/* Wooden handle */}
          <mesh position={[0, 0.8, 0]} rotation={[0.2, 0, 0.4]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
            <meshStandardMaterial color="#8d6e63" roughness={0.9} />
          </mesh>
          {/* Brush Head */}
          <mesh position={[0.3, 0.1, 0.08]} rotation={[0.2, 0, 0.4]} castShadow>
            <boxGeometry args={[0.35, 0.08, 0.12]} />
            <meshStandardMaterial color="#5d4037" roughness={0.9} />
          </mesh>
          <mesh position={[0.3, 0.02, 0.08]} rotation={[0.2, 0, 0.4]} castShadow>
            <boxGeometry args={[0.33, 0.08, 0.1]} />
            <meshStandardMaterial color="#ffee58" roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function House() {
  const wallTex = useMemo(() => createWallTexture(), []);
  const roofTex = useMemo(() => createRoofTexture(), []);
  const floorTex = useMemo(() => createWoodFloor(), []);
  
  const extWallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85 });
  const intWallMat = new THREE.MeshStandardMaterial({ color: '#fcfaf2', roughness: 0.9 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 });
  const garageFloorMat = new THREE.MeshStandardMaterial({ color: '#555555', roughness: 0.85 });

  // Note: House center positioned at [0, 0, -8]
  return (
    <group position={[0, 0, -8]}>
      {/* --- FLOORS --- */}
      {/* Expanded Main Floor (12x8) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <primitive object={floorMat} attach="material" />
      </mesh>
      {/* Expanded Garage Floor (4x8) */}
      <mesh position={[-8, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 8]} />
        <primitive object={garageFloorMat} attach="material" />
      </mesh>

      {/* --- EXTERIOR WALLS (Hollow, Expanded House) --- */}
      {/* Front Wall (Z = 4.0) with main entrance door gap */}
      <Wall args={[5, 4, 0.2]} position={[-3.5, 2, 4.0]} mat={extWallMat} />
      <Wall args={[5, 4, 0.2]} position={[3.5, 2, 4.0]} mat={extWallMat} />
      <Wall args={[2, 1.6, 0.2]} position={[0, 3.2, 4.0]} mat={extWallMat} />

      {/* Back Wall (Z = -4.0) */}
      <Wall args={[12, 4, 0.2]} position={[0, 2, -4.0]} mat={extWallMat} />
      {/* Right Wall (X = 6.0) */}
      <Wall args={[0.2, 4, 8]} position={[6.0, 2, 0]} mat={extWallMat} />
      
      {/* Left Wall / divider between house and garage (X = -6.0) - Solid Partition */}
      <Wall args={[0.2, 4, 8]} position={[-6.0, 2, 0]} mat={intWallMat} />

      {/* --- GARAGE EXTERIOR WALLS --- */}
      {/* Garage Back Wall */}
      <Wall args={[4, 3, 0.2]} position={[-8.0, 1.5, -4.0]} mat={extWallMat} /> 
      {/* Garage Left Wall */}
      <Wall args={[0.2, 3, 8]} position={[-10.0, 1.5, 0]} mat={extWallMat} /> 
      {/* Garage Door (Open Column + Header Layout) */}
      <Wall args={[0.4, 3, 0.2]} position={[-9.8, 1.5, 4.0]} mat={extWallMat} />
      <Wall args={[0.4, 3, 0.2]} position={[-6.2, 1.5, 4.0]} mat={extWallMat} />
      <Wall args={[3.2, 0.6, 0.2]} position={[-8.0, 2.7, 4.0]} mat={extWallMat} />

      {/* --- INTERIOR PARTITION WALLS (Creating Bedroom & Bathroom) --- */}
      {/* Bedroom Divider Wall (Z = 0) with door gap */}
      <Wall args={[3.3, 4, 0.2]} position={[4.35, 2, 0]} mat={intWallMat} />
      <Wall args={[1.2, 1.6, 0.2]} position={[2.1, 3.2, 0]} mat={intWallMat} />
      {/* Bedroom Side Divider Wall (X = 1.5) */}
      <Wall args={[0.2, 4, 4]} position={[1.5, 2, -2.0]} mat={intWallMat} />

      {/* Bathroom Divider Wall (Z = 0) */}
      <Wall args={[3.5, 4, 0.2]} position={[-4.25, 2, 0]} mat={intWallMat} />
      {/* Bathroom Side Divider Wall (X = -2.5) with door gap */}
      <Wall args={[0.2, 4, 2.8]} position={[-2.5, 2, -2.6]} mat={intWallMat} />
      <Wall args={[0.2, 1.6, 1.2]} position={[-2.5, 3.2, -0.6]} mat={intWallMat} />

      {/* --- CEILINGS --- */}
      {/* Main House Flat Ceiling (aligned with wall tops) */}
      <mesh position={[0, 4.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.1, 8]} />
        <meshStandardMaterial color="#fcfaf2" roughness={0.9} />
      </mesh>
      {/* Garage Flat Ceiling */}
      <mesh position={[-8, 3.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 0.1, 8]} />
        <meshStandardMaterial color="#777777" roughness={0.9} />
      </mesh>

      {/* --- ROOFS (Aligned to rectangular walls using scale nesting) --- */}
      {/* Main roof: nested rotation + scale */}
      <group position={[0, 4.05, 0]} scale={[1.45, 1.0, 0.98]}>
        <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
          <cylinderGeometry args={[0.01, 6.0, 2.2, 4, 1]} />
          <meshStandardMaterial map={roofTex} roughness={0.7} />
        </mesh>
      </group>
      {/* Garage roof: nested rotation + scale */}
      <group position={[-8, 3.05, 0]} scale={[0.52, 0.75, 0.98]}>
        <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
          <cylinderGeometry args={[0.01, 6.0, 1.8, 4, 1]} />
          <meshStandardMaterial map={roofTex} roughness={0.7} />
        </mesh>
      </group>

      {/* 1. Living Room (Rearranged to keep entryway X: [-2.5, 2] completely clear) */}
      <TV position={[4.5, 0, 0.35]} rotation={[0, 0, 0]} />
      <Sofa position={[4.5, 0, 3.1]} rotation={[0, Math.PI, 0]} />
      <CoffeeTable position={[4.5, 0, 1.8]} />
      <Bookshelf position={[5.7, 0, 2.0]} rotation={[0, -Math.PI / 2, 0]} />
      <Plant position={[5.5, 0, 3.5]} />
      
      {/* 2. Bedroom */}
      <Bed position={[4.5, 0, -2.2]} rotation={[0, Math.PI, 0]} />
      <StudyDesk position={[2.5, 0, -3.65]} rotation={[0, 0, 0]} />
      <DeskChair position={[2.5, 0, -3.0]} rotation={[0, 0, 0]} />
      <Wardrobe position={[5.3, 0, -0.5]} rotation={[0, -Math.PI / 2, 0]} />
      <Plant position={[5.5, 0, -3.5]} />
      
      {/* 3. Bathroom (Back-Left - Detailed Porcelain/Glass) */}
      <Toilet position={[-5.3, 0, -3.2]} rotation={[0, 0, 0]} />
      <BathroomSink position={[-3.3, 0, -3.35]} rotation={[0, 0, 0]} />
      <ShowerStall position={[-5.3, 0, -0.7]} rotation={[0, 0, 0]} />
      
      {/* 4. Kitchen (Middle/Front-Left - Open Kitchen Concept) */}
      <Fridge position={[-5.4, 0, 0.6]} rotation={[0, Math.PI / 2, 0]} />
      <Stove position={[-5.4, 0, 1.7]} rotation={[0, Math.PI / 2, 0]} />
      <KitchenCounter position={[-5.4, 0, 3.1]} rotation={[0, Math.PI / 2, 0]} />
      <DiningSet position={[-3.8, 0, 1.8]} rotation={[0, Math.PI / 2, 0]} />

      {/* 5. Garage Workshop (Packed Workbench, Storage, toolbox, tires) */}
      <VacuumProp position={[-8.0, 0, -1.8]} />
      <BroomProp position={[-7.2, 0, -1.8]} />
      <GarageWorkbench position={[-9.6, 0, 1.0]} rotation={[0, Math.PI / 2, 0]} />
      <StorageShelves position={[-9.4, 0, -0.8]} rotation={[0, Math.PI / 2, 0]} />
      <TireStack position={[-7.0, 0, -3.4]} />
      <RedToolbox position={[-7.0, 0, 0.5]} rotation={[0, Math.PI / 2, 0]} />
      <OilDrum position={[-9.4, 0, -3.3]} />

      {/* Porch steps */}
      <mesh position={[0, 0.05, 4.4]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.1, 0.8]} />
        <meshStandardMaterial color="#b0a090" roughness={1} />
      </mesh>
    </group>
  );
}
