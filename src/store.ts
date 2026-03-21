/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { 
  BoardState, Rotation, Phase, TimelineNode, Player, PlayerPosition, 
  RECEIVE_NODES, SERVE_NODES, Slot, PlayerRole, SavedSchema, UserRole,
  Tool, Drawing
} from './types';
import DEFAULT_SCHEMA_JSON from './rotation_2026-03-10.json';

const DEFAULT_SCHEMA_ID = 'DEFAULT';

const getDefaultSchema = (): SavedSchema => ({
  id: DEFAULT_SCHEMA_ID,
  name: 'DEFAULT - 5-1 Rotace',
  timestamp: new Date('2026-03-10').getTime(),
  state: DEFAULT_SCHEMA_JSON as any,
  isReadOnly: true
});

interface AppState extends BoardState {
  history: BoardState[];
  future: BoardState[];
  checkpoint: BoardState | null;
  schemas: SavedSchema[];
  activeSchemaId: string | null;
  isReadOnly: boolean;
  isDragging: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setIsDragging: (value: boolean) => void;
  setRotation: (r: Rotation) => void;
  setPhase: (p: Phase) => void;
  setNode: (n: TimelineNode) => void;
  setSaveChanges: (value: boolean) => void;
  setUserRole: (role: UserRole) => void;
  updatePlayerPosition: (playerId: string, x: number, y: number) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  addPlayer: (role: PlayerRole, name?: string, color?: string) => void;
  removePlayer: (playerId: string) => void;
  swapPlayers: (id1: string, id2: string) => void;
  setPlayerPosition: (playerId: string, slot: Slot | null) => void;
  toggleSetting: (key: keyof BoardState['toggles']) => void;
  loadState: (state: BoardState, role?: UserRole) => void;
  resetAll: () => void;
  resetNode: () => void;
  resetNodeToBase: () => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Drawing actions
  setActiveTool: (tool: Tool) => void;
  setDrawingColor: (color: string) => void;
  setDrawingWidth: (width: number) => void;
  setIsDashed: (isDashed: boolean) => void;
  addDrawing: (drawing: Drawing) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  clearDrawings: () => void;
  removeDrawing: (id: string) => void;
  
  // Ball actions
  toggleBall: () => void;
  updateBallPosition: (x: number, y: number) => void;
  
  // Schema management
  createSchema: (name: string) => void;
  deleteSchema: (id: string) => void;
  loadSchema: (id: string) => void;
  renameSchema: (id: string, name: string) => void;
  updateSchemaThumbnail: (id: string, thumbnail: string) => void;
  saveCurrentSchema: () => void;
  setCourtZoom: (zoom: number) => void;
}

const DEFAULT_PLAYERS: Player[] = [
  { id: 'p1', role: 'S', name: 'Setter', slot: 'BR', color: '#3b82f6' },
  { id: 'p2', role: 'OH', name: 'OH1', slot: 'FR', color: '#ef4444' },
  { id: 'p3', role: 'MB', name: 'MB1', slot: 'FC', color: '#10b981' },
  { id: 'p4', role: 'OPP', name: 'Opposite', slot: 'FL', color: '#f59e0b' },
  { id: 'p5', role: 'OH', name: 'OH2', slot: 'BL', color: '#8b5cf6' },
  { id: 'p6', role: 'L', name: 'Libero', slot: 'BC', color: '#ec4899' },
];

export const SLOT_COORDS: Record<Slot, { x: number; y: number }> = {
  BR: { x: 750, y: 750 },
  BC: { x: 450, y: 750 },
  BL: { x: 150, y: 750 },
  FL: { x: 150, y: 150 },
  FC: { x: 450, y: 150 },
  FR: { x: 750, y: 150 },
};

const SLOT_TO_INDEX: Record<Slot, number> = {
  BR: 0, BC: 1, BL: 2, FL: 3, FC: 4, FR: 5
};
const INDEX_TO_SLOT: Slot[] = ['BR', 'BC', 'BL', 'FL', 'FC', 'FR'];

