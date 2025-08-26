import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const grokApiKey = Deno.env.get('GROK_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

interface ImageOnlyRequest {
  imageData: string; // base64 encoded image
  imageFormat?: string;
}

interface HTSPrediction {
  code: string;
  description: string;
  confidence: number;
  category: string;
  sourceDocument: {
    name: string;
    type: 'AI_IMAGE_ANALYSIS';
    version: string;
  };
}

serve(async (req) => {
  console.log('=== Image-only prediction function started ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Parsing request body...');
    const request: ImageOnlyRequest = await req.json();
    
    if (!request.imageData) {
      console.error('No image data provided');
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Image data received, length:', request.imageData.length);

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
    
    // Get auth user (optional for image-only analysis)
    let userId = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
        console.log('User authenticated:', userId);
      }
    }

    console.log('Starting image analysis...');
    
    // Try real image analysis with Grok API first
    let imageAnalysis;
    if (grokApiKey) {
      console.log('Using Grok API for image analysis');
      imageAnalysis = await analyzeImageWithGrok(request.imageData);
    } else {
      console.log('No API key - using fallback analysis');
      imageAnalysis = {
        materials: ['unknown'],
        product_type: 'unidentified product',
        features: ['requires manual classification'],
        classification_hints: ['No AI analysis available'],
        confidence: 0.3,
        construction_method: 'unknown',
        intended_use: 'unknown'
      };
    }

    console.log('Generated analysis:', imageAnalysis);

    // Generate HTS predictions based on analysis
    const predictions = generateHTSPredictions(imageAnalysis);
    
    console.log('Generated predictions:', predictions);

    // Try to store the prediction in database (but don't fail if this errors)
    try {
      await supabaseClient
        .from('hts_predictions')
        .insert({
          user_id: userId,
          product_title: imageAnalysis.product_type || 'Image-based classification',
          product_description: `Material: ${imageAnalysis.materials?.join(', ') || 'Unknown'}. Features: ${imageAnalysis.features?.join(', ') || 'None identified'}.`,
          predicted_hts_code: predictions[0]?.code || '',
          confidence_score: predictions[0]?.confidence || 0,
          image_analysis_data: imageAnalysis
        });
      console.log('Database insert successful');
    } catch (dbError) {
      console.error('Database error (non-fatal):', dbError);
    }

    const response = {
      predictions: predictions,
      imageAnalysis: imageAnalysis,
      analysisDetails: {
        processingTime: Date.now(),
        factors: [
          'Image-based material identification',
          'Visual product classification',
          'Pattern recognition',
          ...(imageAnalysis.classification_hints || [])
        ]
      }
    };

    console.log('Returning successful response');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in image-only prediction:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeImageWithGrok(imageData: string): Promise<any> {
  try {
    console.log('Starting Grok image analysis...');
    
    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const prompt = `Analyze this product image for customs classification (HTS codes). Provide detailed analysis:

1. MATERIAL COMPOSITION: Identify all visible materials (plastic, metal, textile, leather, wood, glass, ceramic, etc.)
2. PRODUCT TYPE: What is this product? Be specific about its function and category
3. CONSTRUCTION: How is it made? Assembly method, parts, components
4. INTENDED USE: What is this product used for? Target market (consumer, industrial, etc.)
5. KEY FEATURES: Any special characteristics affecting classification
6. VISIBLE TEXT: Any brand names, model numbers, labels, or text
7. SIZE/SCALE: Estimate dimensions if possible from context
8. HTS CLASSIFICATION HINTS: Specific factors that would determine the correct HTS code

Respond ONLY with valid JSON in this exact format:
{
  "materials": ["primary_material", "secondary_material"],
  "product_type": "specific product category",
  "construction_method": "how it's made",
  "intended_use": "primary function",
  "features": ["feature1", "feature2"],
  "visible_text": "any text seen on product",
  "estimated_size": "size description",
  "classification_hints": ["hint1", "hint2"],
  "confidence": 0.85,
  "suggested_hts_chapters": ["chapter_number_1", "chapter_number_2"]
}`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`
      },
      body: JSON.stringify({
        model: 'grok-vision-beta',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2048
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Grok API error:', response.status, errorText);
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Grok API response received');
    
    const analysisText = data.choices[0].message.content;
    
    try {
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed Grok analysis');
        return parsed;
      } else {
        console.error('No JSON found in Grok response');
        return null;
      }
    } catch (parseError) {
      console.error('Failed to parse Grok JSON:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error in Grok image analysis:', error);
    return null;
  }
}

function generateHTSPredictions(imageAnalysis: any): HTSPrediction[] {
  const predictions: HTSPrediction[] = [];
  
  // Generate predictions based on image analysis
  const materials = imageAnalysis.materials || [];
  const productType = imageAnalysis.product_type || '';
  
  // Comprehensive HTS code patterns based on materials and product types
  const htsMapping = [
    // Bags and luggage
    { keywords: ['bag', 'luggage', 'backpack', 'handbag', 'purse', 'tote', 'suitcase'], codes: ['4202.12.80', '4202.22.80', '4202.92.30'], chapter: 'Chapter 42: Leather goods' },
    // Electronics
    { keywords: ['electronic', 'device', 'circuit'], codes: ['8517.62.00', '8471.30.01', '9013.80.90'], chapter: 'Chapter 84-85: Electronics' },
    // Plastics
    { keywords: ['plastic', 'polymer'], codes: ['3926.90.99', '3924.10.00', '3923.30.00'], chapter: 'Chapter 39: Plastics' },
    // Metals
    { keywords: ['metal', 'steel', 'aluminum'], codes: ['7323.93.00', '7615.19.00', '8302.41.60'], chapter: 'Chapter 72-83: Metals' },
    // Textiles
    { keywords: ['textile', 'fabric', 'cotton'], codes: ['6109.10.00', '6203.42.40', '6204.62.40'], chapter: 'Chapter 61-62: Textiles' },
    // Leather
    { keywords: ['leather'], codes: ['4202.12.80', '4203.29.80', '4205.00.80'], chapter: 'Chapter 42: Leather goods' },
  ];
  
  // Find matching HTS codes
  for (const mapping of htsMapping) {
    for (const keyword of mapping.keywords) {
      if (materials.some(m => m.toLowerCase().includes(keyword)) || 
          productType.toLowerCase().includes(keyword)) {
        for (const code of mapping.codes) {
          predictions.push({
            code: code,
            description: `${productType} - ${keyword} based classification`,
            confidence: Math.min(0.95, (imageAnalysis.confidence || 0.7)),
            category: mapping.chapter,
            sourceDocument: {
              name: 'AI Image Analysis',
              type: 'AI_IMAGE_ANALYSIS',
              version: '1.0'
            }
          });
        }
        break;
      }
    }
  }
  
  // If no specific matches, provide general classifications
  if (predictions.length === 0) {
    predictions.push({
      code: '8517.62.00',
      description: `Electronic device classification for ${productType}`,
      confidence: Math.max(0.6, (imageAnalysis.confidence || 0.7)),
      category: 'Electronics - General',
      sourceDocument: {
        name: 'AI Image Analysis',
        type: 'AI_IMAGE_ANALYSIS',
        version: '1.0'
      }
    });
  }
  
  // Sort by confidence and return top 3
  return predictions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}