/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useStore } from '../store';
import { Rotation, Phase, RECEIVE_NODES, SERVE_NODES, TimelineNode } from '../types';
import { ChevronRight, ChevronLeft, FolderOpen } from 'lucide-react';

export const BottomPanel: React.FC<{ style?: React.CSSProperties }> = React.memo(({ style }) => {
  const { 
    activeRotation, 
    activePhase, 
    activeNode, 
    setRotation, 
    setPhase, 
    setNode,
    activeSchemaId,
    schemas
  } = useStore();

  const rotations: Rotation[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
  const phases: Phase[] = ['SERVE', 'RECEIVE'];
  
  const getNodesForPhase = (phase: Phase) => phase === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
  const currentNodes = getNodesForPhase(activePhase);

  const currentSchema = schemas.find(s => s.id === activeSchemaId);
  const isReadOnly = currentSchema?.isReadOnly;

  // Circular Carousel Logic
  const getFullSequence = useCallback(() => {
    const sequence: { rotation: Rotation; phase: Phase; node: TimelineNode }[] = [];
    rotations.forEach(r => {
      phases.forEach(p => {
        const nodes = getNodesForPhase(p);
        nodes.forEach(n => {
          sequence.push({ rotation: r, phase: p, node: n });
        });
      });
    });
    return sequence;
  }, []);

  const stepSequence = useCallback((dir: number) => {
    const sequence = getFullSequence();
    const currentIndex = sequence.findIndex(
      s => s.rotation === activeRotation && s.phase === activePhase && s.node === activeNode
    );
    
    if (currentIndex === -1) return;

    let nextIndex = (currentIndex + dir) % sequence.length;
    if (nextIndex < 0) nextIndex = sequence.length - 1;

    const next = sequence[nextIndex];
    setRotation(next.rotation);
    setPhase(next.phase);
    setNode(next.node);
  }, [activeRotation, activePhase, activeNode, setRotation, setPhase, setNode, getFullSequence]);

  const phaseColor = activePhase === 'RECEIVE' ? '#ff9f43' : '#3b82f6';

  return (
    <div 
      style={{ ...style, height: '160px' }}
      className="bg-white rounded-2xl border border-black/10 shadow-2xl overflow-hidden flex flex-col transition-none"
    >
      {/* Row 1: Rotations (R1-R6) - Individual Buttons */}
      <div className="flex justify-between items-center px-2 pt-2 pb-1">
        {rotations.map((rot) => (
          <button
            key={rot}
            onClick={() => setRotation(rot)}
            className={`flex-1 mx-2 py-2 text-xs font-black tracking-widest rounded-lg transition-none ${
              activeRotation === rot 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-50 text-gray-400 hover:bg-black/[0.05]'
            }`}
          >
            {rot}
          </button>
        ))}
      </div>

      {/* Row 2: Phase, Timeline Nodes, Arrows */}
      <div className="flex-1 flex items-center justify-between px-6 gap-8 relative">
        {/* Left: Phase Toggle */}
        <div className="flex flex-col gap-1 shrink-0 z-10">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {phases.map((phase) => (
              <button
                key={phase}
                onClick={() => setPhase(phase)}
                className={`px-4 py-2 text-[11px] font-black rounded-lg transition-none ${
                  activePhase === phase 
                    ? 'bg-white shadow-md' 
                    : 'text-gray-400 hover:bg-black/[0.05]'
                }`}
                style={{ color: activePhase === phase ? (phase === 'RECEIVE' ? '#ff9f43' : '#3b82f6') : undefined }}
              >
                {phase}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Timeline & Nodes */}
        <div className="flex-1 flex items-center justify-center relative min-w-0">
          {/* Timeline Line */}
          <div 
            className="absolute h-1 rounded-full opacity-20" 
            style={{ 
              backgroundColor: phaseColor,
              width: 'calc(100% - 40px)',
              left: '20px'
            }} 
          />
          
          <div className="flex items-center justify-between w-full relative z-10">
            {currentNodes.map((node) => (
              <button
                key={node}
                onClick={() => setNode(node as any)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black whitespace-nowrap transition-none border-2 ${
                  activeNode === node 
                    ? 'shadow-sm' 
                    : 'bg-white hover:bg-black/[0.05]'
                }`}
                style={{ 
                  borderColor: activeNode === node ? phaseColor : 'transparent',
                  backgroundColor: activeNode === node ? phaseColor : undefined,
                  color: activeNode === node ? 'white' : '#9ca3af'
                }}
              >
                {node}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Navigation Arrows */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          <button
            onClick={() => stepSequence(-1)}
            className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-black/[0.05] rounded-full text-gray-600 transition-none border border-black/5"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => stepSequence(1)}
            className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-black/[0.05] rounded-full text-gray-600 transition-none border border-black/5"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
});
