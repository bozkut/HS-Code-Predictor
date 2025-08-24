interface ProductData {
  title: string;
  description: string;
  category: string;
  materials: string;
  image: File | null;
}

interface HSCodePrediction {
  code: string;
  description: string;
  confidence: number;
  category: string;
  tariffRate?: string;
}

// Mock analysis function to simulate AI prediction
export const analyzeProduct = async (productData: ProductData): Promise<{
  predictions: HSCodePrediction[];
  analysisDetails: {
    processingTime: number;
    factors: string[];
  };
}> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

  const factors = ['Product Title', 'Description Analysis', 'Category Classification'];
  if (productData.materials) factors.push('Material Composition');
  if (productData.image) factors.push('Image Recognition');

  // Mock predictions based on category
  const predictions = generateMockPredictions(productData);

  return {
    predictions,
    analysisDetails: {
      processingTime: Math.round(1500 + Math.random() * 2000),
      factors
    }
  };
};

const generateMockPredictions = (productData: ProductData): HSCodePrediction[] => {
  const categoryMappings: Record<string, HSCodePrediction[]> = {
    'Electronics': [
      {
        code: '8517.12.00',
        description: 'Telephones for cellular networks or for other wireless networks',
        confidence: 87,
        category: 'Electrical machinery and equipment',
        tariffRate: '0%'
      },
      {
        code: '8471.30.01',
        description: 'Portable automatic data processing machines, weighing not more than 10 kg',
        confidence: 73,
        category: 'Electrical machinery and equipment',
        tariffRate: '0%'
      },
      {
        code: '8528.72.64',
        description: 'Other apparatus with a microprocessor-based device incorporating a modem',
        confidence: 61,
        category: 'Electrical machinery and equipment',
        tariffRate: '0%'
      }
    ],
    'Clothing & Textiles': [
      {
        code: '6109.10.00',
        description: 'T-shirts, singlets and other vests, knitted or crocheted, of cotton',
        confidence: 91,
        category: 'Textiles and textile articles',
        tariffRate: '16.5%'
      },
      {
        code: '6203.42.40',
        description: 'Men\'s or boys\' trousers, bib and brace overalls, breeches and shorts',
        confidence: 78,
        category: 'Textiles and textile articles',
        tariffRate: '28.2%'
      },
      {
        code: '6110.20.20',
        description: 'Sweaters, pullovers, sweatshirts, waistcoats and similar articles',
        confidence: 65,
        category: 'Textiles and textile articles',
        tariffRate: '32%'
      }
    ],
    'Home & Garden': [
      {
        code: '9403.60.80',
        description: 'Other wooden furniture',
        confidence: 83,
        category: 'Miscellaneous manufactured articles',
        tariffRate: '0%'
      },
      {
        code: '6302.60.00',
        description: 'Toilet linen and kitchen linen, of terry towelling or similar terry fabrics',
        confidence: 76,
        category: 'Textiles and textile articles',
        tariffRate: '9.1%'
      },
      {
        code: '8516.79.00',
        description: 'Other electro-thermic appliances',
        confidence: 58,
        category: 'Electrical machinery and equipment',
        tariffRate: '2.1%'
      }
    ],
    'Sports & Outdoor': [
      {
        code: '9506.62.80',
        description: 'Other inflatable balls',
        confidence: 89,
        category: 'Miscellaneous manufactured articles',
        tariffRate: '4.6%'
      },
      {
        code: '6402.99.31',
        description: 'Other footwear with outer soles and uppers of rubber or plastics',
        confidence: 71,
        category: 'Footwear, headgear, umbrellas',
        tariffRate: '20%'
      },
      {
        code: '9506.91.00',
        description: 'Articles and equipment for general physical exercise, gymnastics or athletics',
        confidence: 64,
        category: 'Miscellaneous manufactured articles',
        tariffRate: '4.6%'
      }
    ]
  };

  // Get predictions for the category, or use Electronics as default
  const categoryPredictions = categoryMappings[productData.category] || categoryMappings['Electronics'];
  
  // Adjust confidence based on available data
  const hasImage = productData.image !== null;
  const hasMaterials = productData.materials.length > 0;
  const hasDetailedDescription = productData.description.length > 50;
  
  const confidenceBoost = (hasImage ? 5 : 0) + (hasMaterials ? 8 : 0) + (hasDetailedDescription ? 3 : 0);
  
  return categoryPredictions.map(prediction => ({
    ...prediction,
    confidence: Math.min(95, prediction.confidence + confidenceBoost + Math.floor(Math.random() * 5 - 2))
  })).sort((a, b) => b.confidence - a.confidence);
};