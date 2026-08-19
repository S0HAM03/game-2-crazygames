import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Ultra-Realistic Bark Texture Generator ──────────────────────────
function createBarkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep base heartwood gradient
  const baseGrad = ctx.createLinearGradient(0, 0, 512, 0);
  baseGrad.addColorStop(0,    '#2b180a');
  baseGrad.addColorStop(0.3,  '#4a2912');
  baseGrad.addColorStop(0.65, '#5c3316');
  baseGrad.addColorStop(1,    '#2d190b');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Coarse vertical bark plates & deep fissures
  for (let i = 0; i < 32; i++) {
    const x = (i / 32) * 512 + (Math.random() - 0.5) * 16;
    const w = 10 + Math.random() * 26;
    const isDark = Math.random() > 0.4;
    ctx.fillStyle = isDark ? 'rgba(15,6,2,0.65)' : 'rgba(140,85,35,0.4)';
    ctx.fillRect(x, 0, w, 512);
  }

  // Fiber striations
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 120; i++) {
    let x = Math.random() * 512;
    ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? '190,115,45' : '10,4,0'},${0.25 + Math.random() * 0.35})`;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y < 512; y += 12) {
      x += (Math.random() - 0.5) * 8;
      ctx.lineTo(Math.max(0, Math.min(512, x)), y);
    }
    ctx.stroke();
  }

  // Organic knots
  for (let i = 0; i < 6; i++) {
    const kx = 30 + Math.random() * 450;
    const ky = 40 + Math.random() * 430;
    const kr = 6 + Math.random() * 14;
    ctx.strokeStyle = 'rgba(10,4,0,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr, kr * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(25,10,2,0.5)';
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  return tex;
}

// ── Realistic Autumn Leaf Cluster Texture ────────────────────────
function createFoliageTexture(hexColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Gradient base
  const baseGrad = ctx.createRadialGradient(256, 256, 30, 256, 256, 250);
  baseGrad.addColorStop(0, `rgb(${Math.min(r+50,255)},${Math.min(g+40,255)},${Math.min(b+20,255)})`);
  baseGrad.addColorStop(0.65, hexColor);
  baseGrad.addColorStop(1, `rgb(${Math.max(r-60,0)},${Math.max(g-50,0)},${Math.max(b-40,0)})`);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Hundreds of distinct individual leaf shapes
  for (let i = 0; i < 450; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const rx = 8 + Math.random() * 20;
    const ry = rx * (0.4 + Math.random() * 0.5);
    const angle = Math.random() * Math.PI;
    const bright = Math.random();

    let c;
    if (bright < 0.35) c = `rgb(${Math.min(r+65,255)},${Math.min(g+55,255)},${Math.min(b+15,255)})`;
    else if (bright < 0.70) c = `rgb(${Math.max(r-50,0)},${Math.max(g-45,0)},${Math.max(b-35,0)})`;
    else c = hexColor;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.65 + Math.random() * 0.35;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

// ── Realistic 3D Tree Model Component ─────────────────────────────
function RealisticTree({ position, scale = 1, foliageColor = '#c0392b', barkTex, foliageTexCache }) {
  const swayRef = useRef();
  const offset = position[0] * 1.4 + position[2] * 0.8;

  useFrame(({ clock }) => {
    if (swayRef.current) {
      const t = clock.elapsedTime;
      swayRef.current.rotation.z = Math.sin(t * 0.35 + offset) * 0.025;
      swayRef.current.rotation.x = Math.sin(t * 0.25 + offset * 0.5) * 0.012;
    }
  });

  const foliageTex = useMemo(() => {
    if (!foliageTexCache.current[foliageColor]) {
      foliageTexCache.current[foliageColor] = createFoliageTexture(foliageColor);
    }
    return foliageTexCache.current[foliageColor];
  }, [foliageColor, foliageTexCache]);

  const trunkMat  = useMemo(() => new THREE.MeshStandardMaterial({
    map: barkTex, roughness: 0.95, bumpMap: barkTex, bumpScale: 0.06
  }), [barkTex]);

  const foliageMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: foliageTex, roughness: 0.85, side: THREE.DoubleSide
  }), [foliageTex]);

  return (
    <group position={position} scale={scale} ref={swayRef}>
      {/* Root buttresses */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh key={i} position={[Math.sin(rad) * 0.32, 0.15, Math.cos(rad) * 0.32]}
            rotation={[0, -rad, 0.42]} castShadow material={trunkMat}>
            <boxGeometry args={[0.15, 0.35, 0.45]} />
          </mesh>
        );
      })}

      {/* Tapered main trunk */}
      <mesh position={[0, 1.8, 0]} castShadow material={trunkMat}>
        <cylinderGeometry args={[0.22, 0.45, 3.6, 12, 4]} />
      </mesh>

      {/* Primary branch forks */}
      <mesh position={[-0.45, 3.1, 0.15]} rotation={[0.15, 0.25, -0.42]} castShadow material={trunkMat}>
        <cylinderGeometry args={[0.1, 0.18, 2.0, 10]} />
      </mesh>

      <mesh position={[0.45, 3.1, -0.15]} rotation={[-0.12, -0.2, 0.40]} castShadow material={trunkMat}>
        <cylinderGeometry args={[0.09, 0.17, 1.9, 10]} />
      </mesh>

      <mesh position={[0.15, 3.4, -0.42]} rotation={[-0.40, 0.0, 0.12]} castShadow material={trunkMat}>
        <cylinderGeometry args={[0.08, 0.14, 1.7, 9]} />
      </mesh>

      {/* Detailed Layered Leaf Canopy Clouds */}
      <mesh position={[0, 4.8, 0]} castShadow material={foliageMat}>
        <sphereGeometry args={[2.2, 14, 12]} />
      </mesh>

      {/* Asymmetric secondary canopy clusters */}
      <mesh position={[1.4, 4.2, 0.5]} castShadow material={foliageMat}>
        <sphereGeometry args={[1.5, 12, 10]} />
      </mesh>
      <mesh position={[-1.3, 4.3, -0.4]} castShadow material={foliageMat}>
        <sphereGeometry args={[1.4, 12, 10]} />
      </mesh>
      <mesh position={[0.4, 4.1, -1.5]} castShadow material={foliageMat}>
        <sphereGeometry args={[1.3, 12, 10]} />
      </mesh>
      <mesh position={[-0.5, 5.7, 0.4]} castShadow material={foliageMat}>
        <sphereGeometry args={[1.2, 11, 9]} />
      </mesh>
      <mesh position={[0.6, 3.6, 1.2]} castShadow material={foliageMat}>
        <sphereGeometry args={[0.9, 10, 8]} />
      </mesh>
      <mesh position={[-0.9, 3.5, -1.0]} castShadow material={foliageMat}>
        <sphereGeometry args={[0.85, 10, 8]} />
      </mesh>

      {/* Lower drooping leaf clusters */}
      <mesh position={[0, 3.0, 0]} castShadow material={foliageMat}>
        <sphereGeometry args={[1.1, 10, 8]} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────
   TREES POSITIONS:
   Garage road (x: -11 to -6, z: -4 to 14) is completely
   cleared of all trees as requested!
   ───────────────────────────────────────────── */
const REAL_TREES = [
  // Outer Left Fence Border (Outside garage left wall x = -10.1)
  { pos: [-14.8, 0,  2.0], scale: 1.15, color: '#d35400' },
  { pos: [-14.8, 0,  8.0], scale: 1.10, color: '#c0392b' },
  
  // Far Back Yard (Strictly behind house back wall z = -12.1)
  { pos: [-7.5,  0, -14.5], scale: 1.25, color: '#e67e22' },
  { pos: [-1.5,  0, -14.5], scale: 1.30, color: '#f39c12' },
  { pos: [ 4.5,  0, -14.5], scale: 1.20, color: '#ca6f1e' },

  // Outer Right Side Yard (Outside house right wall x = 6.1)
  { pos: [13.5,  0, -5.0], scale: 1.20, color: '#ca6f1e' },
  { pos: [13.5,  0,  1.5], scale: 1.10, color: '#f5b041' },
  { pos: [13.5,  0,  7.5], scale: 1.35, color: '#a93226' },

  // Right Front Lawn
  { pos: [ 8.5,  0,  9.5], scale: 1.05, color: '#dc7633' },
  { pos: [11.5,  0,  11.0], scale: 0.95, color: '#e59866' },
];

export default function Trees() {
  const barkTex = useMemo(() => createBarkTexture(), []);
  const foliageTexCache = useRef({});

  return (
    <group>
      {REAL_TREES.map((t, i) => (
        <RealisticTree
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
