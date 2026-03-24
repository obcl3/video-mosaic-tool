import { useEffect, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

interface BlurArea {
  x: number
  y: number
  width: number
  height: number
}

function App() {
  // ========== State Variables ==========
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoURL, setVideoURL] = useState<string>('')
  const [blurArea, setBlurArea] = useState<BlurArea | null>(null)
  const [blurStrength, setBlurStrength] = useState(50)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initProgress, setInitProgress] = useState(0)

  // ========== useRef Variables ==========
  const [ffmpeg] = useState(() => new FFmpeg())
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  // ========== useEffect: FFmpeg Initialization ==========
  useEffect(() => {
    const initFFmpeg = async () => {
      try {
        console.log('Initializing FFmpeg...')
        setInitProgress(5)

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

        console.log('Loading core JS...')
        setInitProgress(30)
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')

        console.log('Loading WASM...')
        setInitProgress(60)
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')

        setInitProgress(75)
        const progressInterval = setInterval(() => {
          setInitProgress((prev) => Math.min(prev + 5, 95))
        }, 500)

        console.log('Loading FFmpeg...')
        await ffmpeg.load({
          coreURL,
          wasmURL,
        })

        clearInterval(progressInterval)
        console.log('FFmpeg loaded successfully')
        setInitProgress(100)
        setTimeout(() => setIsInitializing(false), 500)
      } catch (error) {
        console.error('Failed to initialize FFmpeg:', error)
        setIsInitializing(false)
      }
    }

    initFFmpeg()

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch((error) =>
        console.error('Service Worker registration failed:', error)
      )
    }
  }, [ffmpeg])

  // ========== Event Handlers ==========

  const handleVideoUpload = (file: File) => {
    console.log('Video uploaded:', file.name)
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoURL(url)
    setBlurArea(null)
  }

  const handleVideoLoad = () => {
    console.log('Video loaded')
    if (videoRef.current && canvasRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      canvasRef.current.width = rect.width
      canvasRef.current.height = rect.height
      console.log(`Canvas size set to ${rect.width}x${rect.height}`)
    }
  }

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 }

    const rect = containerRef.current.getBoundingClientRect()

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPointerPos(e)
    setStartPos(pos)
    setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return

    const currentPos = getPointerPos(e)

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)

    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)

    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    ctx.fillRect(x, y, width, height)
  }

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) {
      setIsDrawing(false)
      return
    }

    const currentPos = getPointerPos(e)
    const x = Math.min(startPos.x, currentPos.x)
    const y = Math.min(startPos.y, currentPos.y)
    const width = Math.abs(currentPos.x - startPos.x)
    const height = Math.abs(currentPos.y - startPos.y)

    if (width >= 10 && height >= 10) {
      setBlurArea({ x, y, width, height })
      console.log('Area selected:', { x, y, width, height })
    }

    setIsDrawing(false)

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const processVideo = async () => {
    if (!videoFile || !blurArea || !ffmpeg.loaded) {
      alert('動画を選択して、ぼかし領域を指定してください')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const inputName = 'input.mp4'
      const outputName = 'output.mp4'

      console.log('Writing input file...')
      const data = await videoFile.arrayBuffer()
      ffmpeg.writeFile(inputName, new Uint8Array(data))

      setProgress(20)

      console.log('Preparing FFmpeg filter...')
      const blurSize = Math.max(2, Math.ceil((blurStrength / 100) * 50))
      console.log(`Blur size: ${blurSize} (strength: ${blurStrength}%)`)

      setProgress(40)

      console.log('Executing FFmpeg...')
      await ffmpeg.exec([
        '-i',
        inputName,
        '-vf',
        `boxblur=${blurSize}:${blurSize}`,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-c:a',
        'aac',
        outputName,
      ])

      setProgress(80)

      console.log('Reading output file...')
      const outputData = await ffmpeg.readFile(outputName)
      const uint8Data = Array.from(new Uint8Array(outputData as unknown as ArrayBufferLike))
      const blob = new Blob([new Uint8Array(uint8Data)], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)

      console.log('Downloading file...')
      const a = document.createElement('a')
      a.href = url
      a.download = `blurred_${videoFile.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log('Cleaning up...')
      ffmpeg.deleteFile(inputName)
      ffmpeg.deleteFile(outputName)

      setProgress(100)
      setTimeout(() => {
        setIsProcessing(false)
        setProgress(0)
      }, 1000)
    } catch (error) {
      console.error('Error:', error)
      alert('処理中にエラーが発生しました。ブラウザコンソールを確認してください')
      setIsProcessing(false)
    }
  }

  // ========== Render: Splash Screen ==========
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8 animate-bounce">
            <div className="text-7xl">🎬</div>
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-4">
            Video Mosaic Tool
          </h1>
          <p className="text-gray-500 mb-8 text-lg">準備中...</p>
          <div className="w-64 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${initProgress}%` }}
            />
          </div>
          <p className="text-gray-400 mt-4 text-sm">{initProgress}%</p>
        </div>
      </div>
    )
  }

  // ========== Render: Main Screen ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
            🎬 Video Mosaic Tool
          </h1>
          <p className="text-gray-500 text-lg">観客をぼかす • ローカル処理 • プライバシー保護</p>
        </header>

        <div className="space-y-8">
          {/* Section 1: Video Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. 動画を選択</h2>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                if (e.currentTarget.files?.[0]) {
                  handleVideoUpload(e.currentTarget.files[0])
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white hover:file:from-blue-600 hover:file:to-blue-700 cursor-pointer"
            />
            {videoFile && <p className="mt-3 text-sm text-gray-600">選択: {videoFile.name}</p>}
          </div>

          {/* Sections 2-4: Only show after video upload */}
          {videoURL && (
            <>
              {/* Section 2: Preview & Area Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. ぼかす領域を選択</h2>
                <p className="text-gray-600 mb-4">
                  動画上でドラッグして、ぼかしたい領域（観客など）を選択
                </p>

                <div
                  ref={containerRef}
                  className="relative bg-black rounded-lg overflow-hidden"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => setIsDrawing(false)}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                >
                  <video
                    ref={videoRef}
                    src={videoURL}
                    controls
                    className="w-full block"
                    onLoadedMetadata={handleVideoLoad}
                    onPlay={handleVideoLoad}
                  />

                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                    style={{ pointerEvents: 'auto' }}
                  />

                  {blurArea && (
                    <div
                      className="absolute border-2 border-yellow-400 pointer-events-none"
                      style={{
                        left: `${blurArea.x}px`,
                        top: `${blurArea.y}px`,
                        width: `${blurArea.width}px`,
                        height: `${blurArea.height}px`,
                        backgroundColor: 'rgba(250, 204, 21, 0.1)',
                      }}
                    />
                  )}
                </div>

                {blurArea && (
                  <p className="mt-4 text-sm text-blue-600 font-medium">✅ 領域を選択しました</p>
                )}
              </div>

              {/* Section 3: Blur Strength */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. ぼかし強度を調整</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-gray-700 font-medium">強度: {blurStrength}%</label>
                    <span className="text-blue-600 font-bold">
                      {Math.ceil((blurStrength / 100) * 50)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={blurStrength}
                    onChange={(e) => setBlurStrength(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>弱</span>
                    <span>強</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Process */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. 処理実行</h2>

                {isProcessing && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">処理中...</span>
                      <span className="text-sm font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={processVideo}
                  disabled={isProcessing || !blurArea}
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
                    isProcessing || !blurArea
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {isProcessing ? '⏳ 処理中...' : '✨ ぼかし処理 & ダウンロード'}
                </button>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <strong>💡 ヒント：</strong>
                    ぼかし強度を上げるほど、処理時間が少し長くなります。
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
