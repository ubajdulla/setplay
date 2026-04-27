import React, { useCallback } from 'react';
import { useStore } from '../store';
import { SERVE_NODES, RECEIVE_NODES } from '../types';

export const BoardControl: React.FC = React.memo(() => null);

export const DisplayOptions: React.FC = React.memo(() => {
  const { toggles, toggleSetting, showBall, toggleBall, skippedNodes, toggleNodeSkip } = useStore();

  const handleToggle = useCallback((key: string) => toggleSetting(key as any), [toggleSetting]);

  const phaseKey = (phase: string) => phase as 'SERVE' | 'RECEIVE';
  const isNodeSkipped = (phase: string, node: string) => (skippedNodes[phaseKey(phase)] || []).includes(node);
  const isPhaseAllSkipped = (phase: string, nodes: readonly string[]) =>
    nodes.every(n => (skippedNodes[phaseKey(phase)] || []).includes(n));

  const togglePhaseAll = (phase: string, nodes: readonly string[]) => {
    const allSkipped = isPhaseAllSkipped(phase, nodes);
    nodes.forEach(n => {
      const skipped = (skippedNodes[phaseKey(phase)] || []).includes(n);
      if (allSkipped && skipped) toggleNodeSkip(phase, n);
      else if (!allSkipped && !skipped) toggleNodeSkip(phase, n);
    });
  };

  return (
    <>
      {/* Display Options */}
      <div className="flex flex-col gap-3 p-4 border-t border-black/5 select-none">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Display Options</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50">
            <span className="text-sm text-gray-700">Show Ball 🏐</span>
            <input type="checkbox" checked={showBall} onChange={toggleBall} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
          </label>
          {[
            { key: 'smartValidator', label: 'Show Validator' },
            { key: 'showZones', label: 'Show Zones' },
            { key: 'showBench', label: 'Show Bench' }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50">
              <span className="text-sm text-gray-700">{label}</span>
              <input type="checkbox" checked={(toggles as any)[key]} onChange={() => handleToggle(key)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            </label>
          ))}
        </div>
      </div>

      {/* Skip Nodes */}
      <div className="flex flex-col gap-3 p-4 border-t border-black/5 select-none">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skip Nodes</h3>

        {/* SERVE */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between px-2 py-1 cursor-pointer group">
            <span className="text-sm font-black text-blue-500 uppercase tracking-widest">SERVE</span>
            <input
              type="checkbox"
              checked={!isPhaseAllSkipped('SERVE', SERVE_NODES)}
              onChange={() => togglePhaseAll('SERVE', SERVE_NODES)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 accent-blue-500"
            />
          </label>
          {SERVE_NODES.map(node => (
            <label key={node} className="flex items-center justify-between p-3 bg-white border border-blue-50 rounded-lg cursor-pointer hover:bg-blue-50/50 ml-2">
              <span className="text-sm text-gray-700">{node}</span>
              <input
                type="checkbox"
                checked={!isNodeSkipped('SERVE', node)}
                onChange={() => toggleNodeSkip('SERVE', node)}
                className="w-4 h-4 rounded border-gray-300 accent-blue-500"
              />
            </label>
          ))}
        </div>

        {/* RECEIVE */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between px-2 py-1 cursor-pointer group">
            <span className="text-sm font-black text-orange-400 uppercase tracking-widest">RECEIVE</span>
            <input
              type="checkbox"
              checked={!isPhaseAllSkipped('RECEIVE', RECEIVE_NODES)}
              onChange={() => togglePhaseAll('RECEIVE', RECEIVE_NODES)}
              className="w-4 h-4 rounded border-gray-300 accent-orange-400"
            />
          </label>
          {RECEIVE_NODES.map(node => (
            <label key={node} className="flex items-center justify-between p-3 bg-white border border-orange-50 rounded-lg cursor-pointer hover:bg-orange-50/50 ml-2">
              <span className="text-sm text-gray-700">{node}</span>
              <input
                type="checkbox"
                checked={!isNodeSkipped('RECEIVE', node)}
                onChange={() => toggleNodeSkip('RECEIVE', node)}
                className="w-4 h-4 rounded border-gray-300 accent-orange-400"
              />
            </label>
          ))}
        </div>
      </div>
    </>
  );
});