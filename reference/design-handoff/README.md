# Handoff: DATUM — App de Fotogrametría 3D / As-built

> **¿Usas Claude Code?** Empieza por `CLAUDE.md` (instrucciones del agente) y luego `IMPLEMENTATION.md` (plan por fases). Este `README.md` es la especificación de diseño completa y la fuente de verdad. Levanta la referencia con `npm run dev`.

## Overview
DATUM es una aplicación web responsive (móvil + escritorio) dirigida a **estudios de arquitectura** que, a partir de un set de fotografías, reconstruye un **modelo 3D medible de un terreno/parcela**. El usuario sube fotos → la app procesa (fotogrametría) → obtiene un modelo 3D navegable con datos métricos (superficie, cotas, precisión) y lo georreferencia como **as-built**.

El flujo estrella es: **subir fotos → procesar → resultado 3D navegable**.

## About the Design Files
Los archivos de este paquete son **referencias de diseño creadas en HTML/CSS/JS** — prototipos que muestran el aspecto y el comportamiento previstos, **no código de producción para copiar directamente**. El visor 3D está implementado con **Three.js** (módulos ES vía importmap) puramente como demostración visual con datos simulados.

La tarea es **recrear estos diseños en el entorno del codebase destino** (React, Vue, Next, etc.) usando sus patrones y librerías establecidas. Si no existe entorno aún, elegir el framework más apropiado. Para el visor 3D real, lo natural sería **react-three-fiber + drei** (o Three.js directo) conectado a un pipeline de fotogrametría real (p. ej. salida de WebODM / RealityCapture / Metashape como malla glTF + metadatos).

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciado, estados e interacciones son finales y deben recrearse fielmente. El único placeholder es el **contenido de datos** (fotos de muestra generadas por canvas, métricas y coordenadas simuladas) y la **geometría del terreno** (generada con ruido procedural). En producción se sustituyen por la malla y metadatos reales del pipeline.

---

## Sistema de Diseño / Design Tokens

La app soporta **3 temas conmutables** vía atributo `data-theme` en `<html>`. **Precision es el tema por defecto y elegido**. Documento los 3 porque el conmutador se conserva, pero prioriza **Precision**.

### Tema PRECISION (por defecto — científico, monoespaciado, denso)
```
--bg:            #0c1016   (con rejilla sutil de fondo, ver nota)
--bg-2:          #0e131a
--panel:         #10151c
--panel-2:       #151b23
--stroke:        #1e2530
--stroke-2:      #2a333f
--text:          #d7e0ea
--text-2:        #8694a2
--text-3:        #54616e
--accent:        #2dd4a7   (turquesa/esmeralda)
--accent-2:      #14b88f
--accent-soft:   rgba(45,212,167,0.10)
--accent-line:   rgba(45,212,167,0.42)
--warn:          #eab308
--danger:        #ef4444
--scene-top:     #0c1117   (gradiente superior de la escena 3D)
--scene-bot:     #070a0e   (gradiente inferior de la escena 3D)
--shadow:        0 8px 30px rgba(0,0,0,0.55)
--radius:        5px       (esquinas marcadas, look técnico)
--label-track:   0.13em    (letter-spacing de etiquetas mono)
```
- En Precision, **toda la tipografía base usa la fuente monoespaciada** (`body { font-family: var(--font-mono) }`).
- La marca (`.brand-name`) usa `letter-spacing: 0.20em`.

### Tema DARK ("Topo" — CAD oscuro)
```
--bg:#0a0c0e  --bg-2:#121519  --panel:#14181d  --panel-2:#1a1f25
--stroke:#252b33  --stroke-2:#323a44
--text:#e8edf2  --text-2:#9aa6b2  --text-3:#5e6873
--accent:#34d399  --accent-2:#10b981
--accent-soft:rgba(52,211,153,0.12)  --accent-line:rgba(52,211,153,0.40)
--scene-top:#0e1318  --scene-bot:#05070a
--radius:12px  --label-track:0.08em
```

