import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TariffCalculatorService, TariffCalculation, Country } from '@/services/TariffCalculatorService';
import { useToast } from '@/components/ui/use-toast';

export const TariffCalculator = () => {
  const [hsCode, setHsCode] = useState('');
  const [productValue, setProductValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [originCountry, setOriginCountry] = useState('CN');
  const [calculation, setCalculation] = useState<TariffCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const countries = TariffCalculatorService.getCountries();

  const handleCalculate = async () => {
    if (!hsCode || !productValue) {
      toast({
        title: "Missing Information",
        description: "Please enter both HS code and product value",
        variant: "destructive",
      });
      return;
    }

    const value = parseFloat(productValue);
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid product value",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      const result = await TariffCalculatorService.calculateTariff(
        hsCode,
        value,
        currency,
        originCountry
      );
      
      setCalculation(result);
      
      toast({
        title: "Calculation Complete",
        description: "Tariff estimate has been calculated successfully",
      });
    } catch (error) {
      console.error('Tariff calculation error:', error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate tariff. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tariff Calculator
          </CardTitle>
          <CardDescription>
            Calculate estimated customs duties and fees for your imports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hsCode">HS Code</Label>
              <Input
                id="hsCode"
                placeholder="e.g., 8215.20.0000"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productValue">Product Value</Label>
              <div className="flex gap-2">
                <Input
                  id="productValue"
                  type="number"
                  placeholder="1000"
                  value={productValue}
                  onChange={(e) => setProductValue(e.target.value)}
                  className="flex-1"
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="originCountry">Country of Origin</Label>
              <Select value={originCountry} onValueChange={setOriginCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center justify-between w-full">
                        <span>{country.name}</span>
                        {country.preferentialRate && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {country.tradeProgram}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleCalculate} 
            disabled={isCalculating}
            className="w-full"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Tariff'}
          </Button>
        </CardContent>
      </Card>

      {calculation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tariff Calculation Results
            </CardTitle>
            <CardDescription>
              HS Code: {calculation.hsCode} | Origin: {countries.find(c => c.code === originCountry)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cost Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Product Value:</span>
                    <span className="font-medium">
                      {TariffCalculatorService.formatCurrency(calculation.breakdown.productValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customs Duty:</span>
                    <span className="font-medium">
                      {TariffCalculatorService.formatCurrency(calculation.breakdown.customsDuty)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Additional Fees:</span>
                    <span className="font-medium">
                      {TariffCalculatorService.formatCurrency(calculation.breakdown.additionalFees)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Estimated Cost:</span>
                    <span className="text-primary">
                      {TariffCalculatorService.formatCurrency(calculation.breakdown.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Tariff Rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>General Rate:</span>
                    <span>{calculation.calculations.generalRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Special Rate:</span>
                    <span>{calculation.calculations.specialRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Applied Rate:</span>
                    <Badge variant="outline" className="ml-2">
                      {calculation.calculations.appliedRate}
                    </Badge>
                  </div>
                  {calculation.calculations.tradeProgram && (
                    <div className="flex justify-between">
                      <span>Trade Program:</span>
                      <Badge variant="secondary">
                        {calculation.calculations.tradeProgram}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Fees Breakdown */}
            <Card className="bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Merchandise Processing Fee (MPF):</span>
                  <span className="font-medium">
                    {TariffCalculatorService.formatCurrency(calculation.additionalFees.merchandiseProcessingFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Harbor Maintenance Fee (HMF):</span>
                  <span className="font-medium">
                    {TariffCalculatorService.formatCurrency(calculation.additionalFees.harborMaintenanceFee)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimers */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Important Disclaimers:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    {calculation.disclaimers.map((disclaimer, index) => (
                      <li key={index} className="list-disc">{disclaimer}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* Pro Tips */}
            <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li>• Consider timing imports around rate changes to optimize costs</li>
                  <li>• Free Trade Agreement countries may qualify for preferential rates</li>
                  <li>• Formal entries (over $2,500) have different fee structures than informal entries</li>
                  <li>• Additional fees like Anti-Dumping duties may apply to certain products</li>
                  <li>• Consult with a licensed customs broker for complex shipments</li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
};