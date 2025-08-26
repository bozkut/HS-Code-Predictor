# How to Share Just the Backend

Your client only needs these backend components to run the HTS classification system:

## 📁 Files to Share

### 1. Supabase Configuration
```
supabase/
├── config.toml
└── functions/
    ├── enhanced-prediction/index.ts
    ├── hts-lookup/index.ts
    ├── pdf-processor/index.ts
    ├── bulk-hts-analysis/index.ts
    ├── semantic-analysis/index.ts
    └── feedback/index.ts
```

### 2. Setup Documentation
```
BACKEND_SETUP.md
supabase-config-template.toml
```

### 3. Data Files (Optional)
```
src/data/
├── hsCodes.ts
├── hts_catalog.csv
└── Change_Record_2025HTSRev19.pdf
```

## 🚀 Quick Setup for Client

1. **Create New Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note project URL and anon key

2. **Run Database Setup**
   - Copy SQL from `BACKEND_SETUP.md`
   - Run in Supabase SQL Editor

3. **Deploy Edge Functions**
   - Copy all files from `supabase/functions/`
   - Deploy using Supabase CLI: `supabase functions deploy`

4. **Configure Secrets**
   - Add required API keys in Supabase dashboard:
     - `GEMINI_API_KEY`
     - `FIRECRAWL_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_DB_URL`

## 📋 What the Backend Provides

### Edge Functions API Endpoints
- **Enhanced Prediction**: AI-powered HTS code classification
- **HTS Lookup**: Search and validate HTS codes
- **PDF Processor**: Extract product data from documents
- **Bulk Analysis**: Process multiple products at once
- **Semantic Analysis**: Advanced product categorization
- **Feedback**: Collect and process user feedback

### Database Tables
- `hts_predictions` - Store classification results
- `imported_products` - Manage product data

### Features
- ✅ JWT Authentication
- ✅ Row Level Security (RLS)
- ✅ AI-powered predictions
- ✅ Bulk processing
- ✅ PDF analysis
- ✅ Feedback collection
- ✅ Real-time updates

## 💡 Frontend Integration

The client can integrate with any frontend framework using:

```javascript
// Example API call
const response = await supabase.functions.invoke('enhanced-prediction', {
  body: {
    productTitle: "Cotton T-shirt",
    productDescription: "100% cotton casual wear",
    category: "Apparel"
  }
});
```

## 📞 Support

Provide the client with:
- This documentation
- Access to edge function logs in Supabase dashboard
- Database schema documentation
- API endpoint specifications

## 💰 Estimated Costs

- **Supabase**: Free tier available, $25/month for pro
- **Gemini AI**: ~$0.01 per 1K tokens
- **Firecrawl**: Free tier, $29/month for higher usage

The backend is completely self-contained and ready for production use!