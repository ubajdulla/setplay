/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlayerRole = 'S' | 'OH' | 'MB' | 'OPP' | 'L';
export type Slot = 'FR' | 'FC' | 'FL' | 'BL' | 'BC' | 'BR';

export interface Player {
  id: string;
  role: PlayerRole;
  name: string;
  slot: Slot;
  color: string;
}

export interface PlayerPosition {
  x: number;
  y: number;
  modified: boolean;
}

export type Rotation = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6';
export type Phase = 'RECEIVE' | 'SERVE';

export const RECEIVE_NODES = ['BASE', 'PASS', 'SET', 'ATTACK', 'COVER', 'DEFENSE'] as const;
export const SERVE_NODES = ['BASE', 'SERVE', 'DEFENSE'] as const;

export type ReceiveNode = typeof RECEIVE_NODES[number];
export type ServeNode = typeof SERVE_NODES[number];
export type TimelineNode = ReceiveNode | ServeNode;

export type UserRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export type Tool = 'CURSOR' | 'PENCIL' | 'LINE' | 'ARROW' | 'SQUARE' | 'TEXT' | 'ERASER';

export interface Drawing {
  id: string;
  type: Tool;
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  text?: string;
  dash?: number[];
}

export interface BoardState {
  players: Player[];
  // positions[rotation][phase][node][playerId]
  positions: Record<Rotation, Record<Phase, Record<string, Record<string, PlayerPosition>>>>;
  onFieldPositions: Record<Rotation, Record<Phase, Record<string, Slot>>>; // Per rotation and phase: playerId -> Slot
  benchPlayers: Record<Rotation, Record<Phase, string[]>>; // Per rotation and phase: playerId[]
  activeRotation: Rotation;
  activePhase: Phase;
  activeNode: TimelineNode;
  saveChanges: boolean;
  userRole: UserRole;
  activeTool: Tool;
  drawingColor: string;
  drawingWidth: number;
  isDashed: boolean;
  toggles: {
    smartValidator: boolean;
    showZones: boolean;
    overlapLinks: boolean;
    showBench: boolean;
  };
  courtZoom: number;
  drawings: Record<Rotation, Record<Phase, Record<string, Drawing[]>>>;
  showBall: boolean;
  ballPositions: Record<Rotation, Record<Phase, Record<string, { x: number; y: number }>>>;
  skippedNodes: { SERVE: string[]; RECEIVE: string[] };
}

export interface SavedSchema {
  id: string;
  name: string;
  timestamp: number;
  thumbnail?: string; // Base64 image
  state: BoardState;
  isReadOnly?: boolean;
}