-- Fix critical security issues with user data association (Step 1: Clean existing data)

-- 1. First, delete any predictions without user_id (these are orphaned records)
DELETE FROM public.hts_predictions WHERE user_id IS NULL;

-- 2. Update imported_products table to require user association
ALTER TABLE public.imported_products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Create trigger to ensure user_id for new imported_products records
CREATE OR REPLACE FUNCTION public.ensure_user_id_on_imported_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null for imported products';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_user_id_imported_products ON public.imported_products;
CREATE TRIGGER ensure_user_id_imported_products
  BEFORE INSERT ON public.imported_products
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_on_imported_products();

-- 4. Update RLS policies for imported_products to be user-specific
DROP POLICY IF EXISTS "Only authenticated users can view imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Only authenticated users can insert imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Only authenticated users can update imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Only authenticated users can delete imported products" ON public.imported_products;

-- Create user-specific RLS policies for imported_products
CREATE POLICY "Users can view their own imported products" 
ON public.imported_products 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own imported products" 
ON public.imported_products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imported products" 
ON public.imported_products 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imported products" 
ON public.imported_products 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Now make hts_predictions user_id NOT NULL (should work after cleanup)
ALTER TABLE public.hts_predictions ALTER COLUMN user_id SET NOT NULL;

-- 6. Add indexes for better performance on user-filtered queries
CREATE INDEX IF NOT EXISTS idx_imported_products_user_id ON public.imported_products(user_id);
CREATE INDEX IF NOT EXISTS idx_hts_predictions_user_id ON public.hts_predictions(user_id);