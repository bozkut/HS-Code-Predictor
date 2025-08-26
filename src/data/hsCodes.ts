// Real HS Code database for accurate classification
export interface HSCode {
  code: string;
  description: string;
  category: string;
  keywords: string[];
  tariffRate?: string;
}

export const hsCodeDatabase: HSCode[] = [
  // Chapter 69 - Ceramic products
  {
    code: "6912.00.48",
    description: "Ceramic tableware, kitchenware, other household articles and toilet articles",
    category: "Ceramics & Porcelain",
    keywords: ["ceramic", "porcelain", "mug", "cup", "tableware", "kitchenware", "household", "dishes", "bowl", "plate"],
    tariffRate: "8.5%"
  },
  {
    code: "6911.10.38",
    description: "Porcelain or china tableware and kitchenware", 
    category: "Ceramics & Porcelain",
    keywords: ["porcelain", "china", "tableware", "kitchenware", "cup", "mug", "plate", "bowl", "fine", "dinnerware"],
    tariffRate: "8%"
  },
  {
    code: "6914.90.90",
    description: "Other ceramic articles",
    category: "Ceramics & Porcelain", 
    keywords: ["ceramic", "porcelain", "decorative", "ornamental", "figurine", "vase", "pottery"],
    tariffRate: "8.5%"
  },

  // Chapter 61 - Articles of apparel and clothing accessories, knitted or crocheted
  {
    code: "6109.10.00",
    description: "T-shirts, singlets and other vests, knitted or crocheted, of cotton",
    category: "Textiles & Clothing",
    keywords: ["t-shirt", "shirt", "vest", "cotton", "knitted", "clothing", "apparel", "tee", "top"],
    tariffRate: "16.5%"
  },
  {
    code: "6104.62.20",
    description: "Women's or girls' trousers, bib and brace overalls, breeches and shorts, of cotton",
    category: "Textiles & Clothing", 
    keywords: ["trousers", "pants", "women", "girls", "cotton", "shorts", "breeches", "jeans", "leggings"],
    tariffRate: "16.6%"
  },
  {
    code: "6110.20.20",
    description: "Sweaters, pullovers, sweatshirts, waistcoats and similar articles, knitted or crocheted, of cotton",
    category: "Textiles & Clothing",
    keywords: ["sweater", "pullover", "sweatshirt", "hoodie", "cardigan", "cotton", "knitted", "jumper"],
    tariffRate: "16.5%"
  },
  {
    code: "6203.42.40",
    description: "Men's or boys' trousers, bib and brace overalls, breeches and shorts, of cotton",
    category: "Textiles & Clothing",
    keywords: ["men", "boys", "trousers", "pants", "cotton", "shorts", "jeans", "chinos", "khakis"],
    tariffRate: "16.6%"
  },

  // Chapter 42 - Articles of leather; saddlery and harness  
  {
    code: "4202.12.80",
    description: "Handbags, with or without shoulder strap, including those without handle",
    category: "Leather Goods",
    keywords: ["handbag", "purse", "bag", "shoulder", "strap", "handle", "leather", "tote", "clutch"],
    tariffRate: "17.6%"
  },
  {
    code: "4202.22.80", 
    description: "Handbags of textile materials",
    category: "Leather Goods",
    keywords: ["handbag", "purse", "bag", "textile", "fabric", "canvas", "nylon", "polyester"],
    tariffRate: "17.6%"
  },
  {
    code: "4203.29.50",
    description: "Gloves, mittens and mitts, of leather or of composition leather",
    category: "Leather Goods",
    keywords: ["gloves", "mittens", "mitts", "leather", "hands", "winter"],
    tariffRate: "12.6%"
  },
  {
    code: "4202.11.00",
    description: "Trunks, suitcases, vanity cases, executive cases, briefcases, school satchels and similar containers, with outer surface of leather",
    category: "Leather Goods",
    keywords: ["wallet", "billfold", "bifold", "trifold", "leather", "genuine", "executive", "briefcase"],
    tariffRate: "20%"
  },
  {
    code: "4202.92.45",
    description: "Travel, sports and similar bags with outer surface of textile materials",
    category: "Leather Goods", 
    keywords: ["travel", "sports", "bag", "luggage", "duffel", "gym", "backpack", "textile"],
    tariffRate: "17.6%"
  },

  // Chapter 64 - Footwear, gaiters and the like
  {
    code: "6404.19.39",
    description: "Other footwear with outer soles of rubber, plastics, leather",
    category: "Footwear",
    keywords: ["shoes", "footwear", "boots", "sandals", "rubber", "leather", "sneakers", "athletic"],
    tariffRate: "8.5%"
  },
  {
    code: "6403.91.60",
    description: "Other footwear with outer soles of leather",
    category: "Footwear",
    keywords: ["dress", "shoes", "leather", "formal", "oxford", "loafer", "boot", "heel"],
    tariffRate: "8.5%"
  },
  {
    code: "6404.11.90",
    description: "Sports footwear; tennis shoes, basketball shoes, gym shoes, training shoes and the like",
    category: "Footwear",
    keywords: ["sports", "athletic", "tennis", "basketball", "gym", "training", "running", "sneakers"],
    tariffRate: "20%"
  },

  // Chapter 71 - Natural or cultured pearls, precious stones, precious metals, jewelry
  {
    code: "7113.19.50",
    description: "Articles of jewelry and parts thereof, of precious metal other than silver",
    category: "Jewelry & Precious Items",
    keywords: ["jewelry", "necklace", "bracelet", "ring", "gold", "precious", "metal", "earrings"],
    tariffRate: "5.5%"
  },
  {
    code: "7113.11.50",
    description: "Articles of jewelry and parts thereof, of silver, whether or not plated or clad",
    category: "Jewelry & Precious Items", 
    keywords: ["jewelry", "silver", "necklace", "bracelet", "ring", "925", "sterling", "earrings"],
    tariffRate: "6.5%"
  },
  {
    code: "7117.90.90",
    description: "Imitation jewelry, other",
    category: "Jewelry & Precious Items",
    keywords: ["imitation", "costume", "jewelry", "fashion", "accessory", "beads", "fake", "plated"],
    tariffRate: "11%"
  },

  // Chapter 85 - Electrical machinery and equipment and parts thereof
  {
    code: "8517.12.00",
    description: "Telephones for cellular networks or for other wireless networks",
    category: "Electronics & Electrical",
    keywords: ["phone", "smartphone", "mobile", "cellular", "wireless", "iphone", "android"],
    tariffRate: "Free"
  },
  {
    code: "8471.30.01",
    description: "Portable automatic data processing machines, weighing not more than 10 kg",
    category: "Electronics & Electrical",
    keywords: ["laptop", "notebook", "computer", "portable", "macbook", "chromebook", "tablet"],
    tariffRate: "Free"
  },
  {
    code: "8543.70.96",
    description: "Other electrical machines and apparatus, having individual functions",
    category: "Electronics & Electrical",
    keywords: ["electronic", "electrical", "device", "machine", "equipment", "gadget"],
    tariffRate: "2.6%"
  },
  {
    code: "8518.30.20",
    description: "Headphones and earphones, whether or not combined with a microphone",
    category: "Electronics & Electrical",
    keywords: ["headphones", "earphones", "earbuds", "headset", "audio", "wireless", "bluetooth"],
    tariffRate: "Free"
  },

  // Chapter 94 - Furniture; bedding, mattresses, mattress supports, cushions and similar stuffed furnishings
  {
    code: "9401.61.40",
    description: "Other seats, with wooden frames, upholstered",
    category: "Furniture & Home",
    keywords: ["chair", "seat", "wooden", "upholstered", "furniture", "dining", "office"],
    tariffRate: "Free"
  },
  {
    code: "9403.60.80",
    description: "Other wooden furniture",
    category: "Furniture & Home",
    keywords: ["wooden", "furniture", "table", "desk", "cabinet", "shelf", "bookcase", "dresser"],
    tariffRate: "Free"
  },
  {
    code: "9404.90.95",
    description: "Other articles of bedding and similar furnishing",
    category: "Furniture & Home",
    keywords: ["bedding", "pillow", "cushion", "blanket", "comforter", "sheet", "mattress"],
    tariffRate: "9%"
  },

  // Chapter 39 - Plastics and articles thereof
  {
    code: "3923.30.00",
    description: "Bottles, flasks and similar articles, of plastics",
    category: "Plastics & Containers",
    keywords: ["bottle", "flask", "plastic", "container", "water", "drink", "beverage"],
    tariffRate: "3%"
  },
  {
    code: "3926.90.99",
    description: "Other articles of plastics and articles of other materials",
    category: "Plastics & Polymers",
    keywords: ["plastic", "polymer", "accessories", "household", "container", "storage"],
    tariffRate: "3.1%"
  },

  // Chapter 70 - Glass and glassware
  {
    code: "7013.49.20",
    description: "Other glassware of a kind used for table, kitchen, toilet, office, indoor decoration",
    category: "Glass & Glassware",
    keywords: ["glass", "glassware", "table", "kitchen", "decoration", "vase", "bowl", "cup"],
    tariffRate: "28.5%"
  },
  {
    code: "7018.90.50",
    description: "Glass beads, imitation pearls, imitation precious stones and similar articles",
    category: "Glass & Ceramics",
    keywords: ["glass", "beads", "imitation", "pearls", "decorative", "ornament"],
    tariffRate: "6%"
  },

  // Chapter 95 - Toys, games and sports equipment  
  {
    code: "9503.00.00",
    description: "Tricycles, scooters, pedal cars and similar wheeled toys; dolls",
    category: "Toys & Games",
    keywords: ["toy", "game", "children", "play", "doll", "tricycle", "scooter", "kids"],
    tariffRate: "Free"
  },
  {
    code: "9506.91.00",
    description: "Articles and equipment for general physical exercise, gymnastics, athletics",
    category: "Sports & Recreation",
    keywords: ["exercise", "gym", "fitness", "athletic", "sports", "equipment", "workout"],
    tariffRate: "Free"
  },

  // Chapter 33 - Essential oils and resinoids; perfumery, cosmetic preparations
  {
    code: "3304.99.50",
    description: "Other beauty or make-up preparations",
    category: "Cosmetics & Beauty",
    keywords: ["cosmetic", "makeup", "beauty", "skincare", "lotion", "cream", "foundation"],
    tariffRate: "Free"
  },
  {
    code: "3303.00.30",
    description: "Perfumes and toilet waters",
    category: "Cosmetics & Beauty", 
    keywords: ["perfume", "fragrance", "cologne", "scent", "toilet", "water", "spray"],
    tariffRate: "Free"
  },

  // Chapter 20 - Preparations of vegetables, fruit, nuts or other parts of plants
  {
    code: "2005.99.85",
    description: "Other vegetables prepared or preserved otherwise than by vinegar or acetic acid",
    category: "Food & Beverages",
    keywords: ["vegetables", "preserved", "canned", "food", "jarred", "pickled"],
    tariffRate: "14.9%"
  },
  {
    code: "2009.90.80",
    description: "Mixtures of fruit or vegetable juices",
    category: "Food & Beverages",
    keywords: ["juice", "fruit", "vegetable", "beverage", "drink", "mixed", "blend"],
    tariffRate: "Free"
  },

  // Chapter 73 - Articles of iron or steel
  {
    code: "7326.90.85",
    description: "Other articles of iron or steel",
    category: "Metals & Hardware",
    keywords: ["iron", "steel", "metal", "hardware", "tool", "equipment", "bracket", "fastener"],
    tariffRate: "2.9%"
  },
  {
    code: "7323.99.90",
    description: "Other table, kitchen or other household articles of iron or steel",
    category: "Metals & Hardware",
    keywords: ["kitchen", "household", "iron", "steel", "utensil", "cookware", "pot", "pan"],
    tariffRate: "3.4%"
  },

  // Chapter 48 - Paper and paperboard; articles of paper pulp, of paper or of paperboard
  {
    code: "4823.90.86",
    description: "Other paper and paperboard, cut to size or shape; other articles of paper",
    category: "Paper & Stationery",
    keywords: ["paper", "cardboard", "box", "packaging", "stationery", "craft", "notebook"],
    tariffRate: "Free"
  },
  {
    code: "4802.56.60",
    description: "Other paper and paperboard, not containing fibers",
    category: "Paper & Stationery",
    keywords: ["paper", "writing", "printing", "office", "copy", "bond"],
    tariffRate: "Free"
  },

  // Chapter 97 - Works of art, collectors' pieces and antiques
  {
    code: "9701.10.00", 
    description: "Paintings, drawings and pastels, executed entirely by hand",
    category: "Art & Collectibles",
    keywords: ["painting", "art", "drawing", "artwork", "canvas", "handmade", "original"],
    tariffRate: "Free"
  },
  {
    code: "9705.00.00",
    description: "Collections and collectors' pieces of archaeological, historical or ethnographic interest",
    category: "Art & Collectibles", 
    keywords: ["collectible", "antique", "historical", "archaeological", "ethnographic", "vintage"],
    tariffRate: "Free"
  }
];

