import React, { useState, DragEvent } from 'react';
import { MediaFiles } from '../types';
import { Image, Video, FileText, Loader2, UploadCloud, Edit2 } from 'lucide-react';
import { resizeImage } from '../services/imageProcessing';

interface MediaUploadProps {
  media: MediaFiles;
  onChange: (media: MediaFiles) => void;
}

interface CardProps {
  children?: React.ReactNode;
  title: string;
  icon: any;
  isProcessing: boolean;
}

const Card = ({ children, title, icon: Icon, isProcessing }: CardProps) => (
    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden mb-6 shadow-xl">
        <div className="bg-white/5 px-4 md:px-6 py-4 flex items-center justify-between border-b border-white/5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Icon className="w-4 h-4 text-purple-400" /> {title}
            </h3>
            {isProcessing && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
        </div>
        <div className="p-4 md:p-6">
            {children}
        </div>
    </div>
);

const MediaUpload: React.FC<MediaUploadProps> = ({ media, onChange }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState<string | null>(null);

  const isValidFileType = (file: File, field: keyof MediaFiles) => {
    if (field === 'videos') return file.type.startsWith('video/');
    if (field === 'manuals') return file.type === 'application/pdf';
    return file.type.startsWith('image/');
  };

  const handleFileChange = async (field: keyof MediaFiles, files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Filter valid files
    const validFiles = Array.from(files).filter(f => isValidFileType(f, field));
    if (validFiles.length === 0) return;

    setIsProcessing(true);
    const processedFiles: File[] = [];

    try {
      for (const file of validFiles) {
        if (file.type.startsWith('image/')) {
          try {
            const resized = await resizeImage(file, 500, 500);
            processedFiles.push(resized);
          } catch (err) {
            console.warn(`Resize failed for ${file.name}, using original.`, err);
            processedFiles.push(file);
          }
        } else {
          processedFiles.push(file);
        }
      }

      if (field === 'gallery' || field === 'videos') {
         const current = media[field] as File[];
         onChange({ ...media, [field]: [...current, ...processedFiles] });
      } else if (field === 'manuals') {
         const newManuals = processedFiles.map(f => ({ file: f, name: f.name }));
         onChange({ ...media, manuals: [...media.manuals, ...newManuals] });
      } else {
        onChange({ ...media, [field]: processedFiles[0] });
      }
    } catch (error) {
      console.error("Error processing files", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (field: keyof MediaFiles, index?: number) => {
    if (field === 'gallery' || field === 'videos') {
        const current = media[field] as File[];
        if (typeof index === 'number') {
            onChange({ ...media, [field]: current.filter((_, i) => i !== index) });
        }
    } else if (field === 'manuals') {
         if (typeof index === 'number') {
            onChange({ ...media, manuals: media.manuals.filter((_, i) => i !== index) });
        }
    } else {
        onChange({ ...media, [field]: null });
    }
  };

  const updateManualName = (index: number, newName: string) => {
    const updated = [...media.manuals];
    updated[index] = { ...updated[index], name: newName };
    onChange({ ...media, manuals: updated });
  };

  // Drag Handlers
  const handleDrag = (e: DragEvent, field: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(field);
    } else if (e.type === 'dragleave') {
        // Prevent flickering when entering children
        if (e.relatedTarget && (e.currentTarget.contains(e.relatedTarget as Node))) {
            return;
        }
        setDragActive(null);
    }
  };

  const handleDrop = (e: DragEvent, field: keyof MediaFiles) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(field, e.dataTransfer.files);
    }
  };

  const getDragClass = (field: string) => 
    dragActive === field 
      ? 'border-purple-500 bg-purple-900/10 ring-1 ring-purple-500/50' 
      : 'border-white/10 hover:border-purple-500/30 bg-black/60 backdrop-blur-xl';

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Primary Assets */}
      <div className="grid grid-cols-2 gap-4">
          <div 
            className={`rounded-3xl p-4 flex flex-col items-center justify-center text-center relative group transition-all cursor-pointer h-40 border shadow-xl ${getDragClass('logo')}`}
            onDragEnter={(e) => handleDrag(e, 'logo')}
            onDragLeave={(e) => handleDrag(e, 'logo')}
            onDragOver={(e) => handleDrag(e, 'logo')}
            onDrop={(e) => handleDrop(e, 'logo')}
          >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="logo-upload"
                  onChange={(e) => handleFileChange('logo', e.target.files)}
                  disabled={isProcessing}
                />
                <label htmlFor="logo-upload" className="absolute inset-0 cursor-pointer z-10"></label>
                
                {media.logo ? (
                   <div className="relative z-20 w-full h-full flex flex-col items-center justify-center">
                       <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-2 mb-2">
                           <img src={URL.createObjectURL(media.logo)} className="max-w-full max-h-full object-contain" />
                       </div>
                       <span className="text-[10px] text-green-400 truncate max-w-full">{media.logo.name}</span>
                       <button onClick={(e) => { e.preventDefault(); removeFile('logo'); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-30">×</button>
                   </div>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-full bg-purple-900/20 flex items-center justify-center mb-3 group-hover:bg-purple-600/20 transition-colors">
                            <Image className="w-6 h-6 text-purple-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-400">Brand Logo</span>
                        <span className="text-[9px] text-slate-600 mt-1">500x500 PNG</span>
                    </>
                )}
          </div>

          <div 
            className={`rounded-3xl p-4 flex flex-col items-center justify-center text-center relative group transition-all cursor-pointer h-40 border shadow-xl ${getDragClass('cover')}`}
            onDragEnter={(e) => handleDrag(e, 'cover')}
            onDragLeave={(e) => handleDrag(e, 'cover')}
            onDragOver={(e) => handleDrag(e, 'cover')}
            onDrop={(e) => handleDrop(e, 'cover')}
          >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="cover-upload"
                  onChange={(e) => handleFileChange('cover', e.target.files)}
                  disabled={isProcessing}
                />
                <label htmlFor="cover-upload" className="absolute inset-0 cursor-pointer z-10"></label>
                
                 {media.cover ? (
                   <div className="relative z-20 w-full h-full flex flex-col items-center justify-center">
                       <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden mb-2 border border-slate-700">
                           <img src={URL.createObjectURL(media.cover)} className="w-full h-full object-cover" />
                       </div>
                       <span className="text-[10px] text-green-400 truncate max-w-full">{media.cover.name}</span>
                       <button onClick={(e) => { e.preventDefault(); removeFile('cover'); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-30">×</button>
                   </div>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-full bg-indigo-900/20 flex items-center justify-center mb-3 group-hover:bg-indigo-600/20 transition-colors">
                            <Image className="w-6 h-6 text-indigo-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-400">Cover Image</span>
                        <span className="text-[9px] text-slate-600 mt-1">Main Product Shot</span>
                    </>
                )}
          </div>
      </div>

      <Card title="Gallery Images" icon={Image} isProcessing={isProcessing}>
          <div 
            className={`grid grid-cols-3 md:grid-cols-4 gap-2 transition-all p-2 -m-2 rounded-xl border border-transparent ${dragActive === 'gallery' ? 'bg-purple-900/10 border-purple-500/30' : ''}`}
             onDragEnter={(e) => handleDrag(e, 'gallery')}
             onDragLeave={(e) => handleDrag(e, 'gallery')}
             onDragOver={(e) => handleDrag(e, 'gallery')}
             onDrop={(e) => handleDrop(e, 'gallery')}
          >
            {media.gallery.map((file, i) => (
                <div key={i} className="aspect-square bg-black border border-white/10 rounded-lg relative overflow-hidden group">
                     <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                     <button onClick={() => removeFile('gallery', i)} className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-[10px] md:opacity-0 md:group-hover:opacity-100 transition-opacity">×</button>
                </div>
            ))}
             <label className="aspect-square bg-black/50 border border-white/10 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-900/10 transition-all">
                <span className="text-xl text-slate-600 mb-1">+</span>
                <span className="text-[8px] uppercase text-slate-500 font-bold">Add</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange('gallery', e.target.files)} />
             </label>
          </div>
      </Card>

      <Card title="Product Videos" icon={Video} isProcessing={isProcessing}>
           <div 
             className={`space-y-2 transition-all p-2 -m-2 rounded-xl border border-transparent ${dragActive === 'videos' ? 'bg-purple-900/10 border-purple-500/30' : ''}`}
             onDragEnter={(e) => handleDrag(e, 'videos')}
             onDragLeave={(e) => handleDrag(e, 'videos')}
             onDragOver={(e) => handleDrag(e, 'videos')}
             onDrop={(e) => handleDrop(e, 'videos')}
           >
               {media.videos.map((file, i) => (
                   <div key={i} className="flex items-center justify-between bg-black/50 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 overflow-hidden">
                             <div className="w-6 h-6 bg-purple-900/40 rounded flex items-center justify-center flex-shrink-0">
                                 <Video className="w-3 h-3 text-purple-400" />
                             </div>
                             <span className="text-xs text-slate-300 truncate">{file.name}</span>
                        </div>
                        <button onClick={() => removeFile('videos', i)} className="text-slate-600 hover:text-red-500">×</button>
                   </div>
               ))}
               <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-white/10 rounded-lg cursor-pointer hover:bg-white/5 hover:border-purple-500/30 transition-all text-xs font-bold text-slate-400">
                    <UploadCloud className="w-4 h-4" /> Upload MP4
                    <input type="file" multiple accept="video/*" className="hidden" onChange={(e) => handleFileChange('videos', e.target.files)} />
               </label>
           </div>
      </Card>

      <Card title="User Manuals" icon={FileText} isProcessing={isProcessing}>
           <div 
             className={`space-y-3 transition-all p-2 -m-2 rounded-xl border border-transparent ${dragActive === 'manuals' ? 'bg-purple-900/10 border-purple-500/30' : ''}`}
             onDragEnter={(e) => handleDrag(e, 'manuals')}
             onDragLeave={(e) => handleDrag(e, 'manuals')}
             onDragOver={(e) => handleDrag(e, 'manuals')}
             onDrop={(e) => handleDrop(e, 'manuals')}
           >
               {media.manuals.map((manual, i) => (
                   <div key={i} className="flex items-center gap-3 bg-black/50 p-3 rounded-xl border border-white/10 group">
                        <div className="w-8 h-8 bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex-grow min-w-0">
                            <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">
                                Display Name
                            </label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={manual.name}
                                    onChange={(e) => updateManualName(i, e.target.value)}
                                    className="w-full bg-transparent border-b border-white/10 focus:border-green-500 p-0 pb-1 text-sm font-medium text-slate-200 focus:ring-0 placeholder:text-slate-700 transition-colors"
                                    placeholder="e.g. User Manual"
                                />
                                <Edit2 className="w-3 h-3 text-slate-600 flex-shrink-0" />
                            </div>
                        </div>
                        <button onClick={() => removeFile('manuals', i)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                            ×
                        </button>
                   </div>
               ))}

               <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-white/10 rounded-lg cursor-pointer hover:bg-white/5 hover:border-purple-500/30 transition-all text-xs font-bold text-slate-400 mt-2">
                    <UploadCloud className="w-4 h-4" /> Add PDF Manual
                    <input type="file" multiple accept=".pdf" className="hidden" onChange={(e) => handleFileChange('manuals', e.target.files)} />
               </label>
           </div>
      </Card>

    </div>
  );
};

export default MediaUpload;