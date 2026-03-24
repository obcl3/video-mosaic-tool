import { MosaicArea } from '../App';

interface MosaicControlsProps {
  areas: MosaicArea[];
  onUpdateArea: (id: string, updates: Partial<MosaicArea>) => void;
  onRemoveArea: (id: string) => void;
}

export default function MosaicControls({
  areas,
  onUpdateArea,
  onRemoveArea,
}: MosaicControlsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">モザイク領域</h2>
      
      {areas.length === 0 ? (
        <p className="text-gray-400 text-center py-12 text-sm">
          プレビューで領域を選択して開始
        </p>
      ) : (
        <div className="space-y-4">
          {areas.map((area, index) => (
            <div
              key={area.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900">
                  領域 {index + 1}
                </h3>
                <button
                  onClick={() => onRemoveArea(area.id)}
                  className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  削除
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">X座標</label>
                    <input
                      type="number"
                      value={Math.round(area.x)}
                      onChange={(e) => onUpdateArea(area.id, { x: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Y座標</label>
                    <input
                      type="number"
                      value={Math.round(area.y)}
                      onChange={(e) => onUpdateArea(area.id, { y: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">幅</label>
                    <input
                      type="number"
                      value={Math.round(area.width)}
                      onChange={(e) => onUpdateArea(area.id, { width: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">高さ</label>
                    <input
                      type="number"
                      value={Math.round(area.height)}
                      onChange={(e) => onUpdateArea(area.id, { height: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-3">
                    モザイク強度: <span className="text-blue-600 font-bold">{Math.round(area.strength)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={area.strength}
                    onChange={(e) => onUpdateArea(area.id, { strength: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
