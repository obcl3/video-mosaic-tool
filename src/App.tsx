import { useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string>('');
  const [blurStrength, setBlurStrength] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [ffmpeg] = useState(() => new FFmpeg());
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize FFmpeg
  useEffect(() => {
    const initFFmpeg = async () => {
      try {
        setInitProgress(5);
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        
        setInitProgress(30);
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        
        setInitProgress(60);
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
        
        setInitProgress(75);
        const progressInterval = setInterval(() => {
          setInitProgress((prev) => Math.min(prev + 5, 95));
        }, 500);
        
        await ffmpeg.load({
          coreURL,
          wasmURL,
        });
        
        clearInterval(progressInterval);
        setInitProgress(100);
        setTimeout(() => setIsInitializing(false), 500);
      } catch (error) {
        console.error('Failed to initialize FFmpeg:', error);
        setIsInitializing(false);
      }
    };

    initFFmpeg();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .catch(error => console.error('Service Worker registration failed:', error));
    }
  }, [ffmpeg]);

  const handleVideoUpload = (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoURL(url);
  };

  const processVideo = async () => {
    if (!videoFile || !ffmpeg.loaded) {
      alert('動画を選択してください');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const inputName = 'input.mp4';
      const outputName = 'output.mp4';

      const data = await videoFile.arrayBuffer();
      ffmpeg.writeFile(inputName, new Uint8Array(data));

      setProgress(20);

      // Simple blur filter applied to entire video
      const blurSize = Math.max(2, Math.ceil((blurStrength / 100) * 50));
      const filterComplex = `boxblur=${blurSize}:${blurSize}`;

      setProgress(40);

      await ffmpeg.exec([
        '-i', inputName,
        '-vf', filterComplex,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-c:a', 'aac',
        outputName,
      ]);

      setProgress(80);

      const outputData = await ffmpeg.readFile(outputName);
      const uint8Data = Array.from(new Uint8Array(outputData as unknown as ArrayBufferLike));
      const blob = new Blob([new Uint8Array(uint8Data)], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `blurred_${videoFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      ffmpeg.deleteFile(inputName);
      ffmpeg.deleteFile(outputName);

      setProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      alert('処理中にエラーが発生しました');
      setIsProcessing(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8 animate-bounce">
            <div className="text-7xl">🎬</div>
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-4">
            Video Blur Tool
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
            🎬 Video Blur Tool
          </h1>
          <p className="text-gray-500 text-lg">観客をぼかす • ローカル処理 • プライバシー保護</p>
        </header>

        <div className="space-y-8">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. 動画を選択</h2>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                if (e.currentTarget.files?.[0]) {
                  handleVideoUpload(e.currentTarget.files[0]);
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-blue-600 file:text-white hover:file:from-blue-600 hover:file:to-blue-700 cursor-pointer"
            />
            {videoFile && (
              <p className="mt-3 text-sm text-gray-600">選択: {videoFile.name}</p>
            )}
          </div>

          {/* Preview Section */}
          {videoURL && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. プレビュー</h2>
                <video
                  ref={videoRef}
                  src={videoURL}
                  controls
                  className="w-full rounded-lg bg-black"
                />
              </div>

              {/* Blur Strength Control */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. ぼかし強度を調整</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-gray-700 font-medium">強度: {blurStrength}%</label>
                    <span className="text-blue-600 font-bold">{Math.ceil((blurStrength / 100) * 50)}</span>
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

              {/* Process Section */}
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
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
                    isProcessing
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {isProcessing ? '⏳ 処理中...' : '✨ ぼかし処理 & ダウンロード'}
                </button>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <strong>💡 ヒント：</strong>ぼかし強度を上げるほど、処理時間が少し長くなります。
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
