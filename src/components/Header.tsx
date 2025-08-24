import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Truck, Zap } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-gradient-hero text-primary-foreground">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                <Truck className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Toolsy HS Code Predictor</h1>
                <p className="text-primary-foreground/80 text-lg">AI-Powered Customs Classification</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-white/30">
                    <Zap className="h-3 w-3 mr-1" />
                    De Minimis Ready
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Ready for the US De Minimis regulation change. The exemption ended August 29th - all sellers must now correctly classify products with HS codes for customs duties, regardless of shipment value.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-white/30">
              16K+ Users
            </Badge>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <p className="text-sm text-primary-foreground/90 leading-relaxed">
            <strong>Important Update:</strong> US De Minimis exemption ends August 29th. 
            All sellers must now correctly classify products with HS codes for customs duties. 
            Our AI analyzes your product data to predict the most accurate classification.
          </p>
        </div>
      </div>
    </header>
  );
};