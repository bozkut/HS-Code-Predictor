import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Camera, X, Eye, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PredictionResults } from './PredictionResults';

interface AnalysisResults {
  predictions: any[];
  imageAnalysis: any;
  analysisDetails: {
    processingTime: number;
    factors: string[];
  };
}

export const ImageOnlyAnalysis: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedImage(file);
    setResults(null); // Clear previous results
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImageOnly = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        try {
          clearInterval(progressInterval);
          setUploadProgress(100);

          console.log('Starting image-only analysis...');
          
          // Call the image-only prediction function
          const { data, error } = await supabase.functions.invoke('image-only-prediction', {
            body: {
              imageData: base64Data,
              imageFormat: selectedImage.type
            }
          });

          if (error) {
            console.error('Analysis error:', error);
            throw new Error(error.message || 'Analysis failed');
          }

          console.log('Analysis successful:', data);
          setResults(data);
          
          toast({
            title: "Analysis Complete",
            description: `Found ${data.predictions?.length || 0} potential HTS codes`,
          });

        } catch (analysisError) {
          console.error('Analysis failed:', analysisError);
          toast({
            title: "Analysis Failed",
            description: analysisError.message || "Failed to analyze image. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      reader.readAsDataURL(selectedImage);

    } catch (error) {
      console.error('Error in image analysis:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setUploadProgress(0);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Image-Only HTS Classification
          </CardTitle>
          <CardDescription>
            Upload a product image and let AI predict HTS codes based on visual analysis only
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!selectedImage ? (
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="mx-auto h-16 w-16 text-muted-foreground">
                    <Upload className="h-full w-full" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Drop an image here, or{' '}
                      <button
                        type="button"
                        className="text-primary hover:text-primary/80 font-medium"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Product for analysis"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <p><strong>File:</strong> {selectedImage.name}</p>
                  <p><strong>Size:</strong> {(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>

                {isAnalyzing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Analyzing image...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <Button
                  onClick={analyzeImageOnly}
                  disabled={isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Predict HTS Codes from Image
                    </>
                  )}
                </Button>
              </div>
            )}

            <Alert>
              <Camera className="h-4 w-4" />
              <AlertDescription>
                <strong>Best Results:</strong> Use clear, well-lit images showing the entire product with visible materials, textures, and any labels or markings.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Image Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Detected Materials:</h4>
                  <p className="text-muted-foreground">
                    {results.imageAnalysis?.materials?.join(', ') || 'Not detected'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Product Type:</h4>
                  <p className="text-muted-foreground">
                    {results.imageAnalysis?.product_type || 'Not identified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Key Features:</h4>
                  <p className="text-muted-foreground">
                    {results.imageAnalysis?.features?.join(', ') || 'None identified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Analysis Confidence:</h4>
                  <p className="text-muted-foreground">
                    {((results.imageAnalysis?.confidence || 0) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <PredictionResults 
            predictions={results.predictions}
            analysisDetails={results.analysisDetails}
          />
        </div>
      )}
    </div>
  );
};