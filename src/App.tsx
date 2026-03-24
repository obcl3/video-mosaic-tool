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
  const [frameImage, setFrameImage] = useState<string>('')
  const [blurArea, setBlurArea] = useState<BlurArea | null>(null)
  const [blurStrength, setBlurStrength] = useState(50)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initProgress, setInitProgress] = useState(0)

  // ========== useRef Variables ==========
  const [ffmpeg] = useState(() => new FFmpeg())
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

        setInitProgress(30)
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')

        setInitProgress(60)
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')

        setInitProgress(75)
        const progressInterval = setInterval(() => {
          setInitProgress((prev) => Math.min(prev + 5, 95))
        }, 500)

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

  // ========== Helper: Extract First Frame ==========
  const extractFirstFrame = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')

      video.onloadedmetadata = () => {
        console.log(`Video dimensions: ${video.videoWidth}x${video.videoHeight}`)
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          canvas.toBlob((blob) => {
            if (blob) {
              const imageUrl = URL.createObjectURL(blob)
              setFrameImage(imageUrl)
              console.log('First frame extracted and set')
              resolve()
            } else {
              reject(new Error('Canvas to Blob failed'))
            }
          }, 'image/png')
        } else {
          reject(new Error('Failed to get canvas context'))
        }
      }

      video.onerror = () => {
        reject(new Error('Failed to load video'))
      }

      video.src = URL.createObjectURL(file)
    })
  }

  // ========== Event Handlers ==========

  const handleVideoUpload = async (file: File) => {
    console.log('Video uploaded:', file.name)
    setVideoFile(file)
    setBlurArea(null)
    setFrameImage('')

    try {
      await extractFirstFrame(file)
    } catch (error) {
      console.error('Failed to extract frame:', error)
      alert('フレーム抽出に失敗しました')
    }
  }

  const handleCanvasLoad = () => {
    console.log('Canvas loaded for area selection')
    if (containerRef.current && canvasRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvasRef.current.width = Math.ceil(rect.width * dpr)
      canvasRef.current.height = Math.ceil(rect.height * dpr)
      canvasRef.current.style.width = `${rect.width}px`
      canvasRef.current.style.height = `${rect.height}px`

      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      console.log(`Canvas size set to ${rect.width}x${rect.height}`)
    }
  }

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 }

    const rect = containerRef.current.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * dpr,
        y: (touch.clientY - rect.top) * dpr,
      }
    } else {
      return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
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
      alert('動画を選択して、ぼかす領域を指定してください')
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

      // iOS Safari 対応
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

      if (isIOS) {
        const win = window.open(url, '_blank')
        if (!win) {
          alert('ポップアップがブロックされています。ブラウザ設定を確認してください')
        }
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `blurred_${videoFile.name}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }

      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
            🎬 Video Mosaic Tool
          </h1>
          <p className="text-gray-600">動画の観客をぼかしてプライバシーを保護</p>
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">動画ファイルを選択</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              if (e.currentTarget.files?.[0]) {
                handleVideoUpload(e.currentTarget.files[0])
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white hover:file:from-blue-600 hover:file:to-blue-700 cursor-pointer"
          />
          {videoFile && (
            <p className="mt-2 text-sm text-gray-600">✓ {videoFile.name}</p>
          )}
        </div>

        {/* Frame Preview & Area Selection */}
        {frameImage && (
          <>
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">ぼかす領域を選択</label>
              <p className="text-xs text-gray-500 mb-3">
                動画の1フレーム目上をドラッグして、ぼかしたい領域を指定してください
              </p>

              <div
                ref={containerRef}
                className="relative bg-black rounded-lg overflow-hidden shadow-lg"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setIsDrawing(false)}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
              >
                <img
                  src={frameImage}
                  alt="First frame"
                  className="w-full h-auto block"
                  onLoad={handleCanvasLoad}
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
                      left: `${(blurArea.x / (canvasRef.current?.width || 1)) * 100}%`,
                      top: `${(blurArea.y / (canvasRef.current?.height || 1)) * 100}%`,
                      width: `${(blurArea.width / (canvasRef.current?.width || 1)) * 100}%`,
                      height: `${(blurArea.height / (canvasRef.current?.height || 1)) * 100}%`,
                      backgroundColor: 'rgba(250, 204, 21, 0.1)',
                    }}
                  />
                )}
              </div>

              {blurArea && (
                <p className="mt-2 text-sm text-green-600 font-medium">✓ 領域を選択しました</p>
              )}
            </div>

            {/* Blur Strength */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-gray-700">ぼかし強度</label>
                <span className="text-sm font-bold text-blue-600">{blurStrength}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={blurStrength}
                onChange={(e) => setBlurStrength(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Process Button */}
            <div>
              {isProcessing && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">処理中...</span>
                    <span className="text-sm font-bold text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={processVideo}
                disabled={isProcessing || !blurArea}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-300 ${
                  isProcessing || !blurArea
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                {isProcessing ? '⏳ 処理中...' : '✨ ぼかし処理 & ダウンロード'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
