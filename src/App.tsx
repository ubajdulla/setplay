/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Court } from './components/Court';
import { Toolbar } from './components/Toolbar';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { BottomPanel } from './components/BottomPanel';
import { useStore } from './store';
import { deserializeState } from './utils';
import { RECEIVE_NODES, SERVE_NODES, UserRole } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function App() {
  const { 
    loadState, 
    undo, 
    redo, 
    activeSchemaId, 
    loadSchema, 
    courtZoom,
    leftPanelOpen,
    rightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel
  } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const COURT_VISUAL_SIZE = 900; // Fixed visual size for the court

  // Calculate court visual width to set BottomPanel width
  const courtVisualWidth = COURT_VISUAL_SIZE;
  const panelWidth = courtVisualWidth;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const { activeRotation, activePhase, activeNode, setNode, undo, redo, isDragging } = useStore.getState();

      if (isDragging) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
        return;
      }

      const nodes = activePhase === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
      const currentIndex = nodes.indexOf(activeNode as any);
      const rotations: any[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (currentIndex < nodes.length - 1) {
          setNode(nodes[currentIndex + 1]);
        } else if (activePhase === 'SERVE') {
          const { setPhase, setNode } = useStore.getState();
          setPhase('RECEIVE');
          setNode(RECEIVE_NODES[0]);
        } else {
          const { setRotation, setPhase, setNode } = useStore.getState();
          const rIdx = rotations.indexOf(activeRotation);
          const nextRIdx = (rIdx + 1) % 6;
          setRotation(rotations[nextRIdx]);
          setPhase('SERVE');
          setNode(SERVE_NODES[0]);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (currentIndex > 0) {
          setNode(nodes[currentIndex - 1]);
        } else if (activePhase === 'RECEIVE') {
          const { setPhase, setNode } = useStore.getState();
          setPhase('SERVE');
          setNode(SERVE_NODES[SERVE_NODES.length - 1]);
        } else {
          const { setRotation, setPhase, setNode } = useStore.getState();
          const rIdx = rotations.indexOf(activeRotation);
          const prevRIdx = (rIdx - 1 + 6) % 6;
          setRotation(rotations[prevRIdx]);
          setPhase('RECEIVE');
          setNode(RECEIVE_NODES[RECEIVE_NODES.length - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Load state from URL if present
    const params = new URLSearchParams(window.location.search);
    const schema = params.get('schema');
    const role = params.get('role') as UserRole | null;
    if (schema) {
      const state = deserializeState(schema);
      if (state) {
        loadState(state, role || 'OWNER');
      }
    } else if (activeSchemaId) {
      loadSchema(activeSchemaId);
    }
    // If no URL schema and no saved activeSchemaId, the store already initializes
    // with the default JSON state — so we don't need to do anything else

    // Handle resizing
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loadState, activeSchemaId, loadSchema]);

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans overflow-hidden select-none relative">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel Toggle */}
        <button
          onClick={toggleLeftPanel}
          className={`absolute top-1/2 -translate-y-1/2 left-0 z-[60] p-2 bg-white border border-l-0 border-black/10 rounded-r-xl shadow-md text-gray-500 hover:text-blue-600 transition-all ${leftPanelOpen ? 'translate-x-80' : 'translate-x-0'}`}
          title={leftPanelOpen ? "Close Archive" : "Open Archive"}
        >
          {leftPanelOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>

        {/* Left Panel: Archive */}
        <motion.div
          initial={false}
          animate={{ width: leftPanelOpen ? 320 : 0, opacity: leftPanelOpen ? 1 : 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="overflow-hidden border-r border-black/10 bg-gray-50 shrink-0"
        >
          <div className="w-80 h-full">
            <LeftPanel />
          </div>
        </motion.div>

        {/* Center: Canvas & Bottom Panel Island */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-cyan-400">
          <div ref={containerRef} className="flex-1 relative overflow-auto flex items-center justify-center p-20">
            <div 
              style={{ width: COURT_VISUAL_SIZE, height: COURT_VISUAL_SIZE }}
              className="relative z-0 shadow-2xl"
            >
              <Court width={COURT_VISUAL_SIZE} height={COURT_VISUAL_SIZE} />
            </div>
          </div>
        </div>

        {/* Floating Toolbar - Fixed to screen center */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="pointer-events-auto">
            <Toolbar />
          </div>
        </div>

        {/* Bottom Panel - Fixed to screen center */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <BottomPanel style={{ width: panelWidth }} />
          </div>
        </div>

        {/* Right Panel Toggle */}
        <button
          onClick={toggleRightPanel}
          className={`absolute top-1/2 -translate-y-1/2 right-0 z-[60] p-2 bg-white border border-r-0 border-black/10 rounded-l-xl shadow-md text-gray-500 hover:text-blue-600 transition-all ${rightPanelOpen ? '-translate-x-80' : 'translate-x-0'}`}
          title={rightPanelOpen ? "Close Roster" : "Open Roster"}
        >
          {rightPanelOpen ? <ChevronRight size={20} /> : <Menu size={20} />}
        </button>

        {/* Right Panel: Roster & Controls */}
        <motion.div
          initial={false}
          animate={{ width: rightPanelOpen ? 320 : 0, opacity: rightPanelOpen ? 1 : 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="overflow-hidden border-l border-black/10 bg-gray-50 shrink-0"
        >
          <div className="w-80 h-full">
            <RightPanel />
          </div>
        </motion.div>
      </div>
    </div>
  );
}