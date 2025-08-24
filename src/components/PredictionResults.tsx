import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HSCodePrediction {
  code: string;
  description: string;
  confidence: number;
  category: string;
  tariffRate?: string;
}

interface PredictionResultsProps {
  predictions: HSCodePrediction[];
  analysisDetails?: {
    processingTime: number;
    factors: string[];
  };
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-success';
  if (confidence >= 60) return 'text-warning';
  return 'text-destructive';
};

const getConfidenceIcon = (confidence: number) => {
  if (confidence >= 80) return <CheckCircle className="h-4 w-4 text-success" />;
  if (confidence >= 60) return <AlertCircle className="h-4 w-4 text-warning" />;
  return <AlertCircle className="h-4 w-4 text-destructive" />;
};

const getConfidenceBadge = (confidence: number) => {
  if (confidence >= 80) return 'High Confidence';
  if (confidence >= 60) return 'Medium Confidence';
  return 'Low Confidence';
};

export const PredictionResults = ({ predictions, analysisDetails }: PredictionResultsProps) => {
  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      {analysisDetails && (
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing Time:</span>
              <span className="font-medium text-foreground">{analysisDetails.processingTime}ms</span>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Analysis Factors:</span>
              <div className="flex flex-wrap gap-2">
                {analysisDetails.factors.map((factor, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predictions */}
      <Card className="shadow-card border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">
            HS Code Predictions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Results ranked by confidence level. Higher confidence indicates more reliable predictions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {predictions.map((prediction, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                index === 0 ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-foreground">
                      {prediction.code}
                    </span>
                    {index === 0 && (
                      <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
                        Best Match
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {prediction.category}
                  </p>
                </div>
                
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2">
                    {getConfidenceIcon(prediction.confidence)}
                    <span className={`font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                      {prediction.confidence}%
                    </span>
                  </div>
                  <Badge 
                    variant={prediction.confidence >= 80 ? "default" : prediction.confidence >= 60 ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {getConfidenceBadge(prediction.confidence)}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-foreground mb-3 leading-relaxed">
                {prediction.description}
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Confidence Level</span>
                    <span>{prediction.confidence}%</span>
                  </div>
                  <Progress 
                    value={prediction.confidence} 
                    className="h-2"
                  />
                </div>

                {prediction.tariffRate && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Estimated Tariff Rate:</span>
                    <span className="font-semibold text-foreground">{prediction.tariffRate}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open(`https://hts.usitc.gov/search?query=${prediction.code}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Verify HTS Database
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Confidence Guidelines */}
      <Card className="shadow-card border-border/50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground mb-3">Confidence Level Guidelines</h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-success">High Confidence (80%+):</span>
                  <span className="text-muted-foreground ml-1">Reliable prediction, recommended for use</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-warning">Medium Confidence (60-79%):</span>
                  <span className="text-muted-foreground ml-1">May require verification</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-destructive">Low Confidence (Below 60%):</span>
                  <span className="text-muted-foreground ml-1">Manual review strongly recommended</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};