import { useRef } from 'react'
import { SceneCanvas } from '@/viewer/SceneCanvas'
import { ModeToolbar } from '@/viewer/ModeToolbar'
import { ViewsToolbar, ActionsToolbar } from '@/viewer/ViewToolbar'
import { ScaleBar } from '@/viewer/ScaleBar'
import { Inspector } from '@/components/inspector/Inspector'

/**
 * Phase 4 + 5 — Viewer 3D scene (mode group, view/action toolbars, floating
 * dimensions, scale bar) + the Inspector data panel. On desktop the inspector
 * is a 340px side panel; below 880px it becomes a draggable bottom sheet.
 * Reference: README › Viewer main + Inspector.
 */
export function ViewerScreen() {
  const mainRef = useRef<HTMLDivElement>(null)

  const onFullscreen = () => {
    const el = mainRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }

  return (
    <div className="relative flex h-full flex-col min-[880px]:flex-row">
      {/* Viewer main — the 3D scene fills it; overlays float on top. */}
      <div ref={mainRef} className="relative min-h-0 flex-1">
        <SceneCanvas />
        <ModeToolbar />
        <ViewsToolbar />
        <ActionsToolbar onFullscreen={onFullscreen} />
        <ScaleBar />
      </div>

      <Inspector />
    </div>
  )
}
