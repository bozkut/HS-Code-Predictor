import { supabase } from '@/integrations/supabase/client';

export interface HTSEntry {
  code: string;
  description: string;
  category: string;
  chapter: string;
  section: string;
  tariffInfo: {
    generalRate: string;
    specialRate: string;
    column2Rate: string;
  };
  statisticalSuffix?: string;
  units: string;
  footnotes: string[];
  relatedCodes: string[];
  officialSource: string;
}

export interface HTSValidationResult {
  valid: boolean;
  entry?: HTSEntry;
  suggestions?: string[];
}

export interface HTSChapterInfo {
  number: string;
  title: string;
  description: string;
  notes: string[];
  sections: string[];
  commonCodes: string[];
}

export class HTSLookupService {
  /**
   * Search for HTS codes by product description using official USITC data
   */
  static async searchByDescription(description: string): Promise<HTSEntry[]> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-lookup', {
        body: {
          action: 'search',
          query: description
        }
      });

      if (error) {
        console.error('Error searching HTS:', error);
        throw new Error('Failed to search HTS database');
      }

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      return data.data || [];
    } catch (error) {
      console.error('HTS search error:', error);
      return [];
    }
  }

  /**
   * Validate an HTS code against official USITC database
   */
  static async validateHTSCode(hsCode: string): Promise<HTSValidationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-lookup', {
        body: {
          action: 'validate',
          hsCode
        }
      });

      if (error) {
        console.error('Error validating HTS code:', error);
        return {
          valid: false,
          suggestions: ['Unable to validate code at this time']
        };
      }

      return data.data || { valid: false };
    } catch (error) {
      console.error('HTS validation error:', error);
      return {
        valid: false,
        suggestions: ['Validation service temporarily unavailable']
      };
    }
  }

  /**
   * Get detailed information about an HTS chapter
   */
  static async getChapterInfo(chapter: string): Promise<HTSChapterInfo | null> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-lookup', {
        body: {
          action: 'get-chapter',
          chapter
        }
      });

      if (error) {
        console.error('Error getting chapter info:', error);
        return null;
      }

      return data.data || null;
    } catch (error) {
      console.error('Chapter info error:', error);
      return null;
    }
  }

  /**
   * Get related HTS codes for a given code
   */
  static async getRelatedCodes(hsCode: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.functions.invoke('hts-lookup', {
        body: {
          action: 'get-related',
          hsCode
        }
      });

      if (error) {
        console.error('Error getting related codes:', error);
        return [];
      }

      return data.data || [];
    } catch (error) {
      console.error('Related codes error:', error);
      return [];
    }
  }

  /**
   * Enhanced prediction combining local data with official USITC lookup
   */
  static async enhancedPrediction(productDescription: string, localPredictions: any[]): Promise<{
    predictions: any[];
    officialMatches: HTSEntry[];
    validationResults: { [key: string]: HTSValidationResult };
  }> {
    try {
      // Get official matches from USITC
      const officialMatches = await this.searchByDescription(productDescription);
      
      // Validate local predictions against official database
      const validationPromises = localPredictions.map(async (pred) => {
        const validation = await this.validateHTSCode(pred.hsCode);
        return { hsCode: pred.hsCode, validation };
      });
      
      const validationResults = await Promise.all(validationPromises);
      const validationMap: { [key: string]: HTSValidationResult } = {};
      
      validationResults.forEach(({ hsCode, validation }) => {
        validationMap[hsCode] = validation;
      });

      // Enhance local predictions with official data
      const enhancedPredictions = localPredictions.map(pred => ({
        ...pred,
        isOfficiallyValidated: validationMap[pred.hsCode]?.valid || false,
        officialEntry: validationMap[pred.hsCode]?.entry,
        validationSuggestions: validationMap[pred.hsCode]?.suggestions
      }));

      // Combine and rank predictions
      const combinedPredictions = [
        ...enhancedPredictions,
        ...officialMatches.map(match => ({
          hsCode: match.code,
          description: match.description,
          confidence: 95, // High confidence for official matches (95%)
          category: match.category,
          isOfficialMatch: true,
          officialEntry: match,
          tariffInfo: match.tariffInfo
        }))
      ];

      // Remove duplicates and sort by confidence
      const uniquePredictions = combinedPredictions.filter((pred, index, self) =>
        index === self.findIndex(p => p.hsCode === pred.hsCode)
      ).sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

      return {
        predictions: uniquePredictions.slice(0, 10), // Top 10 results
        officialMatches,
        validationResults: validationMap
      };
    } catch (error) {
      console.error('Enhanced prediction error:', error);
      // Fallback to local predictions
      return {
        predictions: localPredictions,
        officialMatches: [],
        validationResults: {}
      };
    }
  }

  /**
   * Format HTS code for display
   */
  static formatHTSCode(code: string): string {
    const clean = code.replace(/\./g, '');
    if (clean.length >= 6) {
      return `${clean.substring(0, 4)}.${clean.substring(4, 6)}.${clean.substring(6, 8) || '00'}.${clean.substring(8, 10) || '00'}`;
    }
    return clean;
  }

  /**
   * Get chapter title for a given chapter number
   */
  static getChapterTitle(chapter: string): string {
    const chapterTitles: Record<string, string> = {
      '01': 'Live animals',
      '02': 'Meat and edible meat offal',
      '03': 'Fish and crustaceans, molluscs and other aquatic invertebrates',
      '04': 'Dairy produce; birds\' eggs; natural honey; edible products of animal origin, not elsewhere specified or included',
      '05': 'Products of animal origin, not elsewhere specified or included',
      '39': 'Plastics and articles thereof',
      '40': 'Rubber and articles thereof',
      '42': 'Articles of leather; saddlery and harness; travel goods, handbags and similar containers; articles of animal gut (other than silk-worm gut)',
      '44': 'Wood and articles of wood; wood charcoal',
      '50': 'Silk',
      '51': 'Wool, fine or coarse animal hair; horsehair yarn and woven fabric',
      '52': 'Cotton',
      '53': 'Other vegetable textile fibers; paper yarn and woven fabrics of paper yarn',
      '54': 'Man-made filaments',
      '61': 'Articles of apparel and clothing accessories, knitted or crocheted',
      '62': 'Articles of apparel and clothing accessories, not knitted or crocheted',
      '64': 'Footwear, gaiters and the like; parts of such articles',
      '84': 'Nuclear reactors, boilers, machinery and mechanical appliances; parts thereof',
      '85': 'Electrical machinery and equipment and parts thereof; sound recorders and reproducers, television image and sound recorders and reproducers, and parts and accessories of such articles',
      '97': 'Works of art, collectors\' pieces and antiques'
    };
    
    return chapterTitles[chapter] || `Chapter ${chapter}`;
  }
}