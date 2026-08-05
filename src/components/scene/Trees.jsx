import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// Single tree: trunk + branch layer + foliage cloud
function Tree({ position, scale = 1, foliageColor = '#c0392b' }) {
  const swayRef = useRef();
  const offset = position[0] * 1.3 + position[2] * 0.7;

  useFrame(({ clock }) => {
    if (swayRef.current) {
      swayRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.4 + offset) * 0.04;
    }
  });

  return (
    <group position={position} scale={scale} ref={swayRef}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 3, 8]} />
        <meshStandardMaterial color="#5c3d1e" roughness={1} />
      </mesh>

      {/* Lower trunk roots flare */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.4, 8]} />
        <meshStandardMaterial color="#5c3d1e" roughness={1} />
      </mesh>

      {/* Main foliage sphere */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <sphereGeometry args={[1.9, 10, 10]} />
        <meshStandardMaterial color={foliageColor} roughness={0.9} />
      </mesh>

      {/* Secondary foliage blobs for fullness */}
      <mesh position={[1.1, 3.5, 0.3]} castShadow>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshStandardMaterial color={foliageColor} roughness={0.9} />
      </mesh>
      <mesh position={[-1.0, 3.4, -0.2]} castShadow>
        <sphereGeometry args={[1.15, 8, 8]} />
        <meshStandardMaterial color={foliageColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.3, 3.6, -1.1]} castShadow>
        <sphereGeometry args={[1.1, 8, 8]} />
        <meshStandardMaterial color={foliageColor} roughness={0.9} />
      </mesh>
      <mesh position={[-0.4, 4.9, 0.6]} castShadow>
        <sphereGeometry args={[1.0, 8, 8]} />
        <meshStandardMaterial color={foliageColor} roughness={0.9} />
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
  return (
    <group>
      {TREES.map((t, i) => (
        <Tree key={i} position={t.pos} scale={t.scale} foliageColor={t.color} />
      ))}
    </group>
  );
}
