import { useState } from 'react';

interface VideoUploaderProps {
  onUpload: (file: File) => void;
}

export default function VideoUploader({ onUpload }: VideoUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      onUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      onUpload(files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="video/*"
        onChange={handleFileInput}
        className="hidden"
        id="video-input"
      />
      <label htmlFor="video-input" className="block cursor-pointer">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-2xl p-12 text-center transition-all duration-300 ${
            isDragOver
              ? 'border-2 border-blue-500 bg-blue-50 scale-105'
              : 'border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-gray-300 hover:shadow-lg'
          }`}
        >
          <div className="text-5xl mb-4 opacity-80">🎬</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            動画をアップロード
          </h3>
          <p className="text-gray-500 mb-6 text-sm">
            ドラッグ＆ドロップするか、クリックして選択
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('video-input')?.click();
            }}
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
          >
            ファイルを選択
          </button>
        </div>
      </label>
    </div>
  );
}
