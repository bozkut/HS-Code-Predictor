// Shared types for product data and HS code predictions
export interface ProductData {
  title: string;
  description: string;
  category: string;
  materials: string;
  image: File | null;
}

export interface HSCodePrediction {
  code: string;
  description: string;
  confidence: number;
  category: string;
  tariffRate?: string;
}

export interface AnalysisResults {
  predictions: HSCodePrediction[];
  analysisDetails: {
    processingTime: number;
    factors: string[];
  };
}