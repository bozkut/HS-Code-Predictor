// Tariff calculation service for customs duty estimation
import { HTSEntry } from './HTSLookupService';

export interface TariffCalculation {
  hsCode: string;
  productValue: number;
  currency: string;
  estimatedDuty: {
    general: number;
    special: number;
    column2: number;
  };
  additionalFees: {
    merchandiseProcessingFee: number;
    harborMaintenanceFee: number;
  };
  totalEstimatedCost: number;
  breakdown: {
    productValue: number;
    customsDuty: number;
    additionalFees: number;
    total: number;
  };
  disclaimers: string[];
  calculations: {
    generalRate: string;
    specialRate: string;
    column2Rate: string;
    appliedRate: string;
    tradeProgram?: string;
  };
}

export interface Country {
  code: string;
  name: string;
  tradeProgram?: string;
  preferentialRate?: boolean;
}

export class TariffCalculatorService {
  private static readonly TRADE_PROGRAMS = {
    'USMCA': ['US', 'CA', 'MX'],
    'CAFTA-DR': ['CR', 'DO', 'GT', 'HN', 'NI', 'SV'],
    'FTA': ['AU', 'BH', 'CL', 'CO', 'IL', 'JO', 'KR', 'MA', 'OM', 'PA', 'PE', 'SG'],
    'GSP': ['IN', 'TH', 'PH', 'ID'], // Generalized System of Preferences
    'MFN': [] // Most Favored Nation (default)
  };

  private static readonly MPF_RATES = {
    informal: 2.0, // Min $2, Max $10 for informal entries
    formal: 0.003464, // 0.3464% for formal entries, Min $27.23, Max $528.33
  };

  private static readonly HMF_RATE = 0.00125; // 0.125% Harbor Maintenance Fee

  /**
   * Calculate estimated tariff for a product
   */
  static async calculateTariff(
    hsCode: string,
    productValue: number,
    currency: string = 'USD',
    originCountry: string = 'CN',
    htsEntry?: HTSEntry
  ): Promise<TariffCalculation> {
    
    // Convert to USD if needed (simplified - in production use real exchange rates)
    const valueInUSD = currency === 'USD' ? productValue : productValue * 0.85; // Simplified conversion

    // Get tariff rates
    const rates = htsEntry?.tariffInfo || await this.getTariffRates(hsCode);
    
    // Determine applicable rate based on country of origin
    const appliedRateInfo = this.determineApplicableRate(originCountry, rates);
    
    // Calculate duties
    const generalDuty = this.calculateDuty(valueInUSD, rates.generalRate);
    const specialDuty = this.calculateDuty(valueInUSD, rates.specialRate);
    const column2Duty = this.calculateDuty(valueInUSD, rates.column2Rate);
    
    const appliedDuty = this.calculateDuty(valueInUSD, appliedRateInfo.rate);

    // Calculate additional fees
    const mpf = this.calculateMPF(valueInUSD);
    const hmf = this.calculateHMF(valueInUSD);

    const totalAdditionalFees = mpf + hmf;
    const totalEstimatedCost = valueInUSD + appliedDuty + totalAdditionalFees;

    return {
      hsCode,
      productValue: valueInUSD,
      currency: 'USD',
      estimatedDuty: {
        general: generalDuty,
        special: specialDuty,
        column2: column2Duty
      },
      additionalFees: {
        merchandiseProcessingFee: mpf,
        harborMaintenanceFee: hmf
      },
      totalEstimatedCost,
      breakdown: {
        productValue: valueInUSD,
        customsDuty: appliedDuty,
        additionalFees: totalAdditionalFees,
        total: totalEstimatedCost
      },
      disclaimers: [
        'Estimates are for informational purposes only',
        'Actual duties may vary based on specific circumstances',
        'Additional fees and taxes may apply',
        'Consult with a customs broker for accurate calculations',
        'Exchange rates used are approximate'
      ],
      calculations: {
        generalRate: rates.generalRate,
        specialRate: rates.specialRate,
        column2Rate: rates.column2Rate,
        appliedRate: appliedRateInfo.rate,
        tradeProgram: appliedRateInfo.program
      }
    };
  }

