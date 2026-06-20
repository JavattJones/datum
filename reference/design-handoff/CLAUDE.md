# CLAUDE.md — Instrucciones para Claude Code

Este repositorio es un **paquete de handoff de diseño** para la app **DATUM** (fotogrametría 3D / As-built para estudios de arquitectura). Léelo entero antes de escribir código.

## Qué es esto (y qué NO es)
- Los archivos `Datum 3D.html`, `styles.css`, `app.js`, `viewer.js` son **una referencia de diseño en HTML/CSS/JS vanilla + Three.js**. Muestran el aspecto y comportamiento finales (alta fidelidad).
- **No es código de producción para copiar tal cual.** Tu trabajo es **recrear estos diseños en el codebase/stack destino** siguiendo sus patrones. Si no hay codebase aún, monta uno nuevo (recomendado: **Vite + React + TypeScript**, con **react-three-fiber + @react-three/drei** para el visor 3D).
- Los datos (fotos de muestra, métricas, coordenadas, geometría del terreno) son **simulados**. En producción se sustituyen por la salida real del pipeline de fotogrametría.

## Documentos clave (léelos en este orden)
1. `README.md` — especificación completa: design tokens, pantallas, componentes, interacciones, estado, comportamiento del visor 3D. **Es la fuente de verdad.**
2. `IMPLEMENTATION.md` — plan de implementación por fases con checklist.
3. `screenshots/` — capturas de referencia en alta resolución (3 pantallas + 3 temas).

## Probar la referencia en vivo
Los módulos ES requieren servidor http (no `file://`):
```bash
npm run dev          # sirve en http://localhost:5173
# abre http://localhost:5173/Datum%203D.html
```
Deep-links de QA (definidos en `app.js`):
- `?jump=viewer` — entra directo al visor 3D.
- `?jump=processing` — pantalla de procesamiento en estado fijo.
- `?jump=thumbs` — subida con miniaturas cargadas.

## Decisiones de diseño que DEBES respetar
- **Tema por defecto: `precision`** (oscuro, monoespaciado, denso, acento turquesa `#2dd4a7`). Hay 3 temas conmutables (`precision` / `dark` / `light`) vía `data-theme` en la raíz. Implementa el sistema de temas con CSS variables (ver tokens en `README.md`).
- **Datos numéricos siempre en fuente monoespaciada** (Geist Mono / JetBrains Mono).
- **Responsive real** móvil + escritorio: inspector lateral 340px en desktop → bottom sheet deslizable en móvil (<880px).
- **Visor 3D**: orbitar 360° con damping, modos Sólido/Malla/Nube, vistas iso/planta/alzado con animación de cámara, cotas flotantes proyectadas desde 3D a pantalla, capas conmutables (límite, curvas de nivel, rejilla).
- **Sin iconos de librería en la referencia** (son SVG inline). Al portar, puedes usar Lucide/Heroicons como equivalentes.

## Convenciones al recrear
- Recrea la UI **pixel-perfect** (es alta fidelidad). Usa exactamente los tokens de color/tipografía/espaciado de `README.md`.
- Componentiza por pantalla: `UploadScreen`, `ProcessingScreen`, `ViewerScreen`, y dentro del visor `SceneCanvas`, `ModeToolbar`, `ViewToolbar`, `Inspector` (con sub-secciones Superficie, Cotas, Precisión, Mapa, Capas).
- Centraliza los design tokens (CSS variables o theme object). No hardcodees hex sueltos.
- El estado mínimo está descrito en `README.md › State Management`.
- Mantén accesibilidad: `aria-pressed` en toggles/segmentados, foco visible, hit targets ≥44px en móvil.

## Integración real (producción)
- **Entrada**: subida de fotos → backend de fotogrametría (WebODM / Metashape / RealityCapture o servicio propio). Polling/websocket del progreso → alimenta `ProcessingScreen`.
- **Salida**: malla (glTF/OBJ + textura) + JSON de métricas y georreferenciación (EPSG, polígono límite, curvas de nivel) → alimenta `ViewerScreen` e `Inspector`.
- **Mapa**: sustituir el canvas esquemático por Mapbox/MapLibre/Leaflet con el polígono real.
- **Export As-built**: DXF/GeoJSON/glTF + informe PDF.

## Qué NO hacer
- No inventes contenido ni secciones nuevas sin pedir confirmación.
- No cambies la dirección visual (tema Precision) salvo que se indique.
- No dejes los datos simulados en producción: conéctalos al pipeline real.
