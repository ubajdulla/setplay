import React, { useState, useRef, useEffect } from 'react';
import { 
  MousePointer2, 
  Pencil, 
  Minus, 
  ArrowUpRight, 
  Square, 
  Type, 
  Eraser,
  Trash2,
  Undo2,
  Redo2,
  RotateCcw,
  Palette,
  ChevronDown,
  Lock,
  Unlock,
  MoreVertical,
  Check
} from 'lucide-react';
import { useStore } from '../store';

const TOOLBAR_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', 
  '#14b8a6', '#6366f1', '#000000', '#ffffff'
];

export const Toolbar: React.FC<{ style?: React.CSSProperties }> = React.memo(({ style }) => {
  const { 
    activeTool, setActiveTool, 
    undo, redo, history, future, resetNode, resetNodeToBase,
    userRole, drawingColor, setDrawingColor,
    showBall, toggleBall,
    saveChanges, setSaveChanges,
    activeSchemaId, schemas,
    activeNode
  } = useStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const currentSchema = schemas.find(s => s.id === activeSchemaId);
  const isReadOnly = currentSchema?.isReadOnly;

  const tools = [
    { id: 'CURSOR', icon: MousePointer2, label: 'Select' },
    { id: 'PENCIL', icon: Pencil, label: 'Pencil' },
    { id: 'LINE', icon: Minus, label: 'Line' },
    { id: 'ARROW', icon: ArrowUpRight, label: 'Arrow' },
    { id: 'SQUARE', icon: Square, label: 'Square' },
    { id: 'TEXT', icon: Type, label: 'Text' },
    { id: 'ERASER', icon: Eraser, label: 'Eraser' },
  ];

  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsSmallScreen(window.innerWidth < 1000);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const activeToolObj = tools.find(t => t.id === activeTool) || tools[0];

  return (
    <div 
      ref={containerRef}
      style={style}
      className="z-50 flex items-center gap-4 bg-white p-2 rounded-xl border border-black/10 shadow-lg px-4 transition-none"
    >
      {/* Tools Dropdown on the left */}
      <div className="relative">
        <button
          onClick={() => setShowToolsDropdown(!showToolsDropdown)}
          className={`flex items-center gap-2 p-2 rounded-lg transition-none ${
            activeTool !== 'CURSOR' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600'
          } hover:bg-black/[0.05]`}
        >
          <activeToolObj.icon size={18} />
          <ChevronDown size={14} />
        </button>

        {showToolsDropdown && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setShowToolsDropdown(false)} />
            <div className="absolute top-full left-0 mt-2 p-1 bg-white rounded-lg shadow-xl border border-gray-100 z-[70] flex flex-col gap-0.5 min-w-[140px]">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id as any);
                    setShowToolsDropdown(false);
                  }}
                  disabled={isReadOnly && tool.id !== 'CURSOR'}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-none text-sm font-medium ${
                    activeTool === tool.id 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-black/[0.05] text-gray-600'
                  } ${isReadOnly && tool.id !== 'CURSOR' ? 'opacity-20 cursor-not-allowed' : ''}`}
                >
                  <tool.icon size={16} />
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="h-6 w-px bg-black/5 shrink-0" />

      {isSmallScreen ? (
        <div className="relative">
          <button
            onClick={() => setShowMoreDropdown(!showMoreDropdown)}
            className="p-2 hover:bg-black/[0.05] rounded-lg text-gray-600 transition-none"
          >
            <MoreVertical size={18} />
          </button>

          {showMoreDropdown && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setShowMoreDropdown(false)} />
              <div className="absolute top-full right-0 mt-2 p-2 bg-white rounded-xl shadow-xl border border-gray-100 z-[70] flex flex-col gap-2 min-w-[200px]">
                {/* History */}
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase">History</span>
                  <div className="flex gap-1">
                    <button onClick={undo} disabled={history.length === 0 || isReadOnly} className="p-1.5 hover:bg-black/[0.05] rounded-md disabled:opacity-20"><Undo2 size={16} /></button>
                    <button onClick={redo} disabled={future.length === 0 || isReadOnly} className="p-1.5 hover:bg-black/[0.05] rounded-md disabled:opacity-20"><Redo2 size={16} /></button>
                  </div>
                </div>
                <div className="h-px bg-black/5" />
                {/* Ball & Reset */}
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Court</span>
                  <div className="flex gap-1">
                    <button onClick={toggleBall} disabled={isReadOnly} className={`p-1.5 rounded-md ${showBall ? 'bg-yellow-400 text-white' : 'hover:bg-black/[0.05] text-gray-400'}`}>🏐</button>
                    <button onClick={resetNode} disabled={isReadOnly} className="p-1.5 hover:bg-black/[0.05] text-orange-600 rounded-md"><RotateCcw size={16} /></button>
                  </div>
                </div>
                <div className="h-px bg-black/5" />
                {/* Save */}
                <button
                  onClick={() => setSaveChanges(!saveChanges)}
                  disabled={isReadOnly}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-none ${
                    saveChanges ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider">Save Changes</span>
                  {saveChanges ? <Unlock size={14} /> : <Lock size={14} />}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* History Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={undo}
              disabled={history.length === 0 || userRole === 'VIEWER' || isReadOnly}
              className="p-2 hover:bg-black/[0.05] rounded-lg disabled:opacity-20 transition-none text-gray-600"
              title="Undo"
            >
              <Undo2 size={18} />
            </button>
            <button 
              onClick={redo}
              disabled={future.length === 0 || userRole === 'VIEWER' || isReadOnly}
              className="p-2 hover:bg-black/[0.05] rounded-lg disabled:opacity-20 transition-none text-gray-600"
              title="Redo"
            >
              <Redo2 size={18} />
            </button>
          </div>

          <div className="h-6 w-px bg-black/5 shrink-0" />

          {/* Clear Tool */}
          <button
            onClick={() => {
              if (showClearConfirm) {
                useStore.getState().clearDrawings();
                setShowClearConfirm(false);
              } else {
                setShowClearConfirm(true);
                setTimeout(() => setShowClearConfirm(false), 3000);
              }
            }}
            disabled={isReadOnly}
            className={`p-2 rounded-lg transition-none ${
              showClearConfirm 
                ? 'bg-red-600 text-white' 
                : 'hover:bg-black/[0.05] text-red-400'
            } disabled:opacity-20 disabled:cursor-not-allowed`}
            title={showClearConfirm ? "Click again to confirm" : "Clear All Drawings"}
          >
            {showClearConfirm ? <Check size={18} /> : <Trash2 size={18} />}
          </button>

          <div className="h-6 w-px bg-black/5 shrink-0" />

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={isReadOnly}
              className="flex items-center gap-2 p-1.5 hover:bg-black/[0.05] rounded-lg transition-none disabled:opacity-20 disabled:cursor-not-allowed"
              title="Drawing Color"
            >
              <div 
                className="w-5 h-5 rounded-full border border-black/10"
                style={{ backgroundColor: drawingColor }}
              />
              <ChevronDown size={12} className="text-gray-400" />
            </button>

            {showColorPicker && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setShowColorPicker(false)} />
                <div className="absolute top-full right-0 mt-2 p-2 bg-white rounded-lg shadow-xl border border-gray-100 z-[70] grid grid-cols-4 gap-1 w-32">
                  {TOOLBAR_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setDrawingColor(color);
                        setShowColorPicker(false);
                      }}
                      className={`w-6 h-6 rounded-full border transition-none ${
                        drawingColor === color ? 'ring-2 ring-blue-400 border-white' : 'border-gray-100 hover:bg-black/[0.05]'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-black/5 shrink-0" />

          {/* Ball, Reset & Reset to Base */}
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleBall}
              disabled={isReadOnly}
              className={`p-2 rounded-lg transition-none ${
                showBall 
                  ? 'bg-yellow-400 text-white' 
                  : 'hover:bg-black/[0.05] text-gray-400'
              } ${isReadOnly ? 'opacity-20 cursor-not-allowed' : ''}`}
              title="Toggle Ball"
            >
              <div className="relative">
                <RotateCcw size={18} className="opacity-0" />
                <span className="absolute inset-0 flex items-center justify-center text-lg leading-none">🏐</span>
              </div>
            </button>
            <button 
              onClick={resetNode}
              disabled={isReadOnly}
              className="p-2 hover:bg-black/[0.05] text-orange-600 rounded-lg transition-none disabled:opacity-20 disabled:cursor-not-allowed"
              title="Reset Node to last saved"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={resetNodeToBase}
              disabled={isReadOnly || activeNode === 'BASE'}
              className="p-2 hover:bg-black/[0.05] text-red-500 rounded-lg transition-none disabled:opacity-20 disabled:cursor-not-allowed"
              title="Reset Node to BASE positions"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="h-6 w-px bg-black/5 shrink-0" />

          {/* Save Toggle */}
          <button
            onClick={() => setSaveChanges(!saveChanges)}
            disabled={isReadOnly}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-none ${
              saveChanges 
                ? 'bg-emerald-600 border-emerald-600 text-white' 
                : 'bg-white border-gray-200 text-gray-400 hover:bg-black/[0.05]'
            } ${isReadOnly ? 'opacity-20 cursor-not-allowed' : ''}`}
            title={saveChanges ? "Save Changes Enabled" : "Save Changes Disabled"}
          >
            {saveChanges ? <Unlock size={14} /> : <Lock size={14} />}
            <span className="text-[10px] font-black uppercase tracking-wider">Save</span>
          </button>
        </>
      )}
    </div>
  );
});