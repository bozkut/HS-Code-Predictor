-- Fix critical security issues with user data association

-- 1. Update imported_products table to require user association and prevent cross-user access
ALTER TABLE public.imported_products ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id NOT NULL for new records (existing records will need manual cleanup)
-- For now, allow NULL for existing data but require it for new inserts
CREATE OR REPLACE FUNCTION public.ensure_user_id_on_imported_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null for imported products';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_user_id_imported_products
  BEFORE INSERT ON public.imported_products
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_id_on_imported_products();

-- 2. Update RLS policies for imported_products to be user-specific
DROP POLICY IF EXISTS "Only authenticated users can view imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Only authenticated users can insert imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Only authenticated users can update imported products" ON public.imported_products;
DROP POLICY IF EXISTS "Only authenticated users can delete imported products" ON public.imported_products;

-- Create user-specific RLS policies
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

-- 3. Ensure hts_predictions user_id is NOT NULL for data integrity
ALTER TABLE public.hts_predictions ALTER COLUMN user_id SET NOT NULL;

-- 4. Add indexes for better performance on user-filtered queries
CREATE INDEX IF NOT EXISTS idx_imported_products_user_id ON public.imported_products(user_id);
CREATE INDEX IF NOT EXISTS idx_hts_predictions_user_id ON public.hts_predictions(user_id);