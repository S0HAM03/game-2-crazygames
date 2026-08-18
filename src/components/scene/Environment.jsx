import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { playFlowerBell } from '../../audio/SoundSystem';

// Procedural Wood Texture
function createWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#7a5c30';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = '#5d421d';
  ctx.lineWidth = 2;
  for (let i = 0; i < 128; i += 12) {
    ctx.beginPath();
    ctx.moveTo(0, i + Math.random() * 4);
    ctx.quadraticCurveTo(64, i + Math.random() * 8, 128, i + Math.random() * 4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Procedural Bark Texture
function createBarkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5c3d1e';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#3e2712';
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    ctx.fillRect(x, y, 4 + Math.random() * 8, 12 + Math.random() * 20);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Single Interactive Flower (1 of 8 in Piano Bed)
function InteractiveFlower({ index, position, color }) {
  const meshRef = useRef();
  const [scaleY, setScaleY] = useState(1);

  const handleClick = (e) => {
    e.stopPropagation();
    playFlowerBell(index);
    setScaleY(0.65);
    setTimeout(() => setScaleY(1), 180);
  };

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, scaleY, delta * 18);
    }
  });

  return (
    <group position={position}>
      {/* Stem */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 6]} />
        <meshStandardMaterial color="#2ecc40" roughness={0.8} />
      </mesh>
      {/* Lollipop Flower Head */}
      <mesh
        ref={meshRef}
        position={[0, 0.52, 0]}
        castShadow
        userData={{ type: 'flower', noteIndex: index }}
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  );
}

// 8-Flower Piano Bed (Matching user screenshot)
function PianoFlowerBed({ position, rotation }) {
  // 8 distinct vibrant colors matching the user screenshot!
  const FLOWER_COLORS = [
    '#e91e63', // 1: Red/Pink (C5)
    '#ff5722', // 2: Deep Orange (D5)
    '#ffeb3b', // 3: Bright Yellow (E5)
    '#9c27b0', // 4: Purple (F5)
    '#ff9800', // 5: Light Orange (G5)
    '#e91e63', // 6: Crimson (A5)
    '#ff5722', // 7: Red-Orange (B5)
    '#ffeb3b'  // 8: Golden Yellow (C6)
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* Soil Box (Matching wooden planter in screenshot) */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.16, 0.7]} />
        <meshStandardMaterial color="#4a2e16" roughness={0.9} />
      </mesh>

      {/* 8 Lollipop Flowers aligned in a row */}
      {FLOWER_COLORS.map((color, i) => {
        const x = -1.05 + i * 0.3;
        return (
          <InteractiveFlower
            key={i}
            index={i}
            position={[x, 0.12, 0]}
            color={color}
          />
        );
      })}
    </group>
  );
}

function Bench({ position, rotation = [0, 0, 0] }) {
  const woodTex = useMemo(() => createWoodTexture(), []);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.08, 0.5]} />
        <meshStandardMaterial map={woodTex} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.9, -0.22]} castShadow>
        <boxGeometry args={[1.6, 0.5, 0.07]} />
        <meshStandardMaterial map={woodTex} roughness={0.8} />
      </mesh>
      {[-0.65, 0.65].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.28, 0.18]} castShadow>
            <boxGeometry args={[0.08, 0.55, 0.08]} />
            <meshStandardMaterial color="#3a2817" roughness={0.9} />
          </mesh>
          <mesh position={[x, 0.28, -0.18]} castShadow>
            <boxGeometry args={[0.08, 0.55, 0.08]} />
            <meshStandardMaterial color="#3a2817" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Fountain({ position }) {
  return (
    <group position={position}>
      {/* Outer Basin */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.6, 0.3, 24]} />
        <meshStandardMaterial color="#b0a090" roughness={0.9} />
      </mesh>
      {/* Water inside basin */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[1.4, 1.4, 0.05, 24]} />
        <meshStandardMaterial color="#4fc3f7" transparent opacity={0.8} roughness={0.1} />
      </mesh>
      {/* Central Pillar */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, 1.3, 12]} />
        <meshStandardMaterial color="#a09080" roughness={0.85} />
      </mesh>
      {/* Top Bowl */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#a09080" roughness={0.85} />
      </mesh>
      {/* Water inside top bowl */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.65, 0.65, 0.05, 16]} />
        <meshStandardMaterial color="#4fc3f7" transparent opacity={0.8} roughness={0.1} />
      </mesh>
      {/* Water Spout / Spray */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.04, 0.1, 0.4, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0.1} />
      </mesh>
      
      {/* Water Spray Particles */}
      <Sparkles
        count={60}
        scale={[1.2, 1.0, 1.2]}
        position={[0, 1.7, 0]}
        size={2}
        speed={0.4}
        color="#81d4fa"
        opacity={0.8}
      />
    </group>
  );
}

