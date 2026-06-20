import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '@/store/appStore'

/** Deterministic value-noise terrain — placeholder for the real pipeline mesh. */
function useTerrainGeometry(): THREE.PlaneGeometry {
  return useMemo(() => {
    const geo = new THREE.PlaneGeometry(10, 7, 96, 72)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position
    const colors: number[] = []
    const lo = new THREE.Color('#3f6d4a')
    const mid = new THREE.Color('#7d7a3d')
    const hi = new THREE.Color('#c8b890')

    const noise = (x: number, z: number) =>
      Math.sin(x * 0.7) * Math.cos(z * 0.9) * 0.5 +
      Math.sin(x * 1.9 + 1.3) * Math.cos(z * 1.4) * 0.22 +
      Math.sin(x * 3.3) * Math.cos(z * 2.7) * 0.1

    let min = Infinity
    let max = -Infinity
    const heights: number[] = []
    for (let i = 0; i < pos.count; i++) {
      const h = noise(pos.getX(i), pos.getZ(i))
      heights.push(h)
      min = Math.min(min, h)
      max = Math.max(max, h)
    }

    for (let i = 0; i < pos.count; i++) {
      const h = heights[i]
      pos.setY(i, h)
      const t = (h - min) / (max - min)
      const c = t < 0.5 ? lo.clone().lerp(mid, t * 2) : mid.clone().lerp(hi, (t - 0.5) * 2)
      colors.push(c.r, c.g, c.b)
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [])
}

function Terrain() {
  const geometry = useTerrainGeometry()
  const viewMode = useAppStore((s) => s.viewMode)
  const grid = useAppStore((s) => s.layers.grid)
  const meshRef = useRef<THREE.Mesh>(null)
  const autoRotate = useAppStore((s) => s.autoRotate)

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) meshRef.current.rotation.y += delta * 0.15
  })

  return (
    <group ref={meshRef}>
      {viewMode === 'points' ? (
        <points geometry={geometry}>
          <pointsMaterial size={0.04} vertexColors />
        </points>
      ) : (
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            vertexColors
            wireframe={viewMode === 'wire'}
            roughness={0.95}
            metalness={0}
          />
        </mesh>
      )}
      {grid && <gridHelper args={[12, 12, '#2dd4a7', '#1e2530']} position={[0, -0.6, 0]} />}
    </group>
  )
}

export function SceneCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [7.5, 6.2, 9], fov: 42 }}
      gl={{ antialias: true }}
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, var(--scene-top), var(--scene-bot))',
      }}
    >
      <hemisphereLight args={['#cfe8ff', '#101418', 0.9]} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Terrain />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2 - 0.02}
        target={[0, 0.4, 0]}
      />
    </Canvas>
  )
}
