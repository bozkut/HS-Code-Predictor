import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkProduct {
  id: string;
  title: string;
  description: string;
  category?: string;
  materials?: string;
  imageUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, products, jobId } = await req.json();
    console.log(`Action: ${action}, Products: ${products?.length || 0}`);

    // Strict limits for memory management
    const MAX_PRODUCTS = 10;
    if (action === 'start-job' && products?.length > MAX_PRODUCTS) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Too many products. Maximum ${MAX_PRODUCTS} allowed.`,
          maxSize: MAX_PRODUCTS
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'start-job') {
      const jobId = crypto.randomUUID();
      
      // Simple synchronous processing for small batches
      const results = products.map((product: BulkProduct) => {
        const keywords = `${product.title} ${product.description}`.toLowerCase();
        
        // Simple keyword matching
        let prediction;
        if (keywords.includes('cotton') || keywords.includes('shirt') || keywords.includes('clothing')) {
          prediction = { code: '6205.20.2020', description: 'Cotton shirts', confidence: 88 };
        } else if (keywords.includes('plastic') || keywords.includes('container')) {
          prediction = { code: '3923.30.0080', description: 'Plastic containers', confidence: 91 };
        } else if (keywords.includes('steel') || keywords.includes('kitchen')) {
          prediction = { code: '8215.20.0000', description: 'Kitchen utensils', confidence: 94 };
        } else {
          prediction = { code: '9999.00.0000', description: 'Other articles', confidence: 60 };
        }

        return {
          productId: product.id,
          product,
          predictions: [prediction],
          status: 'COMPLETED',
          confidence: prediction.confidence
        };
      });

      return new Response(
        JSON.stringify({
          success: true,
          jobId,
          status: 'COMPLETED',
          results,
          summary: {
            totalProducts: products.length,
            completedProducts: products.length,
            averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get-status') {
      // For demo purposes, return sample results
      const sampleResults = [
        {
          productId: 'sample-1',
          product: { id: 'sample-1', title: 'Sample Product 1', description: 'Sample description', category: 'Electronics' },
          predictions: [{ code: '8517.12.0000', description: 'Telephones for cellular networks', confidence: 92 }],
          status: 'COMPLETED',
          confidence: 92
        },
        {
          productId: 'sample-2', 
          product: { id: 'sample-2', title: 'Sample Product 2', description: 'Sample description', category: 'Textiles' },
          predictions: [{ code: '6205.20.2020', description: 'Cotton shirts', confidence: 88 }],
          status: 'COMPLETED',
          confidence: 88
        },
        {
          productId: 'sample-3',
          product: { id: 'sample-3', title: 'Sample Product 3', description: 'Sample description', category: 'Plastic' },
          predictions: [{ code: '3923.30.0080', description: 'Plastic containers', confidence: 91 }],
          status: 'COMPLETED', 
          confidence: 91
        },
        {
          productId: 'sample-4',
          product: { id: 'sample-4', title: 'Sample Product 4', description: 'Sample description', category: 'Steel' },
          predictions: [{ code: '8215.20.0000', description: 'Kitchen utensils', confidence: 94 }],
          status: 'COMPLETED',
          confidence: 94
        },
        {
          productId: 'sample-5',
          product: { id: 'sample-5', title: 'Sample Product 5', description: 'Sample description', category: 'Other' },
          predictions: [{ code: '9999.00.0000', description: 'Other articles', confidence: 60 }],
          status: 'COMPLETED',
          confidence: 60
        }
      ];

      return new Response(
        JSON.stringify({
          success: true,
          jobId,
          status: 'COMPLETED',
          totalProducts: 5,
          completedProducts: 5,
          failedProducts: 0,
          results: sampleResults,
          summary: {
            averageConfidence: sampleResults.reduce((sum, r) => sum + r.confidence, 0) / sampleResults.length,
            mostCommonChapters: [
              { chapter: 'Chapter 85', count: 1, percentage: 20 },
              { chapter: 'Chapter 62', count: 1, percentage: 20 },
              { chapter: 'Chapter 39', count: 1, percentage: 20 },
              { chapter: 'Chapter 82', count: 1, percentage: 20 },
              { chapter: 'Chapter 99', count: 1, percentage: 20 }
            ],
            flaggedForReview: sampleResults.filter(r => r.confidence < 70).length,
            totalProcessingTime: 2000
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});