import React from 'react';
import { ProductData } from '../types';
import { Edit3, Plus, X, List, Box, Layers, Settings, Ruler, Tag, FolderOpen } from 'lucide-react';

interface DataEditorProps {
  data: ProductData;
  onChange: (data: ProductData) => void;
}

const DataEditor: React.FC<DataEditorProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof ProductData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleDimensionChange = (field: string, value: string) => {
    onChange({
      ...data,
      dimensions: { ...data.dimensions, [field]: value }
    });
  };

  const handleArrayChange = (field: 'whatsInTheBox' | 'keyFeatures', index: number, value: string) => {
    const newArray = [...data[field]];
    newArray[index] = value;
    onChange({ ...data, [field]: newArray });
  };

  const addArrayItem = (field: 'whatsInTheBox' | 'keyFeatures') => {
    onChange({ ...data, [field]: [...data[field], ""] });
  };

  const removeArrayItem = (field: 'whatsInTheBox' | 'keyFeatures', index: number) => {
    const newArray = data[field].filter((_, i) => i !== index);
    onChange({ ...data, [field]: newArray });
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...data.specs];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    onChange({ ...data, specs: newSpecs });
  };

  const addSpec = () => {
    onChange({ ...data, specs: [...data.specs, { key: "", value: "" }] });
  };

  const removeSpec = (index: number) => {
    const newSpecs = data.specs.filter((_, i) => i !== index);
    onChange({ ...data, specs: newSpecs });
  };

  // Shared classes
  const labelClass = "block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2";
  const inputClass = "w-full p-3 bg-black border border-white/10 rounded-xl focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none text-slate-200 transition-all placeholder:text-slate-700 text-sm";
  const cardClass = "bg-[#111] rounded-3xl shadow-xl border border-white/5 p-5 md:p-8 relative overflow-hidden";

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <div className="mb-6 border-b border-white/5 pb-4">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-purple-500" />
            Core Product Identity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className={labelClass}>Brand</label>
              <input 
                type="text" 
                value={data.brand} 
                onChange={(e) => handleChange('brand', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>SKU / Model</label>
              <input 
                type="text" 
                value={data.sku} 
                onChange={(e) => handleChange('sku', e.target.value)}
                className={`${inputClass} font-mono text-purple-200`}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Product Name</label>
              <input 
                type="text" 
                value={data.name} 
                onChange={(e) => handleChange('name', e.target.value)}
                className={`${inputClass} text-base md:text-lg font-bold`}
              />
            </div>
             <div className="md:col-span-2">
              <label className={labelClass}><FolderOpen className="w-3 h-3" /> System Category (Folder Name)</label>
              <input 
                type="text" 
                value={data.category} 
                onChange={(e) => handleChange('category', e.target.value)}
                className={inputClass}
              />
            </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-6 border-b border-white/5 pb-4">
           <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Tag className="w-5 h-5 text-purple-500" />
            Copywriting & Description
          </h2>
        </div>
        
        <div className="space-y-6">
            <div>
              <label className={labelClass}>Short Description (Hook)</label>
              <textarea 
                value={data.shortDescription} 
                onChange={(e) => handleChange('shortDescription', e.target.value)}
                className={`${inputClass} h-20 resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Buying Benefit (Why buy?)</label>
              <textarea 
                value={data.buyingBenefit} 
                onChange={(e) => handleChange('buyingBenefit', e.target.value)}
                className={`${inputClass} h-20 resize-none`}
              />
            </div>
            
             <div>
              <label className={labelClass}>Full Description</label>
              <textarea 
                value={data.description} 
                onChange={(e) => handleChange('description', e.target.value)}
                className={`${inputClass} h-40 resize-none`}
              />
            </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className={cardClass}>
             <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                <label className={labelClass}><List className="w-3 h-3" /> Key Features</label>
                <button onClick={() => addArrayItem('keyFeatures')} className="text-[10px] bg-purple-900/30 text-purple-400 px-3 py-1.5 rounded hover:bg-purple-900/50 transition-colors uppercase font-bold tracking-wider">
                    + Add
                </button>
             </div>
             <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {data.keyFeatures.map((feature, i) => (
                    <div key={i} className="flex gap-2 group">
                        <input 
                            type="text" 
                            value={feature}
                            onChange={(e) => handleArrayChange('keyFeatures', i, e.target.value)}
                            className={`${inputClass} py-2 text-xs`}
                        />
                        <button onClick={() => removeArrayItem('keyFeatures', i)} className="text-slate-600 hover:text-red-500 p-2 md:opacity-0 md:group-hover:opacity-100 transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
             </div>
         </div>

         <div className={cardClass}>
             <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                <label className={labelClass}><Box className="w-3 h-3" /> Box Contents</label>
                <button onClick={() => addArrayItem('whatsInTheBox')} className="text-[10px] bg-purple-900/30 text-purple-400 px-3 py-1.5 rounded hover:bg-purple-900/50 transition-colors uppercase font-bold tracking-wider">
                    + Add
                </button>
             </div>
             <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {data.whatsInTheBox.map((item, i) => (
                    <div key={i} className="flex gap-2 group">
                        <input 
                            type="text" 
                            value={item}
                            onChange={(e) => handleArrayChange('whatsInTheBox', i, e.target.value)}
                            className={`${inputClass} py-2 text-xs`}
                        />
                         <button onClick={() => removeArrayItem('whatsInTheBox', i)} className="text-slate-600 hover:text-red-500 p-2 md:opacity-0 md:group-hover:opacity-100 transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
             </div>
         </div>
      </div>

      {/* Specs & Dims */}
      <div className={cardClass}>
        <div className="mb-6 border-b border-white/5 pb-4">
           <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Settings className="w-5 h-5 text-purple-500" />
            Technical Specifications
          </h2>
        </div>

        <div className="space-y-8">
            {/* Dimensions */}
            <div className="bg-black/50 p-4 md:p-6 rounded-2xl border border-white/5">
                <label className={labelClass}><Ruler className="w-3 h-3" /> Dimensions & Weight</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {['width', 'height', 'depth', 'weight'].map((dim) => (
                        <div key={dim}>
                            <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1 ml-1">{dim}</span>
                            <input 
                                type="text" 
                                value={(data.dimensions as any)[dim]}
                                onChange={(e) => handleDimensionChange(dim, e.target.value)}
                                className={`${inputClass} text-center`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Spec List */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <label className={labelClass}>Detailed Specs</label>
                    <button onClick={addSpec} className="text-[10px] bg-purple-900/30 text-purple-400 px-3 py-1.5 rounded hover:bg-purple-900/50 transition-colors uppercase font-bold tracking-wider">
                        + Add Spec
                    </button>
                 </div>
                 <div className="space-y-2 grid grid-cols-1 gap-2">
                    {data.specs.map((spec, i) => (
                        <div key={i} className="flex gap-2 items-center group flex-wrap md:flex-nowrap">
                            <input 
                                type="text" 
                                placeholder="Key"
                                value={spec.key}
                                onChange={(e) => handleSpecChange(i, 'key', e.target.value)}
                                className={`${inputClass} w-[35%] md:w-1/3 py-2 text-xs font-bold text-purple-200/80`}
                            />
                             <span className="text-slate-700">:</span>
                            <input 
                                type="text" 
                                placeholder="Value"
                                value={spec.value}
                                onChange={(e) => handleSpecChange(i, 'value', e.target.value)}
                                className={`${inputClass} flex-1 py-2 text-xs`}
                            />
                            <button onClick={() => removeSpec(i)} className="text-slate-600 hover:text-red-500 p-2 md:opacity-0 md:group-hover:opacity-100 transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
      </div>
      
      {/* Terms */}
      <div className={cardClass}>
        <label className={labelClass}>Terms & Warranty</label>
        <textarea 
            value={data.terms} 
            onChange={(e) => handleChange('terms', e.target.value)}
            className={`${inputClass} h-20 bg-purple-900/10 border-purple-900/20 text-purple-100/70 text-xs`}
        />
      </div>
    </div>
  );
};

export default DataEditor;