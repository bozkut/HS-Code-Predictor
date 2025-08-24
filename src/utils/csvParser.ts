import { CSVProductData } from "@/types/product";

// Parse CSV content and extract product data
export function parseCSVContent(csvContent: string): CSVProductData[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const products: CSVProductData[] = [];

  // Find key column indices
  const productIdIndex = headers.findIndex(h => h.toLowerCase().includes('product_id'));
  const categoryIdIndex = headers.findIndex(h => h.toLowerCase().includes('category_id') && !h.includes('multiple'));
  const titleIndex = headers.findIndex(h => h.toLowerCase().includes('title'));
  const descriptionIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
  const categoryPathIndex = headers.findIndex(h => h.toLowerCase().includes('category_path'));
  const materialsIndex = headers.findIndex(h => h.toLowerCase().includes('materials'));
  const imageUrlIndex = headers.findIndex(h => h.toLowerCase().includes('image_url'));
  const multipleCategoryIdIndex = headers.findIndex(h => h.includes('multiple_ids_category_id'));
  const multipleCategoryNameIndex = headers.findIndex(h => h.includes('multiple_ids_category_name'));

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    
    if (values.length < headers.length / 2) continue; // Skip incomplete rows
    
    const product: CSVProductData = {
      product_id: values[productIdIndex] || '',
      category_id: values[categoryIdIndex] || '',
      title: values[titleIndex] || '',
      description: values[descriptionIndex] || '',
      category_path: values[categoryPathIndex] || '',
      materials: values[materialsIndex] || '',
      image_url: values[imageUrlIndex] || '',
      multiple_ids_category_id: values[multipleCategoryIdIndex] || '',
      multiple_ids_category_name: values[multipleCategoryNameIndex] || ''
    };

    if (product.title && product.description) {
      products.push(product);
    }
  }

  return products;
}

// Convert CSV product data to our ProductData format
export function convertCSVToProductData(csvProduct: CSVProductData): {
  title: string;
  description: string;
  category: string;
  categoryId: string;
  materials: string;
  image: null;
} {
  return {
    title: csvProduct.title,
    description: csvProduct.description,
    category: csvProduct.category_path || csvProduct.multiple_ids_category_name || 'Unknown',
    categoryId: csvProduct.category_id || csvProduct.multiple_ids_category_id || '',
    materials: csvProduct.materials,
    image: null
  };
}