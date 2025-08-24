-- Remove dangerous anonymous access policies
-- These policies expose business data to anyone on the internet

-- Drop all anonymous testing policies for hts_predictions
DROP POLICY IF EXISTS "Anonymous can insert predictions for testing" ON public.hts_predictions;
DROP POLICY IF EXISTS "Anonymous can view predictions for testing" ON public.hts_predictions;
DROP POLICY IF EXISTS "Anonymous can update predictions for testing" ON public.hts_predictions;
DROP POLICY IF EXISTS "Anonymous can delete predictions for testing" ON public.hts_predictions;

-- Drop all anonymous testing policies for imported_products
DROP POLICY IF EXISTS "Anonymous can view imported products for testing" ON public.imported_products;
DROP POLICY IF EXISTS "Anonymous can insert imported products for testing" ON public.imported_products;
DROP POLICY IF EXISTS "Anonymous can update imported products for testing" ON public.imported_products;
DROP POLICY IF EXISTS "Anonymous can delete imported products for testing" ON public.imported_products;