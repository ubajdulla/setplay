import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { Player, PlayerRole } from '../types';
import { User, Palette, Plus, ArrowRightLeft, Trash2, X, Circle as CircleIcon, Edit2 } from 'lucide-react';
import { EditableText } from './EditableText';

const ROSTER_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', 
  '#14b8a6', '#6366f1', '#000000', '#ffffff'
];

export const getContrastColor = (hexColor: string) => {
  if (!hexColor || hexColor.length < 7) return 'white';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
};

const PlayerCard = React.memo(({ 
  player, 
  isOnField, 
  saveChanges, 
  updatePlayer, 
  removePlayer, 
  onRemove,
  benchPlayers,
  onSwap,
  isReadOnly
}: { 
  player: Player; 
  isOnField: boolean;
  saveChanges: boolean;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  onRemove: (id: string) => void;
  benchPlayers: Player[];
  onSwap: (id1: string, id2: string) => void;
  isReadOnly: boolean;
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  const handleColorSelect = useCallback((color: string) => {
    if (isReadOnly) return;
    updatePlayer(player.id, { color });
    setShowColorPicker(false);
  }, [player.id, updatePlayer, isReadOnly]);

  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isReadOnly) return;
    updatePlayer(player.id, { role: e.target.value as PlayerRole });
  }, [player.id, updatePlayer, isReadOnly]);

  const handleRename = useCallback((newName: string) => {
    if (isReadOnly) return;
    updatePlayer(player.id, { name: newName });
  }, [player.id, updatePlayer, isReadOnly]);

  return (
    <div className={`p-3 rounded-xl border transition-none relative ${
      isOnField ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
    } ${showColorPicker || showSwitchDropdown ? 'z-50' : 'z-0'} ${isReadOnly ? 'opacity-80' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div 
            className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center transition-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
            style={{ backgroundColor: player.color }}
            onClick={() => !isReadOnly && setShowColorPicker(!showColorPicker)}
          >
            {!isReadOnly && <Palette size={12} style={{ color: getContrastColor(player.color) }} className="opacity-0 group-hover:opacity-100" />}
          </div>
          
          {showColorPicker && (
            <>
              <div className="fixed inset-0 z-[110]" onClick={() => setShowColorPicker(false)} />
              <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-gray-200 z-[120] grid grid-cols-4 gap-1 w-32">
                {ROSTER_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-6 h-6 rounded-full border transition-none ${
                      player.color === color ? 'ring-2 ring-blue-400 border-white' : 'border-gray-100 hover:bg-black/[0.05]'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1 group/role">
            <select
              value={player.role}
              disabled={isReadOnly}
              onChange={(e) => {
                handleRoleChange(e);
                e.target.blur();
              }}
              className={`text-[9px] font-black text-gray-400 uppercase bg-transparent border-none p-0 focus:ring-0 focus:outline-none appearance-none transition-none ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:text-blue-600'}`}
            >
              {['S', 'OH', 'MB', 'OPP', 'L'].map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {!isReadOnly && <Edit2 size={8} className="text-gray-300 opacity-0 group-hover/role:opacity-100 transition-none" />}
          </div>
          
          <div className="group/name flex items-center gap-1 -mt-0.5">
            <EditableText 
              value={player.name}
              onSave={handleRename}
              allowClickToEdit={!isReadOnly}
              className="text-sm font-bold text-gray-800 leading-tight"
            />
            {!isReadOnly && <Edit2 size={10} className="text-gray-300 opacity-0 group-hover/name:opacity-100 transition-none" />}
          </div>
        </div>

        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => {
              setShowSwitchDropdown(!showSwitchDropdown);
            }}
            disabled={isReadOnly || !saveChanges || !isOnField}
            className={`p-2 rounded-lg transition-none focus:outline-none ${
              !isReadOnly && saveChanges && isOnField ? 'hover:bg-black/[0.05] text-gray-400 hover:text-blue-600' : 'text-gray-200 cursor-not-allowed'
            }`}
            title={isReadOnly ? "Read-only schema" : !saveChanges ? "Enable SAVE CHANGES to switch" : !isOnField ? "Only on-field players can be switched" : "Switch Player"}
          >
            <ArrowRightLeft size={16} />
          </button>

          {showSwitchDropdown && (
            <>
              <div className="fixed inset-0 z-[110]" onClick={() => setShowSwitchDropdown(false)} />
              <div className="absolute top-full right-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-gray-200 z-[120] min-w-[180px]">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Select from bench</div>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto no-scrollbar">
                  {benchPlayers.map(benchPlayer => (
                    <button
                      key={benchPlayer.id}
                      onClick={() => {
                        onSwap(player.id, benchPlayer.id);
                        setShowSwitchDropdown(false);
                      }}
                      className="flex items-center justify-between p-2 hover:bg-black/[0.05] rounded-lg transition-none group text-left"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700 group-hover:text-blue-700">{benchPlayer.name}</span>
                        <span className="text-[9px] text-gray-400 uppercase">{benchPlayer.role}</span>
                      </div>
                      <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: benchPlayer.color }} />
                    </button>
                  ))}
                  {benchPlayers.length === 0 && (
                    <div className="text-[10px] text-gray-400 italic px-2 py-1">No players on bench</div>
                  )}
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => !isReadOnly && onRemove(player.id)}
            disabled={isReadOnly}
            className={`p-2 rounded-lg transition-none focus:outline-none ${
              isReadOnly ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-black/[0.05] text-gray-400 hover:text-red-600'
            }`}
            title={isReadOnly ? "Read-only schema" : "Remove Player"}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});

