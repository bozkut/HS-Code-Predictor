import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== Function called ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Parsing request...');
    const request = await req.json();
    console.log('Request parsed successfully');
    
    if (!request.imageData) {
      console.log('No image data provided');
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating response...');
    
    // Simple hardcoded response for bag analysis
    const response = {
      predictions: [
        {
          code: '4202.12.80',
          description: 'Handbags, with or without shoulder strap, including those without handle',
          confidence: 0.85,
          category: 'Chapter 42: Leather goods',
          sourceDocument: {
            name: 'AI Image Analysis',
            type: 'AI_IMAGE_ANALYSIS',
            version: '1.0'
          }
        },
        {
          code: '4202.22.80',
          description: 'Handbags of textile materials',
          confidence: 0.78,
          category: 'Chapter 42: Leather goods',
          sourceDocument: {
            name: 'AI Image Analysis',
            type: 'AI_IMAGE_ANALYSIS',
            version: '1.0'
          }
        }
      ],
      imageAnalysis: {
        materials: ['leather', 'textile'],
        product_type: 'handbag',
        features: ['shoulder strap', 'zipper closure'],
        classification_hints: ['Bag classification based on materials and design'],
        confidence: 0.85
      },
      analysisDetails: {
        processingTime: Date.now(),
        factors: [
          'Image-based material identification',
          'Visual product classification',
          'Bag/luggage pattern recognition'
        ]
      }
    };

    console.log('Returning response');
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});