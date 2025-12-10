import React, { useState, useEffect } from 'react';
import InputSection from './InputSection';
import DataEditor from './DataEditor';
import MediaUpload from './MediaUpload';
import ExportSection from './ExportSection';
import { generateProductContent } from '../services/geminiService';
import { ProductData, MediaFiles } from '../types';
import { Box, FolderOpen, Zap, LayoutTemplate, AlertTriangle } from 'lucide-react';
import { getStoredDirectoryHandle, pickDirectory } from '../services/fileSystemService';

const initialProductData: ProductData = {
  brand: '',
  sku: '',
  name: '',
  category: '',
  shortDescription: '',
  whatsInTheBox: [],
  description: '',
  keyFeatures: [],
  material: '',
  dimensions: { width: '', height: '', depth: '', weight: '' },
  buyingBenefit: '',
  specs: [],
  terms: ''
};

const initialMedia: MediaFiles = {
  cover: null,
  gallery: [],
  videos: [],
  manual: null,
  logo: null
};

export default function App() {
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData>(initialProductData);
  const [media, setMedia] = useState<MediaFiles>(initialMedia);
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved handle on mount
  useEffect(() => {
    const loadHandle = async () => {
      const handle = await getStoredDirectoryHandle();
      if (handle) {
        setRootHandle(handle);
      }
    };
    loadHandle();
  }, []);

  const handleConnectFolder = async () => {
    try {
      const handle = await pickDirectory();
      setRootHandle(handle);
    } catch (error) {
      console.log("User cancelled folder selection");
    }
  };

  const handleGenerate = async (text: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateProductContent(text);
      setProductData(result);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate content. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 flex flex-col bg-[#050505] text-slate-300 font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50">
               <Box className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Kiosk <span className="text-purple-400">Architect</span></h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Premium Data Suite</p>
            </div>
          </div>
          
          {/* Steps Indicator */}
          <div className="hidden md:flex items-center bg-[#111] p-1.5 rounded-full border border-white/5">
             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step === 1 ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30' : 'text-slate-600'}`}>
                1. Input
             </div>
             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step >= 2 ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30' : 'text-slate-600'}`}>
                2. Structure
             </div>
             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step === 3 ? 'bg-purple-900/30 text-purple-300 border border-purple-500/30' : 'text-slate-600'}`}>
                3. Finalize
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             {rootHandle ? (
                  <div className="flex items-center gap-2 bg-[#111] px-3 py-1.5 rounded-lg border border-green-900/30 text-green-400 text-xs font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="truncate max-w-[150px]">{rootHandle.name}</span>
                  </div>
                ) : (
                  <button 
                    onClick={handleConnectFolder}
                    className="flex items-center gap-2 text-xs bg-[#111] text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                  >
                    <FolderOpen className="w-3 h-3" /> Connect Library
                  </button>
                )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-8 py-10 flex-grow w-full">
        
        {step === 1 && (
             <div className="max-w-3xl mx-auto mt-12 animate-fade-in-up space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                <InputSection onGenerate={handleGenerate} isLoading={isLoading} />
             </div>
        )}

        {step >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
             
             {/* LEFT COLUMN: Data Editor (Text) */}
             <div className="lg:col-span-7 space-y-8">
                 <DataEditor 
                    data={productData} 
                    onChange={setProductData} 
                 />
             </div>
             
             {/* RIGHT COLUMN: Media & Actions (Visuals) */}
             <div className="lg:col-span-5 space-y-8">
                 <div className="sticky top-24 space-y-8">
                    <MediaUpload 
                        media={media} 
                        onChange={setMedia} 
                    />

                    <ExportSection 
                        data={productData} 
                        media={media} 
                        rootHandle={rootHandle}
                        onConnect={handleConnectFolder}
                    />
                 </div>
             </div>
          </div>
        )}

      </main>

      {step === 1 && (
        <footer className="border-t border-white/5 mt-auto bg-[#0a0a0a]">
            <div className="max-w-[1600px] mx-auto px-8 py-6 flex justify-between items-center">
                <p className="text-xs text-slate-600">Powered by Google Gemini 2.5 Pro</p>
                <div className="flex gap-4 text-xs text-slate-600">
                    <span>Privacy</span>
                    <span>Terms</span>
                </div>
            </div>
        </footer>
      )}
    </div>
  );
}