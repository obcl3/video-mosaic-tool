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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Mosaic Areas</h2>
      
      {areas.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Select areas in the preview to start
        </p>
      ) : (
        <div className="space-y-4">
          {areas.map((area, index) => (
            <div
              key={area.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-800">
                  Area {index + 1}
                </h3>
                <button
                  onClick={() => onRemoveArea(area.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="block text-gray-600 mb-1">X</label>
                    <input
                      type="number"
                      value={Math.round(area.x)}
                      onChange={(e) => onUpdateArea(area.id, { x: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Y</label>
                    <input
                      type="number"
                      value={Math.round(area.y)}
                      onChange={(e) => onUpdateArea(area.id, { y: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Width</label>
                    <input
                      type="number"
                      value={Math.round(area.width)}
                      onChange={(e) => onUpdateArea(area.id, { width: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Height</label>
                    <input
                      type="number"
                      value={Math.round(area.height)}
                      onChange={(e) => onUpdateArea(area.id, { height: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">
                    Mosaic Strength: {Math.round(area.strength)}%
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
