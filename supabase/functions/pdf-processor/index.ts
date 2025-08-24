import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HSCodeEntry {
  code: string;
  description: string;
  category: string;
  keywords: string[];
  tariffRate?: string;
  changeType?: string;
  effectiveDate?: string;
  chapterInfo?: {
    number: string;
    title: string;
    description: string;
  };
  additionalInfo?: {
    dutyRate: string;
    specialPrograms: string[];
    restrictions: string[];
    notes: string[];
    tradeData?: {
      commonUses: string[];
      complianceNotes: string[];
      relatedCodes: string[];
    };
  };
}

interface ProcessingStats {
  totalExtracted: number;
  byChapter: Record<string, number>;
  changeTypes: Record<string, number>;
  documentType: string;
  revision: string;
}

function extractHSCodes(text: string, filename?: string): { entries: HSCodeEntry[], stats: ProcessingStats } {
  const entries: HSCodeEntry[] = [];
  let chapterStats: Record<string, number> = {};
  let changeTypeStats: Record<string, number> = {};
  
  // Detect document type and revision
  const documentType = detectDocumentType(filename, text);
  const revision = extractRevision(filename, text);
  
  // Enhanced patterns for different HTS formats
  const hsCodePatterns = [
    // Standard 10-digit format: 1234.56.78.90
    /^(\d{4}\.\d{2}\.\d{2}\.\d{2})\s+(.+)$/,
    // 8-digit format: 1234.56.78
    /^(\d{4}\.\d{2}\.\d{2})\s+(.+)$/,
    // 6-digit format: 1234.56
    /^(\d{4}\.\d{2})\s+(.+)$/,
    // Simple 10-digit: 1234567890
    /^(\d{10})\s+(.+)$/,
    // Simple 8-digit: 12345678
    /^(\d{8})\s+(.+)$/,
    // Change record format with line numbers
    /^(\d{4}\.\d{2}\.\d{2})\s+(\d+)\s+(Add|Delete|Modify|Change)\s+(.+)$/i,
  ];

  // Pattern for change records (Add, Delete, Modify)
  const changePattern = /(Add|Delete|Modify|New|Revise|Replace|Insert|Remove)/gi;
  
  // Pattern for tariff rates
  const tariffPattern = /(\d+(?:\.\d+)?%|Free|See\s+chapter|\$\d+(?:\.\d+)?)/gi;
  
  // Extract lines that look like HS code entries
  const lines = text.split(/\n|\r\n?/);
  let currentChapter = '';
  let currentChapterTitle = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Detect chapter headers
    const chapterMatch = line.match(/^Chapter\s+(\d{1,2})\s*[:\-\s]*(.*)$/i) ||
                        line.match(/^(\d{1,2})\s*[:\-\s]*(.+)$/) ||
                        line.match(/^CHAPTER\s+(\d{1,2})\s*(.*)$/i);
    
    if (chapterMatch) {
      currentChapter = chapterMatch[1].padStart(2, '0');
      currentChapterTitle = chapterMatch[2].trim();
      continue;
    }
    
    // Look for HS codes in various formats
    for (const pattern of hsCodePatterns) {
      const match = line.match(pattern);
      
      if (match) {
        let code = match[1];
        let description = match[2];
        let changeType = '';
        
        // Handle change record format with line numbers
        if (match.length > 4) {
          changeType = match[3];
          description = match[4];
        }
        
        // Clean up description
        description = description
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s,.\-()]/g, '')
          .trim();
        
        if (description.length < 10) continue; // Skip very short descriptions
        
        // Extract change type if not already detected
        if (!changeType) {
          const changeMatch = line.match(changePattern);
          changeType = changeMatch ? changeMatch[1] : '';
        }
        
        // Extract additional information from surrounding lines
        const additionalInfo = extractAdditionalInfo(lines, i, code);
        
        // Generate enhanced keywords
        const keywords = generateEnhancedKeywords(description + ' ' + additionalInfo.notes.join(' '));
        
        // Determine category based on HS code prefix
        const chapterNumber = currentChapter || code.substring(0, 2);
        const category = getCategoryFromChapter(chapterNumber);
        
        // Chapter information with enhanced details
        const chapterInfo = {
          number: chapterNumber,
          title: currentChapterTitle || getChapterTitle(chapterNumber),
          description: getChapterDescription(chapterNumber)
        };
        
        // Add trade-specific data
        const tradeData = getTradeData(code, description, chapterNumber);
        
        const entry: HSCodeEntry = {
          code: normalizeHSCode(code),
          description,
          category,
          keywords,
          tariffRate: additionalInfo.dutyRate || undefined,
          changeType: changeType || undefined,
          effectiveDate: revision,
          chapterInfo,
          additionalInfo: {
            ...additionalInfo,
            tradeData
          }
        };
        
        entries.push(entry);
        
        // Update statistics
        chapterStats[chapterNumber] = (chapterStats[chapterNumber] || 0) + 1;
        if (changeType) {
          changeTypeStats[changeType] = (changeTypeStats[changeType] || 0) + 1;
        }
        
        break;
      }
    }
  }
  
  const stats: ProcessingStats = {
    totalExtracted: entries.length,
    byChapter: chapterStats,
    changeTypes: changeTypeStats,
    documentType,
    revision
  };
  
  return { entries, stats };
}

