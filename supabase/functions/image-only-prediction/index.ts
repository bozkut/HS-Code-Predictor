import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

if (!geminiApiKey || !supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
}

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting image-only HTS prediction...');
    
    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
    
    // Get auth user
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      if (error || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const request: ImageOnlyRequest = await req.json();
    
    if (!request.imageData) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing image for HTS classification...');
    
    // Enhanced image analysis for HTS classification
    const imageAnalysis = await analyzeImageForHTS(request.imageData);
    
    if (!imageAnalysis) {
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Image analysis result:', imageAnalysis);

    // Generate HTS predictions based on image analysis
    const predictions = await generateHTSPredictions(imageAnalysis);
    
    // Store the prediction in database
    const { error: dbError } = await supabaseClient
      .from('hts_predictions')
      .insert({
        user_id: authHeader ? (await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))).data.user?.id : null,
        product_title: imageAnalysis.product_type || 'Image-based classification',
        product_description: `Material: ${imageAnalysis.materials?.join(', ') || 'Unknown'}. Features: ${imageAnalysis.features?.join(', ') || 'None identified'}.`,
        predicted_hts_code: predictions[0]?.code || '',
        confidence_score: predictions[0]?.confidence || 0,
        analysis_method: 'image_only',
        image_analysis_data: imageAnalysis
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    const response = {
      predictions: predictions,
      imageAnalysis: imageAnalysis,
      analysisDetails: {
        processingTime: Date.now(),
        factors: [
          'Image-based material identification',
          'Visual product classification',
          'AI pattern recognition',
          ...(imageAnalysis.classification_hints || [])
        ]
      }
    };

    console.log('Image-only prediction completed successfully');

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

async function analyzeImageForHTS(imageData: string): Promise<any> {
  try {
    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const prompt = `Analyze this product image for customs classification (HTS codes). Provide detailed analysis:

1. MATERIAL COMPOSITION: Identify all visible materials (plastic, metal, textile, wood, glass, ceramic, etc.)
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { 
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return null;
    }

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;
    
    try {
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        console.error('No JSON found in response:', analysisText);
        return null;
      }
    } catch (parseError) {
      console.error('Failed to parse JSON:', analysisText);
      return {
        materials: ['unknown'],
        product_type: 'unidentified',
        classification_hints: [analysisText.substring(0, 200)],
        confidence: 0.3
      };
    }
  } catch (error) {
    console.error('Error in image analysis:', error);
    return null;
  }
}

async function generateHTSPredictions(imageAnalysis: any): Promise<HTSPrediction[]> {
  const predictions: HTSPrediction[] = [];
  
  // Generate predictions based on image analysis
  const materials = imageAnalysis.materials || [];
  const productType = imageAnalysis.product_type || '';
  const hints = imageAnalysis.classification_hints || [];
  
  // Common HTS code patterns based on materials and product types
  const htsMapping = [
    // Textiles and clothing
    { materials: ['cotton', 'textile', 'fabric'], codes: ['6109', '6203', '6204'], chapter: 'Chapter 61-62: Textiles' },
    // Plastics
    { materials: ['plastic', 'polymer'], codes: ['3926', '3924', '3923'], chapter: 'Chapter 39: Plastics' },
    // Metals
    { materials: ['metal', 'steel', 'aluminum'], codes: ['7323', '7615', '8302'], chapter: 'Chapter 72-83: Metals' },
    // Electronics
    { materials: ['electronic', 'circuit'], codes: ['8517', '8471', '9013'], chapter: 'Chapter 84-85: Electronics' },
    // Wood
    { materials: ['wood', 'timber'], codes: ['4421', '9403', '4419'], chapter: 'Chapter 44: Wood' },
    // Glass
    { materials: ['glass'], codes: ['7013', '7020', '7018'], chapter: 'Chapter 70: Glass' },
    // Ceramic
    { materials: ['ceramic', 'porcelain'], codes: ['6912', '6911', '6909'], chapter: 'Chapter 69: Ceramics' },
    // Toys
    { materials: ['toy', 'game'], codes: ['9503'], chapter: 'Chapter 95: Toys' },
    // Jewelry
    { materials: ['jewelry', 'precious'], codes: ['7113', '7117'], chapter: 'Chapter 71: Jewelry' },
  ];
  
  // Find matching HTS codes
  for (const mapping of htsMapping) {
    for (const material of materials) {
      if (mapping.materials.some(m => material.toLowerCase().includes(m) || productType.toLowerCase().includes(m))) {
        for (const code of mapping.codes) {
          predictions.push({
            code: code,
            description: `${productType} - ${material} based classification`,
            confidence: Math.min(0.95, (imageAnalysis.confidence || 0.7) + 0.1),
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
      code: '9999.00.00',
      description: `General classification for ${productType}`,
      confidence: Math.max(0.4, (imageAnalysis.confidence || 0.5) - 0.1),
      category: 'General Classification',
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