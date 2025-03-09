'use client';

import { useState } from 'react';
import { Input, Button, Label, Progress, Alert, AlertDescription, useToast } from '@/components/ui';
import { Loader2, Link, AlertCircle, Globe } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-3">
        <Label htmlFor="article-url" className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          WeChat Article URL
        </Label>
        <div className="relative">
          <Input
            id="article-url"
            placeholder="https://mp.weixin.qq.com/s/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className={`pl-12 ${isLoading ? 'bg-opacity-50' : ''}`}
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary">
            <Link className="h-5 w-5" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 pl-1">
          Enter the URL of a WeChat article (e.g., https://mp.weixin.qq.com/s/...)
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 mr-2" />
          <AlertDescription className="text-base">{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-3 animate-in fade-in-0">
          <div className="flex justify-between text-base text-muted-foreground">
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting article...
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full transition-all duration-200 font-medium text-base" 
        disabled={isLoading}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Converting...
          </>
        ) : (
          'Convert to Markdown'
        )}
      </Button>
    </form>
  );
} 