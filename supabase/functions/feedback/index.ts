import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

interface FeedbackRequest {
  prediction_id: string;
  user_feedback: 'correct' | 'incorrect' | 'needs_review';
  selected_code?: string;
  user_comments?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prediction_id, user_feedback, selected_code, user_comments }: FeedbackRequest = await req.json();
    
    console.log('Feedback submission:', { prediction_id, user_feedback, selected_code });

    // Update the prediction record with user feedback
    const { error: updateError } = await supabase
      .from('hts_predictions')
      .update({
        user_feedback,
        selected_code,
        updated_at: new Date().toISOString()
      })
      .eq('id', prediction_id);

    if (updateError) {
      console.error('Error updating prediction feedback:', updateError);
      throw new Error('Failed to save feedback');
    }

    // Calculate accuracy metrics for calibration
    const accuracyMetrics = await calculateAccuracyMetrics();
    
    console.log('Feedback saved successfully. Current accuracy metrics:', accuracyMetrics);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Feedback saved successfully',
      accuracy_metrics: accuracyMetrics
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in feedback function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function calculateAccuracyMetrics() {
  try {
    // Get all predictions with feedback
    const { data: predictions, error } = await supabase
      .from('hts_predictions')
      .select('confidence_score, user_feedback, predicted_codes, selected_code')
      .not('user_feedback', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching predictions for metrics:', error);
      return null;
    }

    if (!predictions || predictions.length === 0) {
      return {
        total_predictions: 0,
        accuracy: 0,
        confidence_calibration: {}
      };
    }

    let correctPredictions = 0;
    const confidenceBuckets: { [key: string]: { correct: number; total: number } } = {};

    for (const prediction of predictions) {
      const isCorrect = prediction.user_feedback === 'correct' || 
                       (prediction.selected_code && 
                        prediction.predicted_codes?.[0]?.code === prediction.selected_code);
      
      if (isCorrect) {
        correctPredictions++;
      }

      // Group by confidence ranges for calibration
      const confidence = prediction.confidence_score || 0;
      const bucket = Math.floor(confidence / 10) * 10; // 0-9, 10-19, etc.
      const bucketKey = `${bucket}-${bucket + 9}`;
      
      if (!confidenceBuckets[bucketKey]) {
        confidenceBuckets[bucketKey] = { correct: 0, total: 0 };
      }
      
      confidenceBuckets[bucketKey].total++;
      if (isCorrect) {
        confidenceBuckets[bucketKey].correct++;
      }
    }

    const accuracy = (correctPredictions / predictions.length) * 100;
    
    // Calculate calibration (how well confidence scores match actual accuracy)
    const calibration: { [key: string]: number } = {};
    for (const [bucket, stats] of Object.entries(confidenceBuckets)) {
      calibration[bucket] = (stats.correct / stats.total) * 100;
    }

    return {
      total_predictions: predictions.length,
      accuracy: Math.round(accuracy * 100) / 100,
      confidence_calibration: calibration,
      last_updated: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error calculating accuracy metrics:', error);
    return null;
  }
}