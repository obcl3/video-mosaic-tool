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
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-blue-400'
          }`}
        >
          <div className="text-4xl mb-4">📹</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Drop video here
          </h3>
          <p className="text-gray-600 mb-4">
            or click to select a video file (MP4, WebM, etc.)
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('video-input')?.click();
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Select File
          </button>
        </div>
      </label>
    </div>
  );
}