  /**
   * Get tariff rates for an HTS code
   */
  private static async getTariffRates(hsCode: string): Promise<{
    generalRate: string;
    specialRate: string;
    column2Rate: string;
  }> {
    // Simplified tariff lookup - in production, use official USITC API
    const chapter = hsCode.substring(0, 2);
    
    const defaultRates: Record<string, any> = {
      '39': { generalRate: '5.3%', specialRate: 'Free', column2Rate: '80%' },
      '61': { generalRate: '16.5%', specialRate: 'Free', column2Rate: '90%' },
      '84': { generalRate: '2.5%', specialRate: 'Free', column2Rate: '35%' },
      '82': { generalRate: '3.7%', specialRate: 'Free', column2Rate: '110%' },
      '73': { generalRate: 'Free', specialRate: 'Free', column2Rate: '74%' }
    };

    return defaultRates[chapter] || { 
      generalRate: 'Free', 
      specialRate: 'Free', 
      column2Rate: '60%' 
    };
  }

  /**
   * Determine which tariff rate applies based on country of origin
   */
  private static determineApplicableRate(
    originCountry: string, 
    rates: { generalRate: string; specialRate: string; column2Rate: string }
  ): { rate: string; program?: string } {
    
    // Check if country qualifies for special rates
    for (const [program, countries] of Object.entries(this.TRADE_PROGRAMS)) {
      if (countries.includes(originCountry)) {
        return { 
          rate: rates.specialRate, 
          program 
        };
      }
    }

    // Check for Column 2 countries (non-MFN)
    const column2Countries = ['KP', 'CU']; // North Korea, Cuba
    if (column2Countries.includes(originCountry)) {
      return { 
        rate: rates.column2Rate, 
        program: 'Column 2' 
      };
    }

    // Default to general (MFN) rate
    return { 
      rate: rates.generalRate, 
      program: 'MFN' 
    };
  }

  /**
   * Calculate duty amount from rate string
   */
  private static calculateDuty(value: number, rateString: string): number {
    if (rateString.toLowerCase() === 'free' || rateString === '0%') {
      return 0;
    }

    // Handle percentage rates
    if (rateString.includes('%')) {
      const percentage = parseFloat(rateString.replace('%', ''));
      return (value * percentage) / 100;
    }

    // Handle specific rates (e.g., "$0.52/kg")
    if (rateString.includes('$')) {
      // For specific rates, we'd need weight/quantity data
      // Return estimated duty for now
      return value * 0.05; // 5% estimate
    }

    // Handle ad valorem equivalent
    if (rateString.includes('ad val')) {
      const percentage = parseFloat(rateString.split('%')[0]);
      return (value * percentage) / 100;
    }

    return 0;
  }

  /**
   * Calculate Merchandise Processing Fee
   */
  private static calculateMPF(value: number): number {
    if (value <= 2500) {
      // Informal entries
      return Math.max(2, Math.min(10, this.MPF_RATES.informal));
    } else {
      // Formal entries
      const fee = value * this.MPF_RATES.formal;
      return Math.max(27.23, Math.min(528.33, fee));
    }
  }

  /**
   * Calculate Harbor Maintenance Fee
   */
  private static calculateHMF(value: number): number {
    // HMF applies to commercial shipments over $2,500
    if (value > 2500) {
      return value * this.HMF_RATE;
    }
    return 0;
  }

  /**
   * Get list of countries with trade programs
   */
  static getCountries(): Country[] {
    const countries: Country[] = [
      { code: 'CN', name: 'China' },
      { code: 'CA', name: 'Canada', tradeProgram: 'USMCA', preferentialRate: true },
      { code: 'MX', name: 'Mexico', tradeProgram: 'USMCA', preferentialRate: true },
      { code: 'KR', name: 'South Korea', tradeProgram: 'FTA', preferentialRate: true },
      { code: 'SG', name: 'Singapore', tradeProgram: 'FTA', preferentialRate: true },
      { code: 'AU', name: 'Australia', tradeProgram: 'FTA', preferentialRate: true },
      { code: 'CL', name: 'Chile', tradeProgram: 'FTA', preferentialRate: true },
      { code: 'IN', name: 'India', tradeProgram: 'GSP', preferentialRate: true },
      { code: 'TH', name: 'Thailand', tradeProgram: 'GSP', preferentialRate: true },
      { code: 'VN', name: 'Vietnam' },
      { code: 'JP', name: 'Japan' },
      { code: 'DE', name: 'Germany' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'IT', name: 'Italy' },
      { code: 'FR', name: 'France' },
      { code: 'KP', name: 'North Korea', tradeProgram: 'Column 2' },
      { code: 'CU', name: 'Cuba', tradeProgram: 'Column 2' }
    ];

    return countries.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Format currency values
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}