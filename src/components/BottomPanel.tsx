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
  const skippedNodes = (useStore as any)(s => s.skippedNodes) || { SERVE: [], RECEIVE: [] };

  const rotations: Rotation[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
  const phases: Phase[] = ['SERVE', 'RECEIVE'];
  const ALL_SERVE_NODES = [...SERVE_NODES];
  const ALL_RECEIVE_NODES = [...RECEIVE_NODES];

  const getNodesForPhase = useCallback((phase: Phase) => {
    const all = phase === 'RECEIVE' ? ALL_RECEIVE_NODES : ALL_SERVE_NODES;
    const skipped: string[] = skippedNodes[phase] || [];
    return all.filter(n => !skipped.includes(n));
  }, [skippedNodes]);

  const currentNodes = getNodesForPhase(activePhase);
  const phaseColor = activePhase === 'RECEIVE' ? '#ff9f43' : '#3b82f6';

  const getFullSequence = useCallback(() => {
    const sequence: { rotation: Rotation; phase: Phase; node: TimelineNode }[] = [];
    rotations.forEach(r => {
      phases.forEach(p => {
        getNodesForPhase(p).forEach(n => sequence.push({ rotation: r, phase: p, node: n as TimelineNode }));
      });
    });
    return sequence;
  }, [skippedNodes]);

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
      <div className="flex items-center px-2 pt-2 pb-1.5 gap-1">
        {rotations.map((rot) => (
          <button
            key={rot}
            onClick={() => setRotation(rot)}
            className={`flex-1 py-2.5 text-xs font-black tracking-widest rounded-lg transition-none ${
              activeRotation === rot ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400'
            }`}
          >
            {rot}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-black/5" />

      {/* Row 2: Phase + Nodes + Arrows */}
      <div className="flex items-center px-2 py-2 gap-2">
        {/* Phase toggle - more prominent */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
          {phases.map((phase) => (
            <button
              key={phase}
              onClick={() => setPhase(phase)}
              className={`px-3 py-2 text-[11px] font-black rounded-lg transition-none ${
                activePhase === phase ? 'bg-white shadow-md' : 'text-gray-400'
              }`}
              style={{ color: activePhase === phase ? (phase === 'RECEIVE' ? '#ff9f43' : '#3b82f6') : undefined }}
            >
              {phase}
            </button>
          ))}
        </div>

        {/* Nodes with dashed line */}
        <div className="flex-1 flex items-center gap-1 relative">
          {/* Dashed timeline line */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-px"
            style={{
              backgroundImage: `repeating-linear-gradient(to right, ${phaseColor}55 0px, ${phaseColor}55 6px, transparent 6px, transparent 12px)`,
            }}
          />
          {currentNodes.map((node) => (
            <button
              key={node}
              onClick={() => setNode(node as any)}
              className="flex-1 py-2 rounded-lg text-[10px] font-black whitespace-nowrap transition-none border-2 relative z-10"
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
            className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-full text-gray-600 border border-black/5"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); stepSequence(1); }}
            onMouseDown={(e) => e.preventDefault()}
            className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-full text-gray-600 border border-black/5"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});