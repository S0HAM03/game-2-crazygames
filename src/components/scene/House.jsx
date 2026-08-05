import { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../store';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

function ProximityTooltip({ position, text, showDistance = 4 }) {
  const [opacity, setOpacity] = useState(0);
  const ref = useRef();
  
  useFrame(({ camera }) => {
    if (ref.current) {
      const dist = camera.position.distanceTo(ref.current.getWorldPosition(new THREE.Vector3()));
      const target = dist < showDistance ? 1 : 0;
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

// Simple Model Components
function Sofa({ position, rotation }) {
  return (
    <group position={position} rotation={rotation} castShadow receiveShadow>
      {/* Base */}
      <mesh position={[0, 0.2, 0]}><boxGeometry args={[2, 0.4, 0.8]} /><meshStandardMaterial color="#335577" /></mesh>
      {/* Backrest */}
      <mesh position={[0, 0.6, -0.3]}><boxGeometry args={[2, 0.8, 0.2]} /><meshStandardMaterial color="#335577" /></mesh>
      {/* Armrests */}
      <mesh position={[-0.9, 0.5, 0.0]}><boxGeometry args={[0.2, 0.4, 0.8]} /><meshStandardMaterial color="#335577" /></mesh>
      <mesh position={[0.9, 0.5, 0.0]}><boxGeometry args={[0.2, 0.4, 0.8]} /><meshStandardMaterial color="#335577" /></mesh>
    </group>
  );
}

function TV({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Stand */}
      <mesh position={[0, 0.25, 0]} castShadow><boxGeometry args={[1.5, 0.5, 0.4]} /><meshStandardMaterial color="#3b2b1a" /></mesh>
      {/* Screen */}
      <mesh position={[0, 0.8, 0.1]} castShadow><boxGeometry args={[1.4, 0.8, 0.05]} /><meshStandardMaterial color="#111111" /></mesh>
    </group>
  );
}

function Bed({ position, rotation }) {
  const sleep = useGameStore(s => s.sleep);
  const addNotification = useGameStore(s => s.addNotification);
  const [hovered, setHovered] = useState(false);

  const handleSleep = (e) => {
    e.stopPropagation();
    if (e.distance > 5) return;
    sleep();
    addNotification('💤 You slept and fully restored Energy!');
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Tooltip */}
      <ProximityTooltip position={[0, 1.5, 0]} text="🛏️ Sleep (Free) - Restores Energy" />

      {/* Invisible Hitbox for easy clicking */}
      <mesh userData={{ type: 'bed' }} visible={false} position={[0, 0.5, 0]}>
        <boxGeometry args={[2.5, 1.5, 3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      <mesh position={[0, 0.25, 0]} castShadow userData={{ type: 'bed' }}><boxGeometry args={[1.5, 0.5, 2]} /><meshStandardMaterial color="#4a3b2a" /></mesh>
      <mesh position={[0, 0.35, 0]} castShadow userData={{ type: 'bed' }}><boxGeometry args={[1.4, 0.2, 1.9]} /><meshStandardMaterial color="#e0e0e0" /></mesh>
      <mesh position={[0, 0.45, -0.7]} castShadow userData={{ type: 'bed' }}><boxGeometry args={[1.2, 0.15, 0.4]} /><meshStandardMaterial color="#ffffff" /></mesh>
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
      <mesh userData={{ type: 'food' }} visible={false} position={[0, 0.5, 0]}>
        <boxGeometry args={[3.0, 1.5, 1.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Main Counter */}
      <mesh position={[0, 0.45, 0]} castShadow userData={{ type: 'food' }}><boxGeometry args={[2.5, 0.9, 0.8]} /><meshStandardMaterial color="#3b2b1a" /></mesh>
      <mesh position={[0, 0.95, 0]} castShadow userData={{ type: 'food' }}><boxGeometry args={[2.6, 0.1, 0.9]} /><meshStandardMaterial color="#d4c4a8" roughness={0.2} /></mesh>
      
      {/* Sink Basin */}
      <mesh position={[-0.7, 0.96, 0]} castShadow><boxGeometry args={[0.7, 0.05, 0.5]} /><meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} /></mesh>
      {/* Faucet */}
      <mesh position={[-0.7, 1.15, -0.2]} castShadow><cylinderGeometry args={[0.02, 0.02, 0.3]} /><meshStandardMaterial color="#dddddd" metalness={1.0} roughness={0.1} /></mesh>
      <mesh position={[-0.7, 1.3, -0.1]} castShadow rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 0.2]} /><meshStandardMaterial color="#dddddd" metalness={1.0} roughness={0.1} /></mesh>

      {/* Snack prop */}
      <ProximityTooltip position={[0.2, 1.3, 0.1]} text="🥪 Snack (20 Coins) - +25 Energy" />
      <mesh position={[0.2, 1.05, 0.1]} castShadow userData={{ type: 'food' }}><boxGeometry args={[0.2, 0.1, 0.2]} /><meshStandardMaterial color="#f08080" /></mesh>
      
      {/* Energy Drink prop */}
      <ProximityTooltip position={[0.7, 1.4, 0]} text="⚡ Energy Drink (50 Coins) - 15s Boost" />
      <mesh userData={{ type: 'energydrink' }} visible={false} position={[0.7, 1.0, 0]}>
        <boxGeometry args={[1.0, 1.5, 1.0]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh position={[0.7, 1.1, 0]} castShadow userData={{ type: 'energydrink' }}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
        <meshStandardMaterial color="#00ffff" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function Fridge({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Main Body */}
      <mesh position={[0, 1.1, 0]} castShadow><boxGeometry args={[1.2, 2.2, 1.2]} /><meshStandardMaterial color="#eef2f5" metalness={0.4} roughness={0.3} /></mesh>
      {/* Top Door */}
      <mesh position={[0, 1.6, 0.62]} castShadow><boxGeometry args={[1.15, 1.0, 0.05]} /><meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.2} /></mesh>
      {/* Bottom Door */}
      <mesh position={[0, 0.55, 0.62]} castShadow><boxGeometry args={[1.15, 1.0, 0.05]} /><meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.2} /></mesh>
      {/* Handles */}
      <mesh position={[-0.4, 1.6, 0.66]} castShadow><boxGeometry args={[0.05, 0.4, 0.05]} /><meshStandardMaterial color="#888888" metalness={0.8} /></mesh>
      <mesh position={[-0.4, 0.8, 0.66]} castShadow><boxGeometry args={[0.05, 0.4, 0.05]} /><meshStandardMaterial color="#888888" metalness={0.8} /></mesh>
    </group>
  );
}

function Stove({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Main Body */}
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[1.0, 0.9, 0.9]} /><meshStandardMaterial color="#444444" metalness={0.7} roughness={0.2} /></mesh>
      {/* Oven Window */}
      <mesh position={[0, 0.45, 0.46]} castShadow><boxGeometry args={[0.7, 0.5, 0.05]} /><meshStandardMaterial color="#111111" transparent opacity={0.8} /></mesh>
      {/* Stovetop */}
      <mesh position={[0, 0.95, 0]} castShadow><boxGeometry args={[1.05, 0.05, 0.95]} /><meshStandardMaterial color="#222222" metalness={0.8} /></mesh>
      {/* Burners */}
      <mesh position={[-0.25, 0.98, -0.2]} castShadow><cylinderGeometry args={[0.15, 0.15, 0.02, 16]} /><meshStandardMaterial color="#aa3333" /></mesh>
      <mesh position={[0.25, 0.98, 0.2]} castShadow><cylinderGeometry args={[0.15, 0.15, 0.02, 16]} /><meshStandardMaterial color="#aa3333" /></mesh>
      <mesh position={[-0.25, 0.98, 0.2]} castShadow><cylinderGeometry args={[0.15, 0.15, 0.02, 16]} /><meshStandardMaterial color="#111111" /></mesh>
      <mesh position={[0.25, 0.98, -0.2]} castShadow><cylinderGeometry args={[0.15, 0.15, 0.02, 16]} /><meshStandardMaterial color="#111111" /></mesh>
    </group>
  );
}

function Plant({ position }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.15, 0.4, 8]} /><meshStandardMaterial color="#d35400" /></mesh>
      {/* Leaves */}
      <mesh position={[0, 0.6, 0]} castShadow><sphereGeometry args={[0.35, 7, 7]} /><meshStandardMaterial color="#27ae60" roughness={0.8} /></mesh>
      <mesh position={[0.2, 0.5, 0.1]} castShadow><sphereGeometry args={[0.25, 7, 7]} /><meshStandardMaterial color="#2ecc71" roughness={0.8} /></mesh>
      <mesh position={[-0.1, 0.7, -0.2]} castShadow><sphereGeometry args={[0.25, 7, 7]} /><meshStandardMaterial color="#2ecc71" roughness={0.8} /></mesh>
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
          <mesh userData={{ type: 'vacuum' }} visible={false}>
            <boxGeometry args={[1.5, 2.5, 1.5]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          
          {/* Vacuum Body */}
          <mesh position={[0, 0.4, 0]} castShadow userData={{ type: 'vacuum' }}><cylinderGeometry args={[0.2, 0.2, 0.8, 12]} /><meshStandardMaterial color="#ff9800" metalness={0.6} /></mesh>
          <mesh position={[0, 0.8, 0]} castShadow userData={{ type: 'vacuum' }}><cylinderGeometry args={[0.1, 0.2, 0.3, 12]} /><meshStandardMaterial color="#333333" /></mesh>
          <mesh position={[0, 1.2, 0.1]} rotation={[0.4, 0, 0]} castShadow userData={{ type: 'vacuum' }}><cylinderGeometry args={[0.03, 0.03, 0.6, 8]} /><meshStandardMaterial color="#222222" /></mesh>
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

export default function House() {
  const wallTex = useMemo(() => createWallTexture(), []);
  const roofTex = useMemo(() => createRoofTexture(), []);
  const floorTex = useMemo(() => createWoodFloor(), []);
  
  const extWallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8 });
  const intWallMat = new THREE.MeshStandardMaterial({ color: '#f5f0e6', roughness: 0.9 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 });
  const garageFloorMat = new THREE.MeshStandardMaterial({ color: '#777777', roughness: 0.9 });

  // Note: All positions relative to house center at [0, 0, -8]
  return (
    <group position={[0, 0, -8]}>
      {/* --- FLOORS --- */}
      {/* Main Floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 7]} />
        <primitive object={floorMat} attach="material" />
      </mesh>
      {/* Garage Floor */}
      <mesh position={[-7, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 6]} />
        <primitive object={garageFloorMat} attach="material" />
      </mesh>

      {/* --- EXTERIOR WALLS (Hollow) --- */}
      {/* Front Wall (Living Room) - with door gap */}
      <Wall args={[3.5, 4, 0.2]} position={[-3.25, 2, 3.4]} mat={extWallMat} />
      <Wall args={[4.5, 4, 0.2]} position={[2.75, 2, 3.4]} mat={extWallMat} />
      {/* Above door */}
      <Wall args={[2, 1.6, 0.2]} position={[-0.5, 3.2, 3.4]} mat={extWallMat} />

      {/* Back Wall (Main) */}
      <Wall args={[10, 4, 0.2]} position={[0, 2, -3.4]} mat={extWallMat} />
      {/* Right Wall (Bedroom) */}
      <Wall args={[0.2, 4, 7]} position={[4.9, 2, 0]} mat={extWallMat} />
      
      {/* Left Wall (Living Room/Garage Divider) - Interior wall */}
      <Wall args={[0.2, 4, 7]} position={[-4.9, 2, 0]} mat={intWallMat} />

      {/* Garage Exterior Walls */}
      {/* Back */}
      <Wall args={[4, 3, 0.2]} position={[-7, 1.5, -2.9]} mat={extWallMat} /> 
      {/* Left */}
      <Wall args={[0.2, 3, 6]} position={[-8.9, 1.5, 0]} mat={extWallMat} /> 
      {/* Garage Door (Open) */}
      <Wall args={[0.4, 3, 0.2]} position={[-5.2, 1.5, 2.9]} mat={extWallMat} />
      <Wall args={[0.4, 3, 0.2]} position={[-8.8, 1.5, 2.9]} mat={extWallMat} />
      {/* Above door */}
      <Wall args={[4, 0.6, 0.2]} position={[-7, 2.7, 2.9]} mat={extWallMat} />

      {/* --- INTERIOR WALLS --- */}
      {/* Bedroom Divider */}
      <Wall args={[0.2, 4, 4]} position={[1.5, 2, -1.5]} mat={intWallMat} />
      <Wall args={[3.5, 4, 0.2]} position={[3.25, 2, 0.5]} mat={intWallMat} />

      {/* --- ROOFS --- */}
      {/* Main roof */}
      <mesh position={[0, 4.9, 0]} castShadow>
        <cylinderGeometry args={[0.01, 6, 2.5, 4, 1]} />
        <meshStandardMaterial map={roofTex} roughness={0.7} />
      </mesh>
      <mesh position={[0, 4.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[0.01, 7.2, 2.5, 4, 1]} />
        <meshStandardMaterial map={roofTex} roughness={0.7} />
      </mesh>
      {/* Garage roof */}
      <mesh position={[-7, 3.4, 0]} castShadow>
        <cylinderGeometry args={[0.01, 2.8, 1.8, 4, 1]} />
        <meshStandardMaterial map={roofTex} roughness={0.7} />
      </mesh>

      {/* --- INTERIOR PROPS --- */}
      {/* Living Room */}
      <Sofa position={[-2, 0, 1]} rotation={[0, Math.PI / 2, 0]} />
      <TV position={[1, 0, 1]} rotation={[0, -Math.PI / 2, 0]} />
      <Plant position={[-3, 0, 2.5]} />
      <Plant position={[2, 0, 2.5]} />
      
      {/* Bedroom */}
      <Bed position={[3.5, 0, -1.5]} rotation={[0, -Math.PI / 2, 0]} />
      <Plant position={[4.2, 0, -2.8]} />
      
      {/* Kitchen (Back left corner) */}
      <Fridge position={[-4.2, 0, -2.5]} rotation={[0, Math.PI / 2, 0]} />
      <Stove position={[-3.3, 0, -3.0]} rotation={[0, 0, 0]} />
      <KitchenCounter position={[-1.2, 0, -2.5]} rotation={[0, 0, 0]} />

      {/* Garage */}
      <VacuumProp position={[-7.5, 0, -1.5]} />

      {/* Porch elements */}
      <mesh position={[-0.5, 0.05, 3.9]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.1, 0.8]} />
        <meshStandardMaterial color="#b0a090" roughness={1} />
      </mesh>
    </group>
  );
}

// Trigger HMR
