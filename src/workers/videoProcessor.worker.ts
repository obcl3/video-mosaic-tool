import { MosaicArea } from '../types'

interface ProcessMessage {
  type: 'start'
  videoFile: ArrayBuffer
  mosaicAreas: MosaicArea[]
  mosaicSize: number
}

interface ProgressMessage {
  type: 'progress'
  percent: number
}

interface CompleteMessage {
  type: 'complete'
  blob: ArrayBuffer
}

interface ErrorMessage {
  type: 'error'
  error: string
}

type WorkerMessage = ProgressMessage | CompleteMessage | ErrorMessage

// Worker handler
self.onmessage = async (event: MessageEvent<ProcessMessage>) => {
  const { type, videoFile, mosaicAreas, mosaicSize } = event.data

  if (type !== 'start') return

  try {
    // Simulate processing with progress updates
    for (let i = 0; i <= 100; i += 10) {
      const progress: ProgressMessage = {
        type: 'progress',
        percent: i,
      }
      self.postMessage(progress)

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // For now, we'll just return the input as-is
    // In a real implementation, this would process the video with FFmpeg
    const result: CompleteMessage = {
      type: 'complete',
      blob: videoFile,
    }
    self.postMessage(result)
  } catch (error) {
    const errorMsg: ErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    self.postMessage(errorMsg)
  }
}

export type { ProcessMessage, ProgressMessage, CompleteMessage, ErrorMessage, WorkerMessage }
