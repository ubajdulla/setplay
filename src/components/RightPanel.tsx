import React, { useState } from 'react';
import { DisplayOptions } from './BoardSettings';
import { PlayerRoster } from './PlayerRoster';
import { ActionControls } from './ActionControls';
import { Users, Settings } from 'lucide-react';

export const RightPanel: React.FC = React.memo(() => {
  const [activeTab, setActiveTab] = useState<'roster' | 'settings'>('roster');

  return (
    <div className="w-80 bg-gray-50 border-l border-black/10 flex flex-col h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'roster' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users size={14} />
          Roster
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Settings size={14} />
          Settings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'roster' && <PlayerRoster />}
        {activeTab === 'settings' && (
          <div className="flex flex-col">
            <DisplayOptions />
            <ActionControls />
          </div>
        )}
      </div>
    </div>
  );
});
