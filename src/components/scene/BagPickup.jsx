import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, GAME_PHASES } from '../../store';
import { playBagPickup } from '../../audio/SoundSystem';

// Pulsing glow ring to draw player's attention
function GlowRing() {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const s = 1 + 0.25 * Math.abs(Math.sin(clock.elapsedTime * 2.5));
    meshRef.current.scale.set(s, s, s);
    meshRef.current.material.opacity = 0.5 + 0.4 * Math.abs(Math.sin(clock.elapsedTime * 2));
  });
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[0.6, 0.85, 36]} />
      <meshBasicMaterial color="#ffe066" transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
}

// Bouncing arrow above the bag
function BounceArrow() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = 1.8 + 0.2 * Math.abs(Math.sin(clock.elapsedTime * 3));
    ref.current.rotation.z = Math.PI;
  });
  return (
    <group ref={ref}>
      <mesh>
        <coneGeometry args={[0.16, 0.35, 8]} />
        <meshBasicMaterial color="#ffe066" />
      </mesh>
    </group>
  );
}

export default function BagPickup() {
  const gamePhase = useGameStore(s => s.gamePhase);

  if (gamePhase !== GAME_PHASES.PICKUP_BAG) return null;

  // Bag placed near the compost bin (Bin is at [-8, 0, 8])
  return (
    <group position={[-5.5, 0, 8]}>
      <GlowRing />
      <BounceArrow />

      {/* Bag mesh — tagged with userData for raycast */}
      <mesh
        position={[0, 0.28, 0]}
        userData={{ type: 'bag' }}
        castShadow
      >
        {/* Main bag body */}
        <boxGeometry args={[0.55, 0.6, 0.35]} />
        <meshStandardMaterial color="#d4ac0d" roughness={0.6} />
      </mesh>
      {/* Bag strap */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <torusGeometry args={[0.2, 0.035, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#9a7d0a" roughness={0.7} />
      </mesh>
      {/* Bag label */}
      <mesh position={[0, 0.28, 0.18]} castShadow>
        <boxGeometry args={[0.28, 0.2, 0.01]} />
        <meshBasicMaterial color="#fffde7" />
      </mesh>
    </group>
  );
}

export function handleBagClick(pickupBag, addNotification) {
  playBagPickup();
  pickupBag();
  addNotification('🎒 Bag equipped! Now clean up the fallen leaves!');
}
