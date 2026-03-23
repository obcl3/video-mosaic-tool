import { useState, useCallback, useEffect } from 'react'
import { MosaicArea } from '../types'
import { loadFFmpeg, processVideoWithFFmpeg } from '../utils/ffmpeg'

const SETTINGS_KEY = 'mosaicToolSettings'

export function useVideoProcessor(
  _videoRef: React.RefObject<HTMLVideoElement | null>,
  _canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [mosaicAreas, setMosaicAreas] = useState<MosaicArea[]>([])
  const [mosaicSize, setMosaicSize] = useState(8)
  const [isProcessing, setIsProcessing] = useState<boolean | null>(null)

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      try {
        const settings = JSON.parse(saved)
        if (settings.mosaicSize) {
          setMosaicSize(settings.mosaicSize)
        }
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
  }, [])

  const addMosaicArea = useCallback((area: MosaicArea) => {
    setMosaicAreas((prev) => [...prev, area])
  }, [])

  const removeMosaicArea = useCallback((id: number) => {
    setMosaicAreas((prev) => prev.filter((area) => area.id !== id))
  }, [])

  const clearMosaicAreas = useCallback(() => {
    setMosaicAreas([])
  }, [])

  const processVideo = useCallback(
    async (videoFile: File) => {
      if (mosaicAreas.length === 0) {
        alert('Please draw at least one mosaic area')
        return
      }

      try {
        setIsProcessing(true)
        
        // Initialize FFmpeg
        const ffmpeg = await loadFFmpeg()
        
        // Process the video
        const outputBlob = await processVideoWithFFmpeg(
          ffmpeg,
          videoFile,
          mosaicAreas,
          mosaicSize
        )

        // Store blob in sessionStorage for download
        const reader = new FileReader()
        reader.onload = () => {
          const blobData = reader.result as string
          sessionStorage.setItem('mosaicVideoBlob', blobData)
        }
        reader.readAsArrayBuffer(outputBlob)

        setIsProcessing(false)
      } catch (error) {
        console.error('Video processing failed:', error)
        alert('Video processing failed. Please try again.')
        setIsProcessing(false)
      }
    },
    [mosaicAreas, mosaicSize]
  )

  const downloadVideo = useCallback(() => {
    const blobData = sessionStorage.getItem('mosaicVideoBlob')
    if (blobData) {
      // Download is handled by DownloadButton component
      console.log('Download initiated')
    }
  }, [])

  return {
    mosaicAreas,
    mosaicSize,
    setMosaicSize,
    addMosaicArea,
    removeMosaicArea,
    clearMosaicAreas,
    processVideo,
    isProcessing,
    downloadVideo,
  }
}
