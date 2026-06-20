# IMPLEMENTATION.md — Plan de implementación

Plan por fases para recrear DATUM en un stack de producción. Marca cada ítem al completarlo. Recomendado: **Vite + React + TypeScript + react-three-fiber + @react-three/drei + zustand** (estado). Adáptalo si el codebase destino usa otro stack.

---

## Fase 0 — Setup
- [ ] Inicializar proyecto (Vite + React + TS) o integrar en el codebase existente.
- [ ] Cargar fuentes: **Inter** (400/500/600/700) + **Geist Mono** (400/500/600).
- [ ] Crear capa de **design tokens** (CSS variables por `data-theme`, ver `README.md › Sistema de Diseño`). 3 temas: `precision` (default), `dark`, `light`.
- [ ] Util `mono` para texto monoespaciado.

## Fase 1 — App shell
- [ ] `TopBar`: brand (marca + "DATUM" + sub), project pill, theme switch (3 botones segmentados), botón ayuda. Responsive: ocultar pill/sub <720px, theme switch solo swatches <860px.
- [ ] Router de pantallas (`upload` / `processing` / `viewer`) con transición opacity + translateY.
- [ ] Store global (zustand): `screen`, `theme`, `photos`, `processing`, `viewMode`, `autoRotate`, `layers`, `location`, `model`.

## Fase 2 — Upload screen
- [ ] Step indicator (1 Capturar / 2 Procesar / 3 Modelo 3D).
- [ ] Hero: eyebrow, título "De fotografías a modelo medible.", lead.
- [ ] Dropzone con drag & drop real (estado `.drag`), botones "Seleccionar fotos" / "Usar set de muestra".
- [ ] Hint row (GPS/EXIF, solape, escala métrica).
- [ ] Grid de miniaturas (4:3) con etiqueta `IMG_xxxx` y check; animación pop escalonada.
- [ ] Upload foot: meta (nº fotos, solape, cobertura) + botón "Reconstruir modelo 3D".
- [ ] Validación: tipos JPG/PNG/RAW; recomendación 40–300 tomas.

## Fase 3 — Processing screen
- [ ] Anillo de progreso SVG (stroke-dashoffset) + porcentaje mono + label.
- [ ] Título/subtítulo por fase.
- [ ] Lista de 5 fases con estados pendiente / activo (spinner) / hecho (check). Ver textos exactos en `README.md`.
- [ ] Driver de progreso conectado al backend (polling/websocket); fallback simulado para demo.

## Fase 4 — Viewer 3D (react-three-fiber)
- [ ] `SceneCanvas` con OrbitControls (damping 0.08, minDist 4, maxDist 22, maxPolarAngle ~89°, target (0,0.4,0)).
- [ ] Carga de malla real (glTF). Para demo: terreno procedural (fBm) como en `viewer.js`.
- [ ] Materiales por modo: Sólido (vertex colors por elevación), Malla (wireframe accent), Nube (points).
- [ ] Iluminación: Hemisphere + Directional con sombras PCF soft.
- [ ] Backdrop de gradiente radial (`--scene-top` → `--scene-bot`).
- [ ] **Mode group** (Sólido/Malla/Nube) centrado arriba.
- [ ] **View toolbar TL**: iso / planta / alzado con animación de cámara (lerp ease-out 720ms).
- [ ] **View toolbar TR**: auto-órbita (toggle), medir (toggle), pantalla completa.
- [ ] **Cotas flotantes**: proyectar puntos 3D (4 medios de borde + centro) a pantalla cada frame; render como HTML overlay (`.dim-label`) o `<Html>` de drei.
- [ ] **Capas**: límite de parcela (polígono + postes verticales), curvas de nivel, rejilla métrica.
- [ ] Scale bar (10 m).

## Fase 5 — Inspector (panel de datos)
- [ ] Header: título parcela + badge As-built + sub (reconstruido, nº fotos, fecha).
- [ ] Sección **Superficie**: métrica hero (m²) + delta + subtexto (ha, superficie real 3D).
- [ ] Sección **Cotas y dimensiones**: grid 2×3 (ancho, fondo, perímetro, desnivel, cota mín, cota máx).
- [ ] Sección **Precisión**: RMSE + barra + escala + GSD + nº puntos.
- [ ] Sección **Ubicación · As-built**: mapa (Mapbox/MapLibre/Leaflet con polígono real) + coordenadas + botón Reubicar.
- [ ] Sección **Capas**: toggles (límite ON, curvas OFF, rejilla ON) sincronizados con el visor.
- [ ] Footer: "Nuevo" + "Exportar As-built" (con estado de carga).
- [ ] **Móvil**: inspector como bottom sheet deslizable (pestaña "Datos del modelo", drag/tap para abrir).

## Fase 6 — Integración real
- [ ] Conectar subida → backend de fotogrametría.
- [ ] Progreso en tiempo real (polling/websocket).
- [ ] Cargar malla + métricas + georreferenciación reales.
- [ ] Implementar exportación As-built (DXF / GeoJSON / glTF / PDF).

## Fase 7 — Pulido
- [ ] Accesibilidad: roles/aria, foco visible, contraste, hit targets ≥44px.
- [ ] `prefers-reduced-motion`: desactivar auto-órbita y animaciones no esenciales.
- [ ] Rendimiento: LOD / decimación de malla, instancing para nubes de puntos densas.
- [ ] Estados de error y vacíos (sin fotos, fallo de reconstrucción, sin GPS).
- [ ] Tests de los 3 breakpoints (desktop, tablet, móvil) y los 3 temas.

---

## Mapeo referencia → componentes sugeridos
| Referencia (HTML) | Componente sugerido |
|---|---|
| `.topbar` | `TopBar` |
| `#screen-upload` | `UploadScreen` (+ `Dropzone`, `ThumbGrid`, `StepIndicator`) |
| `#screen-processing` | `ProcessingScreen` (+ `ProgressRing`, `StepList`) |
| `#screen-viewer .viewer-main` | `ViewerScene` (+ `ModeToolbar`, `ViewToolbar`, `DimLabels`, `ScaleBar`) |
| `.inspector` | `Inspector` (+ `SurfaceCard`, `DimGrid`, `PrecisionCard`, `LocationMap`, `LayerList`) |

Geometría/lógica 3D de referencia: ver `viewer.js` (terreno fBm, modos, vistas, cotas, capas, temas, métricas).
