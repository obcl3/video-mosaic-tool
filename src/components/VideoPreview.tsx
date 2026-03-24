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
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      const mouseEvent = e as React.MouseEvent;
      return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top,
      };
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const pos = getPointerPos(e);
    setStartPos(pos);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current || !containerRef.current) return;

    const currentPos = getPointerPos(e);

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

  const redrawCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect || currentRect.width < 10 || currentRect.height < 10) {
      setIsDrawing(false);
      setCurrentRect(null);
      redrawCanvas();
      return;
    }

    onAddArea({ x: currentRect.x, y: currentRect.y, width: currentRect.width, height: currentRect.height, strength: 50 });
    setIsDrawing(false);
    setCurrentRect(null);
    redrawCanvas();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">動画プレビュー</h2>
      <p className="text-sm text-gray-500 mb-6">
        クリック＆ドラッグで領域を選択
      </p>
      
      <div
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden touch-none select-none"
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
