import React, { useState, useEffect } from 'react';
import InputSection from './InputSection';
import DataEditor from './DataEditor';
import MediaUpload from './MediaUpload';
import ExportSection from './ExportSection';
import BackgroundAnimation from './BackgroundAnimation';
import { generateProductContent } from '../services/geminiService';
import { ProductData, MediaFiles } from '../types';
import { Box, FolderOpen, AlertTriangle } from 'lucide-react';
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
  manuals: [],
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

  const handleNextProduct = () => {
    setProductData(initialProductData);
    setMedia(initialMedia);
    setStep(1);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-20 flex flex-col text-slate-300 font-sans selection:bg-purple-500 selection:text-white relative">
      <BackgroundAnimation />
      
      {/* Header */}
      <header className="bg-[#0a0a0a]/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 transition-all">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50">
               <Box className="text-white w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight">Kiosk <span className="text-purple-400">Architect</span></h1>
              <p className="text-[9px] md:text-[10px] text-slate-500 font-bold tracking-widest uppercase hidden sm:block">Premium Data Suite</p>
            </div>
          </div>
          
          {/* Steps Indicator - Hidden on mobile to save space, shown on md+ */}
          <div className="hidden md:flex items-center bg-black/40 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step === 1 ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' : 'text-slate-500'}`}>
                1. Input
             </div>
             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step >= 2 ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' : 'text-slate-500'}`}>
                2. Structure
             </div>
             <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step === 3 ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' : 'text-slate-500'}`}>
                3. Finalize
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             {rootHandle ? (
                  <div className="flex items-center gap-2 bg-black/40 px-2 md:px-3 py-1.5 rounded-lg border border-green-900/30 text-green-400 text-[10px] md:text-xs font-medium max-w-[120px] md:max-w-none backdrop-blur-md">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
                    <span className="truncate">{rootHandle.name}</span>
                  </div>
                ) : (
                  <button 
                    onClick={handleConnectFolder}
                    className="flex items-center gap-2 text-xs bg-black/40 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors whitespace-nowrap backdrop-blur-md"
                  >
                    <FolderOpen className="w-3 h-3" /> 
                    <span className="hidden sm:inline">Connect Library</span>
                    <span className="sm:hidden">Connect</span>
                  </button>
                )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-10 flex-grow w-full relative z-10">
        
        {step === 1 && (
             <div className="max-w-3xl mx-auto mt-4 md:mt-12 animate-fade-in-up space-y-6">
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 text-red-100 p-4 rounded-xl flex items-center gap-3 shadow-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
                <InputSection onGenerate={handleGenerate} isLoading={isLoading} />
             </div>
        )}

        {step >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
             
             {/* LEFT COLUMN: Data Editor (Text) */}
             <div className="lg:col-span-7 space-y-6 md:space-y-8 order-2 lg:order-1">
                 <DataEditor 
                    data={productData} 
                    onChange={setProductData} 
                 />
             </div>
             
             {/* RIGHT COLUMN: Media & Actions (Visuals) */}
             {/* Mobile: Appears at top. Desktop: Sticky on right */}
             <div className="lg:col-span-5 space-y-6 md:space-y-8 order-1 lg:order-2">
                 <div className="static lg:sticky lg:top-24 space-y-6 md:space-y-8">
                    <ExportSection 
                        data={productData} 
                        media={media} 
                        rootHandle={rootHandle}
                        onConnect={handleConnectFolder}
                        onNext={handleNextProduct}
                    />
                    <MediaUpload 
                        media={media} 
                        onChange={setMedia} 
                    />
                 </div>
             </div>
          </div>
        )}

      </main>

      {step === 1 && (
        <footer className="border-t border-white/5 mt-auto bg-[#0a0a0a]/60 backdrop-blur-md relative z-10">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-500 text-center md:text-left">Powered by Google Gemini 2.5 Flash</p>
                <div className="flex gap-4 text-xs text-slate-500">
                    <span>Privacy</span>
                    <span>Terms</span>
                </div>
            </div>
        </footer>
      )}
    </div>
  );
}