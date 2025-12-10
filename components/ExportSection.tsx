import React from 'react';
import { ProductData, MediaFiles } from '../types';
import { Folder, FileJson, Image, Video, FileText, HardDrive, Package, Check } from 'lucide-react';
import { saveToKioskLibrary, verifyPermission } from '../services/fileSystemService';

interface ExportSectionProps {
  data: ProductData;
  media: MediaFiles;
  rootHandle: FileSystemDirectoryHandle | null;
  onConnect: () => void;
}

const ExportSection: React.FC<ExportSectionProps> = ({ data, media, rootHandle, onConnect }) => {
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
      setTimeout(() => setSaveStatus('idle'), 3000);
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
        
        <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
                w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm shadow-xl
                transition-all transform active:scale-95 border border-white/10
                ${isSaving 
                ? 'bg-black/40 text-slate-400 cursor-wait' 
                : saveStatus === 'success' 
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-white text-purple-900 hover:bg-purple-50'
                }
            `}
            >
            {isSaving ? (
                'Saving...'
            ) : saveStatus === 'success' ? (
                <>
                 <Check className="w-5 h-5" /> Saved Successfully
                </>
            ) : (
                <>
                <HardDrive className="w-5 h-5" />
                {rootHandle ? 'Save to Disk' : 'Connect Folder & Save'}
                </>
            )}
        </button>
      </div>

      {/* Visual File Tree Preview */}
      <div className="bg-black/50 rounded-xl p-4 font-mono text-[10px] border border-white/5 overflow-x-auto custom-scrollbar">
        <h3 className="text-purple-300 text-[9px] uppercase tracking-wider mb-3 border-b border-white/5 pb-2">Destination Structure</h3>
        
        <div className="space-y-1.5 opacity-80 whitespace-nowrap">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
                <HardDrive className="w-3 h-3 flex-shrink-0" />
                <span>{rootHandle ? rootHandle.name : 'Select_Folder...'}</span>
            </div>
            
            <div className="pl-4 flex items-center gap-2 text-yellow-500">
                <Folder className="w-3 h-3 flex-shrink-0" />
                <span>{data.brand || '[Brand]'}</span>
            </div>
            
            <div className="pl-8 text-slate-400 flex items-center gap-2">
                 <FileJson className="w-2 h-2 flex-shrink-0" /> brand.json
            </div>

            <div className="pl-8 flex items-center gap-2 text-yellow-500">
                <Folder className="w-3 h-3 flex-shrink-0" />
                <span>{data.category || '[Category]'}</span>
            </div>

            <div className="pl-12 flex items-center gap-2 text-yellow-500">
                <Folder className="w-3 h-3 flex-shrink-0" />
                <span>{data.name || '[Product Name]'}</span>
            </div>

            <div className="pl-16 text-slate-400 flex items-center gap-2">
                 <FileJson className="w-2 h-2 flex-shrink-0" /> details.json
            </div>
             {media.cover && (
                <div className="pl-16 text-green-400 flex items-center gap-2">
                    <Image className="w-2 h-2 flex-shrink-0" /> cover.{media.cover.name.split('.').pop()}
                </div>
            )}
             {media.gallery.length > 0 && (
                <div className="pl-16 text-green-400 flex items-center gap-2">
                    <Image className="w-2 h-2 flex-shrink-0" /> gallery_1..{media.gallery.length}
                </div>
            )}
             {media.videos.length > 0 && (
                <div className="pl-16 text-purple-400 flex items-center gap-2">
                    <Video className="w-2 h-2 flex-shrink-0" /> videos_1..{media.videos.length}
                </div>
            )}
             {media.manuals.length > 0 && (
                <div className="pl-16 text-cyan-400 flex flex-col gap-1">
                     {media.manuals.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                             <FileText className="w-2 h-2 flex-shrink-0" /> {m.name}
                        </div>
                     ))}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default ExportSection;