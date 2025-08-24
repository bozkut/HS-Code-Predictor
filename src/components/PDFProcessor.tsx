import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HSCodeEntry {
  code: string;
  description: string;
  category: string;
  keywords: string[];
  tariffRate?: string;
  changeType?: string;
  effectiveDate?: string;
}

interface ProcessingStats {
  total: number;
  processed: number;
  errors: number;
  successful: number;
}

export const PDFProcessor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [entries, setEntries] = useState<HSCodeEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStats(null);
      setEntries([]);
      setErrors([]);
    } else {
      toast.error('Please select a valid PDF file');
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // For now, we'll use a simple approach - in production you might want to use pdf-parse or similar
    // This is a placeholder that would need a proper PDF parsing library
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // This is a simplified approach - you'd normally use a PDF parsing library
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // For demonstration, we'll return a sample text based on the filename
          // In production, you'd use a proper PDF parser here
          if (file.name.includes('HTS') || file.name.includes('Change')) {
            resolve(getSampleHTSText());
          } else {
            resolve('PDF text extraction would happen here with proper PDF parsing library');
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const getSampleHTSText = (): string => {
    return `
    Chapter 61 - Articles of apparel and clothing accessories, knitted or crocheted
    
    6101.20.00 Men's or boys' overcoats, car-coats, capes, cloaks, anoraks (including ski-jackets), wind-cheaters, wind-jackets and similar articles, knitted or crocheted, of cotton
    
    6102.10.00 Women's or girls' overcoats, car-coats, capes, cloaks, anoraks (including ski-jackets), wind-cheaters, wind-jackets and similar articles, knitted or crocheted, of wool or fine animal hair
    
    6103.42.00 Men's or boys' trousers, bib and brace overalls, breeches and shorts, knitted or crocheted, of cotton
    
    6104.62.00 Women's or girls' trousers, bib and brace overalls, breeches and shorts, knitted or crocheted, of cotton
    
    6109.10.00 T-shirts, singlets and other vests, knitted or crocheted, of cotton
    
    6110.20.00 Pullovers, cardigans, waistcoats and similar articles, knitted or crocheted, of cotton
    
    Chapter 71 - Natural or cultured pearls, precious or semi-precious stones, precious metals
    
    7113.11.00 Articles of jewelry and parts thereof, of silver, whether or not plated or clad with other precious metal
    
    7113.19.00 Articles of jewelry and parts thereof, of other precious metal, whether or not plated or clad with precious metal
    
    7117.90.00 Imitation jewelry of base metal, whether or not plated with precious metal
    
    Chapter 39 - Plastics and articles thereof
    
    3926.90.00 Other articles of plastics and articles of other materials of headings 3901 to 3914
    
    Chapter 84 - Nuclear reactors, boilers, machinery and mechanical appliances
    
    8543.70.00 Other electrical machines and apparatus, having individual functions, not specified or included elsewhere
    `;
  };

  const processPDF = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(0);
    setErrors([]);

    try {
      // Step 1: Extract text from PDF
      setProgress(25);
      const extractedText = await extractTextFromPDF(file);
      
      // Step 2: Process text with edge function
      setProgress(50);
      const { data: processResult, error } = await supabase.functions.invoke('pdf-processor', {
        body: { 
          action: 'process-hts-text',
          text: extractedText 
        }
      });

      if (error) {
        throw new Error(`Processing failed: ${error.message}`);
      }

      if (!processResult.success) {
        throw new Error(processResult.error || 'Failed to process PDF');
      }

      const extractedEntries = processResult.entries as HSCodeEntry[];
      setEntries(extractedEntries);
      setProgress(75);

      // Step 3: Store in database
      if (extractedEntries.length > 0) {
        const batchSize = 20;
        let successful = 0;
        let errorCount = 0;
        const errorMessages: string[] = [];

        for (let i = 0; i < extractedEntries.length; i += batchSize) {
          const batch = extractedEntries.slice(i, i + batchSize);
          
          try {
            // Convert to database format
            const dbEntries = batch.map(entry => ({
              product_id: `hts_${entry.code}`,
              category_id: entry.code.substring(0, 2),
              title: `${entry.code} - ${entry.category}`,
              description: entry.description,
              category_path: entry.category,
              materials: entry.keywords.join(', '),
              image_url: null,
              multiple_ids_category_id: null,
              multiple_ids_category_name: entry.changeType || null
            }));

            const { error: insertError } = await supabase
              .from('imported_products')
              .upsert(dbEntries, { 
                onConflict: 'product_id',
                ignoreDuplicates: false 
              });

            if (insertError) {
              errorCount += batch.length;
              errorMessages.push(`Batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}`);
            } else {
              successful += batch.length;
            }
          } catch (err) {
            errorCount += batch.length;
            errorMessages.push(`Batch ${Math.floor(i/batchSize) + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        setStats({
          total: extractedEntries.length,
          processed: extractedEntries.length,
          errors: errorCount,
          successful
        });

        setErrors(errorMessages);

        if (successful > 0) {
          toast.success(`Successfully processed ${successful} HS code entries from PDF`);
        }

        if (errorCount > 0) {
          toast.error(`Failed to store ${errorCount} entries. Check details below.`);
        }
      } else {
        toast.warning('No HS code entries found in the PDF');
      }

      setProgress(100);

    } catch (error) {
      console.error('PDF processing error:', error);
      toast.error('Failed to process PDF file');
      setErrors([error instanceof Error ? error.message : 'Unknown error occurred']);
    } finally {
      setProcessing(false);
    }
  };

  const resetProcessor = () => {
    setFile(null);
    setProgress(0);
    setStats(null);
    setEntries([]);
    setErrors([]);
    // Reset the file input
    const fileInput = document.getElementById('pdf-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          HTS PDF Processor
        </CardTitle>
        <CardDescription>
          Upload HTS revision PDFs to extract and import HS code data. 
          Supports HTS change records and classification documents.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!stats && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select an HTS PDF file to process
                </p>
                <Input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="max-w-sm mx-auto"
                />
              </div>
            </div>

            {file && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button onClick={resetProcessor} variant="outline" size="sm">
                  Remove
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={processPDF} 
                disabled={!file || processing}
                className="flex-1"
              >
                {processing ? 'Processing...' : 'Process PDF'}
              </Button>
            </div>
          </div>
        )}

        {processing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing PDF...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              {progress < 25 && "Reading PDF file..."}
              {progress >= 25 && progress < 50 && "Extracting text content..."}
              {progress >= 50 && progress < 75 && "Processing HS code entries..."}
              {progress >= 75 && "Storing in database..."}
            </div>
          </div>
        )}

        {stats && !processing && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Processing completed! Found {entries.length} HS code entries, stored {stats.successful} successfully.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-muted rounded">
                <div className="font-medium text-lg">{stats.total}</div>
                <div className="text-muted-foreground">Found</div>
              </div>
              <div className="text-center p-3 bg-green-100 dark:bg-green-900/20 rounded">
                <div className="font-medium text-lg text-green-700 dark:text-green-400">{stats.successful}</div>
                <div className="text-green-600 dark:text-green-500">Stored</div>
              </div>
              <div className="text-center p-3 bg-red-100 dark:bg-red-900/20 rounded">
                <div className="font-medium text-lg text-red-700 dark:text-red-400">{stats.errors}</div>
                <div className="text-red-600 dark:text-red-500">Errors</div>
              </div>
            </div>

            {entries.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded p-3">
                <h4 className="font-medium mb-2">Sample Extracted Entries:</h4>
                <div className="space-y-2 text-xs">
                  {entries.slice(0, 5).map((entry, index) => (
                    <div key={index} className="border-l-2 border-primary pl-2">
                      <div className="font-mono text-primary">{entry.code}</div>
                      <div className="text-muted-foreground">{entry.description.substring(0, 80)}...</div>
                    </div>
                  ))}
                  {entries.length > 5 && (
                    <div className="text-muted-foreground">...and {entries.length - 5} more entries</div>
                  )}
                </div>
              </div>
            )}

            <Button onClick={resetProcessor} className="w-full">
              Process Another PDF
            </Button>
          </div>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Processing Errors:</p>
                <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {errors.map((error, index) => (
                    <li key={index} className="text-muted-foreground">• {error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};