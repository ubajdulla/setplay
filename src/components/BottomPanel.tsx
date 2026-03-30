/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useStore } from '../store';
import { Rotation, Phase, RECEIVE_NODES, SERVE_NODES, TimelineNode } from '../types';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export const BottomPanel: React.FC<{ style?: React.CSSProperties }> = React.memo(({ style }) => {
  const { activeRotation, activePhase, activeNode, setRotation, setPhase, setNode } = useStore();

  const rotations: Rotation[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
  const phases: Phase[] = ['SERVE', 'RECEIVE'];
  const getNodesForPhase = (phase: Phase) => phase === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
  const currentNodes = getNodesForPhase(activePhase);
  const phaseColor = activePhase === 'RECEIVE' ? '#ff9f43' : '#3b82f6';

  const getFullSequence = useCallback(() => {
    const sequence: { rotation: Rotation; phase: Phase; node: TimelineNode }[] = [];
    rotations.forEach(r => phases.forEach(p => getNodesForPhase(p).forEach(n => sequence.push({ rotation: r, phase: p, node: n }))));
    return sequence;
  }, []);

  const stepSequence = useCallback((dir: number) => {
    const sequence = getFullSequence();
    const currentIndex = sequence.findIndex(s => s.rotation === activeRotation && s.phase === activePhase && s.node === activeNode);
    if (currentIndex === -1) return;
    let nextIndex = (currentIndex + dir + sequence.length) % sequence.length;
    const next = sequence[nextIndex];
    setRotation(next.rotation);
    setPhase(next.phase);
    setNode(next.node);
  }, [activeRotation, activePhase, activeNode, setRotation, setPhase, setNode, getFullSequence]);

  return (
    <div style={style} className="bg-white rounded-2xl border border-black/10 shadow-2xl overflow-hidden flex flex-col">
      {/* Row 1: Rotations */}
      <div className="flex items-center px-1.5 pt-1.5 pb-1 gap-1">
        {rotations.map((rot) => (
          <button
            key={rot}
            onClick={() => setRotation(rot)}
            className={`flex-1 py-2 text-[10px] font-black tracking-widest rounded-lg transition-none ${
              activeRotation === rot ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400'
            }`}
          >
            {rot}
          </button>
        ))}
      </div>

      {/* Row 2: Phase + Nodes + Arrows */}
      <div className="flex items-center px-1.5 pb-1.5 gap-1.5">
        {/* Phase */}
        <div className="flex bg-gray-100 p-0.5 rounded-xl shrink-0">
          {phases.map((phase) => (
            <button
              key={phase}
              onClick={() => setPhase(phase)}
              className={`px-2 py-1.5 text-[9px] font-black rounded-lg transition-none ${activePhase === phase ? 'bg-white shadow-sm' : 'text-gray-400'}`}
              style={{ color: activePhase === phase ? (phase === 'RECEIVE' ? '#ff9f43' : '#3b82f6') : undefined }}
            >
              {phase === 'RECEIVE' ? 'RCV' : 'SRV'}
            </button>
          ))}
        </div>

        {/* Nodes */}
        <div className="flex-1 flex items-center gap-0.5 relative">
          <div
            className="absolute h-0.5 rounded-full opacity-20 top-1/2 -translate-y-1/2"
            style={{ backgroundColor: phaseColor, left: 2, right: 2 }}
          />
          {currentNodes.map((node) => (
            <button
              key={node}
              onClick={() => setNode(node as any)}
              className="flex-1 py-2 rounded-lg text-[8px] font-black whitespace-nowrap transition-none border-2 relative z-10"
              style={{
                borderColor: activeNode === node ? phaseColor : 'transparent',
                backgroundColor: activeNode === node ? phaseColor : 'white',
                color: activeNode === node ? 'white' : '#9ca3af',
              }}
            >
              {node}
            </button>
          ))}
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.preventDefault(); stepSequence(-1); }}
            onMouseDown={(e) => e.preventDefault()}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-600 border border-black/5"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); stepSequence(1); }}
            onMouseDown={(e) => e.preventDefault()}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-600 border border-black/5"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});