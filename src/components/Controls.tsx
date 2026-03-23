import React from 'react'

interface ControlsProps {
  videoSelected: boolean
  hasAreas: boolean
  isProcessing: boolean | null
  onProcess: () => void
  onClear: () => void
}

export function Controls({
  videoSelected,
  hasAreas,
  isProcessing,
  onProcess,
  onClear,
}: ControlsProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-4 mt-6">
      <button
        onClick={onProcess}
        disabled={!videoSelected || !hasAreas || isProcessing}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Processing...
          </span>
        ) : (
          '▶ Process Video'
        )}
      </button>

      <button
        onClick={onClear}
        disabled={!videoSelected}
        className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        🔄 Reset
      </button>

      <div className="pt-2 text-slate-400 text-sm space-y-1">
        <p className="flex items-center gap-2">
          {videoSelected ? '✓' : '○'} <span>Video selected</span>
        </p>
        <p className="flex items-center gap-2">
          {hasAreas ? '✓' : '○'} <span>Mosaic areas drawn ({hasAreas ? 'Yes' : 'No'})</span>
        </p>
      </div>
    </div>
  )
}
