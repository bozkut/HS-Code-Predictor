import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProductForm } from '@/components/ProductForm';
import { PredictionResults } from '@/components/PredictionResults';
import { CSVImport } from '@/components/CSVImport';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { analyzeProduct } from '@/utils/mockAnalysis';
import { useToast } from '@/hooks/use-toast';
import { ProductData, AnalysisResults } from '@/types/product';
import heroImage from '@/assets/hero-customs.jpg';

const Index = () => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);

  const handleAnalyze = async (productData: ProductData) => {
    setIsAnalyzing(true);
    setResults(null);
    
    try {
      const analysisResults = await analyzeProduct(productData);
      setResults(analysisResults);
      
      toast({
        title: "Analysis Complete",
        description: `Found ${analysisResults.predictions.length} potential HS code matches`,
        duration: 4000,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src={heroImage} 
            alt="Customs and logistics" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Predict HS Codes with <span className="bg-gradient-hero bg-clip-text text-transparent">AI Precision</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Ensure customs compliance for your products with our advanced AI classifier. 
            Get accurate HS code predictions with confidence scores to streamline your international shipping process.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <Tabs defaultValue="predict" className="w-full max-w-7xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="predict">HS Code Prediction</TabsTrigger>
              <TabsTrigger value="import">Data Import</TabsTrigger>
            </TabsList>
            
            <TabsContent value="predict" className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Product Form */}
                <div className="space-y-6">
                  <ProductForm onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
                  
                  {/* Features Card */}
                  <Card className="shadow-card border-border/50">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-foreground mb-4">Why Use AI HS Code Prediction?</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-foreground">Avoid Customs Delays:</span>
                            <span className="text-muted-foreground ml-1">Correct classification prevents shipment holds</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-foreground">Reduce Penalties:</span>
                            <span className="text-muted-foreground ml-1">Accurate codes minimize risk of fines</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-foreground">Speed Up Processing:</span>
                            <span className="text-muted-foreground ml-1">AI analysis in seconds vs hours of manual research</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Results */}
                <div className="space-y-6">
                  {results ? (
                    <PredictionResults 
                      predictions={results.predictions}
                      analysisDetails={results.analysisDetails}
                    />
                  ) : (
                    <Card className="shadow-card border-border/50">
                      <CardContent className="pt-6">
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="text-2xl">🎯</span>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Analyze</h3>
                          <p className="text-muted-foreground">
                            Fill in your product information to get AI-powered HS code predictions with confidence scores.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="import">
              <CSVImport />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              Powered by Toolsy AI • Built for customs compliance • 
              <span className="text-primary ml-1">Always verify critical classifications</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;