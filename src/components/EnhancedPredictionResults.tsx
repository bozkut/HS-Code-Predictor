import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Clock, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PredictionCandidate {
  code: string;
  description: string;
  confidence: number;
  reasoning: string;
  category?: string;
  tariffInfo?: {
    generalRate: string;
    specialRate: string;
    column2Rate: string;
  };
  isOfficialMatch?: boolean;
  officialSource?: string;
}

interface EnhancedPredictionResultsProps {
  candidates: PredictionCandidate[];
  confidence_score: number;
  needs_human_review: boolean;
  review_reason?: string;
  processing_time: number;
  prediction_id: string;
  isAnalyzing?: boolean;
}

export const EnhancedPredictionResults: React.FC<EnhancedPredictionResultsProps> = ({
  candidates,
  confidence_score,
  needs_human_review,
  review_reason,
  processing_time,
  prediction_id,
  isAnalyzing = false
}) => {
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const { toast } = useToast();

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 60) return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  const submitFeedback = async (feedback: 'correct' | 'incorrect' | 'needs_review') => {
    if (!prediction_id) {
      toast({
        title: "Error",
        description: "No prediction ID available for feedback",
        variant: "destructive"
      });
      return;
    }

    setSubmittingFeedback(true);
    
    try {
      const { error } = await supabase.functions.invoke('feedback', {
        body: {
          prediction_id,
          user_feedback: feedback,
          selected_code: selectedCode || candidates[0]?.code,
          user_comments: feedbackText
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping improve our predictions!",
      });

      setFeedbackText('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            Analyzing Product...
          </CardTitle>
          <CardDescription>
            Using AI and official databases to predict the best HTS codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Processing steps:</div>
              <ul className="text-sm space-y-1">
                <li>🔍 Searching official HTS database</li>
                <li>🧠 AI semantic analysis</li>
                <li>📊 Confidence scoring</li>
                <li>⚖️ Human review assessment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No HTS code predictions could be generated for this product. Please try with more detailed product information or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Confidence and Status */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>HTS Code Predictions</span>
            <div className="flex items-center gap-2">
              {getConfidenceIcon(confidence_score)}
              <Badge className={getConfidenceColor(confidence_score)}>
                {confidence_score}% Confidence
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Analysis completed in {processing_time}ms • {candidates.length} candidates found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Confidence</span>
                <span>{confidence_score}%</span>
              </div>
              <Progress value={confidence_score} className="h-2" />
            </div>

            {needs_human_review && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Human Review Required:</strong> {review_reason}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Candidates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Top HTS Code Candidates</h3>
        {candidates.slice(0, 5).map((candidate, index) => (
          <Card 
            key={candidate.code} 
            className={`cursor-pointer transition-all ${
              selectedCode === candidate.code ? 'ring-2 ring-primary' : ''
            } ${index === 0 ? 'border-primary bg-primary/5' : ''}`}
            onClick={() => setSelectedCode(candidate.code)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono">{candidate.code}</span>
                  {index === 0 && <Badge variant="default">Top Match</Badge>}
                  {candidate.isOfficialMatch && (
                    <Badge variant="secondary">Official USITC</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getConfidenceIcon(candidate.confidence)}
                  <Badge className={getConfidenceColor(candidate.confidence)}>
                    {candidate.confidence}%
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>{candidate.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Reasoning</div>
                  <div className="text-sm">{candidate.reasoning}</div>
                </div>

                {candidate.category && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Category</div>
                    <div className="text-sm">{candidate.category}</div>
                  </div>
                )}

                {candidate.tariffInfo && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-muted-foreground">General Rate</div>
                      <div>{candidate.tariffInfo.generalRate}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Special Rate</div>
                      <div>{candidate.tariffInfo.specialRate}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Column 2</div>
                      <div>{candidate.tariffInfo.column2Rate}</div>
                    </div>
                  </div>
                )}

                {candidate.officialSource && (
                  <div className="text-xs text-muted-foreground">
                    Source: {candidate.officialSource}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Improve Our Predictions
          </CardTitle>
          <CardDescription>
            Your feedback helps us improve accuracy for all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Selected HTS Code</label>
              <div className="text-sm text-muted-foreground mb-2">
                Currently selected: {selectedCode || candidates[0]?.code || 'None'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Comments (Optional)</label>
              <Textarea
                placeholder="Any additional information about this classification..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => submitFeedback('correct')}
                disabled={submittingFeedback}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Correct
              </Button>
              <Button
                variant="secondary"
                onClick={() => submitFeedback('incorrect')}
                disabled={submittingFeedback}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                Incorrect
              </Button>
              <Button
                variant="outline"
                onClick={() => submitFeedback('needs_review')}
                disabled={submittingFeedback}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Needs Review
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};