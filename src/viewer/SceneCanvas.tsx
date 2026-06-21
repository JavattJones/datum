import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Line, Html, useGLTF } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useAppStore, type CameraView, type ModelData } from '@/store/appStore'
import { buildTerrain, type DimAnchor } from '@/viewer/terrain'

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

/* ---------- shared overlays (used by both terrain sources) ---------- */

function Boundary({ corners, elevMin, accent, visible }: { corners: THREE.Vector3[]; elevMin: number; accent: string; visible: boolean }) {
  const loop = useMemo(
    () => [...corners, corners[0]].map((c) => [c.x, c.y, c.z] as [number, number, number]),
    [corners],
  )
  return (
    <group visible={visible}>
      <Line points={loop} color={accent} lineWidth={1.4} transparent opacity={0.9} />
      {corners.map((c, i) => (
        <Line
          key={i}
          points={[[c.x, c.y, c.z], [c.x, elevMin - 0.3, c.z]]}
          color={accent}
          lineWidth={1}
          transparent
          opacity={0.25}
        />
      ))}
    </group>
  )
}

function MetricGrid({ elevMin, visible }: { elevMin: number; visible: boolean }) {
  return (
    <gridHelper
      args={[28, 56, '#2a333f', '#1e2530']}
      position={[0, elevMin - 0.32, 0]}
      visible={visible}
      material-transparent
      material-opacity={0.1}
    />
  )
}

function DimLabels({ anchors }: { anchors: DimAnchor[] }) {
  return (
    <>
      {anchors.map((a, i) => (
        <Html key={i} position={a.position} center zIndexRange={[20, 0]} pointerEvents="none">
          <span className={a.type === 'area' ? 'dim-label dim-label-area' : 'dim-label'}>{a.label}</span>
        </Html>
      ))}
    </>
  )
}

/* ---------- procedural terrain (mock pipeline) ---------- */

function ProceduralTerrain({ accent }: { accent: string }) {
  const viewMode = useAppStore((s) => s.viewMode)
  const layers = useAppStore((s) => s.layers)
  const { geometry, contours, corners, elevMin, anchors } = useMemo(() => buildTerrain(), [])

  return (
    <>
      <mesh geometry={geometry} visible={viewMode === 'solid'} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh geometry={geometry} visible={viewMode === 'wire'}>
        <meshBasicMaterial color={accent} wireframe transparent opacity={0.42} />
      </mesh>
      <points geometry={geometry} visible={viewMode === 'points'}>
        <pointsMaterial size={0.018} vertexColors sizeAttenuation />
      </points>

      <Boundary corners={corners} elevMin={elevMin} accent={accent} visible={layers.boundary} />
      <points geometry={contours} visible={layers.contours}>
        <pointsMaterial color="#ffffff" size={0.012} transparent opacity={0.18} sizeAttenuation />
      </points>
      <MetricGrid elevMin={elevMin} visible={layers.grid} />
      <DimLabels anchors={anchors} />
    </>
  )
}

/* ---------- real glTF mesh (production pipeline) ---------- */

/** Derive boundary corners + dimension anchors from a mesh bounding box. */
function deriveOverlays(box: THREE.Box3, model: ModelData) {
  const corners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
  ]
  const label = (i: number) => (i % 2 === 0 ? `${model.width} m` : `${model.depth} m`)
  const anchors: DimAnchor[] = corners.map((a, i) => {
    const b = corners[(i + 1) % 4]
    const m = a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.25, 0))
    return { type: 'edge', label: label(i), position: [m.x, m.y, m.z] }
  })
  const c = new THREE.Vector3()
  box.getCenter(c)
  anchors.push({ type: 'area', label: `${model.surface} m²`, position: [c.x, box.max.y + 0.4, c.z] })
  return { corners, anchors, elevMin: box.min.y }
}

function GltfTerrain({ url, accent }: { url: string; accent: string }) {
  const viewMode = useAppStore((s) => s.viewMode)
  const layers = useAppStore((s) => s.layers)
  const model = useAppStore((s) => s.model)
  const { scene } = useGLTF(url)

  const { corners, anchors, elevMin } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    return deriveOverlays(box, model)
  }, [scene, model])

  // Reflect the render mode onto the loaded materials.
  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (mat) mat.wireframe = viewMode === 'wire'
    })
  }, [scene, viewMode])

  return (
    <>
      <primitive object={scene} />
      <Boundary corners={corners} elevMin={elevMin} accent={accent} visible={layers.boundary} />
      <MetricGrid elevMin={elevMin} visible={layers.grid} />
      <DimLabels anchors={anchors} />
    </>
  )
}

/* ---------- scene shell (controls + camera + terrain source) ---------- */

function Scene() {
  const { camera } = useThree()
  const controls = useRef<OrbitControlsImpl>(null)
  const accent = useAccent()
  const autoRotate = useAppStore((s) => s.autoRotate)
  const viewRequest = useAppStore((s) => s.viewRequest)
  const modelUrl = useAppStore((s) => s.modelUrl)

  useEffect(() => {
    controls.current?.target.set(0, 0.4, 0)
  }, [])

  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; t0: number } | null>(null)
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

      {modelUrl ? (
        <Suspense fallback={null}>
          <GltfTerrain url={modelUrl} accent={accent} />
        </Suspense>
      ) : (
        <ProceduralTerrain accent={accent} />
      )}

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
