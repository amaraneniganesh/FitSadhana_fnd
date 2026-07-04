import React, { Suspense, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { useLoader } from '@react-three/fiber';

const BMI_BANDS = [
  { max: 18.5, label: 'Underweight',   color: '#93c5fd', bg: '#1e3a5f' },
  { max: 25.0, label: 'Normal Weight', color: '#34d399', bg: '#064e3b' },
  { max: 30.0, label: 'Overweight',    color: '#fb923c', bg: '#431407' },
  { max: 999,  label: 'Obese',         color: '#ef4444', bg: '#450a0a' },
];

function Model({ url, bmi, gender, goal }) {
  const obj = useLoader(OBJLoader, url);
  
  // Clone the object so we can mutate it safely
  const clonedObj = useMemo(() => obj.clone(), [obj]);

  const meshRef = useRef();

  useMemo(() => {
    // Determine scales based on BMI
    // Mean male is around BMI 24
    let scaleX = 1.0;
    let scaleZ = 1.0;
    let scaleY = 1.0;

    const baseBmi = gender === 'Female' ? 22 : 24;
    const diff = bmi - baseBmi;

    if (diff > 0) {
      // Gain weight (wider)
      // Scale X and Z up. Z (depth) goes up faster for belly.
      scaleX = 1.0 + diff * 0.035;
      scaleZ = 1.0 + diff * 0.05;
      scaleY = 1.0 - diff * 0.005; // Slightly compress vertically to exaggerate width
    } else if (diff < 0) {
      // Lose weight (thinner)
      scaleX = 1.0 + diff * 0.025; // diff is negative
      scaleZ = 1.0 + diff * 0.03;
    }

    if (goal === 'Muscle Gain' || goal === 'Aesthetic Body') {
      scaleX += 0.05;
      scaleZ -= 0.02; // More V-taper / less belly
    }

    // Apply material and scale
    clonedObj.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#81c0f0', // The blue tone from the example
          roughness: 0.4,
          metalness: 0.1,
        });
        child.scale.set(scaleX, scaleY, scaleZ);
      }
    });
  }, [clonedObj, bmi, gender, goal]);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle idle rotation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      <primitive object={clonedObj} />
    </group>
  );
}

const BodyVisualizer = ({ height = 170, weight = 70, goal = 'Fit Body', gender = 'Male' }) => {
  const hm  = height / 100;
  const bmi = weight / (hm * hm);
  const band = BMI_BANDS.find(b => bmi < b.max) || BMI_BANDS[BMI_BANDS.length - 1];

  const modelUrl = gender === 'Female' ? '/models/mean_female.obj' : '/models/mean_male.obj';

  const idealMin = (18.5 * hm * hm).toFixed(1);
  const idealMax = (24.9 * hm * hm).toFixed(1);
  const diff     = (weight - (22 * hm * hm)).toFixed(1);
  const bmiPct   = Math.max(2, Math.min(97, ((bmi - 14) / 26) * 100));

  return (
    <div className="flex flex-col items-center w-full select-none">

      {/* ── Real 3D Model Viewport ── */}
      <div
        className="relative w-full max-w-[260px] h-[360px] rounded-2xl overflow-hidden border border-border shadow-inner"
        style={{
          background: '#232323', // Matches the grey background of the reference
        }}
      >
        <Canvas shadows camera={{ position: [0, 0, 250], fov: 0.5 }}>
          <color attach="background" args={['#232323']} />
          <ambientLight intensity={0.4} />
          {/* Main lighting to match reference */}
          <directionalLight position={[0, 50, 50]} intensity={1.2} castShadow />
          <pointLight position={[-50, 50, 50]} intensity={0.8} />
          
          <Suspense fallback={
            <mesh>
              <boxGeometry args={[10, 10, 10]} />
              <meshBasicMaterial color="gray" wireframe />
            </mesh>
          }>
            <Center>
              <Model url={modelUrl} bmi={bmi} gender={gender} goal={goal} />
            </Center>
          </Suspense>
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Canvas>
        
        {/* Loading overlay indicator if desired (handled by suspense fallback) */}
      </div>

      {/* ── STATS BELOW FIGURE ── */}
      <div className="w-full mt-5 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-secondary font-medium">BMI</span>
          <span className="font-bold text-lg" style={{ color: band.color }}>{bmi.toFixed(1)}</span>
        </div>

        <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(to right, #60a5fa 0%, #34d399 30%, #fcd34d 55%, #fb923c 72%, #ef4444 100%)' }}
          />
          <motion.div
            className="absolute top-0 w-4 h-full -ml-2"
            animate={{ left: `${bmiPct}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          >
            <div className="w-3 h-3 bg-white rounded-full mt-0 mx-auto shadow-lg border-2" style={{ borderColor: band.color, marginTop: '1px' }} />
          </motion.div>
        </div>

        <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <span>14</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
        </div>

        <div
          className="text-center text-xs font-semibold py-2 px-4 rounded-xl tracking-wide"
          style={{ background: band.bg, color: band.color, border: `1px solid ${band.color}30` }}
        >
          {band.label}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: 'Height', value: `${height} cm` },
            { label: 'Weight', value: `${weight} kg` },
            { label: 'Ideal range', value: `${idealMin}–${idealMax}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/3 rounded-xl p-2 text-center">
              <p className="text-xs text-text-secondary mb-0.5">{label}</p>
              <p className="text-xs font-semibold text-text-secondary">{value}</p>
            </div>
          ))}
        </div>

        {Math.abs(diff) > 0.5 && (
          <div
            className="flex justify-between items-center text-xs p-2.5 rounded-xl"
            style={{ background: Number(diff) > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(52,211,153,0.08)' }}
          >
            <span style={{ color: Number(diff) > 0 ? '#fca5a5' : '#6ee7b7' }}>
              {Number(diff) > 0 ? '↓ To ideal weight' : '↑ To ideal weight'}
            </span>
            <span className="font-bold" style={{ color: Number(diff) > 0 ? '#f87171' : '#34d399' }}>
              {Math.abs(diff)} kg
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BodyVisualizer;
