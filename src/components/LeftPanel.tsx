/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { Plus, FolderOpen, Trash2, Save, Share2, FileDown, Edit2, Check, X, MoreVertical, Lock } from 'lucide-react';
import { useStore } from '../store';
import { SavedSchema } from '../types';
import { EditableText } from './EditableText';

const SchemaCard = React.memo(({ 
  schema, 
  isActive, 
  onLoad, 
  onDelete, 
  onExport, 
  onRename,
  userRole 
}: { 
  schema: SavedSchema; 
  isActive: boolean; 
  onLoad: (id: string) => void; 
  onDelete: (id: string, e: React.MouseEvent) => void; 
  onExport: (schema: SavedSchema, e: React.MouseEvent) => void;
  onRename: (id: string, newName: string) => void;
  userRole: string;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isReadOnly = schema.isReadOnly;

  return (
    <div 
      onClick={() => onLoad(schema.id)}
      className={`group relative flex flex-col gap-3 p-3 rounded-2xl border transition-none cursor-pointer ${
        isActive 
          ? 'border-blue-500 bg-blue-50/30' 
          : isReadOnly
            ? 'bg-gray-100 border-gray-200 opacity-80'
            : 'bg-white border-gray-200 hover:bg-black/[0.05]'
      }`}
    >
      {/* Thumbnail */}
      <div className={`w-full aspect-video rounded-xl relative overflow-hidden shrink-0 border shadow-inner ${isReadOnly ? 'bg-gray-200 border-gray-300' : 'bg-gray-100 border-gray-200'}`}>
        {schema.thumbnail ? (
          <img 
            src={schema.thumbnail} 
            alt={schema.name} 
            className={`w-full h-full object-cover ${isReadOnly ? 'grayscale' : ''}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <FolderOpen size={32} />
          </div>
        )}
        
        {isReadOnly && (
          <div className="absolute top-2 right-2 p-1.5 bg-black/20 backdrop-blur-md rounded-lg text-white">
            <Lock size={12} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <EditableText 
            value={schema.name}
            onSave={(newName) => onRename(schema.id, newName)}
            className={`text-base font-black leading-tight ${isReadOnly ? 'text-gray-500' : 'text-gray-900'}`}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
            allowClickToEdit={false}
          />
        </div>
        <div className="flex items-center justify-between mt-1 px-2">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {isReadOnly ? 'Original' : new Date(schema.timestamp).toLocaleDateString()}
          </div>
          
          {/* Menu Toggle */}
          {!isReadOnly && (
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className={`p-1 rounded transition-none focus:outline-none ${showMenu ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <MoreVertical size={14} />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 bottom-full mb-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[101]">
                    <button 
                      onClick={(e) => { 
                        setIsEditing(true);
                        setShowMenu(false); 
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold text-gray-700 hover:bg-black/[0.05] flex items-center gap-2 focus:outline-none transition-none"
                    >
                      <Edit2 size={12} /> Rename
                    </button>
                    {userRole !== 'VIEWER' && (
                      <button 
                        onClick={(e) => { onDelete(schema.id, e); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-black/[0.05] flex items-center gap-2 focus:outline-none transition-none"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const LeftPanel: React.FC = React.memo(() => {
  const { 
    schemas, 
    activeSchemaId, 
    createSchema, 
    deleteSchema, 
    loadSchema, 
    saveCurrentSchema,
    renameSchema,
    userRole,
    setUserRole
  } = useStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newSchemaName, setNewSchemaName] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleNewSchema = useCallback(() => {
    // If somehow stuck in viewer mode, allow creating if they are the one clicking
    if (userRole === 'VIEWER') {
      setUserRole('OWNER');
    }
    setNewSchemaName(`Schema ${schemas.length + 1}`);
    setShowCreateModal(true);
  }, [schemas.length, userRole, setUserRole]);

  const confirmCreateSchema = useCallback(() => {
    if (newSchemaName.trim()) {
      createSchema(newSchemaName.trim());
      setShowCreateModal(false);
      setNewSchemaName('');
    }
  }, [newSchemaName, createSchema]);

  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole === 'VIEWER') return;
    saveCurrentSchema();
    setSaveMessage('Changes saved to schema!');
    setTimeout(() => setSaveMessage(null), 3000);
  }, [saveCurrentSchema, userRole]);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole === 'VIEWER') return;
    setConfirmDeleteId(id);
  }, [userRole]);

  const confirmDelete = useCallback(() => {
    if (confirmDeleteId) {
      deleteSchema(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, deleteSchema]);

  const handleExport = useCallback((schema: SavedSchema, e: React.MouseEvent) => {
    const data = JSON.stringify(schema.state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${schema.name.replace(/\s+/g, '_')}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="w-80 bg-gray-50 border-r border-black/10 flex flex-col h-full select-none">
      <div className="p-4 border-b border-black/10 flex flex-col gap-2">
        <button 
          onClick={handleNewSchema}
          disabled={userRole === 'VIEWER'}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-none disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          New Schema
        </button>
        {activeSchemaId && userRole === 'OWNER' && (
          <button 
            onClick={handleSave}
            className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-none"
          >
            <Save size={18} />
            Save Changes
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Archive</h3>
          <span className="text-[10px] font-bold text-gray-400">{schemas.filter(s => s.id !== 'DEFAULT').length}</span>
        </div>

        <div className="flex flex-col gap-4">
          {/* Archive Section - only user schemas */}
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Archive</h3>
            {schemas.filter(s => s.id !== 'DEFAULT').length === 0 ? (
              <div className="text-center py-8 px-4 bg-white/50 rounded-2xl border border-dashed border-black/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">No saved tactics yet</p>
                <p className="text-[10px] text-gray-300 mt-1">Click "New Schema" to create one</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {schemas.filter(s => s.id !== 'DEFAULT').map(schema => (
                  <SchemaCard 
                    key={schema.id}
                    schema={schema}
                    isActive={activeSchemaId === schema.id}
                    onLoad={loadSchema}
                    onDelete={handleDelete}
                    onExport={handleExport}
                    onRename={renameSchema}
                    userRole={userRole}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Delete Tactic</h2>
              <button onClick={() => setConfirmDeleteId(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-500">
              Are you sure you want to delete <span className="font-bold text-gray-900">{schemas.find(s => s.id === confirmDeleteId)?.name}</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-black/[0.05] text-gray-700 rounded-xl font-bold transition-none"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Toast */}
      {saveMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[200] font-bold animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-2">
          <Check size={18} />
          {saveMessage}
        </div>
      )}

      {/* Create Schema Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">New Tactic</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Tactic Name
                </label>
                <input 
                  autoFocus
                  value={newSchemaName}
                  onChange={(e) => setNewSchemaName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmCreateSchema()}
                  className="w-full p-3 bg-white border-2 border-blue-500 rounded-xl text-base outline-none font-bold shadow-sm"
                  placeholder="e.g. 5-1 Rotation"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-black/[0.05] text-gray-700 rounded-xl font-bold transition-none"
              >
                Cancel
              </button>
              <button 
                onClick={confirmCreateSchema}
                disabled={!newSchemaName.trim()}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-none disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});