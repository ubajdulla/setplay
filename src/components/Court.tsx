/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Circle, Text, Group, Arrow, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { useStore, SLOT_COORDS } from '../store';
import { Slot, Rotation, Drawing, Tool } from '../types';
import { getContrastColor } from './PlayerRoster';

const COURT_SIZE = 900;

const SLOT_TO_INDEX: Record<Slot, number> = {
  BR: 0, BC: 1, BL: 2, FL: 3, FC: 4, FR: 5
};
const INDEX_TO_SLOT: Slot[] = ['BR', 'BC', 'BL', 'FL', 'FC', 'FR'];

const ROTATION_ORDER: Rotation[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];

const VALIDATION_PAIRS: { s1: Slot; s2: Slot; axis: 'x' | 'y'; comparison: 'less' | 'greater' }[] = [
  { s1: 'FC', s2: 'FR', axis: 'x', comparison: 'less' },    // FC left of FR
  { s1: 'FL', s2: 'FC', axis: 'x', comparison: 'less' },    // FL left of FC
  { s1: 'BC', s2: 'BR', axis: 'x', comparison: 'less' },    // BC left of BR
  { s1: 'BL', s2: 'BC', axis: 'x', comparison: 'less' },    // BL left of BC
  { s1: 'FR', s2: 'BR', axis: 'y', comparison: 'less' },    // FR front of BR
  { s1: 'FC', s2: 'BC', axis: 'y', comparison: 'less' },    // FC front of BC
  { s1: 'FL', s2: 'BL', axis: 'y', comparison: 'less' },    // FL front of BL
];

