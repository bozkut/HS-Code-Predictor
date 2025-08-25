import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, BarChart3, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { BulkHTSLookupService, BulkJobStatus, BulkAnalysisResult } from '@/services/BulkHTSLookupService';
import { useToast } from '@/components/ui/use-toast';

export const BulkAnalysis = () => {
  const [jobStatus, setJobStatus] = useState<BulkJobStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setUploadedFile(file);
        toast({
          title: "File Uploaded",
          description: `${file.name} is ready for processing`,
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const processCSVFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              return row;
            });
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleStartAnalysis = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File Selected",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Process CSV file
      const csvData = await processCSVFile(uploadedFile);
      
      if (csvData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      // Validate and convert to bulk products
      const products = await BulkHTSLookupService.processCSVData(csvData);
      const { valid, invalid } = BulkHTSLookupService.validateProducts(products);
      
      if (invalid.length > 0) {
        toast({
          title: "Validation Issues",
          description: `${invalid.length} products have validation issues and will be skipped`,
          variant: "destructive",
        });
      }

      if (valid.length === 0) {
        throw new Error('No valid products found in CSV file');
      }

      // Start bulk analysis
      const jobId = await BulkHTSLookupService.startBulkAnalysis(valid);
      
      // Poll for job status
      pollJobStatus(jobId);
      
      toast({
        title: "Analysis Started",
        description: `Processing ${valid.length} products`,
      });
      
    } catch (error) {
      console.error('Bulk analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to start bulk analysis",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await BulkHTSLookupService.getJobStatus(jobId);
        console.log('Job Status Debug:', JSON.stringify(status, null, 2));
        console.log('Results Debug:', status.results);
        setJobStatus(status);
        
        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          clearInterval(pollInterval);
          setIsProcessing(false);
          
          if (status.status === 'COMPLETED') {
            toast({
              title: "Analysis Complete",
              description: `Processed ${status.completedProducts} products successfully`,
            });
          } else {
            toast({
              title: "Analysis Failed",
              description: "Bulk analysis job failed",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        clearInterval(pollInterval);
        setIsProcessing(false);
      }
    }, 2000);
  };

  const handleExportResults = () => {
    if (!jobStatus?.results) return;
    
    const csv = BulkHTSLookupService.exportToCSV(jobStatus.results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hts-analysis-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Results have been downloaded as CSV",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default';
      case 'PROCESSING': return 'secondary';
      case 'FAILED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getResultStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 dark:text-green-400';
      case 'FAILED': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const progressPercentage = jobStatus 
    ? Math.round((jobStatus.completedProducts / jobStatus.totalProducts) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Bulk HTS Analysis
          </CardTitle>
          <CardDescription>
            Upload a CSV file to analyze multiple products and get HS code predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload CSV File
            </Button>
            
            {uploadedFile && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">{uploadedFile.name}</span>
              </div>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              CSV file should contain columns: product_id, title, description, category, materials (optional), image_url (optional)
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleStartAnalysis}
            disabled={!uploadedFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Start Bulk Analysis'}
          </Button>
        </CardContent>
      </Card>

      {(isProcessing || jobStatus) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Analysis Progress
              {jobStatus && (
                <Badge variant={getStatusColor(jobStatus.status)}>
                  {jobStatus.status}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobStatus && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{jobStatus.completedProducts} / {jobStatus.totalProducts}</span>
                  </div>
                  <Progress value={progressPercentage} className="w-full" />
                  <div className="text-center text-sm text-muted-foreground">
                    {progressPercentage}% Complete
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{jobStatus.totalProducts}</div>
                    <div className="text-sm text-muted-foreground">Total Products</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{jobStatus.completedProducts}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{jobStatus.failedProducts}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{jobStatus.summary?.flaggedForReview || 0}</div>
                    <div className="text-sm text-muted-foreground">Need Review</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {jobStatus?.status === 'COMPLETED' && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Analytics</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="results">Product Results</TabsTrigger>
            <TabsTrigger value="export">Export Report</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Average Confidence:</span>
                      <span className="font-medium">{jobStatus.summary?.averageConfidence || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High Confidence (&gt;85%):</span>
                      <span className="font-medium">
                        {jobStatus.results ? jobStatus.results.filter(r => r.confidence > 85).length : 0} / {jobStatus.totalProducts}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Manual Review Needed:</span>
                      <span className="font-medium text-amber-600">
                        {jobStatus.results ? jobStatus.results.filter(r => r.confidence < 70).length : 0} products
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Time:</span>
                      <span className="font-medium">{Math.round((jobStatus.summary?.totalProcessingTime || 0) / 1000)}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Most Common Chapters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(jobStatus.summary?.mostCommonChapters || []).map((chapter, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{chapter.chapter}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${chapter.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">
                            {Math.round(chapter.percentage)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-600">⚠️ High Risk Products</CardTitle>
                  <CardDescription>Products requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(jobStatus.results || [])
                      .filter(r => r.confidence < 70)
                      .slice(0, 5)
                      .map((result, index) => (
                        <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="font-medium text-sm">{result.product.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Confidence: {result.confidence}% - Needs manual review
                          </div>
                        </div>
                      ))}
                    {(jobStatus.results || []).filter(r => r.confidence < 70).length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        🎉 No high risk products found!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">✅ Ready for Customs</CardTitle>
                  <CardDescription>High confidence predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(jobStatus.results || [])
                      .filter(r => r.confidence >= 85)
                      .slice(0, 5)
                      .map((result, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="font-medium text-sm">{result.product.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.predictions?.[0]?.code} - {result.confidence}% confidence
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>🚨 Compliance Risk Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {(jobStatus.results || []).filter(r => r.confidence < 50).length}
                    </div>
                    <div className="text-sm text-red-600">Critical Risk</div>
                    <div className="text-xs text-muted-foreground">(&lt;50% confidence)</div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {(jobStatus.results || []).filter(r => r.confidence >= 50 && r.confidence < 70).length}
                    </div>
                    <div className="text-sm text-amber-600">Medium Risk</div>
                    <div className="text-xs text-muted-foreground">(50-70% confidence)</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {(jobStatus.results || []).filter(r => r.confidence >= 70 && r.confidence < 85).length}
                    </div>
                    <div className="text-sm text-blue-600">Low Risk</div>
                    <div className="text-xs text-muted-foreground">(70-85% confidence)</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(jobStatus.results || []).filter(r => r.confidence >= 85).length}
                    </div>
                    <div className="text-sm text-green-600">Very Low Risk</div>
                    <div className="text-xs text-muted-foreground">(&gt;85% confidence)</div>
                  </div>
                </div>
                
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recommendation:</strong> Focus on {(jobStatus.results || []).filter(r => r.confidence < 70).length} products requiring manual review. 
                    {(jobStatus.results || []).filter(r => r.confidence >= 85).length} products are ready for customs clearance.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  Individual product analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(jobStatus.results || []).slice(0, 50).map((result) => ( // Show first 50 results
                    <div key={result.productId} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="font-medium">{result.product.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {result.product.description}
                          </div>
                          {result.predictions && result.predictions.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{result.predictions[0].code}</Badge>
                              <span className="text-sm">{result.confidence}% confidence</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <Badge variant={result.status === 'COMPLETED' ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(jobStatus.results || []).length > 50 && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      Showing first 50 results. Export to CSV to see all results.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Results</CardTitle>
                <CardDescription>
                  Download your analysis results in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleExportResults}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Report
                </Button>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    The CSV export includes all product details, HS code predictions, confidence scores, 
                    and source information for further analysis or import into your systems.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};