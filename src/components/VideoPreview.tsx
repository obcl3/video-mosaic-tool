import { useState, useRef } from 'react';
import { MosaicArea } from '../App';

interface VideoPreviewProps {
  videoURL: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  mosaicAreas: MosaicArea[];
  onAddArea: (area: Omit<MosaicArea, 'id'>) => void;
}

export default function VideoPreview({
  videoURL,
  videoRef,
  mosaicAreas,
  onAddArea,
}: VideoPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setStartPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Draw preview rectangle
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(x, y, width, height);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const endPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const x = Math.min(startPos.x, endPos.x);
    const y = Math.min(startPos.y, endPos.y);
    const width = Math.abs(endPos.x - startPos.x);
    const height = Math.abs(endPos.y - startPos.y);

    if (width > 10 && height > 10) {
      onAddArea({ x, y, width, height, strength: 50 });
    }

    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">動画プレビュー</h2>
      <p className="text-sm text-gray-500 mb-6">
        クリック＆ドラッグで領域を選択
      </p>
      
      <div
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDrawing(false)}
      >
        <video
          ref={videoRef}
          src={videoURL}
          controls
          className="w-full h-auto max-h-96"
        />
        
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full cursor-crosshair"
          style={{ display: isDrawing ? 'block' : 'none' }}
        />

        {/* Display existing mosaic areas */}
        {mosaicAreas.map(area => (
          <div
            key={area.id}
            className="absolute border-2 border-yellow-400 pointer-events-none"
            style={{
              left: `${area.x}px`,
              top: `${area.y}px`,
              width: `${area.width}px`,
              height: `${area.height}px`,
              backgroundColor: 'rgba(250, 204, 21, 0.1)',
            }}
          />
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        {mosaicAreas.length === 0 ? (
          <p className="text-gray-400">領域がまだ選択されていません</p>
        ) : (
          <p className="text-blue-600 font-medium">{mosaicAreas.length}個の領域を選択</p>
        )}
      </div>
    </div>
  );
}
