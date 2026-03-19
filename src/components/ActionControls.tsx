import React, { useCallback, useState } from 'react';
import { 
  Share2, 
  Download, 
  Upload,
  Trash2,
  FileDown,
  X,
  Check
} from 'lucide-react';
import { useStore } from '../store';
import { serializeState, copyToClipboard } from '../utils';
import { UserRole } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal = React.memo(({ isOpen, onClose }: ShareModalProps) => {
  const state = useStore();
  const [role, setRole] = useState<UserRole>('VIEWER');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const { history, future, schemas, activeSchemaId, ...currentState } = state;
    const stateToShare = {
      ...currentState,
      activeRotation: 'R1',
      activePhase: 'SERVE',
      activeNode: 'BASE',
      saveChanges: false,
      userRole: role
    };

    const serialized = serializeState(stateToShare as any);
    const url = new URL(window.location.href);
    url.searchParams.set('schema', serialized);
    url.searchParams.set('role', role);
    
    const success = await copyToClipboard(url.toString());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Share Schema</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Permission Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['VIEWER', 'EDITOR', 'OWNER'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    role === r 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-medium text-white transition-all hover:bg-indigo-700"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5" />
                Copy Share Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export const ActionControls: React.FC = React.memo(() => {
  const state = useStore();
  const { 
    resetAll, loadState, userRole, activeSchemaId, schemas
  } = state;
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const currentSchema = schemas.find(s => s.id === activeSchemaId);
  const isReadOnly = currentSchema?.isReadOnly;

  const handleDownload = useCallback(() => {
    const stage = document.querySelector('canvas');
    if (stage) {
      const dataURL = stage.toDataURL();
      const link = document.createElement('a');
      link.download = 'volleyball-tactics.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const handleExportJSON = useCallback(() => {
    const { history, future, schemas, activeSchemaId, ...currentState } = state;
    const data = JSON.stringify(currentState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.download = `rotation_${date}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [state]);

  const handleImportJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (userRole === 'VIEWER') return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadState(json);
      } catch (err) {
        alert('Failed to import rotation. Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }, [loadState, userRole]);

  return (
    <div className="flex flex-col gap-3 p-4 border-t border-black/5 select-none">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</h3>
      
      <div className="flex flex-col gap-2">
        <div className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest border text-center ${
          userRole === 'OWNER' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
          userRole === 'EDITOR' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
          'bg-gray-50 border-gray-200 text-gray-500'
        }`}>
          Role: {userRole}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded border border-gray-200 shadow-sm transition-colors"
          >
            <FileDown size={16} />
            <span className="text-xs font-medium">Export</span>
          </button>
          
          <label className={`flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded border border-gray-200 shadow-sm cursor-pointer transition-colors ${userRole === 'VIEWER' || isReadOnly ? 'opacity-30 cursor-not-allowed' : ''}`}>
            <Upload size={16} />
            <span className="text-xs font-medium">Import</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} disabled={userRole === 'VIEWER' || isReadOnly} />
          </label>
        </div>

        <button 
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded border border-gray-200 shadow-sm transition-colors"
        >
          <Share2 size={16} />
          <span className="text-xs font-medium">Share via URL</span>
        </button>

        <button 
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded border border-gray-200 shadow-sm transition-colors"
        >
          <Download size={16} />
          <span className="text-xs font-medium">Download PNG</span>
        </button>

        <button 
          onClick={resetAll}
          disabled={userRole === 'VIEWER' || isReadOnly}
          className="flex items-center justify-center gap-2 p-2 hover:bg-red-50 text-red-600 rounded border border-red-100 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 size={16} />
          <span className="text-xs font-medium">Clear All</span>
        </button>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </div>
  );
});
