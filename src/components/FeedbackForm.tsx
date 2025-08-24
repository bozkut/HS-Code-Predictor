import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackFormProps {
  predictionCode: string;
  predictionDescription: string;
}

export const FeedbackForm = ({ predictionCode, predictionDescription }: FeedbackFormProps) => {
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!feedbackType) return;

    // Here you would typically send feedback to your backend
    const feedback = {
      predictionCode,
      predictionDescription,
      type: feedbackType,
      comment: comment.trim(),
      timestamp: new Date().toISOString()
    };

    console.log('Feedback submitted:', feedback);
    
    // Show success toast
    toast({
      title: "Feedback submitted",
      description: "Thank you for your feedback!",
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-2">
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-green-800">
              Feedback submitted!
            </p>
            <p className="text-xs text-green-600">
              Your feedback helps us improve our system.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Was this prediction helpful?
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="font-mono text-xs">
            {predictionCode}
          </Badge>
          <span className="truncate">{predictionDescription}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feedback Buttons */}
        <div className="flex gap-3">
          <Button
            variant={feedbackType === 'positive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedbackType('positive')}
            className="flex-1"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Yes, accurate
          </Button>
          <Button
            variant={feedbackType === 'negative' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setFeedbackType('negative')}
            className="flex-1"
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            No, incorrect
          </Button>
        </div>

        {/* Optional Comment */}
        {feedbackType && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Additional comments (optional)
            </label>
            <Textarea
              placeholder="Share your thoughts about this prediction..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>
        )}

        {/* Submit Button */}
        {feedbackType && (
          <Button 
            onClick={handleSubmit}
            size="sm"
            className="w-full"
          >
            <Send className="h-3 w-3 mr-2" />
            Submit Feedback
          </Button>
        )}
      </CardContent>
    </Card>
  );
};