const createEmptyPositions = () => {
  const rotations: Rotation[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
  const phases: Phase[] = ['RECEIVE', 'SERVE'];
  
  const pos: any = {};
  const drawings: any = {};
  const ballPos: any = {};

  rotations.forEach((r, rIdx) => {
    pos[r] = {};
    drawings[r] = {};
    ballPos[r] = {};
    phases.forEach(p => {
      pos[r][p] = {};
      drawings[r][p] = {};
      ballPos[r][p] = {};
      const nodes = p === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
      nodes.forEach(n => {
        drawings[r][p][n] = [];
        ballPos[r][p][n] = { x: 450, y: 450 }; // Center of court
        const nodePos: Record<string, PlayerPosition> = {};
        DEFAULT_PLAYERS.forEach((player) => {
          const initialZoneIndex = SLOT_TO_INDEX[player.slot];
          const shift = rIdx;
          const currentZoneIndex = (initialZoneIndex + shift) % 6;
          const currentSlot = INDEX_TO_SLOT[currentZoneIndex];
          const coords = SLOT_COORDS[currentSlot];
          nodePos[player.id] = { x: coords.x, y: coords.y, modified: false };
        });
        pos[r][p][n] = nodePos;
      });
    });
  });
  return { pos, drawings, ballPos };
};

const getBaseState = (): BoardState => {
  const players = DEFAULT_PLAYERS;
  const rotations: Rotation[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
  const phases: Phase[] = ['SERVE', 'RECEIVE'];
  
  const onFieldPositions: any = {};
  const benchPlayers: any = {};
  
  rotations.forEach(r => {
    onFieldPositions[r] = {};
    benchPlayers[r] = {};
    phases.forEach(p => {
      onFieldPositions[r][p] = {};
      players.forEach(player => {
        onFieldPositions[r][p][player.id] = player.slot;
      });
      benchPlayers[r][p] = [];
    });
  });

  const { pos, drawings, ballPos } = createEmptyPositions();

  return {
    players,
    positions: pos,
    onFieldPositions,
    benchPlayers,
    activeRotation: 'R1',
    activePhase: 'SERVE',
    activeNode: 'BASE',
    saveChanges: true,
    userRole: 'OWNER',
    activeTool: 'CURSOR',
    drawingColor: '#3b82f6',
    drawingWidth: 3,
    isDashed: false,
    toggles: {
      smartValidator: true,
      showZones: true,
      showBench: true,
      overlapLinks: true,
    },
    courtZoom: 1,
    drawings,
    showBall: false,
    ballPositions: ballPos,
  };
};

const getBoardState = (state: any): BoardState => {
  const base = getBaseState();
  return {
    players: state.players || base.players,
    positions: { ...base.positions, ...(state.positions || {}) },
    onFieldPositions: { ...base.onFieldPositions, ...(state.onFieldPositions || {}) },
    benchPlayers: { ...base.benchPlayers, ...(state.benchPlayers || {}) },
    activeRotation: state.activeRotation || base.activeRotation,
    activePhase: state.activePhase || base.activePhase,
    activeNode: state.activeNode || base.activeNode,
    saveChanges: state.saveChanges !== undefined ? state.saveChanges : base.saveChanges,
    userRole: state.userRole || base.userRole,
    toggles: { ...base.toggles, ...(state.toggles || {}) },
    drawings: state.drawings || base.drawings,
    courtZoom: state.courtZoom || base.courtZoom,
    activeTool: state.activeTool || base.activeTool,
    drawingColor: state.drawingColor || base.drawingColor,
    drawingWidth: state.drawingWidth || base.drawingWidth,
    isDashed: state.isDashed !== undefined ? state.isDashed : base.isDashed,
    showBall: state.showBall !== undefined ? state.showBall : base.showBall,
    ballPositions: state.ballPositions || base.ballPositions
  };
};

export const useStore = create<AppState>((set, get) => ({
  ...getBoardState(DEFAULT_SCHEMA_JSON as any),
  activeRotation: 'R1' as Rotation,
  activePhase: 'SERVE' as Phase,
  activeNode: 'BASE' as TimelineNode,
  saveChanges: (() => { try { const v = localStorage.getItem('vb_save_changes'); return v === null ? true : v === 'true'; } catch(e) { return true; } })(),
  checkpoint: { ...getBoardState(DEFAULT_SCHEMA_JSON as any), activeRotation: 'R1' as Rotation, activePhase: 'SERVE' as Phase, activeNode: 'BASE' as TimelineNode },
  history: [],
  future: [],
  schemas: (() => {
    let saved = [];
    try {
      const item = localStorage.getItem('vb_schemas');
      if (item) {
        saved = JSON.parse(item);
        if (!Array.isArray(saved)) saved = [];
      }
    } catch (e) {
      console.error('Failed to parse schemas from localStorage', e);
    }
    // Only return user-created schemas, NOT the default schema
    // Default schema is used as the initial board state but is NOT shown in the archive
    const filtered = saved.filter((s: any) => s && s.id && s.id !== DEFAULT_SCHEMA_ID);
    return filtered;
  })(),
  activeSchemaId: (() => {
    try {
      const saved = localStorage.getItem('vb_active_schema_id');
      // If saved ID is the default schema ID, return null (no active schema = default state)
      if (!saved || saved === DEFAULT_SCHEMA_ID) return null;
      return saved;
    } catch (e) {
      return null;
    }
  })(),
  isReadOnly: (() => {
    try {
      const activeId = localStorage.getItem('vb_active_schema_id');
      // Default state is NOT read-only - user can browse freely
      if (!activeId || activeId === DEFAULT_SCHEMA_ID) return false;
      const item = localStorage.getItem('vb_schemas');
      if (!item) return false;
      const saved = JSON.parse(item);
      const schema = Array.isArray(saved) ? saved.find((s: any) => s.id === activeId) : null;
      return schema ? !!schema.isReadOnly : false;
    } catch (e) {
      return false;
    }
  })(),
  isDragging: false,
  leftPanelOpen: true,
  rightPanelOpen: true,
  toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

  setIsDragging: (isDragging) => set({ isDragging }),

  saveToHistory: () => {
    const state = get();
    if (!state.activeSchemaId || state.activeSchemaId === DEFAULT_SCHEMA_ID) return;
    const boardState = getBoardState(state);
    set({ 
      history: [...state.history.slice(-19), JSON.parse(JSON.stringify(boardState))],
      future: [] 
    });
    state.saveCurrentSchema();
  },

  undo: () => {
    const { history, future, checkpoint, schemas, activeSchemaId, ...currentState } = get();
    if (history.length === 0 || currentState.userRole === 'VIEWER') return;
    
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    set({
      ...previous,
      history: newHistory,
      future: [JSON.parse(JSON.stringify(currentState)), ...future],
      checkpoint: get().saveChanges ? JSON.parse(JSON.stringify(previous)) : checkpoint
    });
    get().saveCurrentSchema();
  },

  redo: () => {
    const { history, future, checkpoint, schemas, activeSchemaId, ...currentState } = get();
    if (future.length === 0 || currentState.userRole === 'VIEWER') return;
    
    const next = future[0];
    const newFuture = future.slice(1);
    
    set({
      ...next,
      history: [...history, JSON.parse(JSON.stringify(currentState))],
      future: newFuture,
      checkpoint: get().saveChanges ? JSON.parse(JSON.stringify(next)) : checkpoint
    });
    get().saveCurrentSchema();
  },

  setRotation: (activeRotation) => {
    const { saveChanges, checkpoint, activePhase } = get();
    if (!saveChanges && checkpoint) {
      // Revert data to checkpoint but keep the NEW rotation and CURRENT phase
      const revertedState = JSON.parse(JSON.stringify(checkpoint));
      const newState = { 
        ...revertedState, 
        activeRotation, 
        activePhase, 
        activeNode: 'BASE' as TimelineNode 
      };
      // Update checkpoint so subsequent navigations don't reset the rotation
      set({ ...newState, checkpoint: JSON.parse(JSON.stringify(newState)) });
    } else {
      set({ activeRotation, activePhase, activeNode: 'BASE' });
      if (saveChanges) {
        const { history, future, checkpoint: oldCp, schemas, activeSchemaId, ...current } = get();
        set({ checkpoint: JSON.parse(JSON.stringify(current)) });
      }
    }
    get().saveCurrentSchema();
  },

  setPhase: (activePhase) => {
    const { saveChanges, checkpoint } = get();
    if (!saveChanges && checkpoint) {
      const revertedState = JSON.parse(JSON.stringify(checkpoint));
      const newState = { ...revertedState, activePhase, activeNode: 'BASE' as TimelineNode };
      set({ ...newState, checkpoint: JSON.parse(JSON.stringify(newState)) });
    } else {
      set({ activePhase, activeNode: 'BASE' });
      if (saveChanges) {
        const { history, future, checkpoint: oldCp, schemas, activeSchemaId, ...current } = get();
        set({ checkpoint: JSON.parse(JSON.stringify(current)) });
      }
    }
    get().saveCurrentSchema();
  },

  setNode: (activeNode) => {
    set({ activeNode });
    get().saveCurrentSchema();
  },

  setSaveChanges: (saveChanges) => {
    if (get().userRole === 'VIEWER') return;
    if (saveChanges) {
      const { history, future, checkpoint, schemas, activeSchemaId, ...current } = get();
      set({ saveChanges, checkpoint: JSON.parse(JSON.stringify(current)) });
    } else {
      set({ saveChanges });
    }
    // Persist saveChanges preference to localStorage
    try { localStorage.setItem('vb_save_changes', String(saveChanges)); } catch(e) {}
  },

  setUserRole: (userRole) => set({ userRole }),

  setActiveTool: (activeTool) => set({ activeTool }),
  setDrawingColor: (drawingColor) => set({ drawingColor }),
  setDrawingWidth: (drawingWidth) => set({ drawingWidth }),
  setIsDashed: (isDashed) => set({ isDashed }),
  addDrawing: (drawing) => {
    if (get().activeSchemaId === DEFAULT_SCHEMA_ID) return;
    set(state => {
      const { activeRotation, activePhase, activeNode, drawings } = state;
      const newList = [...drawings[activeRotation][activePhase][activeNode], drawing];
      
      return {
        drawings: {
          ...drawings,
          [activeRotation]: {
            ...drawings[activeRotation],
            [activePhase]: {
              ...drawings[activeRotation][activePhase],
              [activeNode]: newList
            }
          }
        }
      };
    });
    get().saveCurrentSchema();
  },
  updateDrawing: (id, updates) => {
    set(state => {
      const { activeRotation, activePhase, activeNode, drawings } = state;
      const currentList = drawings[activeRotation][activePhase][activeNode];
      const newList = currentList.map((d: Drawing) => 
        d.id === id ? { ...d, ...updates } : d
      );
      
      return {
        drawings: {
          ...drawings,
          [activeRotation]: {
            ...drawings[activeRotation],
            [activePhase]: {
              ...drawings[activeRotation][activePhase],
              [activeNode]: newList
            }
          }
        }
      };
    });
  },
  clearDrawings: () => {
    if (get().activeSchemaId === DEFAULT_SCHEMA_ID) return;
    const { activeRotation, activePhase, activeNode, drawings } = get();
    const newDrawings = JSON.parse(JSON.stringify(drawings));
    newDrawings[activeRotation][activePhase][activeNode] = [];
    set({ drawings: newDrawings });
    get().saveCurrentSchema();
  },
  removeDrawing: (id) => {
    if (get().activeSchemaId === DEFAULT_SCHEMA_ID) return;
    set(state => {
      const { activeRotation, activePhase, activeNode, drawings } = state;
      const currentList = drawings[activeRotation][activePhase][activeNode];
      const index = currentList.findIndex((d: Drawing) => d.id === id);
      if (index === -1) return {};
      
      const newList = [...currentList];
      newList.splice(index, 1);
      
      const newDrawings = {
        ...drawings,
        [activeRotation]: {
          ...drawings[activeRotation],
          [activePhase]: {
            ...drawings[activeRotation][activePhase],
            [activeNode]: newList
          }
        }
      };
      
      return { drawings: newDrawings };
    });
  },

  toggleBall: () => set(state => ({ showBall: !state.showBall })),
  updateBallPosition: (x, y) => {
    const { activeRotation, activePhase, activeNode, ballPositions, saveChanges, activeSchemaId } = get();
    if (activeSchemaId === DEFAULT_SCHEMA_ID) return;
    
    const currentNodes = activePhase === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
    
    let effectiveNode = activeNode;
    if (activeNode === 'BASE') {
      effectiveNode = currentNodes[1]; // Transition to PASS or SERVE
      set({ activeNode: effectiveNode });
    }

    const newBallPositions = JSON.parse(JSON.stringify(ballPositions));
    newBallPositions[activeRotation][activePhase][effectiveNode] = { x, y };

    // Cascade changes to all subsequent nodes
    const nodeIndex = currentNodes.indexOf(effectiveNode as any);
    for (let i = nodeIndex + 1; i < currentNodes.length; i++) {
      newBallPositions[activeRotation][activePhase][currentNodes[i]] = { x, y };
    }

    set({ ballPositions: newBallPositions });
    get().saveCurrentSchema();
  },

  updatePlayerPosition: (playerId, x, y) => {
    const { activeRotation, activePhase, activeNode, positions, userRole, schemas, activeSchemaId, saveChanges } = get();
    if (userRole === 'VIEWER' || !activeSchemaId || activeSchemaId === DEFAULT_SCHEMA_ID) return;
    
    const currentSchema = schemas.find(s => s.id === activeSchemaId);
    const isReadOnly = currentSchema?.isReadOnly;

    const currentNodes = activePhase === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
    
    // If we are in BASE, we should NOT be able to move players.
    let effectiveNode = activeNode;
    if (activeNode === 'BASE') {
      effectiveNode = currentNodes[1]; // Transition to PASS or SERVE
      set({ activeNode: effectiveNode });
    }

    const effectiveNodeIndex = currentNodes.indexOf(effectiveNode as any);
    if (effectiveNodeIndex === -1) return;

    const newPositions = JSON.parse(JSON.stringify(positions));
    if (!newPositions[activeRotation]?.[activePhase]?.[effectiveNode]) return;
    
    // Update ONLY the effective node - no cascade to subsequent nodes
    newPositions[activeRotation][activePhase][effectiveNode][playerId] = { x, y, modified: !isReadOnly && saveChanges };

    set({ positions: newPositions });
    
    if (!isReadOnly && saveChanges) {
      const state = get();
      const boardState = getBoardState(state);
      set({ checkpoint: JSON.parse(JSON.stringify(boardState)) });
      get().saveCurrentSchema();
    }
  },

  updatePlayer: (playerId, updates) => {
    if (get().userRole === 'VIEWER') return;
    const isDefault = get().activeSchemaId === DEFAULT_SCHEMA_ID;
    if (!isDefault) get().saveToHistory();
    set(state => {
      const newPlayers = state.players.map(p => p.id === playerId ? { ...p, ...updates } : p);
      const newState = { ...state, players: newPlayers };
      
      if (state.saveChanges && !isDefault) {
        const { history, future, checkpoint, schemas, activeSchemaId, ...current } = newState;
        return { ...newState, checkpoint: JSON.parse(JSON.stringify(current)) };
      }
      return newState;
    });
    if (!isDefault) get().saveCurrentSchema();
  },

  addPlayer: (role, name, color) => {
    if (get().userRole === 'VIEWER' || get().activeSchemaId === DEFAULT_SCHEMA_ID) return;
    get().saveToHistory();
    const id = `p${Date.now()}`;
    
    set(state => {
      const sameRolePlayers = state.players.filter(p => p.role === role);
      const roleCount = sameRolePlayers.length;
      
      let defaultName: string = role;
      if (roleCount > 0) {
        defaultName = `${role}${roleCount + 1}`;
      }

      const newPlayer: Player = {
        id,
        role,
        name: name || defaultName,
        slot: 'BR', 
        color: color || '#64748b'
      };

      const newPlayers = [...state.players, newPlayer];
      const newBench = JSON.parse(JSON.stringify(state.benchPlayers));
      const newOnField = JSON.parse(JSON.stringify(state.onFieldPositions));
      const newPositions = JSON.parse(JSON.stringify(state.positions));
      const rotations: Rotation[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
      const phases: Phase[] = ['RECEIVE', 'SERVE'];
      
      rotations.forEach(r => {
        phases.forEach(p => {
          // Add to bench by default for all rotations/phases
          if (!newBench[r][p].includes(id)) {
            newBench[r][p].push(id);
          }
          
          const benchIndex = newBench[r][p].indexOf(id);
          const nodes = p === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
          nodes.forEach(n => {
            if (!newPositions[r][p][n]) newPositions[r][p][n] = {};
            newPositions[r][p][n][id] = { x: -130, y: 450 + (benchIndex - 2.5) * 110, modified: false };
          });
        });
      });

      const newState = { players: newPlayers, benchPlayers: newBench, onFieldPositions: newOnField, positions: newPositions };
      if (state.saveChanges) {
        const { history, future, checkpoint, schemas, activeSchemaId, ...current } = { ...state, ...newState };
        return { ...newState, checkpoint: JSON.parse(JSON.stringify(current)) };
      }
      return newState;
    });
    get().saveCurrentSchema();
  },

  removePlayer: (playerId) => {
    if (get().userRole === 'VIEWER' || get().activeSchemaId === DEFAULT_SCHEMA_ID) return;
    if (get().players.length <= 6) {
      alert("Minimum 6 players required on roster to maintain a full team");
      return;
    }
    get().saveToHistory();
    set(state => {
      const newPlayers = state.players.filter(p => p.id !== playerId);
      const newBench = JSON.parse(JSON.stringify(state.benchPlayers));
      const newOnField = JSON.parse(JSON.stringify(state.onFieldPositions));
      const newPositions = JSON.parse(JSON.stringify(state.positions));
      const rotations: Rotation[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
      const phases: Phase[] = ['RECEIVE', 'SERVE'];
      
      rotations.forEach((r, rIdx) => {
        phases.forEach(p => {
          const slot = newOnField[r][p][playerId];
          const wasOnField = !!slot;
          
          newBench[r][p] = newBench[r][p].filter((id: string) => id !== playerId);
          delete newOnField[r][p][playerId];

          if (wasOnField && newBench[r][p].length > 0) {
            const replacementId = newBench[r][p][0];
            newOnField[r][p][replacementId] = slot;
            newBench[r][p] = newBench[r][p].filter((id: string) => id !== replacementId);

            const nodes = p === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
            nodes.forEach(n => {
              const initialZoneIndex = SLOT_TO_INDEX[slot];
              const currentZoneIndex = (initialZoneIndex + rIdx) % 6;
              const currentSlot = INDEX_TO_SLOT[currentZoneIndex];
              const coords = SLOT_COORDS[currentSlot];
              newPositions[r][p][n][replacementId] = { x: coords.x, y: coords.y, modified: false };
            });
          }

          const nodes = p === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
          nodes.forEach(n => {
            delete newPositions[r][p][n][playerId];
          });

          newBench[r][p].forEach((id: string, idx: number) => {
            nodes.forEach(n => {
              newPositions[r][p][n][id] = { x: -130, y: 450 + (idx - 2.5) * 110, modified: false };
            });
          });
        });
      });

      const newState = { 
        players: newPlayers, 
        benchPlayers: newBench, 
        onFieldPositions: newOnField, 
        positions: newPositions 
      };
      
      if (state.saveChanges) {
        const { history, future, checkpoint, schemas, activeSchemaId, ...current } = { ...state, ...newState };
        return { ...newState, checkpoint: JSON.parse(JSON.stringify(current)) };
      }
      return newState;
    });
    get().saveCurrentSchema();
  },

  setPlayerPosition: (playerId, slot) => {
    if (get().userRole === 'VIEWER' || get().activeSchemaId === DEFAULT_SCHEMA_ID) return;
    if (get().activeNode === 'BASE') {
      alert("Lineup changes are not allowed in BASE node");
      return;
    }
    get().saveToHistory();
    const { activeRotation, onFieldPositions, benchPlayers, positions, saveChanges } = get();
    const rotations: Rotation[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
    const phases: Phase[] = ['RECEIVE', 'SERVE'];
    const startIdx = rotations.indexOf(activeRotation);

    const newOnField = JSON.parse(JSON.stringify(onFieldPositions));
    const newBench = JSON.parse(JSON.stringify(benchPlayers));
    const newPositions = JSON.parse(JSON.stringify(positions));

    const endIdx = saveChanges ? rotations.length : startIdx + 1;

    for (let i = startIdx; i < endIdx; i++) {
      const r = rotations[i];
      const rIdx = i;

      phases.forEach(p => {
        if (slot) {
          const existingPlayerId = Object.keys(newOnField[r][p]).find(id => newOnField[r][p][id] === slot);
          if (existingPlayerId && existingPlayerId !== playerId) {
            delete newOnField[r][p][existingPlayerId];
            if (!newBench[r][p].includes(existingPlayerId)) newBench[r][p].push(existingPlayerId);
            const benchIdx = newBench[r][p].indexOf(existingPlayerId);
            const nodes = p === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
            nodes.forEach(n => {
              newPositions[r][p][n][existingPlayerId] = { x: -130, y: 450 + (benchIdx - 2.5) * 110, modified: false };
            });
          }
          newOnField[r][p][playerId] = slot;
          newBench[r][p] = newBench[r][p].filter((id: string) => id !== playerId);
          const nodes = p === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
          nodes.forEach(n => {
            const initialZoneIndex = SLOT_TO_INDEX[slot];
            const currentZoneIndex = (initialZoneIndex + rIdx) % 6;
            const currentSlot = INDEX_TO_SLOT[currentZoneIndex];
            const coords = SLOT_COORDS[currentSlot];
            // Always reset to default slot position when changing lineup, and clear modified flag
            newPositions[r][p][n][playerId] = { x: coords.x, y: coords.y, modified: false };
          });
        } else {
          delete newOnField[r][p][playerId];
          if (!newBench[r][p].includes(playerId)) newBench[r][p].push(playerId);
          const benchIdx = newBench[r][p].indexOf(playerId);
          const nodes = p === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
          nodes.forEach(n => {
            newPositions[r][p][n][playerId] = { x: -130, y: 450 + (benchIdx - 2.5) * 110, modified: false };
          });
        }

        newBench[r][p].forEach((id: string, idx: number) => {
          const nodes = p === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
          nodes.forEach(n => {
            if (!newOnField[r][p][id]) {
              newPositions[r][p][n][id] = { x: -130, y: 450 + (idx - 2.5) * 110, modified: false };
            }
          });
        });
      });
    }

    set({ onFieldPositions: newOnField, benchPlayers: newBench, positions: newPositions });
    
    if (saveChanges) {
      const { history, future, checkpoint: oldCp, schemas, activeSchemaId, ...current } = get();
      set({ checkpoint: JSON.parse(JSON.stringify(current)) });
    }
    get().saveCurrentSchema();
  },

  swapPlayers: (id1, id2) => {
    if (get().userRole === 'VIEWER' || get().activeSchemaId === DEFAULT_SCHEMA_ID) return;
    get().saveToHistory();
    const { activeRotation, activePhase, activeNode, onFieldPositions, benchPlayers, positions, saveChanges } = get();
    const rotations: Rotation[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
    const startIdx = rotations.indexOf(activeRotation);
    
    const newOnField = JSON.parse(JSON.stringify(onFieldPositions));
    const newBench = JSON.parse(JSON.stringify(benchPlayers));
    const newPositions = JSON.parse(JSON.stringify(positions));
    
    const currentNodes = activePhase === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
    const nodeIndex = currentNodes.indexOf(activeNode as any);

    const endIdx = saveChanges ? rotations.length : startIdx + 1;

    for (let i = startIdx; i < endIdx; i++) {
      const r = rotations[i];
      const phases: Phase[] = ['SERVE', 'RECEIVE'];

      phases.forEach(p => {
        if (i === startIdx && activePhase === 'RECEIVE' && p === 'SERVE') return;

        const s1 = newOnField[r][p][id1];
        const s2 = newOnField[r][p][id2];
        
        if (s1 && s2) {
          newOnField[r][p][id1] = s2;
          newOnField[r][p][id2] = s1;
        } else if (s1) {
          newOnField[r][p][id2] = s1;
          delete newOnField[r][p][id1];
          newBench[r][p] = newBench[r][p].filter((id: string) => id !== id2);
          newBench[r][p].push(id1);
        } else if (s2) {
          newOnField[r][p][id1] = s2;
          delete newOnField[r][p][id2];
          newBench[r][p] = newBench[r][p].filter((id: string) => id !== id1);
          newBench[r][p].push(id2);
        }

        const nodes = p === 'RECEIVE' ? RECEIVE_NODES : SERVE_NODES;
        nodes.forEach((node) => {
          const pos1 = newPositions[r][p][node][id1];
          const pos2 = newPositions[r][p][node][id2];
          if (pos1 && pos2) {
            // When swapping, we reset the modified flag to false for the new positions
            // so that they can follow the cascading logic correctly.
            newPositions[r][p][node][id1] = { ...pos2, modified: false };
            newPositions[r][p][node][id2] = { ...pos1, modified: false };
          }
        });
        
        newBench[r][p].forEach((id: string, idx: number) => {
          nodes.forEach((n) => {
            if (!newOnField[r][p][id]) {
              newPositions[r][p][n][id] = { x: -130, y: 450 + (idx - 2.5) * 110, modified: false };
            }
          });
        });
      });
    }

    set({ onFieldPositions: newOnField, benchPlayers: newBench, positions: newPositions });
    
    if (saveChanges) {
      const { history, future, checkpoint: oldCp, schemas, activeSchemaId, ...current } = get();
      set({ checkpoint: JSON.parse(JSON.stringify(current)) });
    }
    get().saveCurrentSchema();
  },

  toggleSetting: (key) => {
    if (get().userRole === 'VIEWER') return;
    set(state => ({
      toggles: { ...state.toggles, [key]: !state.toggles[key] }
    }));
    get().saveCurrentSchema();
  },

  loadState: (newState, role) => {
    const boardState = getBoardState(newState as any);
    set({ 
      ...boardState, 
      userRole: role || boardState.userRole || 'OWNER',
      checkpoint: JSON.parse(JSON.stringify(boardState)),
      history: [],
      future: []
    });
  },

  resetAll: () => {
    if (get().userRole === 'VIEWER' || get().activeSchemaId === DEFAULT_SCHEMA_ID) return;
    get().saveToHistory();
    set({
      ...getBaseState(),
      activeSchemaId: null
    });
    get().saveCurrentSchema();
  },

  resetNode: () => {
    if (get().userRole === 'VIEWER' || !get().activeSchemaId || get().activeSchemaId === DEFAULT_SCHEMA_ID) return;
    // Restore current node positions from last saved checkpoint
    const { activeRotation, activePhase, activeNode, checkpoint, positions } = get();
    if (!checkpoint) return;
    const newPositions = JSON.parse(JSON.stringify(positions));
    const savedNodePositions = checkpoint.positions?.[activeRotation]?.[activePhase]?.[activeNode];
    if (savedNodePositions) {
      newPositions[activeRotation][activePhase][activeNode] = JSON.parse(JSON.stringify(savedNodePositions));
    }
    set({ positions: newPositions });
    get().saveCurrentSchema();
  },

  resetNodeToBase: () => {
    if (get().userRole === 'VIEWER' || !get().activeSchemaId || get().activeSchemaId === DEFAULT_SCHEMA_ID) return;
    // Reset current node positions to match BASE node positions
    const { activeRotation, activePhase, activeNode, positions, onFieldPositions, players, benchPlayers } = get();
    if (activeNode === 'BASE') return;
    const newPositions = JSON.parse(JSON.stringify(positions));
    const basePositions = newPositions[activeRotation][activePhase]['BASE'];
    if (basePositions) {
      newPositions[activeRotation][activePhase][activeNode] = JSON.parse(JSON.stringify(basePositions));
    }
    set({ positions: newPositions });
    get().saveCurrentSchema();
  },

  // Schema management
  createSchema: (name) => {
    try {
      const state = get();
      
      // Always copy from the original default JSON state, forced to R1 BASE
      const baseState = getBoardState(DEFAULT_SCHEMA_JSON as any);
      const stateToCopy = { ...baseState, activeRotation: 'R1' as Rotation, activePhase: 'SERVE' as Phase, activeNode: 'BASE' as TimelineNode };

      const newSchema: SavedSchema = {
        id: `s_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: name.trim() || `Schema ${state.schemas.length + 1}`,
        timestamp: Date.now(),
        state: JSON.parse(JSON.stringify(stateToCopy)),
        isReadOnly: false
      };
      
      // Only save user schemas (no default schema in localStorage)
      const userSchemas = state.schemas.filter(s => s.id !== DEFAULT_SCHEMA_ID);
      const updated = [newSchema, ...userSchemas];
      set({ 
        ...stateToCopy,
        schemas: updated, 
        activeSchemaId: newSchema.id, 
        isReadOnly: false,
        userRole: 'OWNER',
        history: [],
        future: [],
        checkpoint: JSON.parse(JSON.stringify(stateToCopy))
      });
      
      localStorage.setItem('vb_schemas', JSON.stringify(updated));
      localStorage.setItem('vb_active_schema_id', newSchema.id);
    } catch (error) {
      console.error('Failed to create schema:', error);
      alert('Failed to save schema. Your browser storage might be full.');
    }
  },

  deleteSchema: (id) => {
    if (id === DEFAULT_SCHEMA_ID) return;
    const state = get();
    const updated = state.schemas.filter(s => s.id !== id);
    const isActiveDeleted = state.activeSchemaId === id;
    const nextActiveId = isActiveDeleted ? (updated[0]?.id || null) : state.activeSchemaId;
    
    set({ schemas: updated, activeSchemaId: nextActiveId });
    localStorage.setItem('vb_schemas', JSON.stringify(updated));
    
    if (nextActiveId) {
      localStorage.setItem('vb_active_schema_id', nextActiveId);
      if (isActiveDeleted) {
        const nextSchema = updated[0];
        if (nextSchema) {
          state.loadState(nextSchema.state, state.userRole);
        }
      }
    } else {
      localStorage.removeItem('vb_active_schema_id');
      if (isActiveDeleted) {
        // No schemas left — go back to default JSON state
        const defaultState = getBoardState(DEFAULT_SCHEMA_JSON as any);
        set({ 
          ...defaultState, 
          activeSchemaId: null, 
          isReadOnly: false,
          history: [],
          future: [],
          checkpoint: JSON.parse(JSON.stringify(defaultState))
        });
      }
    }
  },

  loadSchema: (id) => {
    const schemas = get().schemas;
    if (!Array.isArray(schemas)) return;
    const schema = schemas.find(s => s.id === id);
    if (schema) {
      get().loadState(schema.state, 'OWNER');
      set({ activeSchemaId: id, isReadOnly: !!schema.isReadOnly });
      localStorage.setItem('vb_active_schema_id', id);
    }
  },

  renameSchema: (id, name) => {
    if (id === DEFAULT_SCHEMA_ID) return;
    const updated = get().schemas.map(s => s.id === id ? { ...s, name } : s);
    set({ schemas: updated });
    localStorage.setItem('vb_schemas', JSON.stringify(updated));
  },

  updateSchemaThumbnail: (id, thumbnail) => {
    if (id === DEFAULT_SCHEMA_ID) return;
    const updated = get().schemas.map(s => s.id === id ? { ...s, thumbnail } : s);
    set({ schemas: updated });
    localStorage.setItem('vb_schemas', JSON.stringify(updated));
  },

  saveCurrentSchema: () => {
    try {
      const state = get();
      const { activeSchemaId, schemas, userRole } = state;
      
      const boardState = getBoardState(state);
      
      // Always persist the absolute latest state to a "last session" key
      // This ensures that even if no schema is active, work is not lost on reload
      localStorage.setItem('vb_last_session', JSON.stringify(boardState));

      if (userRole === 'VIEWER' || !activeSchemaId || activeSchemaId === DEFAULT_SCHEMA_ID) return;

      const updated = schemas.map(s => {
        if (s.id === activeSchemaId) {
          return {
            ...s,
            timestamp: Date.now(),
            state: JSON.parse(JSON.stringify(boardState))
          };
        }
        return s;
      });
      
      set({ 
        schemas: updated,
        checkpoint: JSON.parse(JSON.stringify(boardState)) // Update checkpoint on manual save
      });
      localStorage.setItem('vb_schemas', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save current schema:', error);
    }
  },

  setCourtZoom: (zoom: number) => {
    set({ courtZoom: zoom });
    get().saveCurrentSchema();
  }
}));