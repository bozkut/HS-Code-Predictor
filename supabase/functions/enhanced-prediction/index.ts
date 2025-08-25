import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

interface PredictionRequest {
  productTitle: string;
  productDescription: string;
  category?: string;
  materials?: string;
  imageUrl?: string;
  availableHSCodes?: any[];
}

interface PredictionCandidate {
  code: string;
  description: string;
  confidence: number;
  reasoning: string;
  category?: string;
  tariffInfo?: any;
  officialSource?: string;
  isOfficialMatch?: boolean;
}

interface PredictionResult {
  candidates: PredictionCandidate[];
  confidence_score: number;
  needs_human_review: boolean;
  review_reason?: string;
  processing_time: number;
  prediction_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Extract and verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT and extract user_id
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData: PredictionRequest = await req.json();
    
    // Validate input
    if (!requestData.productTitle || typeof requestData.productTitle !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid request: productTitle is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (requestData.productTitle.length > 500) {
      return new Response(JSON.stringify({ error: 'Invalid request: productTitle too long (max 500 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Enhanced prediction request:', requestData);

    // Step 1: Get initial HTS search results
    const htsResults = await getHTSSearchResults(requestData);
    
    // Step 2: Get AI-powered semantic analysis
    const semanticResults = await getSemanticAnalysis(requestData, htsResults);
    
    // Step 3: Process image if provided (multimodal support)
    let imageAnalysis = null;
    if (requestData.imageUrl) {
      imageAnalysis = await analyzeProductImage(requestData.imageUrl);
    }

    // Step 4: Combine and rank all candidates
    const candidates = await combineAndRankCandidates(semanticResults, htsResults, imageAnalysis);
    
    // Step 5: Calculate overall confidence and determine if human review is needed
    const confidence_score = calculateOverallConfidence(candidates);
    const { needs_human_review, review_reason } = determineHumanReviewNeed(
      candidates, 
      confidence_score, 
      requestData
    );

    const processing_time = Date.now() - startTime;

    // Step 6: Store prediction in database for feedback tracking with user association
    const { data: predictionRecord } = await supabase
      .from('hts_predictions')
      .insert({
        user_id: user.id, // Associate with authenticated user
        product_title: requestData.productTitle,
        product_description: requestData.productDescription,
        category: requestData.category,
        materials: requestData.materials,
        image_url: requestData.imageUrl,
        predicted_codes: candidates,
        confidence_score,
        processing_time_ms: processing_time,
        needs_human_review,
        review_reason
      })
      .select('id')
      .single();

    const result: PredictionResult = {
      candidates: candidates.slice(0, 5), // Top 5 candidates
      confidence_score,
      needs_human_review,
      review_reason,
      processing_time,
      prediction_id: predictionRecord?.id || ''
    };

    console.log(`Prediction completed in ${processing_time}ms with confidence ${confidence_score}%`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhanced-prediction:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      processing_time: Date.now() - startTime 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getHTSSearchResults(request: PredictionRequest): Promise<any[]> {
  try {
    const searchQuery = `${request.productTitle} ${request.productDescription} ${request.materials || ''}`.trim();
    
    // Call the existing HTS lookup function
    const htsResponse = await fetch(`${supabaseUrl}/functions/v1/hts-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        action: 'search',
        query: searchQuery
      })
    });

    if (!htsResponse.ok) {
      console.error('HTS lookup failed:', await htsResponse.text());
      return [];
    }

    const htsData = await htsResponse.json();
    return htsData.data || [];
  } catch (error) {
    console.error('Error getting HTS results:', error);
    return [];
  }
}

async function getSemanticAnalysis(request: PredictionRequest, htsResults: any[]): Promise<any> {
  try {
    const semanticResponse = await fetch(`${supabaseUrl}/functions/v1/semantic-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        productTitle: request.productTitle,
        productDescription: request.productDescription,
        availableHSCodes: htsResults
      })
    });

    if (!semanticResponse.ok) {
      console.error('Semantic analysis failed:', await semanticResponse.text());
      return { matches: [] };
    }

    const semanticData = await semanticResponse.json();
    return semanticData.semanticMatches || { matches: [] };
  } catch (error) {
    console.error('Error getting semantic analysis:', error);
    return { matches: [] };
  }
}

async function analyzeProductImage(imageUrl: string): Promise<any> {
  try {
    // Enhanced image analysis using Gemini Vision
    const prompt = `Analyze this product image for customs classification. Identify:
1. Material composition (plastic, metal, textile, etc.)
2. Product type and function
3. Key features that would affect HTS classification
4. Any visible text or branding
5. Size/scale indicators

Provide structured analysis in JSON format:
{
  "materials": ["list of materials"],
  "product_type": "main category",
  "features": ["key classification features"],
  "text_content": "any visible text",
  "classification_hints": ["factors affecting HTS code"]
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { 
              inline_data: {
                mime_type: "image/jpeg",
                data: await getImageAsBase64(imageUrl)
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      console.error('Image analysis failed:', await response.text());
      return null;
    }

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;
    
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      console.error('Failed to parse image analysis JSON:', analysisText);
      return { classification_hints: [analysisText] };
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    return null;
  }
}

async function getImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

async function combineAndRankCandidates(
  semanticResults: any, 
  htsResults: any[], 
  imageAnalysis: any
): Promise<PredictionCandidate[]> {
  const candidates: PredictionCandidate[] = [];

  // Add semantic analysis results
  if (semanticResults.matches) {
    for (const match of semanticResults.matches) {
      candidates.push({
        code: match.code,
        description: match.description || '',
        confidence: Math.min(match.confidence || 0, 95), // Cap at 95% for AI predictions
        reasoning: match.reasoning || 'AI semantic analysis',
        category: match.category
      });
    }
  }

  // Add official HTS results with high confidence
  for (const htsEntry of htsResults) {
    const existingIndex = candidates.findIndex(c => c.code === htsEntry.code);
    
    if (existingIndex >= 0) {
      // Boost confidence for official matches
      candidates[existingIndex].confidence = Math.min(candidates[existingIndex].confidence + 20, 98);
      candidates[existingIndex].isOfficialMatch = true;
      candidates[existingIndex].officialSource = htsEntry.officialSource;
      candidates[existingIndex].tariffInfo = htsEntry.tariffInfo;
    } else {
      candidates.push({
        code: htsEntry.code,
        description: htsEntry.description,
        confidence: 92, // High confidence for official matches
        reasoning: 'Official USITC database match',
        category: htsEntry.category,
        isOfficialMatch: true,
        officialSource: htsEntry.officialSource,
        tariffInfo: htsEntry.tariffInfo
      });
    }
  }

  // Enhance with image analysis if available
  if (imageAnalysis) {
    for (const candidate of candidates) {
      if (imageAnalysis.materials) {
        const materialMatch = imageAnalysis.materials.some((material: string) => 
          candidate.description.toLowerCase().includes(material.toLowerCase()) ||
          candidate.category?.toLowerCase().includes(material.toLowerCase())
        );
        if (materialMatch) {
          candidate.confidence = Math.min(candidate.confidence + 5, 99);
          candidate.reasoning += ' (confirmed by image analysis)';
        }
      }
    }
  }

  // Sort by confidence and remove duplicates
  const uniqueCandidates = candidates
    .filter((candidate, index, self) => 
      index === self.findIndex(c => c.code === candidate.code)
    )
    .sort((a, b) => b.confidence - a.confidence);

  return uniqueCandidates;
}

function calculateOverallConfidence(candidates: PredictionCandidate[]): number {
  if (candidates.length === 0) return 0;
  
  const topCandidate = candidates[0];
  const hasOfficialMatch = candidates.some(c => c.isOfficialMatch);
  const confidenceSpread = candidates.length > 1 ? 
    topCandidate.confidence - candidates[1].confidence : topCandidate.confidence;

  let overallConfidence = topCandidate.confidence;

  // Boost confidence if we have official matches
  if (hasOfficialMatch) {
    overallConfidence = Math.min(overallConfidence + 5, 99);
  }

  // Reduce confidence if there's low spread between top candidates (uncertainty)
  if (confidenceSpread < 10) {
    overallConfidence = Math.max(overallConfidence - 15, 0);
  }

  return Math.round(overallConfidence);
}

function determineHumanReviewNeed(
  candidates: PredictionCandidate[], 
  confidence: number, 
  request: PredictionRequest
): { needs_human_review: boolean; review_reason?: string } {
  const reasons: string[] = [];

  // Low confidence threshold
  if (confidence < 70) {
    reasons.push('Low confidence prediction');
  }

  // No clear winner
  if (candidates.length > 1 && candidates[0].confidence - candidates[1].confidence < 15) {
    reasons.push('Multiple similar candidates');
  }

  // Special product categories that require manual review
  const reviewKeywords = [
    'battery', 'lithium', 'food', 'cosmetic', 'pharmaceutical', 'medical',
    'chemical', 'hazardous', 'explosive', 'flammable', 'dangerous',
    'supplement', 'medicine', 'drug', 'organic', 'agriculture'
  ];

  const productText = `${request.productTitle} ${request.productDescription}`.toLowerCase();
  const hasReviewKeyword = reviewKeywords.some(keyword => productText.includes(keyword));
  
  if (hasReviewKeyword) {
    reasons.push('Product requires special customs consideration');
  }

  // No candidates found
  if (candidates.length === 0) {
    reasons.push('No suitable HTS codes found');
  }

  const needs_human_review = reasons.length > 0;
  
  return {
    needs_human_review,
    review_reason: needs_human_review ? reasons.join('; ') : undefined
  };
}