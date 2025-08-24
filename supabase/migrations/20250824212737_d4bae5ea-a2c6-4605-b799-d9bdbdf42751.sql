-- Fix critical security vulnerability in hts_predictions table
-- Replace overly permissive RLS policies with user-specific access control

-- First, drop the existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view predictions" ON public.hts_predictions;
DROP POLICY IF EXISTS "Anyone can insert predictions" ON public.hts_predictions;  
DROP POLICY IF EXISTS "Anyone can update predictions" ON public.hts_predictions;

-- Create secure user-specific RLS policies
-- Users can only view their own predictions
CREATE POLICY "Users can view own predictions" 
ON public.hts_predictions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert predictions with their own user_id
CREATE POLICY "Users can insert own predictions" 
ON public.hts_predictions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own predictions
CREATE POLICY "Users can update own predictions" 
ON public.hts_predictions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own predictions
CREATE POLICY "Users can delete own predictions" 
ON public.hts_predictions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Optional: Allow public access for anonymous predictions (if needed for demo purposes)
-- Uncomment these policies if you need to support anonymous usage
-- CREATE POLICY "Anonymous can view predictions without user_id" 
-- ON public.hts_predictions 
-- FOR SELECT 
-- TO anon
-- USING (user_id IS NULL);

-- CREATE POLICY "Anonymous can insert predictions without user_id" 
-- ON public.hts_predictions 
-- FOR INSERT 
-- TO anon
-- WITH CHECK (user_id IS NULL);