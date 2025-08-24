import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { parseCSVContent, convertCSVToProductData } from '@/utils/csvParser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportStats {
  total: number;
  processed: number;
  errors: number;
  successful: number;
}

export const CSVImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setStats(null);
      setErrors([]);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const importCSV = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setErrors([]);

    try {
      // Read file content
      const content = await file.text();
      const products = parseCSVContent(content);
      
      const totalProducts = products.length;
      let processed = 0;
      let successful = 0;
      let errorCount = 0;
      const errorMessages: string[] = [];

      setStats({
        total: totalProducts,
        processed: 0,
        errors: 0,
        successful: 0
      });

      // Process products in batches of 50
      const batchSize = 50;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        try {
          const { error } = await supabase
            .from('imported_products')
            .upsert(batch, { 
              onConflict: 'product_id',
              ignoreDuplicates: false 
            });

          if (error) {
            errorCount += batch.length;
            errorMessages.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
          } else {
            successful += batch.length;
          }
        } catch (err) {
          errorCount += batch.length;
          errorMessages.push(`Batch ${Math.floor(i/batchSize) + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        processed += batch.length;
        const newProgress = Math.round((processed / totalProducts) * 100);
        setProgress(newProgress);
        
        setStats({
          total: totalProducts,
          processed,
          errors: errorCount,
          successful
        });

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setErrors(errorMessages);
      
      if (successful > 0) {
        toast.success(`Successfully imported ${successful} products`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} products. Check details below.`);
      }

    } catch (error) {
      console.error('CSV import error:', error);
      toast.error('Failed to process CSV file');
      setErrors([error instanceof Error ? error.message : 'Unknown error occurred']);
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setProgress(0);
    setStats(null);
    setErrors([]);
    // Reset the file input
    const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CSV Data Import
        </CardTitle>
        <CardDescription>
          Upload your product CSV files to expand the HS code database. 
          Supports files with product_id, category_id, title, description, and other fields.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!stats && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select a CSV file to import product data
                </p>
                <Input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
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
                <Button onClick={resetImport} variant="outline" size="sm">
                  Remove
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={importCSV} 
                disabled={!file || importing}
                className="flex-1"
              >
                {importing ? 'Importing...' : 'Import CSV Data'}
              </Button>
            </div>
          </div>
        )}

        {importing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing products...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
            
            {stats && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">{stats.processed}</div>
                  <div className="text-muted-foreground">Processed</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">{stats.successful}</div>
                  <div className="text-muted-foreground">Successful</div>
                </div>
              </div>
            )}
          </div>
        )}

        {stats && !importing && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Import completed! Processed {stats.total} products with {stats.successful} successful imports.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-muted rounded">
                <div className="font-medium text-lg">{stats.total}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 bg-green-100 dark:bg-green-900/20 rounded">
                <div className="font-medium text-lg text-green-700 dark:text-green-400">{stats.successful}</div>
                <div className="text-green-600 dark:text-green-500">Successful</div>
              </div>
              <div className="text-center p-3 bg-red-100 dark:bg-red-900/20 rounded">
                <div className="font-medium text-lg text-red-700 dark:text-red-400">{stats.errors}</div>
                <div className="text-red-600 dark:text-red-500">Errors</div>
              </div>
            </div>

            <Button onClick={resetImport} className="w-full">
              Import Another File
            </Button>
          </div>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Import Errors:</p>
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