// Neighborhood Houses around perimeter (Highly Detailed)
function DummyNeighborhood() {
  const dummyHouses = [
    // Left neighbor house
    { pos: [-24, 0, -2], rotY: Math.PI / 2, wallColor: '#d6c8b4', roofColor: '#8c3a2b' },
    // Right neighbor house
    { pos: [24, 0, -3], rotY: -Math.PI / 2, wallColor: '#e3d7c5', roofColor: '#4a5b6e' },
    // Back street left house
    { pos: [-16, 0, -22], rotY: 0, wallColor: '#c5b8a5', roofColor: '#6e4a3a' },
    // Back street right house
    { pos: [16, 0, -22], rotY: 0, wallColor: '#d8caa7', roofColor: '#5a3a2a' },
  ];

  return (
    <group>
      {dummyHouses.map((h, i) => (
        <group key={i} position={h.pos} rotation={[0, h.rotY, 0]}>
          {/* Main House Body */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <boxGeometry args={[9, 5, 7]} />
            <meshStandardMaterial color={h.wallColor} roughness={0.9} />
          </mesh>

          {/* Roof (Gabled/Pyramid Structure) */}
          <mesh position={[0, 5.8, 0]} castShadow>
            <cylinderGeometry args={[0.01, 5.5, 2.2, 4, 1]} />
            <meshStandardMaterial color={h.roofColor} roughness={0.8} />
          </mesh>

          {/* Garage Extension */}
          <mesh position={[-5.3, 1.6, 0.5]} castShadow>
            <boxGeometry args={[3.2, 3.2, 5.0]} />
            <meshStandardMaterial color={h.wallColor} roughness={0.9} />
          </mesh>
          {/* Garage Sloped Roof */}
          <mesh position={[-5.3, 3.3, 0.5]} rotation={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[3.4, 0.15, 5.2]} />
            <meshStandardMaterial color={h.roofColor} roughness={0.8} />
          </mesh>
          {/* Garage Door (Closed Panel style) */}
          <mesh position={[-5.3, 1.2, 3.01]} castShadow>
            <boxGeometry args={[2.4, 2.4, 0.05]} />
            <meshStandardMaterial color="#556677" roughness={0.7} />
          </mesh>

          {/* Chimney Stack */}
          <mesh position={[2.6, 5.4, -1.6]} castShadow>
            <boxGeometry args={[0.8, 2.2, 0.8]} />
            <meshStandardMaterial color="#8d5c4b" roughness={0.95} />
          </mesh>
          {/* Chimney Cap */}
          <mesh position={[2.6, 6.55, -1.6]} castShadow>
            <boxGeometry args={[0.92, 0.1, 0.92]} />
            <meshStandardMaterial color="#333333" />
          </mesh>

          {/* Front Entry Door */}
          <mesh position={[1.2, 1.1, 3.51]} castShadow>
            <boxGeometry args={[1.1, 2.2, 0.05]} />
            <meshStandardMaterial color="#5d4037" roughness={0.8} />
          </mesh>
          {/* Porch Roof awning */}
          <mesh position={[1.2, 2.4, 3.9]} rotation={[0.2, 0, 0]} castShadow>
            <boxGeometry args={[1.6, 0.08, 0.8]} />
            <meshStandardMaterial color={h.roofColor} />
          </mesh>

          {/* Windows with Cozy Glowing Lights inside! */}
          {/* Front Windows */}
          {[-2.2, 2.8].map((x, idx) => (
            <group key={idx}>
              {/* Window Frame */}
              <mesh position={[x, 2.8, 3.52]} castShadow>
                <boxGeometry args={[1.3, 1.4, 0.06]} />
                <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
              </mesh>
              {/* Glowing Warm Window Pane */}
              <mesh position={[x, 2.8, 3.54]}>
                <boxGeometry args={[1.18, 1.28, 0.04]} />
                <meshStandardMaterial color="#ffe082" emissive="#ff9800" emissiveIntensity={0.65} roughness={0.1} />
              </mesh>
            </group>
          ))}

          {/* Side Windows */}
          <group position={[4.52, 2.8, 0.0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh castShadow>
              <boxGeometry args={[1.3, 1.4, 0.06]} />
              <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[1.18, 1.28, 0.04]} />
              <meshStandardMaterial color="#ffe082" emissive="#ff9800" emissiveIntensity={0.65} roughness={0.1} />
            </mesh>
          </group>

          {/* Neighbor Yard Shrubbery Decorations */}
          <mesh position={[3.2, 0.5, 4.4]} castShadow>
            <sphereGeometry args={[0.55, 8, 8]} />
            <meshStandardMaterial color="#2e7d32" roughness={0.85} />
          </mesh>
          <mesh position={[4.0, 0.4, 4.4]} castShadow>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshStandardMaterial color="#388e3c" roughness={0.85} />
          </mesh>
          <mesh position={[-1.8, 0.45, 4.4]} castShadow>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshStandardMaterial color="#2e7d32" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Cloud({ position, scale = 1 }) {
  const ref = useRef();
  const speed = useMemo(() => 0.015 + Math.random() * 0.015, []);
  
  useFrame(() => {
    if (ref.current) {
      ref.current.position.x += speed;
      if (ref.current.position.x > 60) ref.current.position.x = -60;
    }
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[2.2, 7, 7]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[1.4, -0.4, 0.3]} castShadow>
        <sphereGeometry args={[1.5, 6, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-1.4, -0.5, -0.2]} castShadow>
        <sphereGeometry args={[1.6, 6, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function SkyClouds() {
  return (
    <group>
      <Cloud position={[-35, 18, -12]} scale={1.8} />
      <Cloud position={[-10, 19, -25]} scale={1.5} />
      <Cloud position={[15, 21, -18]} scale={2.1} />
      <Cloud position={[40, 17, -10]} scale={1.6} />
      <Cloud position={[-20, 20, 12]} scale={1.4} />
      <Cloud position={[5, 18, 15]} scale={1.7} />
      <Cloud position={[30, 22, 8]} scale={2.0} />
    </group>
  );
}

function Road() {
  return (
    <group position={[0, 0, 17.5]}>
      {/* Main road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[120, 6]} />
        <meshStandardMaterial color="#2d3748" roughness={0.85} />
      </mesh>
      
      {/* Dashed Center Yellow Line */}
      {Array.from({ length: 25 }).map((_, i) => (
        <mesh key={i} position={[-60 + i * 5, 0.012, 0]} receiveShadow>
          <boxGeometry args={[1.5, 0.002, 0.12]} />
          <meshStandardMaterial color="#f6e05e" roughness={0.9} />
        </mesh>
      ))}
      
      {/* Road Curb (Concrete divider along the yard boundary at Z = 14.5) */}
      <mesh position={[0, 0.08, -3.1]} castShadow receiveShadow>
        <boxGeometry args={[120, 0.16, 0.2]} />
        <meshStandardMaterial color="#a0aec0" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Gate() {
  return (
    <group position={[0, 0, 14.5]}>
      {/* Left Gate Post */}
      <mesh position={[-1.7, 0.75, 0]} castShadow>
        <boxGeometry args={[0.18, 1.5, 0.18]} />
        <meshStandardMaterial color="#6d4c41" roughness={0.9} />
      </mesh>
      {/* Right Gate Post */}
      <mesh position={[1.7, 0.75, 0]} castShadow>
        <boxGeometry args={[0.18, 1.5, 0.18]} />
        <meshStandardMaterial color="#6d4c41" roughness={0.9} />
      </mesh>

      {/* Left Gate Wing (Open angled) */}
      <group position={[-1.7, 0, 0]} rotation={[0, Math.PI / 3, 0]}>
        {/* Horizontal frame */}
        <mesh position={[0.75, 0.9, 0.05]} castShadow>
          <boxGeometry args={[1.5, 0.08, 0.05]} />
          <meshStandardMaterial color="#a0704a" roughness={0.9} />
        </mesh>
        <mesh position={[0.75, 0.4, 0.05]} castShadow>
          <boxGeometry args={[1.5, 0.08, 0.05]} />
          <meshStandardMaterial color="#a0704a" roughness={0.9} />
        </mesh>
        {/* Diagonal brace */}
        <mesh position={[0.75, 0.65, 0.06]} rotation={[0, 0, 0.5]} castShadow>
          <boxGeometry args={[1.6, 0.06, 0.03]} />
          <meshStandardMaterial color="#a0704a" roughness={0.9} />
        </mesh>
        {/* Vertical pickets */}
        {Array.from({ length: 4 }).map((_, j) => (
          <mesh key={j} position={[0.2 + j * 0.38, 0.65, 0.08]} castShadow>
            <boxGeometry args={[0.08, 1.1, 0.03]} />
            <meshStandardMaterial color="#bcaaa4" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Right Gate Wing (Open angled) */}
      <group position={[1.7, 0, 0]} rotation={[0, -Math.PI / 3, 0]}>
        {/* Horizontal frame */}
        <mesh position={[-0.75, 0.9, 0.05]} castShadow>
          <boxGeometry args={[1.5, 0.08, 0.05]} />
          <meshStandardMaterial color="#a0704a" roughness={0.9} />
        </mesh>
        <mesh position={[-0.75, 0.4, 0.05]} castShadow>
          <boxGeometry args={[1.5, 0.08, 0.05]} />
          <meshStandardMaterial color="#a0704a" roughness={0.9} />
        </mesh>
        {/* Diagonal brace */}
        <mesh position={[-0.75, 0.65, 0.06]} rotation={[0, 0, -0.5]} castShadow>
          <boxGeometry args={[1.6, 0.06, 0.03]} />
          <meshStandardMaterial color="#a0704a" roughness={0.9} />
        </mesh>
        {/* Vertical pickets */}
        {Array.from({ length: 4 }).map((_, j) => (
          <mesh key={j} position={[-0.2 - j * 0.38, 0.65, 0.08]} castShadow>
            <boxGeometry args={[0.08, 1.1, 0.03]} />
            <meshStandardMaterial color="#bcaaa4" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function StreetLamp({ position }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 3.6, 8]} />
        <meshStandardMaterial color="#37474f" metalness={0.7} />
      </mesh>
      {/* Lamp Head */}
      <mesh position={[0, 3.7, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.1, 0.3, 8]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
      {/* Bulb (Emissive) */}
      <mesh position={[0, 3.5, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ffe082" emissive="#ffb300" emissiveIntensity={2.5} />
      </mesh>
      {/* Light Source */}
      <pointLight position={[0, 3.4, 0]} intensity={1.5} distance={12} color="#ffb300" castShadow />
    </group>
  );
}

function Fence() {
  const spacing = 2.2;
  const posts = [
    // Front fence left segment (i = 0 to 6)
    ...Array.from({ length: 6 }, (_, i) => ({ pos: [-15.5 + i * spacing, 0, 14.5], rotY: 0, hasRail: true })),
    // Front fence right segment (i = 8 to 14)
    ...Array.from({ length: 7 }, (_, i) => ({ pos: [2.1 + i * spacing, 0, 14.5], rotY: 0, hasRail: i < 6 })),
    
    // Left fence
    ...Array.from({ length: 14 }, (_, i) => ({ pos: [-15.5, 0, -5 + i * spacing], rotY: Math.PI / 2, hasRail: i < 13 })),
    // Right fence
    ...Array.from({ length: 14 }, (_, i) => ({ pos: [15.5, 0, -5 + i * spacing], rotY: Math.PI / 2, hasRail: i < 13 })),
  ];

  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} position={[p.pos[0], p.pos[1], p.pos[2]]} rotation={[0, p.rotY, 0]}>
          <mesh position={[0, 0.65, 0]} castShadow>
            <boxGeometry args={[0.12, 1.3, 0.12]} />
            <meshStandardMaterial color="#8b5e3c" roughness={0.9} />
          </mesh>
          {p.hasRail && (
            <>
              <mesh position={[spacing / 2, 0.85, 0]} castShadow>
                <boxGeometry args={[spacing, 0.07, 0.06]} />
                <meshStandardMaterial color="#a0704a" roughness={0.9} />
              </mesh>
              <mesh position={[spacing / 2, 0.5, 0]} castShadow>
                <boxGeometry args={[spacing, 0.07, 0.06]} />
                <meshStandardMaterial color="#a0704a" roughness={0.9} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}



export default function Environment() {
  return (
    <>
      {/* Volumetric Haze / Autumn Sunset Fog */}
      <fog attach="fog" args={["#ffd1a4", 10, 45]} />

      <Sky
        distance={450000}
        sunPosition={[-60, 15, -45]}
        inclination={0.52}
        azimuth={0.2}
        mieCoefficient={0.005}
        mieDirectionalG={0.88}
      />

      {/* Cozy twilight ambient light */}
      <ambientLight intensity={0.55} color="#b0bec5" />

      {/* Cinematic Sunset Sun casting warm orange-gold shadows */}
      <directionalLight
        position={[-30, 18, -25]}
        intensity={2.2}
        color="#ff9b5c"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />

      {/* Cyan Fill Light from the cool sky dome */}
      <directionalLight position={[20, 10, 20]} intensity={0.4} color="#80deea" />

      {/* Main lawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 24, 32, 32]} />
        <meshStandardMaterial color="#548a36" roughness={0.95} />
      </mesh>

      {/* Outer neighborhood grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[120, 100]} />
        <meshStandardMaterial color="#42732a" roughness={1} />
      </mesh>


      <Fence />
      <Gate />
      <Road />
      <SkyClouds />
      <StreetLamp position={[-2.4, 0, 14.1]} />
      <StreetLamp position={[2.4, 0, 14.1]} />
      <DummyNeighborhood />

      {/* Decorations */}
      <Bench position={[-6.5, 0, 5]} rotation={[0, 0.3, 0]} />
      <Bench position={[6.5, 0, 6]} rotation={[0, Math.PI + 0.2, 0]} />
      <Fountain position={[4.5, 0, 3]} />

      {/* 8-Flower Piano Bed (Matching user screenshot) */}
      <PianoFlowerBed position={[-10.5, 0, 12.5]} rotation={[0, 0.1, 0]} />
      <PianoFlowerBed position={[9, 0, 12.5]} rotation={[0, -0.1, 0]} />

      {/* Gentle wind particles */}
      <Sparkles
        count={90}
        scale={[30, 6, 24]}
        position={[0, 2.5, 4]}
        size={3}
        speed={0.2}
        color="#e67e22"
        opacity={0.5}
      />
    </>
  );
}
