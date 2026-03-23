import React, { useState, useRef, useEffect } from 'react'
import { VideoUpload } from './components/VideoUpload'
import { VideoCanvas } from './components/VideoCanvas'
import { Controls } from './components/Controls'
import { DownloadButton } from './components/DownloadButton'
import { SettingsPanel } from './components/SettingsPanel'
import { useVideoProcessor } from './hooks/useVideoProcessor'

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const {
    mosaicAreas,
    mosaicSize,
    setMosaicSize,
    addMosaicArea,
    removeMosaicArea,
    clearMosaicAreas,
    processVideo,
    isProcessing,
    downloadVideo,
  } = useVideoProcessor(videoRef, canvasRef)

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  const handleVideoSelect = (file: File) => {
    setVideoFile(file)
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
  }

  const handleReset = () => {
    setVideoFile(null)
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl('')
    clearMosaicAreas()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">🎬</span>
              Video Mosaic Tool
            </h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              title="Toggle Settings"
            >
              ⚙️
            </button>
          </div>
          <p className="text-slate-400">
            Process videos locally with mosaic effects. Works offline!
          </p>
        </header>

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            mosaicSize={mosaicSize}
            onSizeChange={setMosaicSize}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <VideoUpload onVideoSelect={handleVideoSelect} videoSelected={!!videoFile} />
            <Controls
              videoSelected={!!videoFile}
              hasAreas={mosaicAreas.length > 0}
              isProcessing={isProcessing}
              onProcess={() => processVideo(videoFile!)}
              onClear={handleReset}
            />
          </div>

          {/* Video Canvas Section */}
          <div className="lg:col-span-2">
            <VideoCanvas
              videoUrl={videoUrl}
              videoRef={videoRef}
              canvasRef={canvasRef}
              mosaicAreas={mosaicAreas}
              onAddArea={addMosaicArea}
              mosaicSize={mosaicSize}
            />
          </div>
        </div>

        {/* Download Section */}
        {isProcessing === false && videoFile && (
          <div className="flex justify-center">
            <DownloadButton onDownload={() => downloadVideo()} />
          </div>
        )}

        {/* Debug Info */}
        <footer className="mt-12 pt-6 border-t border-slate-700 text-slate-500 text-sm">
          <p>
            Mosaic Areas: {mosaicAreas.length} | Mosaic Size: {mosaicSize}px
          </p>
          <p className="mt-2">
            💡 Tip: Draw rectangles on the video to select mosaic areas. All processing happens locally in your browser.
          </p>
        </footer>
      </div>
    </div>
  )
}
