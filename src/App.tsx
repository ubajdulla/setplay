/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Court } from './components/Court';
import { Toolbar } from './components/Toolbar';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { BottomPanel } from './components/BottomPanel';
import { useStore } from './store';
import { deserializeState } from './utils';
import { RECEIVE_NODES, SERVE_NODES, UserRole } from './types';
import { motion } from 'motion/react';
import { Menu, ChevronLeft, ChevronRight, FolderOpen, Users } from 'lucide-react';

type MobileTab = 'archive' | 'court' | 'roster';

export default function App() {
  const { 
    loadState, 
    activeSchemaId, 
    loadSchema, 
    leftPanelOpen,
    rightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
  } = useStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mobileTab, setMobileTab] = useState<MobileTab>('court');
  const [isMobile, setIsMobile] = useState(false);

  const COURT_VISUAL_SIZE = 900;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      const { activeRotation, activePhase, activeNode, setNode, undo, redo, isDragging } = useStore.getState();
      if (isDragging) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        else if (e.key === 'y') { e.preventDefault(); redo(); }
        return;
      }
      const nodes = activePhase === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
      const currentIndex = nodes.indexOf(activeNode as any);
      const rotations: any[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (currentIndex < nodes.length - 1) { setNode(nodes[currentIndex + 1]); }
        else if (activePhase === 'SERVE') { const { setPhase, setNode } = useStore.getState(); setPhase('RECEIVE'); setNode(RECEIVE_NODES[0]); }
        else { const { setRotation, setPhase, setNode } = useStore.getState(); const rIdx = rotations.indexOf(activeRotation); setRotation(rotations[(rIdx + 1) % 6]); setPhase('SERVE'); setNode(SERVE_NODES[0]); }
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (currentIndex > 0) { setNode(nodes[currentIndex - 1]); }
        else if (activePhase === 'RECEIVE') { const { setPhase, setNode } = useStore.getState(); setPhase('SERVE'); setNode(SERVE_NODES[SERVE_NODES.length - 1]); }
        else { const { setRotation, setPhase, setNode } = useStore.getState(); const rIdx = rotations.indexOf(activeRotation); setRotation(rotations[(rIdx - 1 + 6) % 6]); setPhase('RECEIVE'); setNode(RECEIVE_NODES[RECEIVE_NODES.length - 1]); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const schema = params.get('schema');
    const role = params.get('role') as UserRole | null;
    if (schema) {
      const state = deserializeState(schema);
      if (state) loadState(state, role || 'OWNER');
    } else if (activeSchemaId) {
      loadSchema(activeSchemaId);
    }
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [loadState, activeSchemaId, loadSchema]);

  // MOBILE LAYOUT
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden select-none">
        <div className="flex-1 overflow-hidden relative">
          {mobileTab === 'court' && (
            <div className="flex flex-col h-full bg-cyan-400">
              <div className="flex justify-center pt-2 px-2 z-50 shrink-0">
                <Toolbar />
              </div>
              <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center">
                <Court 
                  width={dimensions.width || window.innerWidth} 
                  height={dimensions.height || (window.innerHeight - 200)} 
                />
              </div>
              <div className="px-2 pb-2 shrink-0">
                <BottomPanel style={{ width: '100%' }} />
              </div>
            </div>
          )}
          {mobileTab === 'archive' && (
            <div className="h-full overflow-y-auto bg-gray-50">
              <LeftPanel />
            </div>
          )}
          {mobileTab === 'roster' && (
            <div className="h-full overflow-y-auto bg-gray-50">
              <RightPanel />
            </div>
          )}
        </div>

        {/* Mobile bottom nav */}
        <div className="flex border-t border-gray-200 bg-white shrink-0">
          <button
            onClick={() => setMobileTab('archive')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 ${mobileTab === 'archive' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <FolderOpen size={22} />
            <span className="text-[10px] font-black uppercase tracking-wider">Archive</span>
          </button>
          <button
            onClick={() => setMobileTab('court')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 ${mobileTab === 'court' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <div className="w-6 h-6 rounded bg-orange-400 flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-white rounded-sm" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider">Court</span>
          </button>
          <button
            onClick={() => setMobileTab('roster')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 ${mobileTab === 'roster' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Users size={22} />
            <span className="text-[10px] font-black uppercase tracking-wider">Roster</span>
          </button>
        </div>
      </div>
    );
  }

  // DESKTOP LAYOUT
  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans overflow-hidden select-none relative">
      <div className="flex flex-1 overflow-hidden relative">
        <button
          onClick={toggleLeftPanel}
          className={`absolute top-1/2 -translate-y-1/2 left-0 z-[60] p-2 bg-white border border-l-0 border-black/10 rounded-r-xl shadow-md text-gray-500 hover:text-blue-600 transition-all ${leftPanelOpen ? 'translate-x-80' : 'translate-x-0'}`}
        >
          {leftPanelOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>

        <motion.div
          initial={false}
          animate={{ width: leftPanelOpen ? 320 : 0, opacity: leftPanelOpen ? 1 : 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="overflow-hidden border-r border-black/10 bg-gray-50 shrink-0"
        >
          <div className="w-80 h-full"><LeftPanel /></div>
        </motion.div>

        <div className="flex-1 flex flex-col overflow-hidden relative bg-cyan-400">
          <div ref={containerRef} className="flex-1 relative overflow-auto flex items-center justify-center p-20">
            <div style={{ width: COURT_VISUAL_SIZE, height: COURT_VISUAL_SIZE }} className="relative z-0 shadow-2xl">
              <Court width={COURT_VISUAL_SIZE} height={COURT_VISUAL_SIZE} />
            </div>
          </div>
        </div>

        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="pointer-events-auto"><Toolbar /></div>
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <BottomPanel style={{ width: COURT_VISUAL_SIZE }} />
          </div>
        </div>

        <button
          onClick={toggleRightPanel}
          className={`absolute top-1/2 -translate-y-1/2 right-0 z-[60] p-2 bg-white border border-r-0 border-black/10 rounded-l-xl shadow-md text-gray-500 hover:text-blue-600 transition-all ${rightPanelOpen ? '-translate-x-80' : 'translate-x-0'}`}
        >
          {rightPanelOpen ? <ChevronRight size={20} /> : <Menu size={20} />}
        </button>

        <motion.div
          initial={false}
          animate={{ width: rightPanelOpen ? 320 : 0, opacity: rightPanelOpen ? 1 : 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="overflow-hidden border-l border-black/10 bg-gray-50 shrink-0"
        >
          <div className="w-80 h-full"><RightPanel /></div>
        </motion.div>
      </div>
    </div>
  );
}