-- Fix public access to product catalog
-- Update the SELECT policy to require authentication

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can view imported products" ON public.imported_products;

-- Create a new policy that only allows authenticated users to view products
CREATE POLICY "Only authenticated users can view imported products" 
ON public.imported_products 
FOR SELECT 
USING (auth.uid() IS NOT NULL);