### Tema LIGHT ("Studio" — claro)
```
--bg:#f3f4f1  --bg-2:#ffffff  --panel:#ffffff  --panel-2:#f7f8f5
--stroke:#e4e7e1  --stroke-2:#d2d7cd
--text:#15181b  --text-2:#586068  --text-3:#969ea6
--accent:#059669  --accent-2:#047857
--accent-soft:rgba(5,150,105,0.10)  --accent-line:rgba(5,150,105,0.32)
--scene-top:#e7eae4  --scene-bot:#d4dacf
--radius:14px  --label-track:0.06em
```

### Tipografía
```
--font-sans: "Inter", system-ui, -apple-system, sans-serif
--font-mono: "Geist Mono", "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace
```
- Fuentes cargadas desde Google Fonts: Inter (400,500,600,700) y Geist Mono (400,500,600).
- **Datos numéricos siempre en mono** (superficie, cotas, coordenadas, porcentajes).
- Botón primario sobre acento usa texto color `#04130d` (verde casi negro).

### Escala tipográfica clave
```
Título hero (.h-title):  clamp(30px, 4.4vw, 46px) / line-height 1.04 / weight 680 / letter-spacing -0.025em
Eyebrow (.h-eyebrow):    12px / mono / letter-spacing 0.16em / UPPERCASE / color accent
Lead (.h-lead):          16px / line-height 1.55 / color text-2
Métrica hero (.val):     38px / mono / weight 600 / letter-spacing -0.02em
Métrica celda (.v):      19px / mono / weight 600
Section label:           10.5px / mono / letter-spacing var(--label-track) / UPPERCASE / color text-3
```

### Espaciado y radios
- Radios por tema (ver `--radius`). En Precision casi todo es 4–6px.
- Botones: `padding: 11px 20px`, `border-radius: 10px` (4px en Precision).
- Secciones del inspector: `padding: 16px 20px`, separadas por `1px solid var(--stroke)`.

### Sombras
```
--shadow (Precision/Dark): 0 8px 30px rgba(0,0,0,0.55)
--shadow (Light):          0 10px 34px rgba(20,30,25,0.10)
Toolbars flotantes usan var(--shadow) + backdrop-filter: blur(10px)
```

---

## Screens / Views

### 1. Top Bar (persistente en todas las pantallas)
- **Layout**: barra horizontal, `height: 56px`, `flex`, `padding: 0 16px`, `border-bottom: 1px solid var(--stroke)`, fondo `var(--bg-2)`.
- **Componentes**:
  - **Brand**: marca cuadrada `27×27px` `border-radius:7px` fondo accent con icono cubo/datum (SVG), nombre "DATUM" (weight 700, letter-spacing 0.16em) + sub "Photogrammetry Suite" (10px mono, uppercase, separado por borde izquierdo). El sub se oculta < 720px.
  - **Project pill**: chip redondeado (`border-radius:999px`) con punto accent + "Parcela P-204 · Vega Norte". Se oculta < 720px.
  - **Theme switch**: grupo segmentado de 3 botones (Precision / Topo / Studio), cada uno con un swatch circular `11px`. El activo tiene fondo `panel-2` + swatch relleno de accent. Texto oculto < 860px (solo swatches).
  - **Icon button** de ayuda (interrogación en círculo), `34×34px`.