// Enhanced helper function with precise matching algorithm
export async function findMatchingHSCodes(
  title: string, 
  description: string, 
  category: string, 
  materials?: string,
  categoryId?: string
): Promise<HSCode[]> {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const categoryLower = category.toLowerCase();
  const materialsLower = (materials || "").toLowerCase();
  
  console.log("=== MATCHING DEBUG ===");
  console.log("Input:", { title, materials, category });
  
  // Enhanced matching with strict prioritization
  const candidateMatches = hsCodeDatabase.map(hsCode => {
    let matchScore = 0;
    let matchDetails: string[] = [];
    
    // 1. EXACT PRODUCT TYPE MATCHES (highest priority - 50 points each)
    const productTypeKeywords = ["mug", "cup", "bowl", "plate", "wallet", "purse", "handbag", "shoe", "boot", "shirt", "pants"];
    productTypeKeywords.forEach(keyword => {
      if (hsCode.keywords.includes(keyword)) {
        if (titleLower.includes(keyword) || descLower.includes(keyword)) {
          matchScore += 50;
          matchDetails.push(`EXACT_PRODUCT: ${keyword}`);
        }
      }
    });
    
    // 2. MATERIAL MATCHES (high priority - 20 points each)
    if (materialsLower) {
      hsCode.keywords.forEach(keyword => {
        // Only count material matches for actual materials
        const materialKeywords = ["ceramic", "porcelain", "leather", "cotton", "plastic", "glass", "wood", "metal", "fabric", "textile"];
        if (materialKeywords.includes(keyword.toLowerCase())) {
          if (materialsLower.includes(keyword.toLowerCase())) {
            matchScore += 20;
            matchDetails.push(`MATERIAL: ${keyword}`);
          }
        }
      });
    }
    
    // 3. CATEGORY MATCHES (medium priority - 10 points)
    const categoryWords = categoryLower.split(/[\s&]+/);
    const hsCodeCategoryWords = hsCode.category.toLowerCase().split(/[\s&]+/);
    
    categoryWords.forEach(catWord => {
      if (catWord.length > 3) { // Only meaningful words
        hsCodeCategoryWords.forEach(hsCodeWord => {
          if (catWord === hsCodeWord || (catWord.length > 5 && hsCodeWord.includes(catWord))) {
            matchScore += 10;
            matchDetails.push(`CATEGORY: ${catWord}→${hsCodeWord}`);
          }
        });
      }
    });
    
    // 4. TITLE KEYWORD MATCHES (low priority - 5 points each)
    const generalKeywords = hsCode.keywords.filter(k => 
      !["mug", "cup", "bowl", "plate", "wallet", "purse", "handbag", "shoe", "boot", "shirt", "pants",
        "ceramic", "porcelain", "leather", "cotton", "plastic", "glass", "wood", "metal", "fabric", "textile"].includes(k)
    );
    
    generalKeywords.forEach(keyword => {
      if (keyword.length > 3 && titleLower.includes(keyword.toLowerCase())) {
        matchScore += 5;
        matchDetails.push(`TITLE_KW: ${keyword}`);
      }
    });
    
    if (matchScore > 0) {
      console.log(`${hsCode.code} (${hsCode.category}): score=${matchScore}, details=[${matchDetails.join(", ")}]`);
    }
    
    return { hsCode, matchScore, matchDetails };
  });
  
  // Filter and sort matches
  const validMatches = candidateMatches
    .filter(item => item.matchScore >= 20) // Require at least a material or product type match
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5)
    .map(item => item.hsCode);
  
  console.log("Valid matches found:", validMatches.length);
  console.log("=== END MATCHING DEBUG ===");
  
  return validMatches;
}