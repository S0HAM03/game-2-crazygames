import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import * as THREE from 'three';

// ----------------------------------------------------
// A Single Leaf Component
// ----------------------------------------------------
function Leaf({ id, position, onPick }) {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);
  const pickingPower = useGameStore(state => state.pickingPower);
  const leavesInBag = useGameStore(state => state.leavesInBag);
  const bagCapacity = useGameStore(state => state.bagCapacity);

  // Subtle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime + position[2]) * 0.2;
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (leavesInBag >= bagCapacity) return; // Bag full
    onPick(id, pickingPower);
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
      onClick={handleClick}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <planeGeometry args={[0.5, 0.5]} />
      <meshStandardMaterial 
        color={hovered ? "#ffaa00" : "#d35400"} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
}

// ----------------------------------------------------
// The Main Garden Scene
// ----------------------------------------------------
export default function Garden() {
  const sellLeaves = useGameStore(state => state.sellLeaves);
  const addLeaves = useGameStore(state => state.addLeaves);
  const leavesInBag = useGameStore(state => state.leavesInBag);
  const bagCapacity = useGameStore(state => state.bagCapacity);

  const [leaves, setLeaves] = useState([]);
  const MAX_LEAVES = 100;

  // Leaf Spawner
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaves((current) => {
        if (current.length >= MAX_LEAVES) return current;
        // Spawn random position within -5 to 5 bounds
        const x = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        return [...current, { id: Math.random().toString(), position: [x, 0.1, z] }];
      });
    }, 1000); // spawn 1 leaf per second
    return () => clearInterval(interval);
  }, []);

  const handlePick = (leafId, amount) => {
    // We cannot call Zustand actions inside a React setState callback safely.
    // So we calculate the state changes synchronously first.
    if (leaves.length === 0) return;
    
    const spaceLeft = bagCapacity - leavesInBag;
    const toRemoveCount = Math.min(amount, leaves.length, spaceLeft);
    
    if (toRemoveCount <= 0) return;
    
    // Call the external store action
    addLeaves(toRemoveCount);

    // Calculate which leaves to remove
    const clickedLeafIndex = leaves.findIndex(l => l.id === leafId);
    let updated = [...leaves];
    
    if (clickedLeafIndex > -1) {
      updated.splice(clickedLeafIndex, 1);
    }
    
    let extraToRemove = toRemoveCount - 1;
    while (extraToRemove > 0 && updated.length > 0) {
      const randomIndex = Math.floor(Math.random() * updated.length);
      updated.splice(randomIndex, 1);
      extraToRemove--;
    }
    
    // Finally, update the local React state
    setLeaves(updated);
  };

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />

      {/* The Lawn (Ground) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>

      {/* The Compost Bin (Sell Zone) */}
      <mesh 
        position={[0, 0.5, -6]} 
        castShadow 
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          sellLeaves();
        }}
        onPointerOver={(e) => document.body.style.cursor = 'pointer'}
        onPointerOut={(e) => document.body.style.cursor = 'default'}
      >
        <boxGeometry args={[2, 1, 1]} />
        <meshStandardMaterial color="#8b4513" />
        
        {/* Sign above bin */}
        <mesh position={[0, 1, 0]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      </mesh>

      {/* Leaves */}
      {leaves.map((leaf) => (
        <Leaf key={leaf.id} id={leaf.id} position={leaf.position} onPick={handlePick} />
      ))}
    </group>
  );
}