function detectDocumentType(filename?: string, text?: string): string {
  if (filename) {
    if (filename.includes('Change') || filename.includes('change')) return 'Change Record';
    if (filename.includes('Chapter') || filename.includes('chapter')) return 'Chapter Document';
    if (filename.includes('General') || filename.includes('Notes')) return 'General Notes';
    if (filename.includes('Cover')) return 'Cover Document';
  }
  
  if (text) {
    if (text.includes('Change Record') || text.includes('CHANGE RECORD')) return 'Change Record';
    if (text.includes('General Notes') || text.includes('GENERAL NOTES')) return 'General Notes';
  }
  
  return 'HTS Document';
}

function extractRevision(filename?: string, text?: string): string {
  // Extract revision from filename (e.g., "2025HTSRev19")
  const revisionMatch = (filename || text || '').match(/2025HTSRev(\d+)/i);
  if (revisionMatch) {
    return `2025 HTS Revision ${revisionMatch[1]}`;
  }
  
  return '2025 HTS Revision';
}

function normalizeHSCode(code: string): string {
  // Remove dots and ensure consistent formatting
  const cleanCode = code.replace(/\./g, '');
  return cleanCode.padEnd(10, '0');
}

function extractAdditionalInfo(lines: string[], currentIndex: number, code: string): {
  dutyRate: string;
  specialPrograms: string[];
  restrictions: string[];
  notes: string[];
} {
  const info = {
    dutyRate: '',
    specialPrograms: [] as string[],
    restrictions: [] as string[],
    notes: [] as string[]
  };
  
  // Look at the next 5 lines for additional information
  for (let j = currentIndex + 1; j < Math.min(currentIndex + 6, lines.length); j++) {
    const line = lines[j].trim();
    
    // Skip if it looks like another HS code entry
    if (line.match(/^\d{4}\.\d{2}/)) break;
    
    // Extract duty rates
    const dutyMatch = line.match(/(\d+\.?\d*%|Free|Duty\s*free|\$\d+\.?\d*)/i);
    if (dutyMatch && !info.dutyRate) {
      info.dutyRate = dutyMatch[1];
    }
    
    // Look for special trade programs
    if (line.match(/(NAFTA|USMCA|GSP|CBI|ATPA|AGOA|MFN)/i)) {
      const programs = line.match(/(NAFTA|USMCA|GSP|CBI|ATPA|AGOA|MFN)/gi);
      if (programs) {
        info.specialPrograms.push(...programs);
      }
    }
    
    // Look for restrictions or special conditions
    if (line.match(/(license|permit|restriction|prohibition|quota|certificate|FDA|USDA|EPA|FTC)/i)) {
      info.restrictions.push(line);
    }
    
    // Collect general notes
    if (line.length > 10 && line.length < 200 && !line.match(/^\d/)) {
      info.notes.push(line);
    }
  }
  
  return info;
}

function generateEnhancedKeywords(text: string): string[] {
  // Enhanced keyword extraction with trade-specific terms
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'shall', 'can', 'a', 'an', 'not', 'no', 'if', 'then', 'than', 'such',
    'other', 'thereof', 'whether', 'nesoi', 'article', 'articles', 'part', 'parts'
  ]);
  
  // Extract material and product keywords
  const materialKeywords = text.match(/(cotton|wool|silk|leather|plastic|metal|glass|wood|rubber|steel|aluminum|gold|silver|ceramic|paper)/gi) || [];
  const productKeywords = text.match(/(clothing|apparel|footwear|machinery|electronic|furniture|tool|instrument|vehicle|textile|toy|jewelry)/gi) || [];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter(word => !word.match(/^\d+$/));
  
  // Combine and deduplicate
  const allKeywords = [...new Set([...materialKeywords, ...productKeywords, ...words])];
  
  return allKeywords.slice(0, 15).map(word => word.toLowerCase());
}

