import React, { useEffect, useRef, useState } from 'react'
import { MosaicArea } from '../types'

interface VideoCanvasProps {
  videoUrl: string
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  mosaicAreas: MosaicArea[]
  onAddArea: (area: MosaicArea) => void
  mosaicSize: number
}

export function VideoCanvas({
  videoUrl,
  videoRef,
  canvasRef,
  mosaicAreas,
  onAddArea,
  mosaicSize,
}: VideoCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentRect, setCurrentRect] = useState<MosaicArea | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && canvasRef.current) {
        const container = containerRef.current
        const canvas = canvasRef.current
        const rect = container.getBoundingClientRect()
        const scale = rect.width / canvas.width
        setScale(scale)
      }
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [canvasRef])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!videoUrl) return
    setIsDrawing(true)
    const pos = getMousePos(e)
    setStartPos(pos)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return

    const currentPos = getMousePos(e)
    const rect: MosaicArea = {
      id: Date.now(),
      x: Math.min(startPos.x, currentPos.x),
      y: Math.min(startPos.y, currentPos.y),
      width: Math.abs(currentPos.x - startPos.x),
      height: Math.abs(currentPos.y - startPos.y),
    }
    setCurrentRect(rect)
    redrawCanvas()
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentRect || currentRect.width < 10 || currentRect.height < 10) {
      setIsDrawing(false)
      setCurrentRect(null)
      return
    }

    onAddArea({
      ...currentRect,
      id: Date.now(),
    })
    setIsDrawing(false)
    setCurrentRect(null)
    redrawCanvas()
  }

  const redrawCanvas = () => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

    // Draw existing mosaic areas
    mosaicAreas.forEach((area) => {
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2
      ctx.strokeRect(area.x, area.y, area.width, area.height)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'
      ctx.fillRect(area.x, area.y, area.width, area.height)
    })

    // Draw current drawing rect
    if (currentRect && (currentRect.width > 0 || currentRect.height > 0)) {
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.1)'
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)
    }
  }

  const handleCanvasClick = () => {
    if (!videoRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div
        ref={containerRef}
        className="relative bg-black flex items-center justify-center max-h-96"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="hidden"
          onLoadedMetadata={() => {
            if (!canvasRef.current || !videoRef.current) return
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
            handleCanvasClick()
          }}
          onPlay={handleCanvasClick}
          onSeeked={handleCanvasClick}
        />
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
          className="cursor-crosshair max-w-full max-h-96"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>
      <div className="bg-slate-700 p-4 text-white text-sm">
        <p>📍 Draw rectangles to select mosaic areas (drag to create)</p>
        <p className="text-slate-400 mt-1">Selected areas: {mosaicAreas.length}</p>
      </div>
    </div>
  )
}
