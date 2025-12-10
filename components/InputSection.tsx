import React, { useState, useRef } from 'react';
import { Sparkles, Command, Upload, FileText } from 'lucide-react';

interface InputSectionProps {
  onGenerate: (text: string) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(prev => prev + (prev ? '\n\n' : '') + content);
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-[#111] rounded-3xl shadow-2xl shadow-purple-900/10 border border-white/10 p-6 md:p-10 relative overflow-hidden group">
      {/* Background glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="mb-6 md:mb-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 mb-3">
            <span className="w-8 h-8 md:w-10 md:h-10 bg-purple-600 text-white rounded-lg md:rounded-xl flex items-center justify-center text-lg shadow-lg shadow-purple-600/30 flex-shrink-0">
              <Command className="w-4 h-4 md:w-5 md:h-5" />
            </span>
            Raw Intelligence Input
          </h2>
          <p className="text-slate-400 text-sm md:text-lg leading-relaxed">
            Paste unstructured product data or upload text files. Our AI will restructure and enrich it.
          </p>
        </div>

        <div className="flex-shrink-0">
            <input 
                type="file" 
                ref={fileInputRef} 
                accept=".txt,.md,.json,.csv,.xml" 
                className="hidden" 
                onChange={handleFileUpload}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-xs font-bold text-purple-300 bg-purple-900/20 hover:bg-purple-900/40 px-4 py-2 rounded-lg transition-all border border-purple-500/20"
            >
                <Upload className="w-3 h-3" />
                Import Text File
            </button>
        </div>
      </div>

      <div className="relative z-10">
        <textarea
          className="w-full h-48 md:h-72 p-4 md:p-6 rounded-2xl border border-white/10 bg-black text-slate-300 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all outline-none resize-none font-mono text-xs md:text-sm shadow-inner placeholder:text-slate-700"
          placeholder="// Paste raw text here...
Example: 
Samsung S24 Ultra, 512GB, Titanium Grey. 
200MP Camera, AI features included. 
In box: Cable, Pin.
Dimensions: 162.3 x 79 x 8.6mm, 232g."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <div className="absolute bottom-4 right-4 text-[10px] md:text-xs text-slate-600 font-mono">
            {text.length} chars
        </div>
      </div>

      <div className="mt-6 md:mt-8 flex justify-end relative z-10">
        <button
          onClick={() => onGenerate(text)}
          disabled={!text.trim() || isLoading}
          className={`
            w-full md:w-auto flex items-center justify-center gap-3 px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95
            ${!text.trim() || isLoading 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
              : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 shadow-purple-900/40 hover:-translate-y-1 border border-white/10'
            }
          `}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-purple-100">Analyzing Data...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-purple-200" />
              Generate Structure
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;