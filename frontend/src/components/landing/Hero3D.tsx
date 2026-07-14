"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, Environment, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.25;
    }
  });

  const color = useMemo(() => new THREE.Color("#A8C5DA"), []);
  const emissive = useMemo(() => new THREE.Color("#C4B5D4"), []);

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} scale={2.5}>
        <icosahedronGeometry args={[1, 20]} />
        <MeshDistortMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.15}
          distort={0.25}
          speed={1.2}
          roughness={0.15}
          metalness={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-60">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} color="#A8C5DA" />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} color="#C4B5D4" />
        <AnimatedSphere />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
