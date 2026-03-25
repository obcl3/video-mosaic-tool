import { useEffect, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

interface Shape {
  id: string
  type: 'circle' | 'rect'
  x: number
  y: number
  width: number
  height: number
}

interface TouchState {
  shapeId: string
  type: 'move' | 'resize'
  startX: number
  startY: number
  startWidth: number
  startHeight: number
}

function App() {
  // ========== State Variables ==========
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [frameImage, setFrameImage] = useState<string>('')
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [shapes, setShapes] = useState<Shape[]>([])
  const [blurStrength, setBlurStrength] = useState(50)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initProgress, setInitProgress] = useState(0)
  const [touchState, setTouchState] = useState<TouchState | null>(null)

  // ========== useRef Variables ==========
  const [ffmpeg] = useState(() => new FFmpeg())
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

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
        setFrameSize({ width: video.videoWidth, height: video.videoHeight })

        video.currentTime = 0.1
      }

      video.oncanplay = () => {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          console.log('Drawing frame to canvas...')
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
    setShapes([])
    setFrameImage('')

    try {
      await extractFirstFrame(file)
    } catch (error) {
      console.error('Failed to extract frame:', error)
      alert('フレーム抽出に失敗しました')
    }
  }

  const addShape = (type: 'circle' | 'rect') => {
    const newShape: Shape = {
      id: Date.now().toString(),
      type,
      x: frameSize.width / 2 - 50,
      y: frameSize.height / 2 - 50,
      width: 100,
      height: 100,
    }
    setShapes([...shapes, newShape])
    console.log('Shape added:', newShape)
  }

  const deleteShape = (id: string) => {
    setShapes(shapes.filter((s) => s.id !== id))
    console.log('Shape deleted:', id)
  }

  const handleShapeMouseDown = (e: React.MouseEvent | React.TouchEvent, shapeId: string, type: 'move' | 'resize') => {
    e.preventDefault()
    e.stopPropagation()

    const pos = 'touches' in e ? e.touches[0] : e
    setTouchState({
      shapeId,
      type,
      startX: pos.clientX,
      startY: pos.clientY,
      startWidth: shapes.find((s) => s.id === shapeId)?.width || 0,
      startHeight: shapes.find((s) => s.id === shapeId)?.height || 0,
    })
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!touchState || !containerRef.current) return

    e.preventDefault()
    const pos = 'touches' in e ? e.touches[0] : e
    const rect = containerRef.current.getBoundingClientRect()

    const deltaX = pos.clientX - touchState.startX
    const deltaY = pos.clientY - touchState.startY

    const scaleX = rect.width / frameSize.width
    const scaleY = rect.height / frameSize.height

    setShapes(
      shapes.map((shape) => {
        if (shape.id !== touchState.shapeId) return shape

        if (touchState.type === 'move') {
          return {
            ...shape,
            x: Math.max(0, Math.min(shape.x + deltaX / scaleX, frameSize.width - shape.width)),
            y: Math.max(0, Math.min(shape.y + deltaY / scaleY, frameSize.height - shape.height)),
          }
        } else {
          // resize
          const newWidth = Math.max(20, touchState.startWidth + deltaX / scaleX)
          const newHeight = Math.max(20, touchState.startHeight + deltaY / scaleY)
          return {
            ...shape,
            width: newWidth,
            height: newHeight,
          }
        }
      })
    )
  }

  const handleMouseUp = () => {
    setTouchState(null)
  }

  const getBoundingBox = (): Shape | null => {
    if (shapes.length === 0) return null

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    shapes.forEach((shape) => {
      minX = Math.min(minX, shape.x)
      minY = Math.min(minY, shape.y)
      maxX = Math.max(maxX, shape.x + shape.width)
      maxY = Math.max(maxY, shape.y + shape.height)
    })

    return {
      id: 'bbox',
      type: 'rect',
      x: Math.max(0, minX),
      y: Math.max(0, minY),
      width: Math.min(frameSize.width - minX, maxX - minX),
      height: Math.min(frameSize.height - minY, maxY - minY),
    }
  }

  const processVideo = async () => {
    console.log('Process video called:', { videoFile: !!videoFile, shapes: shapes.length, ffmpegLoaded: ffmpeg.loaded })

    if (!videoFile || shapes.length === 0 || !ffmpeg.loaded) {
      const reason = !videoFile ? '動画未選択' : shapes.length === 0 ? '領域未追加' : 'FFmpeg未初期化'
      console.error('Validation failed:', reason)
      alert(`${reason}\n形を追加して領域を指定してください`)
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

      const bbox = getBoundingBox()
      if (!bbox) {
        throw new Error('Bounding box calculation failed')
      }

      console.log('Bounding box:', bbox)
      const blurSize = Math.max(2, Math.ceil((blurStrength / 100) * 50))

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
      <div className="max-w-3xl mx-auto">
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
          {videoFile && <p className="mt-2 text-sm text-gray-600">✓ {videoFile.name}</p>}
        </div>

        {/* Frame Preview */}
        {frameImage && (
          <>
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">ぼかす領域を選択</label>

              <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden shadow-lg mb-4">
                <img src={frameImage} alt="First frame" className="w-full h-auto block" />

                {/* SVG Overlay */}
                <svg
                  ref={svgRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ pointerEvents: shapes.length > 0 ? 'auto' : 'none' }}
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchEnd={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {shapes.map((shape) => {
                    const rect = containerRef.current?.getBoundingClientRect()
                    const scaleX = (rect?.width || 0) / frameSize.width
                    const scaleY = (rect?.height || 0) / frameSize.height

                    return (
                      <g key={shape.id}>
                        {shape.type === 'circle' ? (
                          <circle
                            cx={(shape.x + shape.width / 2) * scaleX}
                            cy={(shape.y + shape.height / 2) * scaleY}
                            r={(shape.width / 2) * scaleX}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            onMouseDown={(e) => handleShapeMouseDown(e, shape.id, 'move')}
                            onTouchStart={(e) => handleShapeMouseDown(e, shape.id, 'move')}
                            style={{ cursor: 'move' }}
                          />
                        ) : (
                          <rect
                            x={shape.x * scaleX}
                            y={shape.y * scaleY}
                            width={shape.width * scaleX}
                            height={shape.height * scaleY}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            onMouseDown={(e) => handleShapeMouseDown(e, shape.id, 'move')}
                            onTouchStart={(e) => handleShapeMouseDown(e, shape.id, 'move')}
                            style={{ cursor: 'move' }}
                          />
                        )}

                        {/* Resize Handle (bottom-right corner) */}
                        <circle
                          cx={(shape.x + shape.width) * scaleX}
                          cy={(shape.y + shape.height) * scaleY}
                          r="8"
                          fill="#fbbf24"
                          stroke="#f59e0b"
                          strokeWidth="1"
                          onMouseDown={(e) => handleShapeMouseDown(e, shape.id, 'resize')}
                          onTouchStart={(e) => handleShapeMouseDown(e, shape.id, 'resize')}
                          style={{ cursor: 'nwse-resize' }}
                        />
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Shape Controls */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => addShape('circle')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  + 丸を追加
                </button>
                <button
                  onClick={() => addShape('rect')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                >
                  + 四角を追加
                </button>
              </div>

              {/* Shape List */}
              {shapes.length > 0 && (
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{shapes.length}個の領域を追加</p>
                  <div className="space-y-2">
                    {shapes.map((shape) => (
                      <div
                        key={shape.id}
                        className="flex justify-between items-center bg-white p-2 rounded border border-gray-200"
                      >
                        <span className="text-sm text-gray-600">
                          {shape.type === 'circle' ? '●' : '■'} {Math.round(shape.width)}x{Math.round(shape.height)}
                        </span>
                        <button
                          onClick={() => deleteShape(shape.id)}
                          className="text-red-500 hover:text-red-700 font-semibold text-sm"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
                disabled={isProcessing || shapes.length === 0}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-300 ${
                  isProcessing || shapes.length === 0
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
