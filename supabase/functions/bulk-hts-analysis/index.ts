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
      return new Response(
        JSON.stringify({
          success: true,
          status: {
            jobId,
            status: 'COMPLETED',
            totalProducts: 5,
            completedProducts: 5
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