export const PlayerRoster: React.FC = React.memo(() => {
  const { 
    players, 
    onFieldPositions, 
    benchPlayers: storeBenchPlayers,
    activeRotation,
    activePhase,
    updatePlayer, 
    swapPlayers,
    addPlayer,
    removePlayer,
    saveChanges,
    isReadOnly
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const currentOnField = useMemo(() => {
    try {
      return onFieldPositions[activeRotation]?.[activePhase] || {};
    } catch (e) {
      return {};
    }
  }, [onFieldPositions, activeRotation, activePhase]);

  const currentBench = useMemo(() => {
    try {
      return storeBenchPlayers[activeRotation]?.[activePhase] || [];
    } catch (e) {
      return [];
    }
  }, [storeBenchPlayers, activeRotation, activePhase]);

  const onField = useMemo(() => players.filter(p => currentOnField[p.id]), [players, currentOnField]);
  const onBench = useMemo(() => players.filter(p => currentBench.includes(p.id)), [players, currentBench]);

  const handleAddPlayer = useCallback((role: PlayerRole) => {
    addPlayer(role);
    setShowAddModal(false);
  }, [addPlayer]);

  const handleOpenRemoveModal = useCallback((id: string) => {
    setConfirmRemoveId(id);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (confirmRemoveId) {
      removePlayer(confirmRemoveId);
      setConfirmRemoveId(null);
    }
  }, [confirmRemoveId, removePlayer]);

  return (
    <div className="flex flex-col gap-6 p-4 select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <User size={14} />
          Player Roster
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => !isReadOnly && setShowAddModal(true)}
            disabled={isReadOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-none focus:outline-none ${
              isReadOnly ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus size={14} />
            Add Player
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">On Field</span>
            <span className="text-[10px] font-bold text-gray-400">{onField.length}/6</span>
          </div>
          <div className="grid gap-2">
            {onField.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                isOnField={true} 
                saveChanges={saveChanges}
                updatePlayer={updatePlayer}
                removePlayer={removePlayer}
                onSwap={swapPlayers}
                onRemove={handleOpenRemoveModal}
                benchPlayers={onBench}
                isReadOnly={isReadOnly}
              />
            ))}
            {onField.length === 0 && (
              <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-xl text-xs text-gray-400">
                No players on field
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bench</span>
            <span className="text-[10px] font-bold text-gray-400">{onBench.length}</span>
          </div>
          <div className="grid gap-2">
            {onBench.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                isOnField={false} 
                saveChanges={saveChanges}
                updatePlayer={updatePlayer}
                removePlayer={removePlayer}
                onSwap={swapPlayers}
                onRemove={handleOpenRemoveModal}
                benchPlayers={[]}
                isReadOnly={isReadOnly}
              />
            ))}
            {onBench.length === 0 && (
              <div className="text-center py-4 text-xs text-gray-300 italic">
                Bench is empty
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add New Player</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {(['S', 'OH', 'MB', 'OPP', 'L'] as PlayerRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => handleAddPlayer(role)}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-black/[0.05] border border-gray-200 rounded-xl transition-none group"
                >
                  <span className="font-bold text-gray-700 group-hover:text-blue-700">{role}</span>
                  <span className="text-xs text-gray-400">
                    {role === 'S' && 'Setter'}
                    {role === 'OH' && 'Outside Hitter'}
                    {role === 'MB' && 'Middle Blocker'}
                    {role === 'OPP' && 'Opposite'}
                    {role === 'L' && 'Libero'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmRemoveId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Remove Player</h2>
              <button onClick={() => setConfirmRemoveId(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <p className="text-sm text-gray-500">
              Are you sure you want to remove <span className="font-bold text-gray-900">{players.find(p => p.id === confirmRemoveId)?.name}</span> from the roster?
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmRemoveId(null)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-black/[0.05] text-gray-700 rounded-xl font-bold transition-none"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmRemove}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-none"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
