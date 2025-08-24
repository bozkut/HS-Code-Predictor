import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "./ProductForm";
import { PredictionResults } from "./PredictionResults";
import { AnalysisResults, ProductData } from "../types/product";
import { analyzeProduct } from "../utils/mockAnalysis";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Target, Shield } from "lucide-react";

export const ExtensionApp = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async (productData: ProductData) => {
    setIsAnalyzing(true);
    try {
      const analysisResults = await analyzeProduct(productData);
      setResults(analysisResults);
      toast({
        title: "Analysis Complete!",
        description: `Found ${analysisResults.predictions.length} potential HS codes`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">HS Code Predictor</h1>
              <p className="text-xs text-muted-foreground">AI-powered classification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Product Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Product Analysis</CardTitle>
            <CardDescription className="text-sm">
              Enter your product details for HS code prediction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              AI-Powered Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Advanced AI Analysis</p>
                <p className="text-xs text-muted-foreground">Gemini AI enhanced predictions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">High Accuracy</p>
                <p className="text-xs text-muted-foreground">Real HS code database matching</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Compliance Ready</p>
                <p className="text-xs text-muted-foreground">Trade regulation compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results ? (
          <PredictionResults 
            predictions={results.predictions} 
            analysisDetails={results.analysisDetails}
          />
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Ready for Analysis</p>
                <p className="text-xs text-muted-foreground">
                  Fill in the product details above to get started
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4 border-t">
          <p className="text-xs text-muted-foreground">
            <a 
              href="https://www.toolsy.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Powered by Toolsy AI
            </a>
            {" • Built for customs compliance • Always verify critical classifications"}
          </p>
        </div>
      </div>
    </div>
  );
};