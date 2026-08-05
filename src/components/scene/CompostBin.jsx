import { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useGameStore, GAME_PHASES } from '../../store';
import { playBinDeposit } from '../../audio/SoundSystem';
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
    playBinDeposit(leavesInBag);
    addNotification(`+${leavesInBag} 🪙 Leaves sold!`);
    sellLeaves();
  };

  return (
    <group
      position={[9, 0, 8]}
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