### 2. SCREEN — Upload (`#screen-upload`)
- **Purpose**: el usuario sube/selecciona las fotografías del levantamiento.
- **Layout**: contenedor centrado `max-width: 1060px`, `padding: 52px 28px 64px`, scroll vertical.
- **Componentes**:
  - **Step indicator** (`.step-row`): 3 chips — "1 Capturar" (activo, accent), "2 Procesar", "3 Modelo 3D" — separados por líneas. Chips en mono, número en círculo `20px`.
  - **Eyebrow**: "NUEVO LEVANTAMIENTO" (accent, mono, uppercase).
  - **Título**: "De fotografías a modelo medible." (`max-width:16ch`).
  - **Lead**: párrafo descriptivo (`max-width:52ch`, color text-2). Contiene `<em>as-built</em>`.
  - **Dropzone** (`.dropzone`): caja con `border: 1.5px dashed var(--stroke-2)`, `border-radius: var(--radius)`, `padding: 46px 32px`, centrada. Estado `.drag` (al arrastrar): borde y fondo accent.
    - Icono subida en cuadro `56×56px` `border-radius:14px`.
    - H3 "Arrastra tus fotografías aquí", subtítulo "JPG, PNG o RAW · recomendado 40–300 tomas con solape".
    - Botón primario "Seleccionar fotos" (icono cámara) + botón ghost "Usar set de muestra".
    - Hint row: 3 chips con check accent — "Detección GPS / EXIF", "Solape automático", "Escala métrica real".
  - **Thumbs grid** (`.thumbs`): grid `repeat(auto-fill, minmax(118px,1fr))`, gap 10px. Cada thumb `aspect-ratio:4/3`, `border-radius:10px`, con canvas (imagen de terreno generada), etiqueta `IMG_2040+` (mono, sobre fondo translúcido) y check circular accent arriba-derecha. Animación `pop` escalonada.
  - **Upload foot**: aparece tras añadir fotos. Meta "N fotografías · solape medio 78% · cobertura 96%" + botón primario "Reconstruir modelo 3D" (flecha).

### 3. SCREEN — Processing (`#screen-processing`)
- **Purpose**: feedback de la reconstrucción fotogramétrica.
- **Layout**: centrado vertical y horizontal, `max-width: 560px`.
- **Componentes**:
  - **Anillo de progreso** SVG `220×220px`: círculo base (stroke) + círculo de relleno animado (`stroke-dasharray:276.5`, se reduce `stroke-dashoffset`). Centro: porcentaje grande mono (40px) + label "Reconstruyendo".
  - **Título + subtítulo** que cambian por fase.
  - **Lista de pasos** (`.proc-steps`), 5 fases secuenciales:
    1. "Alineando fotografías" — Detectando puntos clave y estimando posiciones de cámara…
    2. "Generando nube de puntos densa" — Triangulando 2.1 M de puntos…
    3. "Construyendo malla 3D" — Reconstruyendo superficie y normales…
    4. "Proyectando texturas" — Mapeando color fotográfico…
    5. "Georreferenciando as-built" — Aplicando escala métrica y coordenadas…
  - Cada paso: icono `20px` + texto. Estados: `.active` (fondo panel, spinner girando, texto/icono accent), `.done` (check accent), pendiente (icono temático, color text-3).
  - **Duración total simulada**: 5000ms, luego 420ms y transición al visor.

### 4. SCREEN — Viewer (`#screen-viewer`)
- **Purpose**: navegar el modelo 3D y leer sus datos.
- **Layout**: `flex-direction: row` en escritorio — `viewer-main` (flex:1) + `inspector` (340px fijo a la derecha). En móvil (< 880px) pasa a `column` con el inspector como **bottom sheet deslizable**.

#### 4a. Viewer main (escena 3D)
- `<canvas id="scene">` a pantalla completa con backdrop de gradiente radial (`--scene-top` → `--scene-bot`) detrás.
- **Mode group** (centrado arriba): segmentado "Sólido / Malla / Nube" (iconos). El activo: fondo accent, texto `#04130d`. Texto oculto < 600px.
- **Toolbar top-left** (`.v-toolbar.tl`): Vista isométrica, Planta (cenital), Alzado. Cada botón `36×36px` con tooltip.
- **Toolbar top-right** (`.v-toolbar.tr`): Auto-órbita (toggle, pressed=accent), separador, Medir (toggle), Pantalla completa.
- **Scale bar** abajo-centro: barra de 80px con label "10 m" (mono).
- **Dimension labels** (`.dim-label`): etiquetas flotantes ancladas a la geometría proyectada — 4 cotas de borde ("48.6 m", "33.4 m" ×2) + 1 etiqueta de área (`.dim-label.area`, "1623 m²", color accent). Caja con `border: 1px solid var(--accent-line)`, fondo translúcido, mono 11px.

