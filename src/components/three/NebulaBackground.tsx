import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MicroStars: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (!groupRef.current) return;
    
    const particleCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    // Create particles in spherical distribution
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 10 + 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0x00ccff,
      size: 2,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const points = new THREE.Points(geometry, material);
    groupRef.current.add(points);
    
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, []);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Breathing effect
    const breathingCycle = Math.sin(time * Math.PI * 2 / 5) * 0.5 + 0.5;
    const scale = 1 + breathingCycle * 0.03;
    
    groupRef.current.scale.setScalar(scale);
    groupRef.current.rotation.y = time * 0.1;
  });
  
  return <group ref={groupRef} />;
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