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
}

function extractHSCodes(text: string): HSCodeEntry[] {
  const entries: HSCodeEntry[] = [];
  
  // Common patterns for HS codes in HTS documents
  const hsCodePatterns = [
    /(\d{4}\.\d{2}\.\d{2})\s+([^0-9]+?)(?=\d{4}\.\d{2}\.\d{2}|$)/gs,
    /(\d{4}\.\d{2})\s+([^0-9]+?)(?=\d{4}\.\d{2}|$)/gs,
    /(\d{10})\s+([^0-9]+?)(?=\d{10}|$)/gs,
    /Chapter\s+(\d+)\s*[-–]\s*([^0-9]+?)(?=Chapter|\d{4}|$)/gi
  ];

  // Pattern for change records (Add, Delete, Modify)
  const changePattern = /(Add|Delete|Modify|New|Revise|Replace)\s*:?\s*/gi;
  
  // Pattern for tariff rates
  const tariffPattern = /(\d+(?:\.\d+)?%|Free|See\s+chapter)/gi;
  
  // Extract lines that look like HS code entries
  const lines = text.split(/\n|\r\n?/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Look for HS codes in various formats
    for (const pattern of hsCodePatterns) {
      const matches = [...line.matchAll(pattern)];
      
      for (const match of matches) {
        const code = match[1];
        let description = match[2]?.trim() || '';
        
        // Clean up description
        description = description
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s,.-]/g, '')
          .trim();
        
        if (description.length < 10) continue; // Skip very short descriptions
        
        // Extract change type
        const changeMatch = line.match(changePattern);
        const changeType = changeMatch ? changeMatch[1] : undefined;
        
        // Extract tariff rate
        const tariffMatch = description.match(tariffPattern);
        const tariffRate = tariffMatch ? tariffMatch[0] : undefined;
        
        // Generate keywords from description
        const keywords = description
          .toLowerCase()
          .split(/[,;\s]+/)
          .filter(word => word.length > 2 && !/^(the|and|for|with|of|in|to|a|an)$/.test(word))
          .slice(0, 10);
        
        // Determine category based on HS code prefix
        let category = "General Merchandise";
        const codePrefix = code.substring(0, 2);
        
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
          "11": "Milling Products",
          "12": "Oil Seeds and Fruits",
          "13": "Vegetable Extracts",
          "14": "Vegetable Plaiting Materials",
          "15": "Animal or Vegetable Fats",
          "16": "Meat and Fish Preparations",
          "17": "Sugars and Sugar Confectionery",
          "18": "Cocoa and Cocoa Preparations",
          "19": "Cereal Preparations",
          "20": "Vegetable and Fruit Preparations",
          "21": "Miscellaneous Edible Preparations",
          "22": "Beverages and Spirits",
          "23": "Food Industry Residues",
          "24": "Tobacco",
          "25": "Salt, Sulfur, Earth and Stone",
          "26": "Ores, Slag and Ash",
          "27": "Mineral Fuels and Oils",
          "28": "Inorganic Chemicals",
          "29": "Organic Chemicals",
          "30": "Pharmaceutical Products",
          "31": "Fertilizers",
          "32": "Tanning and Dyeing Extracts",
          "33": "Essential Oils and Cosmetics",
          "34": "Soap and Cleaning Preparations",
          "35": "Protein Substances",
          "36": "Explosives",
          "37": "Photographic Products",
          "38": "Miscellaneous Chemical Products",
          "39": "Plastics and Articles Thereof",
          "40": "Rubber and Articles Thereof",
          "41": "Raw Hides and Skins",
          "42": "Leather Articles",
          "43": "Furskins and Artificial Fur",
          "44": "Wood and Wood Articles",
          "45": "Cork and Cork Articles",
          "46": "Basketware",
          "47": "Pulp and Waste Paper",
          "48": "Paper and Paperboard",
          "49": "Printed Books and Newspapers",
          "50": "Silk",
          "51": "Wool and Animal Hair",
          "52": "Cotton",
          "53": "Vegetable Textile Fibers",
          "54": "Manmade Filaments",
          "55": "Manmade Staple Fibers",
          "56": "Wadding and Felt",
          "57": "Carpets and Textile Floor Coverings",
          "58": "Special Woven Fabrics",
          "59": "Impregnated Textile Fabrics",
          "60": "Knitted or Crocheted Fabrics",
          "61": "Knitted or Crocheted Apparel",
          "62": "Woven Apparel",
          "63": "Other Textile Articles",
          "64": "Footwear",
          "65": "Headgear",
          "66": "Umbrellas and Walking Sticks",
          "67": "Prepared Feathers",
          "68": "Stone, Cement, and Glass Articles",
          "69": "Ceramic Products",
          "70": "Glass and Glassware",
          "71": "Pearls and Precious Stones",
          "72": "Iron and Steel",
          "73": "Iron and Steel Articles",
          "74": "Copper and Copper Articles",
          "75": "Nickel and Nickel Articles",
          "76": "Aluminum and Aluminum Articles",
          "78": "Lead and Lead Articles",
          "79": "Zinc and Zinc Articles",
          "80": "Tin and Tin Articles",
          "81": "Other Base Metals",
          "82": "Tools and Cutlery",
          "83": "Miscellaneous Base Metal Articles",
          "84": "Nuclear Reactors and Machinery",
          "85": "Electrical Machinery",
          "86": "Railway Locomotives",
          "87": "Vehicles",
          "88": "Aircraft and Spacecraft",
          "89": "Ships and Boats",
          "90": "Optical and Measuring Instruments",
          "91": "Clocks and Watches",
          "92": "Musical Instruments",
          "93": "Arms and Ammunition",
          "94": "Furniture and Bedding",
          "95": "Toys and Sports Equipment",
          "96": "Miscellaneous Manufactured Articles",
          "97": "Works of Art"
        };
        
        category = categoryMap[codePrefix] || category;
        
        entries.push({
          code,
          description,
          category,
          keywords,
          tariffRate,
          changeType,
          effectiveDate: "2025" // Based on the document name
        });
      }
    }
  }
  
  return entries;
}

function processOCRText(text: string): HSCodeEntry[] {
  console.log("Processing OCR text, length:", text.length);
  
  // Clean up OCR artifacts
  const cleanText = text
    .replace(/[^\x20-\x7E\n\r]/g, ' ') // Remove non-printable characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n'); // Remove empty lines
  
  const entries = extractHSCodes(cleanText);
  console.log("Extracted entries:", entries.length);
  
  return entries;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text } = await req.json();
    
    if (action === 'process-hts-text') {
      const entries = processOCRText(text);
      
      return new Response(JSON.stringify({ 
        success: true, 
        entries,
        count: entries.length 
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
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});