// Real HS Code database for accurate classification
export interface HSCode {
  code: string;
  description: string;
  category: string;
  keywords: string[];
  tariffRate?: string;
}

export const hsCodeDatabase: HSCode[] = [
  // Chapter 61 - Articles of apparel and clothing accessories, knitted or crocheted
  {
    code: "6109.10.00",
    description: "T-shirts, singlets and other vests, knitted or crocheted, of cotton",
    category: "Textiles & Clothing",
    keywords: ["t-shirt", "shirt", "vest", "cotton", "knitted", "clothing", "apparel"],
    tariffRate: "16.5%"
  },
  {
    code: "6104.62.20",
    description: "Women's or girls' trousers, bib and brace overalls, breeches and shorts, of cotton",
    category: "Textiles & Clothing", 
    keywords: ["trousers", "pants", "women", "girls", "cotton", "shorts", "breeches"],
    tariffRate: "16.6%"
  },
  
  // Chapter 71 - Natural or cultured pearls, precious stones, precious metals, jewelry
  {
    code: "7113.19.50",
    description: "Articles of jewelry and parts thereof, of precious metal other than silver",
    category: "Jewelry & Precious Items",
    keywords: ["jewelry", "necklace", "bracelet", "ring", "gold", "precious", "metal"],
    tariffRate: "5.5%"
  },
  {
    code: "7113.11.50",
    description: "Articles of jewelry and parts thereof, of silver, whether or not plated or clad",
    category: "Jewelry & Precious Items", 
    keywords: ["jewelry", "silver", "necklace", "bracelet", "ring", "925", "sterling"],
    tariffRate: "6.5%"
  },
  {
    code: "7117.90.90",
    description: "Imitation jewelry, other",
    category: "Jewelry & Precious Items",
    keywords: ["imitation", "costume", "jewelry", "fashion", "accessory", "beads"],
    tariffRate: "11%"
  },

  // Chapter 39 - Plastics and articles thereof
  {
    code: "3926.90.99",
    description: "Other articles of plastics and articles of other materials",
    category: "Plastics & Polymers",
    keywords: ["plastic", "polymer", "accessories", "household", "container"],
    tariffRate: "3.1%"
  },

  // Chapter 70 - Glass and glassware
  {
    code: "7018.90.50",
    description: "Glass beads, imitation pearls, imitation precious stones and similar articles",
    category: "Glass & Ceramics",
    keywords: ["glass", "beads", "imitation", "pearls", "decorative"],
    tariffRate: "6%"
  },

  // Chapter 48 - Paper and paperboard; articles of paper pulp, of paper or of paperboard
  {
    code: "4823.90.86",
    description: "Other paper and paperboard, cut to size or shape; other articles of paper",
    category: "Paper & Stationery",
    keywords: ["paper", "cardboard", "box", "packaging", "stationery", "craft"],
    tariffRate: "Free"
  },

  // Chapter 97 - Works of art, collectors' pieces and antiques
  {
    code: "9701.10.00", 
    description: "Paintings, drawings and pastels, executed entirely by hand",
    category: "Art & Collectibles",
    keywords: ["painting", "art", "drawing", "artwork", "canvas", "handmade"],
    tariffRate: "Free"
  },
  {
    code: "9705.00.00",
    description: "Collections and collectors' pieces of archaeological, historical or ethnographic interest",
    category: "Art & Collectibles", 
    keywords: ["collectible", "antique", "historical", "archaeological", "ethnographic"],
    tariffRate: "Free"
  },

  // Chapter 85 - Electrical machinery and equipment
  {
    code: "8543.70.96",
    description: "Other electrical machines and apparatus, having individual functions",
    category: "Electronics & Electrical",
    keywords: ["electronic", "electrical", "device", "machine", "equipment"],
    tariffRate: "2.6%"
  },

  // Chapter 42 - Articles of leather; saddlery and harness
  {
    code: "4203.29.50",
    description: "Gloves, mittens and mitts, of leather or of composition leather",
    category: "Leather Goods",
    keywords: ["leather", "gloves", "accessories", "clothing"],
    tariffRate: "12.6%"
  },

  // Chapter 64 - Footwear, gaiters and the like
  {
    code: "6404.19.39",
    description: "Other footwear with outer soles of rubber, plastics, leather",
    category: "Footwear",
    keywords: ["shoes", "footwear", "boots", "sandals", "rubber", "leather"],
    tariffRate: "8.5%"
  },

  // Chapter 73 - Articles of iron or steel
  {
    code: "7326.90.85",
    description: "Other articles of iron or steel",
    category: "Metals & Hardware",
    keywords: ["iron", "steel", "metal", "hardware", "tool", "equipment"],
    tariffRate: "2.9%"
  },

  // Chapter 95 - Toys, games and sports equipment
  {
    code: "9503.00.00",
    description: "Tricycles, scooters, pedal cars and similar wheeled toys; dolls",
    category: "Toys & Games",
    keywords: ["toy", "game", "children", "play", "doll", "tricycle"],
    tariffRate: "Free"
  },

  // Chapter 33 - Essential oils and resinoids; perfumery, cosmetic preparations
  {
    code: "3304.99.50",
    description: "Other beauty or make-up preparations",
    category: "Cosmetics & Beauty",
    keywords: ["cosmetic", "makeup", "beauty", "skincare", "lotion"],
    tariffRate: "Free"
  },

  // Chapter 28 - Inorganic chemicals
  {
    code: "2842.90.10",
    description: "Other salts of inorganic acids or peroxoacids",
    category: "Chemicals",
    keywords: ["chemical", "salt", "acid", "industrial"],
    tariffRate: "3.7%"
  }
];

// Helper function to find matching HS codes based on product data (including imported data)
export async function findMatchingHSCodes(
  title: string, 
  description: string, 
  category: string, 
  materials?: string,
  categoryId?: string
): Promise<HSCode[]> {
  const searchText = `${title} ${description} ${category} ${materials || ""} ${categoryId || ""}`.toLowerCase();
  
  // Search in static database
  const staticMatches = hsCodeDatabase
    .map(hsCode => {
      const matchScore = hsCode.keywords.reduce((score, keyword) => {
        if (searchText.includes(keyword.toLowerCase())) {
          return score + 1;
        }
        return score;
      }, 0);
      
      return { hsCode, matchScore };
    })
    .filter(item => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)
    .map(item => item.hsCode);

  return staticMatches;
}