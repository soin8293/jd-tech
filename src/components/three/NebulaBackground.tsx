import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MicroStars: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  
  const particleCount = 1000; // Reduced for better performance
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Start particles near center and spread them out
      const radius = Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);
  
  const velocities = useMemo(() => {
    const vels = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const speed = 0.005 + Math.random() * 0.01;
      vels[i * 3] = (Math.random() - 0.5) * speed;
      vels[i * 3 + 1] = (Math.random() - 0.5) * speed;
      vels[i * 3 + 2] = (Math.random() - 0.5) * speed;
    }
    return vels;
  }, []);
  
  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const positionAttribute = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;
    
    // Breathing effect with sine wave (5-second cycle)
    const breathingCycle = Math.sin(time * Math.PI * 2 / 5) * 0.5 + 0.5;
    const sizeMultiplier = 1 + breathingCycle * 0.03;
    const opacityMultiplier = 0.3 + breathingCycle * 0.4;
    
    materialRef.current.size = 1.5 * sizeMultiplier;
    materialRef.current.opacity = opacityMultiplier;
    
    // Drift particles
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
      
      if (distance > 20) {
        positions[i * 3] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
    }
    
    positionAttribute.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color="#00ccff"
        size={1.5}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={false}
      />
    </points>
  );
};

const NebulaBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <ambientLight intensity={0.1} />
        <MicroStars />
      </Canvas>
    </div>
  );
};

export default NebulaBackground;