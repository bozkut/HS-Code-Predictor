# Backend Setup Guide

This project uses Supabase as the backend. Here's how to set up your own instance:

## 1. Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

## 2. Database Setup

Run these SQL commands in your Supabase SQL Editor to set up the database schema:

```sql
-- Create hts_predictions table
CREATE TABLE public.hts_predictions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    predicted_codes jsonb NOT NULL,
    confidence_score integer,
    processing_time_ms integer,
    needs_human_review boolean DEFAULT false,
    user_id uuid NOT NULL,
    review_reason text,
    product_title text NOT NULL,
    product_description text,
    category text,
    materials text,
    image_url text,
    selected_code text,
    user_feedback text,
    PRIMARY KEY (id)
);

-- Create imported_products table
CREATE TABLE public.imported_products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    product_id text NOT NULL,
    category_id text NOT NULL,
    title text NOT NULL,
    category_path text,
    user_id uuid,
    materials text,
    image_url text,
    description text,
    multiple_ids_category_id text,
    multiple_ids_category_name text,
    PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.hts_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for hts_predictions
CREATE POLICY "Authenticated users can view their own predictions" 
ON public.hts_predictions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own predictions" 
ON public.hts_predictions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own predictions" 
ON public.hts_predictions FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own predictions" 
ON public.hts_predictions FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for imported_products
CREATE POLICY "Authenticated users can view their own imported products" 
ON public.imported_products FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own imported products" 
ON public.imported_products FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own imported products" 
ON public.imported_products FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own imported products" 
ON public.imported_products FOR DELETE 
USING (auth.uid() = user_id);

-- Create utility functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_user_id_on_imported_products()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null for imported products';
  END IF;
  RETURN NEW;
END;
$function$;
```

## 3. Required API Keys

You'll need to set up these secrets in Supabase Edge Functions settings:

1. **GEMINI_API_KEY** - Google Gemini AI API key for enhanced predictions
2. **FIRECRAWL_API_KEY** - Firecrawl API for web scraping capabilities
3. **SUPABASE_URL** - Your Supabase project URL
4. **SUPABASE_ANON_KEY** - Your Supabase anon key
5. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key
6. **SUPABASE_DB_URL** - Your Supabase database URL

### How to get API keys:

- **Gemini API**: Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Firecrawl API**: Sign up at [firecrawl.dev](https://firecrawl.dev)

## 4. Frontend Configuration

Update your frontend configuration:

1. In `src/integrations/supabase/client.ts`, update:
   ```typescript
   const SUPABASE_URL = "YOUR_SUPABASE_URL_HERE";
   const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";
   ```

## 5. Deploy Edge Functions

The edge functions in this project will be automatically deployed when you deploy your Supabase project. The functions include:

- `bulk-hts-analysis` - Bulk product analysis
- `enhanced-prediction` - AI-enhanced HS code predictions
- `feedback` - User feedback collection
- `hts-change-tracker` - Track HS code changes
- `hts-lookup` - HS code lookup functionality
- `pdf-processor` - PDF document processing
- `semantic-analysis` - Semantic analysis of products

## 6. Authentication Setup

Enable email authentication in Supabase:
1. Go to Authentication > Settings
2. Enable Email provider
3. Configure your site URL and redirect URLs

## 7. Testing

After setup:
1. Test user registration/login
2. Try product analysis features
3. Verify edge functions are working
4. Check database permissions

## Support

If you encounter issues:
1. Check the Supabase logs for edge functions
2. Verify all API keys are correctly set
3. Ensure RLS policies are properly configured
4. Check that authentication is working

## Cost Considerations

- Supabase: Free tier available, paid plans start at $25/month
- Gemini API: Pay-per-use, very affordable for most use cases
- Firecrawl: Free tier available, paid plans for higher usage

This backend provides:
- ✅ User authentication and authorization
- ✅ Secure data storage with RLS
- ✅ AI-powered HS code predictions
- ✅ Bulk analysis capabilities
- ✅ PDF processing
- ✅ Real-time updates
- ✅ Comprehensive audit logging