#### 4b. Inspector (panel de datos)
- **Header**: título "Vega Norte · P-204" + badge "As-built" (punto + texto accent en pill). Sub: "Reconstruido · 184 fotos · 12 jun 2026" (mono).
- **Sección Superficie**: métrica hero "1 623 m²" + delta "±0.4%" (accent). Subtexto: "Proyección horizontal · 0.162 ha · superficie real 3D 1 671 m²".
- **Sección Cotas y dimensiones**: grid 2×3 de celdas (fondo panel, separadas por stroke):
  - Ancho 48.60 m · Fondo 33.40 m · Perímetro 164.0 m · Desnivel 4.85 m · Cota mín. 820.4 m · Cota máx. 825.2 m.
- **Sección Precisión del modelo**:
  - Fila "Error medio (RMSE)" → "1.8 cm".
  - Barra de progreso (`.prec-track` / `.prec-fill` con gradiente accent, width 86%).
  - Escala "0 cm — Grado topográfico — 5 cm".
  - Dos métricas: "GSD 1.4 cm/px · Resolución suelo" y "2.1 M · Puntos de malla".
- **Sección Ubicación · As-built**: tarjeta de mapa con `<canvas id="mapCanvas">` (mapa esquemático dibujado: rejilla de calles, río, polígono de parcela en accent), pin SVG centrado, coordenadas mono "40.4168° N · 3.7038° O" + botón "Reubicar". Al reubicar, cicla 4 coordenadas (Madrid, Barcelona, Sevilla, Valencia) y redibuja.
- **Sección Capas**: 3 toggles — "Límite de parcela" (4 vért., ON), "Curvas de nivel" (0.5 m, OFF), "Rejilla métrica" (1 m, ON). Cada uno con swatch de color, nombre, contador mono y switch.
- **Footer**: botón ghost "Nuevo" + botón primario "Exportar As-built" (con estado de carga → "Exportado").
- **Móvil**: el inspector es un bottom sheet con pestaña "Datos del modelo" (grip + icono); `transform: translateY(calc(100% - 52px))`, abre a `translateY(0)` con `.open`. Altura 56% de la pantalla.

---

## Interactions & Behavior

### Navegación entre pantallas
- Router simple por clase `.active` en `.screen` (solo una activa). Transición: `opacity .5s + translateY(8px)`.
- Upload → (Reconstruir) → Processing → (auto, ~5.4s) → Viewer.
- Viewer → (Nuevo) → Upload.

### Theme switch
- Click cambia `data-theme` en `<html>`, actualiza `aria-pressed` de los botones, y re-aplica tema al visor 3D (`Viewer.applyTheme()`) y redibuja el mapa (`drawMap()`).

### Visor 3D (Three.js — comportamiento a recrear)
- **OrbitControls**: orbitar 360° con damping (`dampingFactor:0.08`), `minDistance:4`, `maxDistance:22`, `maxPolarAngle: ~89°` (no bajo el suelo). Target en `(0, 0.4, 0)`.
- **Modos**: Sólido (MeshStandard con vertex colors por elevación), Malla (wireframe accent, opacity 0.42), Nube de puntos (Points, size 0.018–0.02).
- **Vistas con animación de cámara** (lerp, ease-out cúbico, 720ms): isométrica `(7.5,6.2,9)`, planta `(0,13,0)`, alzado `(0,2.4,12)`.
- **Auto-órbita**: toggle, `autoRotateSpeed:0.6`.
- **Cotas**: se proyectan los puntos 3D (4 puntos medios de borde + centro) a coordenadas de pantalla cada frame y se posicionan los `.dim-label` con CSS `left/top`.
- **Capas**: toggles muestran/ocultan boundary (polígono límite + postes verticales en esquinas), contours (curvas de nivel por marching simple), grid (GridHelper).
- **Iluminación**: HemisphereLight (cielo/suelo) + DirectionalLight con sombras PCF soft (2048²).
- **Terreno**: PlaneGeometry segmentado, altura por fBm/value-noise determinista (semilla fija), coloreado por elevación (verde → oliva → arena). Footprint real 48.6 × 33.4 m mapeado a 10 unidades de escena.

### Estados de carga
- Botón "Exportar As-built": muestra spinner "Generando…" 1.4s → check "Exportado" 1.6s → vuelve a normal.
- Processing: anillo + pasos animados en tiempo real.

### Drag & drop
- La dropzone reacciona a `dragenter/dragover` (clase `.drag`) y `drop` añade fotos (demo: 18 thumbs).

