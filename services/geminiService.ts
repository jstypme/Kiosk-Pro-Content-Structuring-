import { GoogleGenAI, Type, SchemaParams } from "@google/genai";
import { ProductData } from "../types";

const parseProductSchema: SchemaParams = {
  type: Type.OBJECT,
  properties: {
    brand: { type: Type.STRING, description: "The brand name of the product." },
    sku: { type: Type.STRING, description: "The specific model number or SKU." },
    name: { type: Type.STRING, description: "Product title including type, wattage/size, color." },
    category: { type: Type.STRING, description: "A general category for the product (e.g., Microwaves, Smartphones, Fridges)." },
    shortDescription: { type: Type.STRING, description: "One full sentence capturing main benefit." },
    whatsInTheBox: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of items included in the box." 
    },
    description: { type: Type.STRING, description: "The main product description text (preserved from input if available)." },
    keyFeatures: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of key highlights." 
    },
    material: { type: Type.STRING, description: "Materials used (e.g., Stainless Steel)." },
    dimensions: {
      type: Type.OBJECT,
      properties: {
        width: { type: Type.STRING },
        height: { type: Type.STRING },
        depth: { type: Type.STRING },
        weight: { type: Type.STRING }
      },
      required: ["width", "height", "depth", "weight"]
    },
    buyingBenefit: { type: Type.STRING, description: "One sentence on the benefit of ownership." },
    specs: {
      type: Type.ARRAY,
      description: "List of technical specifications.",
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING, description: "Specification name (e.g., Wattage, Voltage)" },
          value: { type: Type.STRING, description: "Specification value (e.g., 900W, 230V)" }
        },
        required: ["key", "value"]
      },
    },
    terms: { type: Type.STRING, description: "Warranty terms and conditions." }
  },
  required: ["brand", "sku", "name", "category", "shortDescription", "whatsInTheBox", "description", "keyFeatures", "dimensions", "buyingBenefit", "terms", "specs"]
};

// Retrieve all available keys from various sources
const getApiKeys = (): string[] => {
  const keys: Set<string> = new Set();
  
  const add = (k?: string) => {
    if (k && k.trim()) keys.add(k.trim());
  };

  // 1. Process Env (Node/Standard)
  if (typeof process !== 'undefined' && process.env) {
    add(process.env.API_KEY);
    add(process.env.API_KEY_2);
    add(process.env.API_KEY_3);
  }

  // 2. Window Process Env (Polyfill)
  if (typeof window !== 'undefined' && (window as any).process?.env) {
    add((window as any).process.env.API_KEY);
    add((window as any).process.env.API_KEY_2);
    add((window as any).process.env.API_KEY_3);
  }

  // 3. Import Meta Env (Vite Direct Access fallback)
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
       add(metaEnv.VITE_API_KEY);
       add(metaEnv.VITE_API_KEY_2);
       add(metaEnv.VITE_API_KEY_3);
       add(metaEnv.NEXT_PUBLIC_API_KEY);
       add(metaEnv.NEXT_PUBLIC_API_KEY_2);
       add(metaEnv.NEXT_PUBLIC_API_KEY_3);
       add(metaEnv.API_KEY);
       add(metaEnv.API_KEY_2);
       add(metaEnv.API_KEY_3);
    }
  } catch (e) {
    // ignore
  }

  return Array.from(keys);
};

export const generateProductContent = async (rawText: string): Promise<ProductData> => {
  const apiKeys = getApiKeys();
  
  if (apiKeys.length === 0) {
    throw new Error("API Key not found. Please ensure API_KEY (and optionally API_KEY_2, API_KEY_3) is set in your .env file or environment variables.");
  }

  const systemInstruction = `
    You are an elite Product Data Architect for a high-end e-commerce kiosk system.
    Your mission is to convert raw, unstructured text (often from OCR or messy inputs) into a pristine, fully populated product record.

    **CORE OBJECTIVE**:
    Extract EVERY piece of technical data available. If the input contains a model number (e.g., "DMO 390"), you MUST utilize your internal knowledge base to fill in any missing technical specifications that are not explicitly in the text. Do not leave fields blank if the product is a known entity.

    **EXTRACTION & ENRICHMENT RULES**:
    1.  **Identity First**: Identify Brand and Model/SKU immediately.
    2.  **Aggressive Spec Filling**: 
        - Look for Watts, Liters, Volts, Amps, Dimensions, Weight, Materials, Colors, Control Types.
        - If the input says "Defy 30L Microwave" but misses the wattage, validly infer it (e.g., "900W") based on the standard specs for that model.
        - Ensure 'weight' and 'dimensions' are filled. If missing, provide the standard shipping dimensions for this specific model.
    3.  **Clean Categorization**: Use plural, simple folder names (e.g., "Microwaves", "Washing Machines").
    4.  **Formatting**:
        - Dimensions: Always include units (mm, cm).
        - Weight: Always include units (kg, g).
        - Sentences: Fix grammar and casing in descriptions.

    **REQUIRED SPECS TO EXTRACT (in 'specs' array)**:
    - Populate this array with Key-Value pairs for every technical detail found or inferred.
    - Examples: { "key": "Wattage", "value": "900W" }, { "key": "Capacity", "value": "30L" }, { "key": "Control Type", "value": "Digital" }, { "key": "Color", "value": "Silver" }.
  `;

  let lastError: Error | null = null;

  // Attempt generation with each key until successful
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    try {
      // console.log(`Attempting generation with API Key ${i + 1}/${apiKeys.length}`); // Debug log
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: rawText,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: parseProductSchema,
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");

      const parsed = JSON.parse(text);
      return parsed as ProductData;

    } catch (error: any) {
      console.warn(`API Key ${i + 1} failed:`, error.message);
      lastError = error;
      
      // If we have more keys, continue loop. Otherwise loop ends and we throw.
      if (i < apiKeys.length - 1) {
        continue;
      }
    }
  }

  console.error("All API keys failed.");
  throw lastError || new Error("Failed to generate content. All API keys were exhausted or rejected.");
};