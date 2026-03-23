import React, { useEffect, useState } from 'react'

interface SettingsPanelProps {
  mosaicSize: number
  onSizeChange: (size: number) => void
  onClose: () => void
}

const STORAGE_KEY = 'mosaicToolSettings'

export function SettingsPanel({ mosaicSize, onSizeChange, onClose }: SettingsPanelProps) {
  const [localSize, setLocalSize] = useState(mosaicSize)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const settings = JSON.parse(saved)
      setLocalSize(settings.mosaicSize || mosaicSize)
      onSizeChange(settings.mosaicSize || mosaicSize)
    }
  }, [])

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value)
    setLocalSize(newSize)
    onSizeChange(newSize)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mosaicSize: newSize }))
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Mosaic Pixel Size: {localSize}px
          </label>
          <input
            type="range"
            min="2"
            max="32"
            value={localSize}
            onChange={handleSizeChange}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <p className="text-xs text-slate-500 mt-2">
            Smaller values = finer detail, larger values = more blur
          </p>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-2">About</h3>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>✓ Works completely offline</li>
            <li>✓ No data is sent to servers</li>
            <li>✓ Settings saved locally</li>
            <li>✓ Install as an app on mobile</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
