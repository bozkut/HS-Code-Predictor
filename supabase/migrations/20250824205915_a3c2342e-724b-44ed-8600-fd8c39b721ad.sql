-- Fix security vulnerability in imported_products table
-- Remove the unrestricted INSERT policy and replace with authenticated user restriction

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "Anyone can insert imported products" ON public.imported_products;

-- Create a new policy that only allows authenticated users to insert products
CREATE POLICY "Only authenticated users can insert imported products" 
ON public.imported_products 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- For even better security, let's also add UPDATE and DELETE policies for authenticated users
CREATE POLICY "Only authenticated users can update imported products" 
ON public.imported_products 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete imported products" 
ON public.imported_products 
FOR DELETE 
USING (auth.uid() IS NOT NULL);