function getTradeData(code: string, description: string, chapter: string): {
  commonUses: string[];
  complianceNotes: string[];
  relatedCodes: string[];
} {
  const tradeData = {
    commonUses: [] as string[],
    complianceNotes: [] as string[],
    relatedCodes: [] as string[]
  };
  
  // Chapter-specific trade information
  const chapterTradeInfo: Record<string, any> = {
    '39': {
      commonUses: ['Packaging materials', 'Industrial components', 'Consumer products', 'Medical devices'],
      complianceNotes: ['FDA approval may be required for food contact', 'Environmental regulations apply', 'Recycling codes required'],
    },
    '42': {
      commonUses: ['Fashion accessories', 'Travel goods', 'Professional equipment', 'Luxury items'],
      complianceNotes: ['CITES permits may be required for exotic leathers', 'Country of origin marking required'],
    },
    '61': {
      commonUses: ['Fashion apparel', 'Activewear', 'Undergarments', 'Children\'s clothing'],
      complianceNotes: ['Textile labeling requirements', 'Flammability standards', 'Child safety regulations'],
    },
    '84': {
      commonUses: ['Manufacturing equipment', 'Industrial machinery', 'Commercial appliances', 'Construction equipment'],
      complianceNotes: ['Safety certifications required', 'Environmental compliance', 'Energy efficiency standards'],
    }
  };
  
  const chapterInfo = chapterTradeInfo[chapter];
  if (chapterInfo) {
    tradeData.commonUses = chapterInfo.commonUses || [];
    tradeData.complianceNotes = chapterInfo.complianceNotes || [];
  }
  
  // Generate related codes (simplified logic)
  const baseCode = code.substring(0, 4);
  for (let i = 1; i <= 3; i++) {
    const relatedCode = baseCode + '.' + (parseInt(code.substring(4, 6)) + i).toString().padStart(2, '0');
    tradeData.relatedCodes.push(relatedCode);
  }
  
  return tradeData;
}

function getCategoryFromChapter(chapter: string): string {
  const categoryMap: Record<string, string> = {
    "01": "Live Animals",
    "02": "Meat and Edible Meat Offal", 
    "03": "Fish and Crustaceans",
    "04": "Dairy Products",
    "05": "Animal Products",
    "06": "Live Trees and Plants",
    "07": "Edible Vegetables",
    "08": "Edible Fruits and Nuts",
    "09": "Coffee, Tea, Spices",
    "10": "Cereals",
    "39": "Plastics and Articles Thereof",
    "40": "Rubber and Articles Thereof",
    "42": "Leather Articles",
    "44": "Wood and Wood Articles",
    "50": "Silk",
    "51": "Wool and Animal Hair",
    "52": "Cotton",
    "53": "Vegetable Textile Fibers",
    "54": "Manmade Filaments",
    "61": "Knitted or Crocheted Apparel",
    "62": "Woven Apparel",
    "64": "Footwear",
    "70": "Glass and Glassware",
    "72": "Iron and Steel",
    "84": "Nuclear Reactors and Machinery",
    "85": "Electrical Machinery",
    "97": "Works of Art"
  };
  
  return categoryMap[chapter] || `Chapter ${chapter}`;
}

function getChapterTitle(chapter: string): string {
  return getCategoryFromChapter(chapter);
}

function getChapterDescription(chapter: string): string {
  const descriptions: Record<string, string> = {
    '39': 'Synthetic materials derived from petroleum, including containers, films, pipes, and manufactured goods. Important for packaging, automotive, and consumer industries.',
    '42': 'Articles made from leather of any kind, including handbags, luggage, belts, and leather clothing. Excludes raw hides and skins.',
    '61': 'Clothing and accessories made by knitting or crocheting, including sweaters, t-shirts, hosiery, and activewear.',
    '84': 'Machinery and mechanical appliances including engines, pumps, machinery for specific industries, and mechanical handling equipment.',
    // Add more as needed
  };
  
  return descriptions[chapter] || `Products classified under Chapter ${chapter} of the Harmonized Tariff Schedule`;
}

function processOCRText(text: string, filename?: string): { entries: HSCodeEntry[], stats: ProcessingStats } {
  console.log("Processing OCR text, length:", text.length, "filename:", filename);
  
  // Clean up OCR artifacts
  const cleanText = text
    .replace(/[^\x20-\x7E\n\r]/g, ' ') // Remove non-printable characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n'); // Remove empty lines
  
  const result = extractHSCodes(cleanText, filename);
  console.log("Extracted entries:", result.entries.length);
  console.log("Processing stats:", result.stats);
  
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text, filename } = await req.json();
    
    if (action === 'process-hts-text') {
      const result = processOCRText(text, filename);
      
      return new Response(JSON.stringify({ 
        success: true, 
        entries: result.entries,
        stats: result.stats,
        count: result.entries.length,
        message: `Successfully processed ${result.stats.documentType} (${result.stats.revision}) and extracted ${result.entries.length} HS code entries`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in pdf-processor function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});