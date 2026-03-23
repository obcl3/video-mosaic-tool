import { useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import VideoUploader from './components/VideoUploader';
import VideoPreview from './components/VideoPreview';
import MosaicControls from './components/MosaicControls';
import ProcessingStatus from './components/ProcessingStatus';

export interface MosaicArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strength: number;
}

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string>('');
  const [mosaicAreas, setMosaicAreas] = useState<MosaicArea[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ffmpeg] = useState(() => new FFmpeg());
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize FFmpeg
  useEffect(() => {
    const initFFmpeg = async () => {
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      } catch (error) {
        console.error('Failed to initialize FFmpeg:', error);
      }
    };

    initFFmpeg();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .catch(error => console.error('Service Worker registration failed:', error));
    }
  }, [ffmpeg]);

  const handleVideoUpload = (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoURL(url);
    setMosaicAreas([]);
  };

  const handleAddMosaicArea = (area: Omit<MosaicArea, 'id'>) => {
    const newArea: MosaicArea = {
      ...area,
      id: Date.now().toString(),
    };
    setMosaicAreas([...mosaicAreas, newArea]);
  };

  const handleRemoveMosaicArea = (id: string) => {
    setMosaicAreas(mosaicAreas.filter(area => area.id !== id));
  };

  const handleUpdateMosaicArea = (id: string, updates: Partial<MosaicArea>) => {
    setMosaicAreas(
      mosaicAreas.map(area =>
        area.id === id ? { ...area, ...updates } : area
      )
    );
  };

  const processVideo = async () => {
    if (!videoFile || mosaicAreas.length === 0 || !ffmpeg.loaded) {
      alert('Please upload a video and add at least one mosaic area');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Write input video to FFmpeg filesystem
      const inputName = 'input_video.mp4';
      const outputName = 'output_video.mp4';

      const data = await videoFile.arrayBuffer();
      ffmpeg.writeFile(inputName, new Uint8Array(data));

      // Build FFmpeg filter string for mosaics
      const filterComplex = buildMosaicFilter(mosaicAreas);

      // Run FFmpeg
      await ffmpeg.exec([
        '-i', inputName,
        '-vf', filterComplex,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-c:a', 'aac',
        outputName,
      ]);

      // Read output file
      const outputData = await ffmpeg.readFile(outputName);
      const blob = new Blob([new Uint8Array(outputData as ArrayBuffer)], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `mosaic_${videoFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Cleanup
      ffmpeg.deleteFile(inputName);
      ffmpeg.deleteFile(outputName);

      setProgress(100);
      setTimeout(() => setIsProcessing(false), 1000);
    } catch (error) {
      console.error('Video processing error:', error);
      alert('Error processing video. Check console for details.');
      setIsProcessing(false);
    }
  };

  const buildMosaicFilter = (areas: MosaicArea[]): string => {
    // Create mosaic filter for each area
    let filter = '';

    areas.forEach((area, index) => {
      const boxblurSize = Math.ceil((area.strength / 100) * 50);
      if (index === 0) {
        filter = `[0:v]boxblur=${boxblurSize}:${boxblurSize}=enable='between(x,${area.x},${area.x + area.width})*between(y,${area.y},${area.y + area.height})'[v${index}]`;
      } else {
        filter += `;[v${index - 1}]boxblur=${boxblurSize}:${boxblurSize}=enable='between(x,${area.x},${area.x + area.width})*between(y,${area.y},${area.y + area.height})'[v${index}]`;
      }
    });

    return filter || '[0:v][0:v]';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎬 Video Mosaic Tool</h1>
          <p className="text-gray-600">Local video processing - No uploads, completely offline</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel */}
          <div className="space-y-6">
            <VideoUploader onUpload={handleVideoUpload} />
            {videoURL && (
              <VideoPreview
                videoURL={videoURL}
                videoRef={videoRef}
                mosaicAreas={mosaicAreas}
                onAddArea={handleAddMosaicArea}
              />
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {videoURL && (
              <>
                <MosaicControls
                  areas={mosaicAreas}
                  onUpdateArea={handleUpdateMosaicArea}
                  onRemoveArea={handleRemoveMosaicArea}
                />
                <ProcessingStatus
                  isProcessing={isProcessing}
                  progress={progress}
                  onProcess={processVideo}
                  hasAreas={mosaicAreas.length > 0}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
