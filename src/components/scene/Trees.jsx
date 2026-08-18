import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Bark Texture Generator ────────────────────────────────────────
function createBarkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Base bark brown
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(0, 0, 128, 256);
  
  // Vertical rough bark stripes
  ctx.fillStyle = '#422814';
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * 128;
    const w = 5 + Math.random() * 10;
    ctx.fillRect(x, 0, w, 256);
  }
  
  // Bark crack line strokes
  ctx.strokeStyle = '#28170b';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    let x = Math.random() * 128;
    ctx.moveTo(x, 0);
    for (let y = 0; y < 256; y += 12) {
      x += (Math.random() - 0.5) * 5;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2.5);
  return tex;
}

// ── Foliage Texture Generator (Leaf Cluster details) ──────────────
function createFoliageTexture(hexColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Base color
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, 256, 256);
  
  // Paint leaf cluster elements
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const radius = 4 + Math.random() * 9;
    const mode = Math.random();
    
    if (mode < 0.38) {
      // Leaf highlight
      ctx.fillStyle = `rgb(${Math.min(r + 35, 255)}, ${Math.min(g + 35, 255)}, ${Math.min(b + 10, 255)})`;
    } else if (mode < 0.72) {
      // Leaf shadow
      ctx.fillStyle = `rgb(${Math.max(r - 45, 0)}, ${Math.max(g - 40, 0)}, ${Math.max(b - 35, 0)})`;
    } else {
      // Accent
      ctx.fillStyle = `rgb(${Math.min(r + 15, 255)}, ${Math.min(g + 20, 255)}, ${b})`;
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 2.5);
  return tex;
}

// Single tree: trunk + branch layer + foliage cloud
function Tree({ position, scale = 1, foliageColor = '#c0392b', barkTex, foliageTexCache }) {
  const swayRef = useRef();
  const offset = position[0] * 1.3 + position[2] * 0.7;

  useFrame(({ clock }) => {
    if (swayRef.current) {
      swayRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.4 + offset) * 0.04;
    }
  });

  const foliageTex = useMemo(() => {
    if (!foliageTexCache.current[foliageColor]) {
      foliageTexCache.current[foliageColor] = createFoliageTexture(foliageColor);
    }
    return foliageTexCache.current[foliageColor];
  }, [foliageColor, foliageTexCache]);

  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ map: barkTex, roughness: 1.0 }), [barkTex]);
  const foliageMat = useMemo(() => new THREE.MeshStandardMaterial({ map: foliageTex, roughness: 0.9 }), [foliageTex]);

  return (
    <group position={position} scale={scale} ref={swayRef}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow material={trunkMat}>
        <cylinderGeometry args={[0.25, 0.35, 3, 8]} />
      </mesh>

      {/* Lower trunk roots flare */}
      <mesh position={[0, 0.2, 0]} castShadow material={trunkMat}>
        <cylinderGeometry args={[0.5, 0.5, 0.4, 8]} />
      </mesh>

      {/* Main foliage sphere */}
      <mesh position={[0, 4.2, 0]} castShadow material={foliageMat}>
        <sphereGeometry args={[1.9, 10, 10]} />
      </mesh>

      {/* Secondary foliage blobs for fullness */}
      <mesh position={[1.1, 3.5, 0.3]} castShadow material={foliageMat}>
        <sphereGeometry args={[1.2, 8, 8]} />
      </mesh>
      <mesh position={[-1.0, 3.4, -0.2]} castShadow material={foliageMat}>
        <sphereGeometry args={[1.15, 8, 8]} />
      </mesh>
      <mesh position={[0.3, 3.6, -1.1]} castShadow material={foliageMat}>
        <sphereGeometry args={[1.1, 8, 8]} />
      </mesh>
      <mesh position={[-0.4, 4.9, 0.6]} castShadow material={foliageMat}>
        <sphereGeometry args={[1.0, 8, 8]} />
      </mesh>
    </group>
  );
}

const TREES = [
  { pos: [-11, 0, -6], scale: 1.3, color: '#c0392b' },
  { pos: [12, 0, -7],  scale: 1.2, color: '#e67e22' },
  { pos: [-12, 0, 5],  scale: 1.1, color: '#d35400' },
  { pos: [11, 0, 7],   scale: 1.4, color: '#c0392b' },
  { pos: [-7, 0, 9],   scale: 0.9, color: '#e74c3c' },
  { pos: [7, 0, 10],   scale: 1.0, color: '#e67e22' },
];

export default function Trees() {
  const barkTex = useMemo(() => createBarkTexture(), []);
  const foliageTexCache = useRef({});

  return (
    <group>
      {TREES.map((t, i) => (
        <Tree 
          key={i} 
          position={t.pos} 
          scale={t.scale} 
          foliageColor={t.color} 
          barkTex={barkTex} 
          foliageTexCache={foliageTexCache} 
        />
      ))}
    </group>
  );
}
