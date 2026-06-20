import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { TopBar } from '@/components/TopBar'
import { UploadScreen } from '@/screens/UploadScreen'
import { ProcessingScreen } from '@/screens/ProcessingScreen'
import { ViewerScreen } from '@/screens/ViewerScreen'

export default function App() {
  const screen = useAppStore((s) => s.screen)
  const theme = useAppStore((s) => s.theme)

  // Sync the active theme onto <html data-theme>.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <main className="relative flex-1 overflow-hidden">
        {screen === 'upload' && <UploadScreen />}
        {screen === 'processing' && <ProcessingScreen />}
        {screen === 'viewer' && <ViewerScreen />}
      </main>
    </div>
  )
}
