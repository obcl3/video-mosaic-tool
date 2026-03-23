interface ProcessingStatusProps {
  isProcessing: boolean;
  progress: number;
  onProcess: () => void;
  hasAreas: boolean;
}

export default function ProcessingStatus({
  isProcessing,
  progress,
  onProcess,
  hasAreas,
}: ProcessingStatusProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Processing</h2>
      
      {isProcessing && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Processing video...
            </span>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={onProcess}
        disabled={isProcessing || !hasAreas}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          isProcessing || !hasAreas
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isProcessing ? '🔄 Processing...' : '✨ Apply Mosaic & Download'}
      </button>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Info:</strong> All processing happens locally on your device. 
          No video data is uploaded anywhere.
        </p>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Note:</strong> First processing may take 30-60 seconds as FFmpeg loads. 
          Subsequent videos will be faster.
        </p>
      </div>
    </div>
  );
}
