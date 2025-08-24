-- Add temporary anonymous access policies for testing
-- These should be removed when authentication is implemented

-- Allow anonymous users to insert predictions (for testing)
CREATE POLICY "Anonymous can insert predictions for testing" 
ON public.hts_predictions 
FOR INSERT 
TO anon
WITH CHECK (user_id IS NULL);

-- Allow anonymous users to view predictions without user_id (for testing)
CREATE POLICY "Anonymous can view predictions for testing" 
ON public.hts_predictions 
FOR SELECT 
TO anon
USING (user_id IS NULL);

-- Allow anonymous users to update predictions without user_id (for testing)
CREATE POLICY "Anonymous can update predictions for testing" 
ON public.hts_predictions 
FOR UPDATE 
TO anon
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

-- Allow anonymous users to delete predictions without user_id (for testing)
CREATE POLICY "Anonymous can delete predictions for testing" 
ON public.hts_predictions 
FOR DELETE 
TO anon
USING (user_id IS NULL);

-- Allow anonymous users to access imported_products for testing
CREATE POLICY "Anonymous can view imported products for testing" 
ON public.imported_products 
FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Anonymous can insert imported products for testing" 
ON public.imported_products 
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Anonymous can update imported products for testing" 
ON public.imported_products 
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anonymous can delete imported products for testing" 
ON public.imported_products 
FOR DELETE 
TO anon
USING (true);