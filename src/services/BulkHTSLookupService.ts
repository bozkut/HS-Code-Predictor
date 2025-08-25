// Service for bulk HTS code lookups and analysis
import { supabase } from '@/integrations/supabase/client';
import { ProductData, HSCodePrediction } from '../types/product';
import { analyzeProduct } from '../utils/mockAnalysis';

export interface BulkProduct {
  id: string;
  title: string;
  description: string;
  category?: string;
  materials?: string;
  imageUrl?: string;
  customData?: Record<string, any>;
}

export interface BulkAnalysisResult {
  productId: string;
  product: BulkProduct;
  predictions: HSCodePrediction[];
  status: 'COMPLETED' | 'FAILED' | 'PROCESSING';
  error?: string;
  processingTime: number;
  confidence: number;
}

export interface BulkJobStatus {
  jobId: string;
  totalProducts: number;
  completedProducts: number;
  failedProducts: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startTime: string;
  endTime?: string;
  estimatedTimeRemaining?: number;
  results: BulkAnalysisResult[];
  summary: {
    averageConfidence: number;
    mostCommonChapters: Array<{ chapter: string; count: number; percentage: number }>;
    flaggedForReview: number;
    totalProcessingTime: number;
  };
}

export class BulkHTSLookupService {
  
  /**
   * Start bulk analysis job
   */
  static async startBulkAnalysis(products: BulkProduct[]): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('bulk-hts-analysis', {
        body: {
          action: 'start-job',
          products
        }
      });

      if (error) {
        console.error('Error starting bulk analysis:', error);
        throw new Error('Failed to start bulk analysis job');
      }

