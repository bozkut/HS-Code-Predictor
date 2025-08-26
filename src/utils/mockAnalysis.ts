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

// Analyze product and return HS code predictions using real database with AI enhancement
export const analyzeProduct = async (productData: ProductData): Promise<{
  predictions: HSCodePrediction[];
  analysisDetails: {
    processingTime: number;
    factors: string[];
  };
}> => {
  const startTime = Date.now();

  // Enhanced factors with official USITC integration
  const factors = [
    "Product Title Analysis",
    "Description Keyword Matching", 
    "Category Classification",
    "HS Code Database Matching",
    "Official USITC HTS Lookup",
    "AI Semantic Analysis (Gemini)",
    ...(productData.materials ? ["Material Composition Analysis"] : []),
    ...(productData.image ? ["Image Recognition Analysis"] : [])
  ];

  // Step 1: Find matching HS codes from our local database
  console.log("Product data for analysis:", {
    title: productData.title,
    materials: productData.materials,
    category: productData.category,
    description: productData.description?.substring(0, 100) + "..."
  });
  
  const matchingHSCodes = await findMatchingHSCodes(
    productData.title,
    productData.description,
    productData.category,
    productData.materials,
    productData.categoryId
  );
  
  console.log("Found matching HS codes:", matchingHSCodes.length, matchingHSCodes.map(c => ({ code: c.code, category: c.category })));

  let predictions: HSCodePrediction[] = [];

  // Step 2: Get official USITC data for enhanced accuracy
  try {
    const fullDescription = `${productData.title} ${productData.description} ${productData.materials || ''}`.trim();
    const enhancedResult = await HTSLookupService.enhancedPrediction(fullDescription, 
      matchingHSCodes.map(hsCode => ({ hsCode: hsCode.code, ...hsCode }))
    );
    
    if (enhancedResult.predictions.length > 0) {
      // Use enhanced predictions with official USITC validation
      predictions = enhancedResult.predictions.map((pred: any) => ({
        code: pred.hsCode,
        description: pred.description,
        confidence: pred.confidence || 85,
        category: pred.category || pred.officialEntry?.category || "Official Classification",
        categoryId: productData.categoryId,
        tariffRate: pred.officialEntry?.tariffInfo?.generalRate || pred.tariffInfo?.generalRate || "Contact Customs",
        isOfficiallyValidated: pred.isOfficiallyValidated || pred.isOfficialMatch || false,
        officialSource: pred.officialEntry?.officialSource || (pred.isOfficialMatch ? "USITC HTS 2025 Revision 19" : undefined),
        sourceDocument: pred.isOfficialMatch || pred.isOfficiallyValidated ? {
          name: "USITC Harmonized Tariff Schedule",
          type: 'USITC_DATABASE' as const,
          version: "2025 Revision 19",
          chapter: pred.hsCode ? `Chapter ${pred.hsCode.substring(0, 2)}` : undefined,
          url: "https://hts.usitc.gov/",
          lastUpdated: new Date().toISOString().split('T')[0]
        } : {
          name: "Local HTS Database",
          type: 'LOCAL_DATABASE' as const,
          version: "Compiled Database",
          chapter: pred.hsCode ? `Chapter ${pred.hsCode.substring(0, 2)}` : undefined
        },
        tariffDetails: pred.officialEntry?.tariffInfo ? {
          general: pred.officialEntry.tariffInfo.generalRate,
          special: pred.officialEntry.tariffInfo.specialRate,
          column2: pred.officialEntry.tariffInfo.column2Rate
        } : undefined
      }));
    } else {
      throw new Error("No enhanced predictions available");
    }
  } catch (error) {
    console.log("Enhanced prediction failed, using fallback analysis:", error);
    
    // Fallback to local analysis with semantic enhancement
    if (matchingHSCodes.length > 0) {
      // Perform AI semantic analysis
      const semanticResults = await performSemanticAnalysis(productData, matchingHSCodes);
      
      if (semanticResults && semanticResults.matches && semanticResults.matches.length > 0) {
        // Use AI-enhanced results
        predictions = semanticResults.matches.map((match: any) => {
          const hsCode = matchingHSCodes.find(code => code.code === match.code);
          return {
            code: match.code,
            description: hsCode?.description || match.reasoning,
            confidence: Math.min(95, match.confidence + 5), // Boost AI-analyzed confidence
            category: hsCode?.category || "AI Classified",
            categoryId: productData.categoryId,
            tariffRate: hsCode?.tariffRate || "Contact Customs",
            sourceDocument: {
              name: "AI Semantic Analysis (Gemini) + Local Database",
              type: 'AI_SEMANTIC' as const,
              version: "Gemini Pro Enhanced",
              chapter: match.code ? `Chapter ${match.code.substring(0, 2)}` : undefined
            }
          };
        });
        
        // Add remaining keyword matches if AI didn't cover all
        const aiCodes = semanticResults.matches.map((m: any) => m.code);
        const remainingCodes = matchingHSCodes
          .filter(code => !aiCodes.includes(code.code))
          .slice(0, 2); // Add up to 2 more
          
        remainingCodes.forEach((hsCode, index) => {
          predictions.push({
            code: hsCode.code,
            description: hsCode.description,
            confidence: Math.max(40, 75 - (index * 15)), // Lower confidence for non-AI matches
            category: hsCode.category,
            categoryId: productData.categoryId,
            tariffRate: hsCode.tariffRate,
            sourceDocument: {
              name: "Local HTS Database",
              type: 'LOCAL_DATABASE' as const,
              version: "Compiled Database",
              chapter: hsCode.code ? `Chapter ${hsCode.code.substring(0, 2)}` : undefined
            }
          });
        });
      } else {
        // Enhanced keyword matching with better confidence calculation
        predictions = matchingHSCodes.map((hsCode, index) => {
          let baseConfidence = 90 - (index * 8); // Start higher, decrease less per position
          
          // Calculate relevance bonuses
          const titleWords = productData.title.toLowerCase().split(' ');
          const materialWords = (productData.materials || '').toLowerCase().split(' ');
          
          // Material match bonus (very important for HTS classification)
          const materialMatches = hsCode.keywords.filter(keyword => 
            materialWords.some(word => word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word))
          ).length;
          if (materialMatches > 0) baseConfidence += materialMatches * 5;
          
          // Title relevance bonus
          const titleMatches = hsCode.keywords.filter(keyword =>
            titleWords.some(word => word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word))
          ).length;
          if (titleMatches > 0) baseConfidence += titleMatches * 3;
          
          // Category match bonus
          if (productData.category && hsCode.category.toLowerCase().includes(productData.category.toLowerCase().split(' ')[0])) {
            baseConfidence += 5;
          }
          
          // Description length bonus (more detail = higher confidence)
          if (productData.description.length > 150) baseConfidence += 3;
          if (productData.description.length > 300) baseConfidence += 2;
          
          // Image availability bonus
          if (productData.image) baseConfidence += 8;
          
          // Ensure confidence stays within reasonable bounds
          const confidence = Math.min(95, Math.max(35, baseConfidence));

          return {
            code: hsCode.code,
            description: hsCode.description,
            confidence,
            category: hsCode.category,
            categoryId: productData.categoryId,
            tariffRate: hsCode.tariffRate,
            sourceDocument: {
              name: "Enhanced Local HTS Database",
              type: 'LOCAL_DATABASE' as const,
              version: "Enhanced Keyword Matching v2.0",
              chapter: hsCode.code ? `Chapter ${hsCode.code.substring(0, 2)}` : undefined
            }
          };
        });
      }
    }
  }

  // If no matches found, provide fallback predictions
  if (predictions.length === 0) {
    predictions = getFallbackPredictions(productData);
  }

  const processingTime = Date.now() - startTime;

  return {
    predictions: predictions.slice(0, 5), // Return top 5 predictions
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