### Responsive
- < 880px: viewer en columna, inspector como bottom sheet.
- < 720px: oculta project pill y brand sub.
- < 860px: theme switch solo swatches.
- < 600px: mode group solo iconos.

## State Management
Variables/estado necesarios al portar:
- `currentScreen`: 'upload' | 'processing' | 'viewer'.
- `theme`: 'precision' | 'dark' | 'light'.
- `photos[]`: lista de fotos subidas (count, metadatos EXIF/GPS).
- `processing`: { progress 0–100, currentStep 0–4 }.
- `viewMode`: 'solid' | 'wire' | 'points'.
- `autoRotate`: bool. `measureMode`: bool.
- `layers`: { boundary, contours, grid : bool }.
- `location`: índice/coordenadas del as-built.
- `model`: malla + métricas (area, dims, RMSE, GSD, puntos, cotas min/max) — del pipeline real.

## Data fetching (producción)
- Subida de fotos → backend de fotogrametría (WebODM/Metashape/RealityCapture o servicio propio).
- Polling/websocket del progreso de reconstrucción.
- Descarga de la malla (glTF/OBJ + textura) y JSON de métricas + georreferenciación (EPSG, polígono límite, curvas de nivel).
- Export As-built → CAD/GIS (DXF, GeoJSON, glTF, PDF de informe).

## Assets
- **Iconos**: todos SVG inline (stroke 1.5–1.6), sin dependencias de icon font. Reemplazables por la librería de iconos del codebase (Lucide/Heroicons son equivalentes cercanos).
- **Imágenes de fotos de muestra**: generadas proceduralmente en canvas (no son archivos). En producción, miniaturas reales de las fotos subidas.
- **Mapa**: dibujado en canvas (esquemático). En producción usar Mapbox/MapLibre/Leaflet con el polígono real georreferenciado.
- **Modelo 3D**: geometría procedural de demo. En producción, malla real del pipeline.
- **Fuentes**: Inter + Geist Mono (Google Fonts).

## Screenshots
La carpeta `screenshots/` incluye capturas de referencia en alta resolución:
- `01-upload.png` — Pantalla de subida de fotos (hero + dropzone + step indicator). Tema Precision.
- `02-processing.png` — Pantalla de procesamiento (anillo 62% + lista de fases). Tema Precision.
- `03-viewer.png` — Visor 3D con terreno reconstruido, cotas, escala e inspector. Tema Precision.
- `theme-topo.png` — Visor en tema **Topo** (oscuro, sans-serif, verde esmeralda).
- `theme-studio.png` — Visor en tema **Studio** (claro).

> Nota: el visor usa WebGL (Three.js); las capturas reflejan el render real. Para ver los modos Malla/Nube, vistas (planta/alzado), auto-órbita y reubicación del mapa, abrir la demo en vivo.

### Atajos de carga (deep-links) para inspección
`app.js` incluye un parámetro `?jump=` útil para QA y capturas (no usar en producción):
- `Datum 3D.html?jump=viewer` — entra directo al visor 3D.
- `Datum 3D.html?jump=processing` — muestra la pantalla de procesamiento en estado fijo.
- `Datum 3D.html?jump=thumbs` — pantalla de subida con miniaturas cargadas.

## Files
Archivos de diseño incluidos en este paquete (en la raíz del proyecto original):
- `Datum 3D.html` — estructura completa (shell, 3 pantallas, inspector). Importa Three.js vía importmap.
- `styles.css` — sistema de diseño completo + los 3 temas + responsive.
- `app.js` — lógica de la app: router de pantallas, theme switch, generación de thumbs, animación de processing, wiring del visor, mini-mapa, inspector móvil.
- `viewer.js` — módulo del visor 3D Three.js: terreno procedural, modos, vistas, cotas, capas, temas, métricas.

### Cómo correr la demo
Servir la carpeta con cualquier servidor estático (los módulos ES requieren http, no `file://`):
```
npx serve .      # o python3 -m http.server
```
Abrir `Datum 3D.html`. Usar "Usar set de muestra" → "Reconstruir modelo 3D" para llegar al visor.
