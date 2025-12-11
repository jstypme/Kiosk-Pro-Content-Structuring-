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
  console.log(`[Gemini Service] Loaded ${apiKeys.length} available API keys.`);
  
  if (apiKeys.length === 0) {
    throw new Error("API Key not found. Please ensure API_KEY (and optionally API_KEY_2, API_KEY_3) is set in your .env file or Vercel environment variables.");
  }

  const systemInstruction = `
    You are a specific Data Structuring Engine.
    Your mission is to organize the user's provided text into a structured JSON format without adding external information, with specific exceptions.

    **CORE RULES**:
    1. **STRICT ADHERENCE (Source of Truth)**: For the following fields, ONLY use information explicitly found in the provided input text. Do NOT fetch, guess, or hallucinate new details from outside knowledge:
       - Description & Short Description
       - Key Features
       - What's in the Box
       - Buying Benefit
       - Materials
       - Specs (Technical specifications)
       
       *If a spec is not in the text, do not add it to the 'specs' array.*

    2. **FILTERING**: Ignore and discard irrelevant text such as advertisements, phone numbers, "Call Now", pricing, or promotion details that are not part of the product identity/structure.

    3. **EXCEPTIONS (External Knowledge Allowed)**:
       - **Dimensions & Weight**: If not present in the text, you ARE allowed to use your internal knowledge to fill in accurate dimensions (width, height, depth) and weight for the identified model.
       - **Terms/Warranty**: If not present in the text, you ARE allowed to provide standard warranty terms for this brand/product.

    4. **Categorization**: Infer a clean, plural folder name for the 'category' based on the product type (e.g., "Smartphones", "Microwaves").

    5. **Formatting**:
       - Fix grammar and capitalization in the extracted text.
       - Ensure dimensions include units (cm, mm, kg).
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
      // Try to parse JSON error message from the SDK/API
      let errorMsg = error.message || String(error);
      try {
        if (typeof errorMsg === 'string' && (errorMsg.startsWith('{') || errorMsg.includes('{"error"'))) {
           // Extract JSON part if mixed with text
           const start = errorMsg.indexOf('{');
           const end = errorMsg.lastIndexOf('}') + 1;
           if (start >= 0 && end > start) {
             const jsonPart = JSON.parse(errorMsg.substring(start, end));
             if (jsonPart.error?.message) {
               errorMsg = jsonPart.error.message;
             }
           }
        }
      } catch (e) {
        // Fallback to original message if parsing fails
      }

      console.warn(`[Gemini Service] Key ${i + 1} failed:`, errorMsg);
      lastError = new Error(errorMsg);
      
      const isOverloaded = errorMsg.toLowerCase().includes('overloaded') || errorMsg.includes('503');
      
      // If we have more keys, continue loop. Otherwise loop ends and we throw.
      if (i < apiKeys.length - 1) {
        const delayMs = isOverloaded ? 4000 : 1000; // Wait 4s if overloaded, 1s otherwise
        console.log(`[Gemini Service] Switching keys in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
    }
  }

  console.error("All API keys failed.");
  throw lastError || new Error("Failed to generate content. All API keys were exhausted or rejected.");
};