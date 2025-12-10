import JSZip from 'jszip';
import { ProductData, MediaFiles } from '../types';

export const generateKioskZip = async (product: ProductData, media: MediaFiles): Promise<Blob> => {
  const zip = new JSZip();

  // Root folder structure: [Brand] -> [Category] -> [Product]
  const brandFolder = zip.folder(product.brand);
  
  if (!brandFolder) throw new Error("Failed to create brand folder");

  // 1. Brand Level Assets
  if (media.logo) {
    // Determine extension
    const ext = media.logo.name.split('.').pop() || 'png';
    brandFolder.file(`brand_logo.${ext}`, media.logo);
  }

  // Create minimal brand.json
  const brandJson = {
    id: `b-${product.brand.toLowerCase().replace(/\s+/g, '-')}`,
    name: product.brand
  };
  brandFolder.file("brand.json", JSON.stringify(brandJson, null, 2));

  // 2. Category Level
  const categoryFolder = brandFolder.folder(product.category);
  if (!categoryFolder) throw new Error("Failed to create category folder");

  // 3. Product Level
  const productFolder = categoryFolder.folder(product.name);
  if (!productFolder) throw new Error("Failed to create product folder");

  // Convert specs array back to Record for JSON
  const specsRecord: Record<string, string> = {};
  product.specs.forEach(s => {
    if (s.key) specsRecord[s.key] = s.value;
  });

  // A. details.json (The "Brain")
  // Transforming our internal ProductData to the strict Kiosk JSON format
  const detailsJson = {
    name: product.name,
    sku: product.sku,
    description: product.description,
    shortDescription: product.shortDescription, // Storing for the "Copywriter" view
    terms: product.terms,
    specs: specsRecord,
    features: product.keyFeatures,
    boxContents: product.whatsInTheBox,
    buyingBenefit: product.buyingBenefit, // Storing for extra context
    material: product.material, // Storing for extra context
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

  productFolder.file("details.json", JSON.stringify(detailsJson, null, 2));

  // B. Media Files
  
  // Cover Image
  if (media.cover) {
    // Rename to cover.[ext]
    const ext = media.cover.name.split('.').pop() || 'jpg';
    productFolder.file(`cover.${ext}`, media.cover);
  }

  // Gallery Images
  media.gallery.forEach((file, index) => {
    const ext = file.name.split('.').pop() || 'jpg';
    productFolder.file(`gallery_${index + 1}.${ext}`, file);
  });

  // Videos
  media.videos.forEach((file, index) => {
    const ext = file.name.split('.').pop() || 'mp4';
    productFolder.file(`video_${index + 1}.${ext}`, file);
  });

  // Manual (PDF)
  if (media.manual) {
     // Keep original name or standardise
     productFolder.file(media.manual.name, media.manual);
  }

  // Generate the ZIP blob
  return await zip.generateAsync({ type: "blob" });
};