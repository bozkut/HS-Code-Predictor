-- Fix remaining security linter issues

-- 1. Fix search path for functions (security issue)
ALTER FUNCTION public.ensure_user_id_on_imported_products() SET search_path = 'public';

-- 2. Update RLS policies to require authenticated users (not just anonymous)
-- Drop existing policies that allow anonymous access
DROP POLICY IF EXISTS "Users can view own predictions" ON public.hts_predictions;
DROP POLICY IF EXISTS "Users can insert own predictions" ON public.hts_predictions;
DROP POLICY IF EXISTS "Users can update own predictions" ON public.hts_predictions;
DROP POLICY IF EXISTS "Users can delete own predictions" ON public.hts_predictions;

-- Create authenticated-only policies for hts_predictions
CREATE POLICY "Authenticated users can view their own predictions" 
ON public.hts_predictions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own predictions" 
ON public.hts_predictions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own predictions" 
ON public.hts_predictions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own predictions" 
ON public.hts_predictions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update imported_products policies to require authenticated users
DROP POLICY IF EXISTS "Users can view their own imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Users can insert their own imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Users can update their own imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Users can delete their own imported products" ON public.imported_products;

-- Create authenticated-only policies for imported_products
CREATE POLICY "Authenticated users can view their own imported products" 
ON public.imported_products 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own imported products" 
ON public.imported_products 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own imported products" 
ON public.imported_products 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own imported products" 
ON public.imported_products 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);