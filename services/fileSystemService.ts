import { get, set } from 'idb-keyval';
import { ProductData, MediaFiles } from '../types';

// Add TypeScript definitions for the File System Access API
declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
  
  interface FileSystemHandlePermissionDescriptor {
    mode: 'read' | 'readwrite';
  }

  interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }
}

const HANDLE_KEY = 'kiosk_root_dir_handle';

// --- Handle Management ---

export const getStoredDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const handle = await get(HANDLE_KEY);
    return handle || null;
  } catch (e) {
    console.error("Error reading directory handle from DB", e);
    return null;
  }
};

export const setStoredDirectoryHandle = async (handle: FileSystemDirectoryHandle) => {
  try {
    await set(HANDLE_KEY, handle);
  } catch (e) {
    console.error("Error saving directory handle to DB", e);
  }
};

export const pickDirectory = async (): Promise<FileSystemDirectoryHandle> => {
  const handle = await window.showDirectoryPicker();
  await setStoredDirectoryHandle(handle);
  return handle;
};

export const verifyPermission = async (fileHandle: FileSystemDirectoryHandle, readWrite: boolean = true) => {
  const options: FileSystemHandlePermissionDescriptor = {
    mode: readWrite ? 'readwrite' : 'read'
  };
  
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  
  return false;
};

// --- Helper: Sanitize Filenames ---
const sanitizeFileName = (name: string, fallback: string = "Untitled"): string => {
  // Replace invalid filesystem characters (< > : " / \ | ? *) with a hyphen
  const sanitized = name.replace(/[<>:"/\\|?*]/g, '-').trim();
  return sanitized.length > 0 ? sanitized : fallback;
};

// --- File Writing Logic ---

export const saveToKioskLibrary = async (rootHandle: FileSystemDirectoryHandle, product: ProductData, media: MediaFiles) => {
  
  // 1. Brand Folder
  const rawBrand = product.brand.trim();
  const brandName = sanitizeFileName(rawBrand, "Unknown Brand");
  const brandDir = await rootHandle.getDirectoryHandle(brandName, { create: true });

  // 1a. Brand Assets
  if (media.logo) {
    const ext = media.logo.name.split('.').pop() || 'png';
    const logoFile = await brandDir.getFileHandle(`brand_logo.${ext}`, { create: true });
    await writeFile(logoFile, media.logo);
  }

  const brandJson = {
    id: `b-${brandName.toLowerCase().replace(/\s+/g, '-')}`,
    name: rawBrand || brandName
  };
  const brandFile = await brandDir.getFileHandle("brand.json", { create: true });
  await writeFile(brandFile, JSON.stringify(brandJson, null, 2));


  // 2. Category Folder
  const categoryName = sanitizeFileName(product.category, "Uncategorized");
  const categoryDir = await brandDir.getDirectoryHandle(categoryName, { create: true });


  // 3. Product Folder
  const productName = sanitizeFileName(product.name, "Untitled Product");
  const productDir = await categoryDir.getDirectoryHandle(productName, { create: true });

  // 3a. details.json
  const detailsJson = {
    name: product.name,
    sku: product.sku,
    description: product.description,
    shortDescription: product.shortDescription,
    terms: product.terms,
    specs: product.specs,
    features: product.keyFeatures,
    boxContents: product.whatsInTheBox,
    buyingBenefit: product.buyingBenefit,
    material: product.material,
    dimensions: [
      {
        label: "Product",
        height: `${product.dimensions.height} cm`,
        width: `${product.dimensions.width} cm`,
        depth: `${product.dimensions.depth} cm`,
        weight: `${product.dimensions.weight} kg`
      }
    ]
  };
  
  const detailsFile = await productDir.getFileHandle("details.json", { create: true });
  await writeFile(detailsFile, JSON.stringify(detailsJson, null, 2));

  // 3b. Media Files
  if (media.cover) {
    const ext = media.cover.name.split('.').pop() || 'jpg';
    const file = await productDir.getFileHandle(`cover.${ext}`, { create: true });
    await writeFile(file, media.cover);
  }

  for (let i = 0; i < media.gallery.length; i++) {
    const fileData = media.gallery[i];
    const ext = fileData.name.split('.').pop() || 'jpg';
    const file = await productDir.getFileHandle(`gallery_${i + 1}.${ext}`, { create: true });
    await writeFile(file, fileData);
  }

  for (let i = 0; i < media.videos.length; i++) {
    const fileData = media.videos[i];
    const ext = fileData.name.split('.').pop() || 'mp4';
    const file = await productDir.getFileHandle(`video_${i + 1}.${ext}`, { create: true });
    await writeFile(file, fileData);
  }

  // Save Manuals with custom names
  for (const manual of media.manuals) {
    let rawName = manual.name.trim();
    if (!rawName.toLowerCase().endsWith('.pdf')) {
        rawName += '.pdf';
    }
    const fileName = sanitizeFileName(rawName, "manual.pdf");
    const file = await productDir.getFileHandle(fileName, { create: true });
    await writeFile(file, manual.file);
  }

  return true;
};

const writeFile = async (fileHandle: FileSystemFileHandle, contents: string | Blob | File) => {
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
};