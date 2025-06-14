import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MicroStars: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  
  const particleCount = 2000;
  
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Start particles near center and spread them out
      const radius = Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Outward drift velocity
      const speed = 0.01 + Math.random() * 0.02;
      velocities[i * 3] = positions[i * 3] * speed * 0.1;
      velocities[i * 3 + 1] = positions[i * 3 + 1] * speed * 0.1;
      velocities[i * 3 + 2] = positions[i * 3 + 2] * speed * 0.1;
    }
    
    return { positions, velocities };
  }, []);
  
  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Breathing effect with sine wave (5-second cycle)
    const breathingCycle = Math.sin(time * Math.PI * 2 / 5) * 0.5 + 0.5;
    const sizeMultiplier = 1 + breathingCycle * 0.03; // 3% size variation
    const opacityMultiplier = 0.3 + breathingCycle * 0.4; // Brightness variation
    
    materialRef.current.size = 2 * sizeMultiplier;
    materialRef.current.opacity = opacityMultiplier;
    
    // Drift particles outward
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocities[i * 3];
      positions[i * 3 + 1] += velocities[i * 3 + 1];
      positions[i * 3 + 2] += velocities[i * 3 + 2];
      
      // Reset particles that drift too far
      const distance = Math.sqrt(
        positions[i * 3] ** 2 + 
        positions[i * 3 + 1] ** 2 + 
        positions[i * 3 + 2] ** 2
      );
      
      if (distance > 25) {
        // Reset to center with slight randomness
        const resetRadius = Math.random() * 2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i * 3] = resetRadius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = resetRadius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = resetRadius * Math.cos(phi);
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#00ffff"
        size={2}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={false}
      />
    </points>
  );
};

const NebulaScene: React.FC = () => {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />
      
      {/* Micro stars */}
      <MicroStars />
      
      {/* Background nebula gradient sphere */}
      <mesh>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial
          color="#1a237e"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
};

const NebulaBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        style={{ background: 'linear-gradient(135deg, #0a0e27 0%, #1a237e 50%, #283593 100%)' }}
      >
        <NebulaScene />
      </Canvas>
    </div>
  );
};

export default NebulaBackground;