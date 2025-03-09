'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

interface ArticleData {
  markdown: string;
  title: string;
  images: Array<{ url: string; filename: string }>;
  originalUrl: string;
  id: string;
}

interface ConverterFormProps {
  onConversionComplete: (data: ArticleData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ConverterForm({ onConversionComplete, isLoading, setIsLoading }: ConverterFormProps) {
  const [url, setUrl] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string);
      return url.hostname.includes('weixin.qq.com') || url.hostname.includes('mp.weixin.qq.com');
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid WeChat article URL');
      return;
    }

    setError('');
    setIsLoading(true);
    setProgress(10);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);

      const response = await axios.post('/api/convert', { url });
      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: "Conversion completed!",
        description: "Article successfully converted to Markdown.",
      });

      onConversionComplete({
        markdown: response.data.markdown,
        title: response.data.title,
        images: response.data.images,
        originalUrl: url,
        id: response.data.id
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to convert article. Please try again.');
      toast({
        variant: "destructive",
        title: "Conversion failed",
        description: "There was a problem converting your article.",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="article-url">WeChat Article URL</Label>
        <Input
          id="article-url"
          placeholder="https://mp.weixin.qq.com/s/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Converting article...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Converting...
          </>
        ) : (
          'Convert to Markdown'
        )}
      </Button>
    </form>
  );
} 