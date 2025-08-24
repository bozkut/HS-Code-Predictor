-- Create feedback system for user corrections and confidence calibration
CREATE TABLE public.hts_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  product_title TEXT NOT NULL,
  product_description TEXT,
  category TEXT,
  materials TEXT,
  image_url TEXT,
  predicted_codes JSONB NOT NULL, -- Array of predictions with confidence scores
  selected_code TEXT, -- User's final selection
  user_feedback TEXT, -- correct/incorrect/needs_review
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  processing_time_ms INTEGER,
  needs_human_review BOOLEAN DEFAULT false,
  review_reason TEXT,
  user_id UUID -- Track by session/user if needed
);

-- Enable RLS
ALTER TABLE public.hts_predictions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view predictions" 
ON public.hts_predictions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert predictions" 
ON public.hts_predictions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update predictions" 
ON public.hts_predictions 
FOR UPDATE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_hts_predictions_updated_at
BEFORE UPDATE ON public.hts_predictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_hts_predictions_created_at ON public.hts_predictions(created_at DESC);
CREATE INDEX idx_hts_predictions_confidence ON public.hts_predictions(confidence_score DESC);
CREATE INDEX idx_hts_predictions_feedback ON public.hts_predictions(user_feedback);
CREATE INDEX idx_hts_predictions_review ON public.hts_predictions(needs_human_review);