import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image as ImageIcon, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductData } from '@/types/product';
import { ImageAnalysis } from './ImageAnalysis';

interface ProductFormProps {
  onAnalyze: (data: ProductData & { imageUrl?: string }) => void;
  isAnalyzing: boolean;
}

const categories = [
  'Electronics',
  'Clothing & Textiles',
  'Home & Garden',
  'Sports & Outdoor',
  'Automotive',
  'Health & Beauty',
  'Toys & Games',
  'Books & Media',
  'Food & Beverage',
  'Jewelry & Accessories',
  'Industrial Equipment',
  'Other'
];

export const ProductForm = ({ onAnalyze, isAnalyzing }: ProductFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProductData>({
    title: '',
    description: '',
    category: '',
    materials: '',
    image: null
  });
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleImageAnalyzed = (url: string, analysis?: any) => {
    setImageUrl(url);
    toast({
      title: "Image Ready",
      description: "Image will be included in the analysis",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only require an image to be uploaded
    if (!formData.image && !imageUrl) {
      toast({
        title: "Image required",
        description: "Please upload an image to run the analysis",
        variant: "destructive"
      });
      return;
    }

    onAnalyze({ ...formData, imageUrl });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Enhanced Product Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Product Image</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer hover:border-primary/50 ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-24 h-24 object-cover rounded-lg mx-auto shadow-md"
                  />
                  <p className="text-sm text-muted-foreground">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-foreground font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Product Title <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter product title..."
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Product Description <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed product description..."
              className="min-h-[120px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-foreground">
              Category <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Select product category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Materials */}
          <div className="space-y-2">
            <Label htmlFor="materials" className="text-sm font-medium text-foreground">
              Materials <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="materials"
              value={formData.materials}
              onChange={(e) => setFormData(prev => ({ ...prev, materials: e.target.value }))}
              placeholder="e.g., Cotton, Plastic, Metal, etc."
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enhanced Analysis in Progress...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Enhanced HTS Prediction
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <ImageAnalysis 
        onImageAnalyzed={handleImageAnalyzed}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
};