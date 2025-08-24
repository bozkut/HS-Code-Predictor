-- Create table for imported product data
CREATE TABLE public.imported_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_path TEXT,
  materials TEXT,
  image_url TEXT,
  multiple_ids_category_id TEXT,
  multiple_ids_category_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable Row Level Security
ALTER TABLE public.imported_products ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is for HS code classification)
CREATE POLICY "Anyone can view imported products" 
ON public.imported_products 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert imported products" 
ON public.imported_products 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_imported_products_updated_at
BEFORE UPDATE ON public.imported_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better search performance
CREATE INDEX idx_imported_products_category_id ON public.imported_products(category_id);
CREATE INDEX idx_imported_products_title ON public.imported_products USING gin(to_tsvector('english', title));
CREATE INDEX idx_imported_products_description ON public.imported_products USING gin(to_tsvector('english', description));