export const Court: React.FC<{ width: number; height: number }> = React.memo(({ width, height }) => {
  const [volleyballImage] = useImage('https://mikasa.cz/wp-content/uploads/2019/04/V200W.png');
  const { 
    players, 
    positions, 
    onFieldPositions,
    activeRotation, 
    activePhase, 
    activeNode, 
    updatePlayerPosition,
    setIsDragging,
    activeSchemaId,
    updateSchemaThumbnail,
    schemas,
    toggles,
    courtZoom,
    activeTool,
    drawingColor,
    drawingWidth,
    isDashed,
    drawings,
    addDrawing,
    updateDrawing,
    removeDrawing,
    showBall,
    ballPositions,
    updateBallPosition,
    userRole
  } = useStore();

  const currentPositions = useMemo(() => {
    try {
      return positions[activeRotation]?.[activePhase]?.[activeNode] || {};
    } catch (e) {
      return {};
    }
  }, [positions, activeRotation, activePhase, activeNode]);

  const currentDrawings = useMemo(() => {
    try {
      return drawings[activeRotation]?.[activePhase]?.[activeNode] || [];
    } catch (e) {
      return [];
    }
  }, [drawings, activeRotation, activePhase, activeNode]);

  const currentBallPos = useMemo(() => {
    try {
      return ballPositions[activeRotation]?.[activePhase]?.[activeNode];
    } catch (e) {
      return undefined;
    }
  }, [ballPositions, activeRotation, activePhase, activeNode]);

  const playerRefs = useRef<Record<string, Konva.Group>>({});
  const ballRef = useRef<Konva.Group>(null);
  const prevNavRef = useRef({ rotation: activeRotation, phase: activePhase, node: activeNode });
  const lastPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const lastBallPosRef = useRef<{ x: number; y: number }>({ x: 450, y: 450 });
  const isDrawingRef = useRef(false);
  const currentDrawingIdRef = useRef<string | null>(null);
  const [deleteButton, setDeleteButton] = React.useState<{ x: number, y: number, id: string } | null>(null);

  // Map players to slots based on their current positions in BASE node
  const playerSlots = useMemo(() => {
    const currentOnField = onFieldPositions[activeRotation]?.[activePhase] || {};
    const rIdx = ROTATION_ORDER.indexOf(activeRotation);
    const slots: { id: string; currentSlot: Slot; role: string }[] = [];
    
    Object.entries(currentOnField).forEach(([playerId, baseSlot]) => {
      const player = players.find(p => p.id === playerId);
      if (player) {
        const initialZoneIndex = SLOT_TO_INDEX[baseSlot as Slot];
        const currentZoneIndex = (initialZoneIndex + rIdx) % 6;
        const currentZoneSlot = INDEX_TO_SLOT[currentZoneIndex];
        slots.push({ id: playerId, currentSlot: currentZoneSlot, role: player.role });
      }
    });
    
    return slots;
  }, [players, onFieldPositions, activeRotation, activePhase]);

  const dragStartPos = useRef<Record<string, { x: number; y: number }>>({});

  const handleDragStart = useCallback((playerId: string, x: number, y: number) => {
    dragStartPos.current[playerId] = { x, y };
  }, []);

  const handleDragMove = useCallback((playerId: string, x: number, y: number, isOnField: boolean) => {
    if (isOnField) {
      updatePlayerPosition(playerId, x, y);
    }
  }, [updatePlayerPosition]);

  const handleDragEnd = useCallback((playerId: string, x: number, y: number, isOnField: boolean, target: Konva.Node) => {
    if (!isOnField) {
      setIsDragging(false);
      return;
    }
    const startPos = dragStartPos.current[playerId];
    
    const currentSchema = useStore.getState().schemas.find(s => s.id === useStore.getState().activeSchemaId);
    const isReadOnly = currentSchema?.isReadOnly;
    const currentActiveNode = useStore.getState().activeNode;
    // Spring mode: BASE node always springs back, or when saveChanges is off, or readOnly
    const isSpringMode = currentActiveNode === 'BASE' || !useStore.getState().saveChanges || isReadOnly;

    if (isSpringMode && startPos) {
      // Reset position (Spring effect)
      target.to({
        x: startPos.x,
        y: startPos.y,
        duration: 0.2,
        onFinish: () => {
          setIsDragging(false);
          // Revert state to original position after animation
          updatePlayerPosition(playerId, startPos.x, startPos.y);
        }
      });
    } else {
      setIsDragging(false);
      // Normal save
      useStore.getState().saveToHistory();
      
      // Capture thumbnail if in BASE node
      if (activeNode === 'BASE' && activeSchemaId) {
        const stage = target.getStage();
        if (stage && stage.width() > 0 && stage.height() > 0) {
          // Temporarily hide UI elements for clean screenshot
          const validatorLines = stage.find('.validator-line');
          validatorLines.forEach(l => l.hide());
          
          const dataUrl = stage.toDataURL({
            pixelRatio: 2.0, // High quality
            mimeType: 'image/jpeg',
            quality: 1.0 // Max quality
          });
          updateSchemaThumbnail(activeSchemaId, dataUrl);
          
          // Show them back if they were supposed to be visible
          // (The animation effect will handle this in the next frame anyway)
        }
      }
    }
  }, [activeNode, activeSchemaId, updateSchemaThumbnail, updatePlayerPosition, setIsDragging]);

  // Auto-generate thumbnail for new schemas if missing
  useEffect(() => {
    if (activeSchemaId && activeNode === 'BASE') {
      const schema = schemas.find(s => s.id === activeSchemaId);
      if (schema && !schema.thumbnail) {
        const stage = playerRefs.current[Object.keys(playerRefs.current)[0]]?.getStage();
        if (stage && stage.width() > 0 && stage.height() > 0) {
          const dataUrl = stage.toDataURL({
            pixelRatio: 2.0,
            mimeType: 'image/jpeg',
            quality: 1.0
          });
          updateSchemaThumbnail(activeSchemaId, dataUrl);
        }
      }
    }
  }, [activeSchemaId, activeNode, schemas, updateSchemaThumbnail]);

  // Real-time line synchronization
  useEffect(() => {
    const anim = new Konva.Animation(() => {
      const isValidatorNode = 
        activeNode === 'BASE' ||
        (activePhase === 'RECEIVE' && activeNode === 'PASS') ||
        (activePhase === 'SERVE' && activeNode === 'SERVE');

      const stage = playerRefs.current[Object.keys(playerRefs.current)[0]]?.getStage();
      if (!stage) return;

      // Hide all lines if validator is off or node is wrong
      if (!toggles.smartValidator || !isValidatorNode) {
        stage.find('.validator-line').forEach(l => {
          l.hide();
        });
        return;
      }

      const getP = (slot: Slot) => {
        const ps = playerSlots.find(s => s.currentSlot === slot);
        if (!ps) return null;
        const group = playerRefs.current[ps.id];
        return group ? { id: ps.id, x: group.x(), y: group.y() } : null;
      };

      VALIDATION_PAIRS.forEach(({ s1, s2, axis, comparison }) => {
        const p1 = getP(s1);
        const p2 = getP(s2);
        const line = stage.findOne(`.neighbor-${s1}-${s2}`) as Konva.Line;
        
        if (line && p1 && p2) {
          const val1 = p1[axis];
          const val2 = p2[axis];
          const isViolation = comparison === 'less' ? !(val1 < val2) : !(val1 > val2);
          
          line.points([p1.x, p1.y, p2.x, p2.y]);
          
          if (isViolation) {
            line.stroke('#ef4444'); // Red
            line.strokeWidth(5);
            line.opacity(1);
          } else {
            line.stroke('rgba(34, 197, 94, 1.0)'); // Green
            line.strokeWidth(3);
            line.opacity(0.5);
          }
          line.show();
        } else if (line) {
          line.hide();
        }
      });
    });

    anim.start();
    return () => {
      anim.stop();
    };
  }, [players, playerSlots, toggles.smartValidator, activePhase, activeNode]);

  // Animate players when rotation, phase, node, or positions change
  useEffect(() => {
    const navChanged = 
      prevNavRef.current.rotation !== activeRotation ||
      prevNavRef.current.phase !== activePhase ||
      prevNavRef.current.node !== activeNode;

    const positionsChanged = players.some(p => {
      const last = lastPositionsRef.current[p.id];
      const curr = currentPositions[p.id];
      return last && curr && (Math.abs(last.x - curr.x) > 1 || Math.abs(last.y - curr.y) > 1);
    });

    if (navChanged || positionsChanged) {
      players.forEach(player => {
        const node = playerRefs.current[player.id];
        if (node) {
          const pos = currentPositions[player.id];
          if (pos) {
            // Only animate if not currently dragging this node
            if (!node.isDragging()) {
              node.to({
                x: pos.x,
                y: pos.y,
                duration: 0.6,
                easing: Konva.Easings.EaseInOut
              });
            }
          }
        }
      });

      // Animate ball
      if (ballRef.current && currentBallPos) {
        if (!ballRef.current.isDragging()) {
          ballRef.current.to({
            x: currentBallPos.x,
            y: currentBallPos.y,
            duration: 0.6,
            easing: Konva.Easings.EaseInOut
          });
        }
      }

      prevNavRef.current = { rotation: activeRotation, phase: activePhase, node: activeNode };
      
      // Update last positions
      const newLast: Record<string, { x: number; y: number }> = {};
      players.forEach(p => {
        if (currentPositions[p.id]) {
          newLast[p.id] = { ...currentPositions[p.id] };
        }
      });
      lastPositionsRef.current = newLast;
      if (currentBallPos) {
        lastBallPosRef.current = { ...currentBallPos };
      }
    }
  }, [activeRotation, activePhase, activeNode, players, currentPositions, currentBallPos]);

  const stageScale = useMemo(() => {
    // Player token diameter is 87.5 (radius 43.75)
    // Bench is at x: -130. Left edge is -130 - 43.75 = -173.75
    // Court center is at 450. Distance from center to left edge is 450 - (-173.75) = 623.75
    // Total width needed to keep court centered and bench visible: 2 * 623.75 = 1247.5
    const baseContainerSize = 1250;
    
    // courtZoom 1.0 is the default "1.5 tokens margin" size
    const containerSize = baseContainerSize / (courtZoom || 1);
    
    // Multiply by 0.9 to make the court 10% smaller as requested
    const scale = Math.min(width / containerSize, height / containerSize) * 0.9;
    
    return isFinite(scale) && scale > 0 ? scale : 0.1;
  }, [width, height, courtZoom]);

  const handleMouseDown = (e: any) => {
    if (e.evt && e.evt.button !== 0) return; // Only left click
    if (activeTool === 'CURSOR' || activeTool === 'ERASER') {
      if (deleteButton) setDeleteButton(null);
      return;
    }

    const stage = e.target.getStage();
    const pos = stage.getRelativePointerPosition();

    // Close delete button on any click
    if (deleteButton) {
      setDeleteButton(null);
    }

    // Save history before starting any drawing action
    useStore.getState().saveToHistory();

    if (activeTool === 'TEXT') {
      const text = prompt('Enter text:');
      if (text) {
        addDrawing({
          id: `d_${Date.now()}`,
          type: 'TEXT',
          color: drawingColor,
          strokeWidth: 2,
          x: pos.x,
          y: pos.y,
          text
        });
      }
      return;
    }
    
    isDrawingRef.current = true;
    const id = `d_${Date.now()}`;
    currentDrawingIdRef.current = id;

    const newDrawing: Drawing = {
      id,
      type: activeTool,
      color: drawingColor,
      strokeWidth: drawingWidth,
      dash: isDashed ? [10, 10] : undefined,
      x: pos.x,
      y: pos.y,
      points: [pos.x, pos.y],
      width: 0,
      height: 0
    };

    addDrawing(newDrawing);
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getRelativePointerPosition();

    // Update cursor
    if (activeTool === 'CURSOR') {
      stage.container().style.cursor = 'default';
    } else if (activeTool === 'ERASER') {
      stage.container().style.cursor = 'cell';
    } else {
      stage.container().style.cursor = 'crosshair';
    }

    if (!isDrawingRef.current) return;

    if (!currentDrawingIdRef.current) return;

    const id = currentDrawingIdRef.current;

    if (activeTool === 'PENCIL') {
      const drawing = currentDrawings.find(d => d.id === id);
      if (drawing) {
        updateDrawing(id, { points: [...(drawing.points || []), pos.x, pos.y] });
      }
    } else if (activeTool === 'LINE' || activeTool === 'ARROW') {
      const drawing = currentDrawings.find(d => d.id === id);
      if (drawing) {
        updateDrawing(id, { points: [drawing.points![0], drawing.points![1], pos.x, pos.y] });
      }
    } else if (activeTool === 'SQUARE') {
      const drawing = currentDrawings.find(d => d.id === id);
      if (drawing) {
        const width = pos.x - drawing.x!;
        const height = pos.y - drawing.y!;
        updateDrawing(id, { width, height });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      useStore.getState().saveToHistory();
      useStore.getState().saveCurrentSchema();
    }
    isDrawingRef.current = false;
    currentDrawingIdRef.current = null;
  };

  if (width <= 0 || height <= 0) {
    return <div className="flex-1 bg-cyan-400" />;
  }

  return (
    <div className="flex-1 bg-cyan-400 flex items-center justify-center overflow-hidden border border-black/10 shadow-inner">
      <Stage 
        width={width} 
        height={height} 
        scaleX={stageScale} 
        scaleY={stageScale}
        x={width / 2}
        y={height / 2}
        offsetX={COURT_SIZE / 2}
        offsetY={COURT_SIZE / 2}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        <Layer>
          {/* Court Background */}
          <Rect
            x={0}
            y={0}
            width={COURT_SIZE}
            height={COURT_SIZE}
            fill="#f97316" // Orange
          />

          {/* Court Lines */}
          {/* Net Line (Top) */}
          <Line points={[0, 0, COURT_SIZE, 0]} stroke="white" strokeWidth={5} />
          {/* Attack Line (3m) */}
          <Line points={[0, 300, COURT_SIZE, 300]} stroke="white" strokeWidth={3} />
          {/* End Line */}
          <Line points={[0, 900, COURT_SIZE, 900]} stroke="white" strokeWidth={5} />
          {/* Side Lines */}
          <Line points={[0, 0, 0, 900]} stroke="white" strokeWidth={5} />
          <Line points={[COURT_SIZE, 0, COURT_SIZE, 900]} stroke="white" strokeWidth={5} />

          {/* Zones Labels */}
          {toggles.showZones && (
            <Group opacity={0.3}>
              <Text x={750} y={750} text="1" fontSize={40} fill="white" />
              <Text x={750} y={150} text="2" fontSize={40} fill="white" />
              <Text x={450} y={150} text="3" fontSize={40} fill="white" />
              <Text x={150} y={150} text="4" fontSize={40} fill="white" />
              <Text x={150} y={750} text="5" fontSize={40} fill="white" />
              <Text x={450} y={750} text="6" fontSize={40} fill="white" />
            </Group>
          )}

          {/* Neighbor Lines (Pre-rendered for real-time update) */}
          {[
            ['FC', 'FR'], ['FL', 'FC'], // Front row
            ['BC', 'BR'], ['BL', 'BC'], // Back row
            ['FR', 'BR'], ['FC', 'BC'], ['FL', 'BL'] // Vertical
          ].map(([s1, s2], i) => (
            <Line
              key={`n-${i}`}
              name={`validator-line neighbor-${s1}-${s2}`}
              stroke="rgba(34, 197, 94, 1.0)"
              strokeWidth={3}
              opacity={0.5}
              visible={false}
            />
          ))}

          {/* Drawings */}
          {currentDrawings.map((drawing) => {
            const commonProps = {
              key: drawing.id,
              id: drawing.id,
              name: 'drawing',
              stroke: drawing.color,
              strokeWidth: drawing.strokeWidth,
              dash: drawing.dash,
              hitStrokeWidth: 20, // Make it easier to click
              onClick: (e: any) => {
                if (activeTool === 'ERASER') {
                  removeDrawing(drawing.id);
                  useStore.getState().saveToHistory();
                }
              },
              onMouseEnter: (e: any) => {
                if (activeTool === 'ERASER') {
                  const stage = e.target.getStage();
                  stage.container().style.cursor = 'no-drop';
                }
              },
              onMouseLeave: (e: any) => {
                if (activeTool === 'ERASER') {
                  const stage = e.target.getStage();
                  stage.container().style.cursor = 'cell';
                }
              },
              onContextMenu: (e: any) => {
                e.evt.preventDefault();
                const stage = e.target.getStage();
                const pos = stage.getRelativePointerPosition();
                setDeleteButton({ x: pos.x, y: pos.y, id: drawing.id });
              }
            };

            if (drawing.type === 'PENCIL' || drawing.type === 'LINE') {
              return (
                <Line
                  {...commonProps}
                  points={drawing.points}
                  tension={drawing.type === 'PENCIL' ? 0.5 : 0}
                  lineCap="round"
                  lineJoin="round"
                />
              );
            }
            if (drawing.type === 'ARROW') {
              return (
                <Arrow
                  {...commonProps}
                  points={drawing.points}
                  fill={drawing.color}
                  pointerLength={10}
                  pointerWidth={10}
                />
              );
            }
            if (drawing.type === 'SQUARE') {
              return (
                <Rect
                  {...commonProps}
                  x={drawing.x}
                  y={drawing.y}
                  width={drawing.width}
                  height={drawing.height}
                />
              );
            }
            if (drawing.type === 'TEXT') {
              return (
                <Text
                  {...commonProps}
                  x={drawing.x}
                  y={drawing.y}
                  text={drawing.text}
                  fontSize={20}
                  fontStyle="bold"
                  fill={drawing.color}
                  strokeWidth={0} // Text uses fill
                />
              );
            }
            return null;
          })}

          {/* Players (Field + Bench) */}
          {players.map((player) => {
            const pos = currentPositions[player.id];
            if (!pos) return null;
            
            const isOnField = !!onFieldPositions[activeRotation]?.[activePhase]?.[player.id];
            if (!isOnField && !toggles.showBench) return null;

            const rolePlayers = players.filter(p => p.role === player.role);
            const showNumber = rolePlayers.length > 1;
            const playerNumber = showNumber ? (rolePlayers.indexOf(player) + 1) : '';
            const label = `${player.role}${playerNumber}`;
            
            return (
              <Group
                key={player.id}
                ref={(node) => {
                  if (node) {
                    playerRefs.current[player.id] = node;
                    // Set initial position on mount to avoid jump to (0,0)
                    if (node.x() === 0 && node.y() === 0) {
                      node.x(pos.x);
                      node.y(pos.y);
                    }
                  }
                }}
                draggable={isOnField && activeTool === 'CURSOR'}
                listening={activeTool !== 'ERASER'}
                onDragStart={(e) => {
                  setIsDragging(true);
                  handleDragStart(player.id, pos.x, pos.y);
                }}
                onDragMove={(e) => {
                  handleDragMove(player.id, e.target.x(), e.target.y(), isOnField);
                }}
                onDragEnd={(e) => {
                  handleDragEnd(player.id, e.target.x(), e.target.y(), isOnField, e.target);
                }}
                onMouseEnter={(e) => {
                  if (isOnField) {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'pointer';
                  }
                }}
                onMouseLeave={(e) => {
                  const stage = e.target.getStage();
                  if (stage) stage.container().style.cursor = 'default';
                }}
              >
                {/* Name Label Above */}
                <Text
                  text={player.name}
                  fontSize={24}
                  fontStyle="bold"
                  fill="white"
                  stroke="black"
                  strokeWidth={0.5}
                  y={isOnField ? -80 : 55}
                  align="center"
                  width={200}
                  offsetX={100}
                />
                
                <Circle
                  radius={43.75}
                  fill={player.color}
                  stroke="white"
                  strokeWidth={3}
                  opacity={isOnField ? 1 : 0.8}
                />
                <Text
                  text={isOnField ? label : player.role}
                  fontSize={20}
                  fontStyle="bold"
                  fill={getContrastColor(player.color)}
                  align="center"
                  verticalAlign="middle"
                  width={80}
                  offsetX={40}
                  offsetY={10}
                />
              </Group>
            );
          })}

          {/* Volleyball Ball */}
          {showBall && currentBallPos && (
            <Group
              ref={(node) => {
                if (node) {
                  (ballRef as any).current = node;
                  // Set initial position on mount to avoid jump
                  if (node.x() === 0 && node.y() === 0) {
                    node.x(currentBallPos.x);
                    node.y(currentBallPos.y);
                  }
                }
              }}
              draggable={userRole !== 'VIEWER' && activeTool === 'CURSOR'}
              listening={activeTool !== 'ERASER'}
              onDragStart={() => setIsDragging(true)}
              onDragMove={(e) => updateBallPosition(e.target.x(), e.target.y())}
              onDragEnd={() => setIsDragging(false)}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'pointer';
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'default';
              }}
            >
              {volleyballImage ? (
                <KonvaImage
                  image={volleyballImage}
                  width={65}
                  height={65}
                  offsetX={32.5}
                  offsetY={32.5}
                  shadowBlur={5}
                  shadowOpacity={0.3}
                />
              ) : (
                <>
                  <Circle
                    radius={28.4375}
                    fill="white"
                    stroke="#333"
                    strokeWidth={2}
                    shadowBlur={5}
                    shadowOpacity={0.2}
                  />
                  <Text
                    text="🏐"
                    fontSize={31}
                    x={-15}
                    y={-15}
                  />
                </>
              )}
            </Group>
          )}

          {/* Delete Button Overlay */}
          {deleteButton && (
            <Group
              x={deleteButton.x}
              y={deleteButton.y}
              onClick={() => {
                removeDrawing(deleteButton.id);
                setDeleteButton(null);
              }}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                stage.container().style.cursor = 'pointer';
              }}
            >
              <Circle
                radius={15}
                fill="#ef4444"
                stroke="white"
                strokeWidth={2}
                shadowBlur={5}
                shadowOpacity={0.3}
              />
              <Text
                text="✕"
                fontSize={14}
                fontStyle="bold"
                fill="white"
                x={-5}
                y={-6}
                listening={false}
              />
            </Group>
          )}

          {/* Eraser Preview Circle removed for basic feel */}
        </Layer>
      </Stage>
    </div>
  );
});