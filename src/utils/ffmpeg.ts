import { FFmpeg, toBlobURL } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { MosaicArea } from '../types'

let ffmpegInstance: FFmpeg | null = null

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.isLoaded()) {
    return ffmpegInstance
  }

  const ffmpeg = new FFmpeg()

  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist'
  
  ffmpeg.on('log', ({ type, message }) => {
    if (type === 'error') {
      console.error('[FFmpeg]', message)
    }
  })

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    ffmpegInstance = ffmpeg
    return ffmpeg
  } catch (error) {
    console.error('Failed to load FFmpeg:', error)
    throw error
  }
}

function generateMosaicFilter(
  mosaicAreas: MosaicArea[],
  mosaicSize: number,
  videoWidth: number,
  videoHeight: number
): string {
  // Create complex filter with pixelate effect for each area
  let filterChain = `scale=${videoWidth}:${videoHeight}`
  
  mosaicAreas.forEach((area, index) => {
    // Pixelate filter for mosaic effect: blur and scale
    const pixelSize = mosaicSize
    const scaledX = Math.round(area.x)
    const scaledY = Math.round(area.y)
    const scaledW = Math.round(area.width)
    const scaledH = Math.round(area.height)
    
    // Use boxblur to create mosaic effect
    filterChain += `,split[base][blur_${index}]` + (index === 0 ? '[base]' : '')
    filterChain += `[blur_${index}]crop=${scaledW}:${scaledH}:${scaledX}:${scaledY}[cropped_${index}]`
    filterChain += `[cropped_${index}]scale=${Math.ceil(scaledW / pixelSize)}:${Math.ceil(scaledH / pixelSize)}[small_${index}]`
    filterChain += `[small_${index}]scale=${scaledW}:${scaledH}[pixelated_${index}]`
  })

  return filterChain
}

export async function processVideoWithFFmpeg(
  ffmpeg: FFmpeg,
  videoFile: File,
  mosaicAreas: MosaicArea[],
  mosaicSize: number
): Promise<Blob> {
  const inputFileName = 'input.mp4'
  const outputFileName = 'output.mp4'

  try {
    // Write input file
    await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile))

    // Get video info to create proper filter
    // For now, we'll use a simpler approach with scale and fps
    const cmd = [
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      outputFileName,
    ]

    await ffmpeg.exec(cmd)

    // Read output file
    const outputData = await ffmpeg.readFile(outputFileName)
    const blob = new Blob([outputData], { type: 'video/mp4' })

    // Cleanup
    await ffmpeg.deleteFile(inputFileName)
    await ffmpeg.deleteFile(outputFileName)

    return blob
  } catch (error) {
    console.error('FFmpeg processing error:', error)
    throw error
  }
}

// Alternative: Use Web Worker for background processing
export function createProcessingWorker(): Worker {
  const workerCode = `
    self.onmessage = async (event) => {
      const { videoFile, mosaicAreas, mosaicSize } = event.data
      
      try {
        // Simulate processing
        self.postMessage({
          status: 'processing',
          progress: 0,
        })
        
        // In a real implementation, this would use FFmpeg via wasm-bindgen
        // For now, just create a dummy blob
        const dummy = new Uint8Array(1000)
        self.postMessage({
          status: 'complete',
          blob: dummy,
        })
      } catch (error) {
        self.postMessage({
          status: 'error',
          error: error.message,
        })
      }
    }
  `

  const blob = new Blob([workerCode], { type: 'application/javascript' })
  const workerUrl = URL.createObjectURL(blob)
  return new Worker(workerUrl)
}
