// Advanced utility for analyzing product data and generating HS code predictions
// Uses real HS code database for accurate classification with AI semantic analysis

import { ProductData, HSCodePrediction } from "../types/product";
import { findMatchingHSCodes } from "../data/hsCodes";
import { supabase } from "../integrations/supabase/client";
import { HTSLookupService } from "../services/HTSLookupService";


// Enhanced semantic analysis using Gemini AI
const performSemanticAnalysis = async (productData: ProductData, matchingHSCodes: any[]) => {
  try {
    // Get the current session to pass auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('Authentication required for semantic analysis');
      return null;
    }

    const { data, error } = await supabase.functions.invoke('semantic-analysis', {
      body: {
        productTitle: productData.title,
        productDescription: productData.description,
        availableHSCodes: matchingHSCodes.slice(0, 10) // Send top 10 matches for AI analysis
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Semantic analysis error:', error);
      return null;
    }

    return data.semanticMatches;
  } catch (error) {
    console.error('Failed to perform semantic analysis:', error);
    return null;
  }
};

// Rebuilt prediction engine focused on accuracy
export const analyzeProduct = async (productData: ProductData): Promise<{
  predictions: HSCodePrediction[];
  analysisDetails: {
    processingTime: number;
    factors: string[];
  };
}> => {
  const startTime = Date.now();
  console.log("=== STARTING PRODUCT ANALYSIS ===");
  console.log("Product:", {
    title: productData.title,
    materials: productData.materials,
    category: productData.category,
    description: productData.description?.substring(0, 100) + "..."
  });

  const factors = [
    "Advanced keyword matching with material prioritization",
    "Precision scoring with product type identification",
    "Category-based classification",
    "Material composition analysis"
  ];

  // Find matching HS codes using our enhanced database
  const matchingHSCodes = await findMatchingHSCodes(
    productData.title,
    productData.description,
    productData.category,
    productData.materials,
    productData.categoryId
  );

  console.log(`Found ${matchingHSCodes.length} potential matches`);

  let predictions: HSCodePrediction[] = [];

  if (matchingHSCodes.length > 0) {
    // Convert to predictions with enhanced confidence calculation
    predictions = matchingHSCodes.map((hsCode, index) => {
      // Start with position-based confidence (85% for first, decreasing)
      let confidence = Math.max(45, 85 - (index * 12));
      
      console.log(`Processing HS Code: ${hsCode.code} (${hsCode.category})`);
      
      // Enhanced scoring based on match quality
      const titleLower = productData.title.toLowerCase();
      const materialsLower = (productData.materials || '').toLowerCase();
      const descLower = productData.description.toLowerCase();
      
      // High-value keyword matches (product type identification)
      const productTypeKeywords = ['mug', 'cup', 'bowl', 'plate', 'wallet', 'handbag', 'shoe', 'shirt', 'pants', 'dress'];
      const productTypeMatches = hsCode.keywords.filter(keyword => 
        productTypeKeywords.includes(keyword) && 
        (titleLower.includes(keyword) || descLower.includes(keyword))
      ).length;
      
      if (productTypeMatches > 0) {
        confidence += productTypeMatches * 15; // Major boost for product type matches
        console.log(`  Product type match bonus: +${productTypeMatches * 15}%`);
      }

      // Material matches (critical for HTS classification)
      const materialKeywords = ['ceramic', 'porcelain', 'leather', 'cotton', 'plastic', 'glass', 'metal', 'wood', 'fabric'];
      const materialMatches = hsCode.keywords.filter(keyword => 
        materialKeywords.includes(keyword) && 
        materialsLower.includes(keyword)
      ).length;
      
      if (materialMatches > 0) {
        confidence += materialMatches * 12; // Strong boost for material matches
        console.log(`  Material match bonus: +${materialMatches * 12}%`);
      }

      // Category alignment
      const categoryWords = productData.category.toLowerCase().split(/[\s&]+/);
      const hsCategoryWords = hsCode.category.toLowerCase().split(/[\s&]+/);
      
      const categoryMatches = categoryWords.filter(catWord => 
        catWord.length > 3 && 
        hsCategoryWords.some(hsWord => hsWord.includes(catWord) || catWord.includes(hsWord))
      ).length;
      
      if (categoryMatches > 0) {
        confidence += categoryMatches * 8;
        console.log(`  Category match bonus: +${categoryMatches * 8}%`);
      }

      // Title keyword matches (lower priority)
      const titleKeywordMatches = hsCode.keywords.filter(keyword => 
        keyword.length > 3 && 
        !productTypeKeywords.includes(keyword) && 
        !materialKeywords.includes(keyword) &&
        titleLower.includes(keyword)
      ).length;
      
      if (titleKeywordMatches > 0) {
        confidence += titleKeywordMatches * 4;
        console.log(`  Title keyword bonus: +${titleKeywordMatches * 4}%`);
      }

      // Description quality bonus
      if (productData.description.length > 100) confidence += 3;
      if (productData.description.length > 200) confidence += 2;
      
      // Material specified bonus
      if (productData.materials && productData.materials.length > 5) confidence += 5;
      
      // Image bonus
      if (productData.image) confidence += 5;

      // Cap confidence at reasonable levels
      confidence = Math.min(92, Math.max(30, confidence));
      
      console.log(`  Final confidence: ${confidence}%`);

      return {
        code: hsCode.code,
        description: hsCode.description,
        confidence,
        category: hsCode.category,
        categoryId: productData.categoryId,
        tariffRate: hsCode.tariffRate || "Contact Customs",
        sourceDocument: {
          name: "Enhanced Local HTS Database",
          type: 'LOCAL_DATABASE' as const,
          version: "Precision Matching v3.0",
          chapter: hsCode.code ? `Chapter ${hsCode.code.substring(0, 2)}` : undefined
        }
      };
    });
  }

  // If no matches found, use smart fallback
  if (predictions.length === 0) {
    console.log("No matches found, using smart fallback");
    predictions = getFallbackPredictions(productData);
  }

  const processingTime = Date.now() - startTime;
  console.log(`=== ANALYSIS COMPLETE in ${processingTime}ms ===`);
  console.log("Top prediction:", predictions[0] ? `${predictions[0].code} (${predictions[0].confidence}%)` : "None");

  return {
    predictions: predictions.slice(0, 5),
    analysisDetails: {
      processingTime,
      factors
    }
  };
};

// Enhanced fallback predictions with intelligent category-based classification
const getFallbackPredictions = (productData: ProductData): HSCodePrediction[] => {
  const title = productData.title?.toLowerCase() || '';
  const description = productData.description?.toLowerCase() || '';
  const materials = productData.materials?.toLowerCase() || '';
  const category = productData.category?.toLowerCase() || '';
  
  // Ceramic/Porcelain products
  if (materials.includes('porcelain') || materials.includes('ceramic') || 
      title.includes('mug') || title.includes('cup') || title.includes('bowl') ||
      description.includes('ceramic') || description.includes('porcelain')) {
    return [
      {
        code: "6912.00.48",
        description: "Ceramic tableware, kitchenware, other household articles",
        confidence: 80,
        category: "Ceramics & Porcelain",
        categoryId: productData.categoryId,
        tariffRate: "8.5%",
        sourceDocument: {
          name: "Smart Fallback Classification",
          type: 'LOCAL_DATABASE' as const,
          version: "Material-Based Classification",
          chapter: "Chapter 69"
        }
      }
    ];
  }
  
  // Textile/Clothing products  
  if (materials.includes('cotton') || materials.includes('fabric') || materials.includes('textile') ||
      category.includes('clothing') || category.includes('apparel') ||
      title.includes('shirt') || title.includes('pants') || title.includes('dress')) {
    return [
      {
        code: "6109.10.00",
        description: "T-shirts, singlets and other vests, knitted or crocheted, of cotton",
        confidence: 70,
        category: "Textiles & Clothing",
        categoryId: productData.categoryId,
        tariffRate: "16.5%",
        sourceDocument: {
          name: "Smart Fallback Classification",
          type: 'LOCAL_DATABASE' as const,
          version: "Category-Based Classification",
          chapter: "Chapter 61"
        }
      }
    ];
  }
  
  // Electronic products
  if (category.includes('electronic') || category.includes('tech') ||
      title.includes('phone') || title.includes('computer') || title.includes('device') ||
      description.includes('electronic') || description.includes('digital')) {
    return [
      {
        code: "8543.70.96",
        description: "Other electrical machines and apparatus, having individual functions",
        confidence: 65,
        category: "Electronics & Electrical",
        categoryId: productData.categoryId,
        tariffRate: "2.6%",
        sourceDocument: {
          name: "Smart Fallback Classification",
          type: 'LOCAL_DATABASE' as const,
          version: "Category-Based Classification",
          chapter: "Chapter 85"
        }
      }
    ];
  }
  
  // Home & Garden products
  if (category.includes('home') || category.includes('garden') || category.includes('furniture') ||
      title.includes('furniture') || title.includes('decor') || description.includes('household')) {
    return [
      {
        code: "9403.60.80",
        description: "Other wooden furniture",
        confidence: 60,
        category: "Furniture & Home",
        categoryId: productData.categoryId,
        tariffRate: "Free",
        sourceDocument: {
          name: "Smart Fallback Classification",
          type: 'LOCAL_DATABASE' as const,
          version: "Category-Based Classification",
          chapter: "Chapter 94"
        }
      }
    ];
  }
  
  // Generic fallback
  return [
    {
      code: "3926.90.99",
      description: "Other articles of plastics and articles of other materials",
      confidence: 25,
      category: "General Merchandise",
      categoryId: productData.categoryId,
      tariffRate: "3.1%",
      sourceDocument: {
        name: "Generic Fallback Classification",
        type: 'LOCAL_DATABASE' as const,
        version: "Default Classification",
        chapter: "Chapter 39"
      }
    }
  ];
};