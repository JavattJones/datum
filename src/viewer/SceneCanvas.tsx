import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Line, Html } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useAppStore, type CameraView } from '@/store/appStore'
import { buildTerrain } from '@/viewer/terrain'

/** Camera pose per named view (position + orbit target). */
const VIEWS: Record<CameraView, { pos: [number, number, number]; target: [number, number, number] }> = {
  iso: { pos: [7.5, 6.2, 9], target: [0, 0.4, 0] },
  plan: { pos: [0.01, 13, 0.01], target: [0, 0, 0] },
  elevation: { pos: [0, 2.4, 12], target: [0, 0.4, 0] },
}

/** Read the live `--accent` token so wire/boundary track the active theme. */
function useAccent(): string {
  const theme = useAppStore((s) => s.theme)
  return useMemo(() => {
    if (typeof window === 'undefined') return '#2dd4a7'
    return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2dd4a7'
  }, [theme])
}

function Scene() {
  const { camera } = useThree()
  const controls = useRef<OrbitControlsImpl>(null)
  const accent = useAccent()

  const viewMode = useAppStore((s) => s.viewMode)
  const layers = useAppStore((s) => s.layers)
  const autoRotate = useAppStore((s) => s.autoRotate)
  const viewRequest = useAppStore((s) => s.viewRequest)

  const terrain = useMemo(() => buildTerrain(), [])
  const { geometry, contours, corners, elevMin, anchors } = terrain

  // Set the initial orbit target once (kept off the prop to avoid resets).
  useEffect(() => {
    controls.current?.target.set(0, 0.4, 0)
  }, [])

  // Eased camera move (~720ms, ease-out cubic) on each view request.
  const anim = useRef<{
    from: THREE.Vector3
    to: THREE.Vector3
    fromT: THREE.Vector3
    toT: THREE.Vector3
    t0: number
  } | null>(null)

  useEffect(() => {
    if (!controls.current) return
    const v = VIEWS[viewRequest.view]
    anim.current = {
      from: camera.position.clone(),
      to: new THREE.Vector3(...v.pos),
      fromT: controls.current.target.clone(),
      toT: new THREE.Vector3(...v.target),
      t0: performance.now(),
    }
    // Only react to nonce bumps from the view toolbar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewRequest.nonce])

  useFrame(() => {
    const a = anim.current
    if (a && controls.current) {
      const k = Math.min(1, (performance.now() - a.t0) / 720)
      const e = 1 - Math.pow(1 - k, 3)
      camera.position.lerpVectors(a.from, a.to, e)
      controls.current.target.lerpVectors(a.fromT, a.toT, e)
      if (k >= 1) anim.current = null
    }
    controls.current?.update()
  })

  const boundaryPts = useMemo(
    () => [...corners, corners[0]].map((c) => [c.x, c.y, c.z] as [number, number, number]),
    [corners],
  )

  return (
    <>
      <hemisphereLight args={['#cfe8ff', '#2a2a1f', 0.85]} />
      <directionalLight
        position={[6, 11, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0003}
      />

      {/* Terrain — Solid (vertex colors) / Mesh (accent wireframe) / Points */}
      <mesh geometry={geometry} visible={viewMode === 'solid'} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh geometry={geometry} visible={viewMode === 'wire'}>
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.42} />
      </mesh>
      <points geometry={geometry} visible={viewMode === 'points'}>
        <pointsMaterial size={0.018} vertexColors sizeAttenuation />
      </points>

      {/* Boundary: closed polygon + vertical drop posts at each corner */}
      <group visible={layers.boundary}>
        <Line points={boundaryPts} color={accent} lineWidth={1.4} transparent opacity={0.9} />
        {corners.map((c, i) => (
          <Line
            key={i}
            points={[
              [c.x, c.y, c.z],
              [c.x, elevMin - 0.3, c.z],
            ]}
            color={accent}
            lineWidth={1}
            transparent
            opacity={0.25}
          />
        ))}
      </group>

      {/* Contour cloud */}
      <points geometry={contours} visible={layers.contours}>
        <pointsMaterial color="#ffffff" size={0.012} transparent opacity={0.18} sizeAttenuation />
      </points>

      {/* Metric grid */}
      <gridHelper
        args={[28, 56, '#2a333f', '#1e2530']}
        position={[0, elevMin - 0.32, 0]}
        visible={layers.grid}
        material-transparent
        material-opacity={0.1}
      />

      {/* Floating dimension labels (projected from 3D each frame by drei Html) */}
      {anchors.map((a, i) => (
        <Html key={i} position={a.position} center zIndexRange={[20, 0]} pointerEvents="none">
          <span className={a.type === 'area' ? 'dim-label dim-label-area' : 'dim-label'}>{a.label}</span>
        </Html>
      ))}

      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={22}
        maxPolarAngle={Math.PI * 0.49}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
      />
    </>
  )
}

export function SceneCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: VIEWS.iso.pos, fov: 42, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(120% 90% at 60% 15%, var(--scene-top), var(--scene-bot))',
      }}
    >
      <Scene />
    </Canvas>
  )
}
