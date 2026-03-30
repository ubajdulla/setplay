/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Court } from './components/Court';
import { Toolbar } from './components/Toolbar';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { BottomPanel } from './components/BottomPanel';
import { useStore } from './store';
import { deserializeState } from './utils';
import { RECEIVE_NODES, SERVE_NODES, UserRole } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronLeft, ChevronRight, FolderOpen, Users } from 'lucide-react';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const COURT_VISUAL_SIZE = 900;

  // Detect mobile/desktop
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Keyboard navigation
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
        else if (activePhase === 'SERVE') { useStore.getState().setPhase('RECEIVE'); useStore.getState().setNode(RECEIVE_NODES[0]); }
        else { const rIdx = rotations.indexOf(activeRotation); useStore.getState().setRotation(rotations[(rIdx + 1) % 6]); useStore.getState().setPhase('SERVE'); useStore.getState().setNode(SERVE_NODES[0]); }
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (currentIndex > 0) { setNode(nodes[currentIndex - 1]); }
        else if (activePhase === 'RECEIVE') { useStore.getState().setPhase('SERVE'); useStore.getState().setNode(SERVE_NODES[SERVE_NODES.length - 1]); }
        else { const rIdx = rotations.indexOf(activeRotation); useStore.getState().setRotation(rotations[(rIdx - 1 + 6) % 6]); useStore.getState().setPhase('RECEIVE'); useStore.getState().setNode(RECEIVE_NODES[RECEIVE_NODES.length - 1]); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load state + resize observer
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

  // Panel overlay backdrop - clicking closes the panel
  const PanelBackdrop = ({ onClose }: { onClose: () => void }) => (
    <div
      className="fixed inset-0 bg-black/50 z-[70]"
      onClick={onClose}
    />
  );

  // ── MOBILE LAYOUT ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-cyan-400 overflow-hidden select-none flex flex-col">
        {/* Backdrop for left panel */}
        <AnimatePresence>
          {leftPanelOpen && <PanelBackdrop onClose={toggleLeftPanel} />}
        </AnimatePresence>
        {/* Backdrop for right panel */}
        <AnimatePresence>
          {rightPanelOpen && <PanelBackdrop onClose={toggleRightPanel} />}
        </AnimatePresence>

        {/* Left Panel - slides in from left as overlay */}
        <AnimatePresence>
          {leftPanelOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-[85vw] max-w-sm bg-gray-50 z-[80] shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-black/10">
                <span className="font-black text-gray-900 uppercase tracking-widest text-sm">Archive</span>
                <button onClick={toggleLeftPanel} className="p-2 rounded-xl hover:bg-black/[0.05]">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <LeftPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Panel - slides in from right as overlay */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-gray-50 z-[80] shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-black/10">
                <span className="font-black text-gray-900 uppercase tracking-widest text-sm">Roster</span>
                <button onClick={toggleRightPanel} className="p-2 rounded-xl hover:bg-black/[0.05]">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <RightPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top bar with hamburger buttons */}
        <div className="flex items-center justify-between px-3 py-2 bg-cyan-400 shrink-0 z-10">
          <button
            onClick={toggleLeftPanel}
            className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl text-white"
          >
            <FolderOpen size={20} />
          </button>
          <button
            onClick={toggleRightPanel}
            className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-xl text-white"
          >
            <Users size={20} />
          </button>
        </div>

        {/* Court - fills all available space */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <Court
            width={dimensions.width || window.innerWidth}
            height={dimensions.height || window.innerHeight - 180}
          />
        </div>

        {/* Bottom Panel - full width with padding */}
        <div className="shrink-0 px-2 pb-2 pt-1 bg-cyan-400">
          <BottomPanel style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans overflow-hidden select-none relative">
      <div className="flex flex-1 overflow-hidden relative">

        {/* Backdrop for left panel */}
        <AnimatePresence>
          {leftPanelOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[55]"
              onClick={toggleLeftPanel}
            />
          )}
        </AnimatePresence>

        {/* Left Panel Toggle button */}
        <button
          onClick={toggleLeftPanel}
          className="absolute top-1/2 -translate-y-1/2 left-0 z-[60] p-2 bg-white border border-l-0 border-black/10 rounded-r-xl shadow-md text-gray-500 hover:text-blue-600 transition-all"
          title={leftPanelOpen ? "Close Archive" : "Open Archive"}
        >
          {leftPanelOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>

        {/* Left Panel: Archive - overlay */}
        <AnimatePresence>
          {leftPanelOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-80 bg-gray-50 z-[60] shadow-2xl border-r border-black/10"
            >
              <LeftPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center: Canvas */}
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

        {/* Floating Toolbar */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="pointer-events-auto">
            <Toolbar />
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <BottomPanel style={{ width: COURT_VISUAL_SIZE }} />
          </div>
        </div>

        {/* Backdrop for right panel */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[55]"
              onClick={toggleRightPanel}
            />
          )}
        </AnimatePresence>

        {/* Right Panel Toggle button */}
        <button
          onClick={toggleRightPanel}
          className="absolute top-1/2 -translate-y-1/2 right-0 z-[60] p-2 bg-white border border-r-0 border-black/10 rounded-l-xl shadow-md text-gray-500 hover:text-blue-600 transition-all"
          title={rightPanelOpen ? "Close Roster" : "Open Roster"}
        >
          {rightPanelOpen ? <ChevronRight size={20} /> : <Menu size={20} />}
        </button>

        {/* Right Panel: Roster - overlay */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-80 bg-gray-50 z-[60] shadow-2xl border-l border-black/10"
            >
              <RightPanel />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}