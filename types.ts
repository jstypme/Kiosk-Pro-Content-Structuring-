export interface ProductDimensions {
  width: string;
  height: string;
  depth: string;
  weight: string;
}

export interface ProductData {
  brand: string;
  sku: string;
  name: string;
  category: string; // Inferred or Manual
  shortDescription: string;
  whatsInTheBox: string[];
  description: string;
  keyFeatures: string[];
  material: string;
  dimensions: ProductDimensions;
  buyingBenefit: string;
  specs: { key: string; value: string }[];
  terms: string;
}

export interface ManualFile {
  file: File;
  name: string;
}

export interface MediaFiles {
  cover: File | null;
  gallery: File[];
  videos: File[];
  manuals: ManualFile[];
  logo: File | null;
}

export type ProcessingStatus = 'idle' | 'generating' | 'success' | 'error';