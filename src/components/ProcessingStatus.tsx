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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">処理実行</h2>
      
      {isProcessing && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">
              動画を処理中...
            </span>
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
        onClick={onProcess}
        disabled={isProcessing || !hasAreas}
        className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
          isProcessing || !hasAreas
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:from-blue-600 hover:to-blue-700'
        }`}
      >
        {isProcessing ? '⏳ 処理中...' : '✨ モザイク処理 & ダウンロード'}
      </button>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>💡 ご注意：</strong>すべての処理はお使いのデバイスで完全に行われます。
          動画データがサーバーにアップロードされることはありません。
        </p>
      </div>

      <div className="mt-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
        <p className="text-sm text-amber-800">
          <strong>⚡ ヒント：</strong>初回処理は30〜60秒かかります（FFmpeg読み込み）。
          2回目以降はより高速です。
        </p>
      </div>
    </div>
  );
}
