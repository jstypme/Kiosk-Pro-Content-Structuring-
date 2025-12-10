import React from 'react';
import { ProductData, MediaFiles } from '../types';
import { Package, Check, ArrowRight, Save, FolderOpen } from 'lucide-react';
import { saveToKioskLibrary, verifyPermission } from '../services/fileSystemService';

interface ExportSectionProps {
  data: ProductData;
  media: MediaFiles;
  rootHandle: FileSystemDirectoryHandle | null;
  onConnect: () => void;
  onNext: () => void;
}

const ExportSection: React.FC<ExportSectionProps> = ({ data, media, rootHandle, onConnect, onNext }) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    if (!rootHandle) {
        onConnect();
        return;
    }

    setSaveStatus('idle');
    setIsSaving(true);
    
    try {
      const hasPermission = await verifyPermission(rootHandle, true);
      if (!hasPermission) {
        alert("Permission denied.");
        return;
      }

      await saveToKioskLibrary(rootHandle, data, media);
      setSaveStatus('success');
    } catch (error) {
      console.error("Failed to save", error);
      setSaveStatus('error');
      alert("Error saving files.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-5 md:p-6 text-white shadow-2xl shadow-purple-900/50 border border-purple-500/30">
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-white">
            <Package className="w-5 h-5 text-purple-200" />
            Export to Library
          </h2>
          <p className="text-purple-200/60 text-xs mt-1">Structure and save files to your local folder.</p>
        </div>
        
        {saveStatus === 'success' ? (
            <div className="space-y-3 animate-fade-in">
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-green-100">Saved Successfully</p>
                        <p className="text-[10px] text-green-200/70">Files written to {rootHandle?.name}/{data.brand}/{data.category}/{data.name}</p>
                    </div>
                </div>

                <button 
                    onClick={onNext}
                    className="w-full flex items-center justify-center gap-2 bg-white text-purple-900 font-bold py-3 px-4 rounded-xl hover:bg-purple-50 transition-colors shadow-lg"
                >
                    Start Next Product <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        ) : (
             <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                    w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-all shadow-lg
                    ${!rootHandle 
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                        : 'bg-white text-purple-900 hover:bg-purple-50'
                    }
                    ${isSaving ? 'opacity-70 cursor-wait' : ''}
                `}
            >
                {isSaving ? (
                    <>Processing...</>
                ) : !rootHandle ? (
                    <><FolderOpen className="w-4 h-4" /> Connect Folder to Save</>
                ) : (
                    <><Save className="w-4 h-4" /> Save to Drive</>
                )}
            </button>
        )}
      </div>
      
       {/* Small status text if needed */}
       {rootHandle && saveStatus !== 'success' && (
           <div className="text-[10px] text-purple-300/50 text-center">
               Target: {rootHandle.name}
           </div>
       )}
    </div>
  );
};

export default ExportSection;