      // Edge function returns data directly or with jobId
      return data.jobId || data.jobId || 'mock-job-' + Date.now();
    } catch (error) {
      console.error('Failed to start bulk analysis:', error);
      throw error;
    }
  }

  /**
   * Get job status and results
   */
  static async getJobStatus(jobId: string): Promise<BulkJobStatus> {
    try {
      const { data, error } = await supabase.functions.invoke('bulk-hts-analysis', {
        body: {
          action: 'get-status',
          jobId
        }
      });

      console.log('EDGE FUNCTION RAW RESPONSE:', data);

      if (error) {
        console.error('Error getting job status:', error);
        throw new Error('Failed to get job status');
      }

      // Normalize the response from edge function
      const edgeData = data.status || data;
      const results = edgeData.results || [];
      
      // Calculate summary statistics from results
      const completedResults = results.filter((r: any) => r.status === 'COMPLETED');
      const totalConfidence = completedResults.reduce((sum: number, r: any) => sum + (r.confidence || 0), 0);
      const averageConfidence = completedResults.length > 0 ? Math.round(totalConfidence / completedResults.length) : 0;
      
      // Calculate chapter distribution
      const chapterCounts: Record<string, number> = {};
      completedResults.forEach((result: any) => {
        if (result.predictions && result.predictions.length > 0) {
          const chapter = result.predictions[0].code.substring(0, 2);
          chapterCounts[chapter] = (chapterCounts[chapter] || 0) + 1;
        }
      });
      
      const mostCommonChapters = Object.entries(chapterCounts)
        .map(([chapter, count]) => ({
          chapter: `Chapter ${chapter}`,
          count,
          percentage: Math.round((count / completedResults.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        jobId: edgeData.jobId || jobId,
        totalProducts: edgeData.totalProducts || results.length,
        completedProducts: edgeData.completedProducts || completedResults.length,
        failedProducts: edgeData.failedProducts || results.filter((r: any) => r.status === 'FAILED').length,
        status: edgeData.status || 'COMPLETED',
        startTime: edgeData.startTime || new Date().toISOString(),
        endTime: edgeData.endTime,
        results: results,
        summary: {
          averageConfidence,
          mostCommonChapters,
          flaggedForReview: results.filter((r: any) => r.confidence < 70).length,
          totalProcessingTime: edgeData.summary?.totalProcessingTime || 2000
        }
      };
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * Process CSV data for bulk analysis
   */
  static async processCSVData(csvData: any[]): Promise<BulkProduct[]> {
    return csvData.map((row, index) => ({
      id: row.product_id || `product-${index}`,
      title: row.title || row.product_name || '',
      description: row.description || '',
      category: row.category || row.category_path || '',
      materials: row.materials || '',
      imageUrl: row.image_url || '',
      customData: {
        originalRow: row,
        categoryId: row.category_id,
        multipleCategoryId: row.multiple_ids_category_id,
        multipleCategoryName: row.multiple_ids_category_name
      }
    }));
  }

  /**
   * Analyze single product in bulk context
   */
  static async analyzeSingleProduct(product: BulkProduct): Promise<BulkAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const productData: ProductData = {
        title: product.title,
        description: product.description,
        category: product.category || '',
        materials: product.materials || '',
        image: null,
        categoryId: product.customData?.categoryId
      };

      const analysis = await analyzeProduct(productData);
      const processingTime = Date.now() - startTime;

      // Calculate overall confidence
      const confidence = analysis.predictions.length > 0 
        ? analysis.predictions[0].confidence 
        : 0;

      return {
        productId: product.id,
        product,
        predictions: analysis.predictions,
        status: 'COMPLETED',
        processingTime,
        confidence
      };
    } catch (error) {
      return {
        productId: product.id,
        product,
        predictions: [],
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        confidence: 0
      };
    }
  }

  /**
   * Export results to CSV
   */
  static exportToCSV(results: BulkAnalysisResult[]): string {
    const headers = [
      'Product ID',
      'Product Title',
      'Product Description',
      'Category',
      'Materials',
      'Top HS Code',
      'Top HS Description',
      'Confidence',
      'Second HS Code',
      'Second HS Description',
      'Second Confidence',
      'Third HS Code',
      'Third HS Description',
      'Third Confidence',
      'Status',
      'Processing Time (ms)',
      'Needs Review',
      'Source'
    ];

    const csvRows = [headers.join(',')];

    results.forEach(result => {
      const pred1 = result.predictions[0];
      const pred2 = result.predictions[1];
      const pred3 = result.predictions[2];

      const needsReview = result.confidence < 70 || result.status === 'FAILED' ? 'Yes' : 'No';

      const row = [
        `"${result.product.id}"`,
        `"${result.product.title}"`,
        `"${result.product.description.replace(/"/g, '""')}"`,
        `"${result.product.category || ''}"`,
        `"${result.product.materials || ''}"`,
        `"${pred1?.code || ''}"`,
        `"${pred1?.description.replace(/"/g, '""') || ''}"`,
        pred1?.confidence || 0,
        `"${pred2?.code || ''}"`,
        `"${pred2?.description.replace(/"/g, '""') || ''}"`,
        pred2?.confidence || 0,
        `"${pred3?.code || ''}"`,
        `"${pred3?.description.replace(/"/g, '""') || ''}"`,
        pred3?.confidence || 0,
        result.status,
        result.processingTime,
        needsReview,
        `"${pred1?.sourceDocument?.name || 'Unknown'}"`
      ];

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Generate analysis summary
   */
  static generateSummary(results: BulkAnalysisResult[]): BulkJobStatus['summary'] {
    const completedResults = results.filter(r => r.status === 'COMPLETED');
    
    // Calculate average confidence
    const totalConfidence = completedResults.reduce((sum, r) => sum + r.confidence, 0);
    const averageConfidence = completedResults.length > 0 
      ? totalConfidence / completedResults.length 
      : 0;

    // Find most common chapters
    const chapterCounts: Record<string, number> = {};
    completedResults.forEach(result => {
      if (result.predictions.length > 0) {
        const chapter = result.predictions[0].code.substring(0, 2);
        chapterCounts[chapter] = (chapterCounts[chapter] || 0) + 1;
      }
    });

    const mostCommonChapters = Object.entries(chapterCounts)
      .map(([chapter, count]) => ({
        chapter: `Chapter ${chapter}`,
        count,
        percentage: (count / completedResults.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Count items flagged for review (low confidence or failed)
    const flaggedForReview = results.filter(r => 
      r.status === 'FAILED' || r.confidence < 70
    ).length;

    // Total processing time
    const totalProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0);

    return {
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      mostCommonChapters,
      flaggedForReview,
      totalProcessingTime
    };
  }

  /**
   * Validate products before analysis
   */
  static validateProducts(products: BulkProduct[]): {
    valid: BulkProduct[];
    invalid: Array<{ product: BulkProduct; issues: string[] }>;
  } {
    const valid: BulkProduct[] = [];
    const invalid: Array<{ product: BulkProduct; issues: string[] }> = [];

    products.forEach(product => {
      const issues: string[] = [];

      if (!product.title || product.title.trim().length === 0) {
        issues.push('Product title is required');
      }

      if (!product.description || product.description.trim().length < 10) {
        issues.push('Product description must be at least 10 characters');
      }

      if (product.title && product.title.length > 200) {
        issues.push('Product title too long (max 200 characters)');
      }

      if (issues.length === 0) {
        valid.push(product);
      } else {
        invalid.push({ product, issues });
      }
    });

    return { valid, invalid };
  }

  /**
   * Get processing statistics
   */
  static getProcessingStats(results: BulkAnalysisResult[]): {
    totalProducts: number;
    completedProducts: number;
    failedProducts: number;
    averageProcessingTime: number;
    successRate: number;
    highConfidenceResults: number;
    lowConfidenceResults: number;
  } {
    const totalProducts = results.length;
    const completedProducts = results.filter(r => r.status === 'COMPLETED').length;
    const failedProducts = results.filter(r => r.status === 'FAILED').length;
    
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);
    const averageProcessingTime = totalProducts > 0 ? totalTime / totalProducts : 0;
    
    const successRate = totalProducts > 0 ? (completedProducts / totalProducts) * 100 : 0;
    
    const highConfidenceResults = results.filter(r => r.confidence >= 80).length;
    const lowConfidenceResults = results.filter(r => r.confidence < 60).length;

    return {
      totalProducts,
      completedProducts,
      failedProducts,
      averageProcessingTime: Math.round(averageProcessingTime),
      successRate: Math.round(successRate * 100) / 100,
      highConfidenceResults,
      lowConfidenceResults
    };
  }
}