import React, { useCallback, useState } from 'react';
import { useStore } from '../store';
import { Settings, Lock, Unlock, RotateCcw, Undo2, Redo2, Trash2, X, AlertTriangle } from 'lucide-react';

export const BoardControl: React.FC = React.memo(() => {
  return null;
});

export const DisplayOptions: React.FC = React.memo(() => {
  const { toggles, toggleSetting, courtZoom, setCourtZoom, showBall, toggleBall } = useStore();
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  const handleToggle = useCallback((key: string) => toggleSetting(key as any), [toggleSetting]);

  const handleWipe = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  return (
    <div className="flex flex-col gap-3 p-4 border-t border-black/5 select-none">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Display Options</h3>
      
      <div className="space-y-2">
        <label className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <span className="text-sm text-gray-700">Show Ball 🏐</span>
          <input 
            type="checkbox" 
            checked={showBall} 
            onChange={toggleBall}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
        {[
          { key: 'smartValidator', label: 'Show Validator' },
          { key: 'showZones', label: 'Show Zones' },
          { key: 'showBench', label: 'Show Bench' }
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-700">{label}</span>
            <input 
              type="checkbox" 
              checked={(toggles as any)[key]} 
              onChange={() => handleToggle(key)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        ))}
      </div>
    </div>
  );
});
