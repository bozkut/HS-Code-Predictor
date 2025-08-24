// Shared types for product data and HS code predictions
export interface ProductData {
  title: string;
  description: string;
  category: string;
  categoryId?: string;
  materials: string;
  image: File | null;
}

// CSV product data structure
export interface CSVProductData {
  product_id: string;
  category_id: string;
  title: string;
  description: string;
  category_path: string;
  materials: string;
  image_url: string;
  multiple_ids_category_id?: string;
  multiple_ids_category_name?: string;
}

export interface HSCodePrediction {
  code: string;
  description: string;
  confidence: number;
  category: string;
  categoryId?: string;
  tariffRate?: string;
}

export interface AnalysisResults {
  predictions: HSCodePrediction[];
  analysisDetails: {
    processingTime: number;
    factors: string[];
  };
}