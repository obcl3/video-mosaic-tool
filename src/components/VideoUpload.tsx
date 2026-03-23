import React, { useRef } from 'react'

interface VideoUploadProps {
  onVideoSelect: (file: File) => void
  videoSelected: boolean
}

export function VideoUpload({ onVideoSelect, videoSelected }: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      onVideoSelect(file)
    } else {
      alert('Please select a valid video file')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('video/')) {
      onVideoSelect(file)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-slate-500 hover:bg-slate-700 transition-all"
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="text-4xl mb-4">📹</div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {videoSelected ? '✓ Video Selected' : 'Select Video'}
      </h3>
      <p className="text-slate-400 text-sm mb-2">
        Drag and drop a video file here or click to browse
      </p>
      <p className="text-slate-500 text-xs">
        Supports MP4, WebM, Ogg, and more
      </p>
    </div>
  )
}
