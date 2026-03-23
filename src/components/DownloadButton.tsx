import React, { useEffect, useState } from 'react'

interface DownloadButtonProps {
  onDownload: () => void
}

export function DownloadButton({ onDownload }: DownloadButtonProps) {
  const [hasBlob, setHasBlob] = useState(false)

  useEffect(() => {
    // Check if there's a blob ready to download
    const blob = sessionStorage.getItem('mosaicVideoBlob')
    setHasBlob(!!blob)
  }, [])

  const handleClick = () => {
    const blobData = sessionStorage.getItem('mosaicVideoBlob')
    if (blobData) {
      const blob = new Blob([blobData], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mosaic-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      sessionStorage.removeItem('mosaicVideoBlob')
      setHasBlob(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!hasBlob}
      className="py-3 px-8 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
    >
      <span>⬇️</span>
      <span>Download Processed Video</span>
    </button>
  )
}
