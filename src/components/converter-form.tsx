'use client';

import { useState, useEffect } from 'react';
import { Input, Button, Label, Progress, Alert, AlertDescription, useToast } from '@/components/ui';
import { Loader2, Link as LinkIcon, AlertCircle, Globe, X } from 'lucide-react';
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
  
  // Check for pre-filled URL from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('wechat-article-url');
      if (savedUrl) {
        setUrl(savedUrl);
        // Clear the saved URL so it doesn't persist across page refreshes
        localStorage.removeItem('wechat-article-url');
        
        // Show a toast to inform the user
        toast({
          title: "URL Loaded",
          description: "The article URL has been loaded from Direct Sync page.",
        });
      }
    }
  }, [toast]);

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
    setError('');
    
    if (!url.trim()) {
      setError('Please enter a WeChat article URL');
      toast({
        title: "Error",
        description: "Please enter a valid WeChat article URL",
        variant: "destructive",
      });
      return;
    }
    
    if (!isValidUrl(url)) {
      setError('Please enter a valid WeChat article URL (mp.weixin.qq.com)');
      toast({
        title: "Error",
        description: "The URL must be from WeChat (mp.weixin.qq.com)",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.floor(Math.random() * 10);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      // Call the API to convert the WeChat article
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert article');
      }
      
      const data = await response.json();
      onConversionComplete(data);
      
      toast({
        title: "Success",
        description: "Article converted successfully!",
      });
    } catch (error) {
      console.error('Conversion error:', error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleClearUrl = () => {
    setUrl('');
    setError('');
  };

  const handleClearAll = () => {
    setUrl('');
    setError('');
    onConversionComplete({
      markdown: '',
      title: '',
      images: [],
      originalUrl: '',
      id: ''
    });
    toast({
      title: "Cleared",
      description: "All content has been cleared.",
    });
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
            className={`pl-12 ${url ? 'pr-12' : ''} ${isLoading ? 'bg-opacity-50' : ''}`}
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary">
            <LinkIcon className="h-5 w-5" />
          </div>
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleClearUrl}
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Clear URL</span>
            </Button>
          )}
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

      <div className="flex justify-between gap-4">
        <Button 
          type="submit" 
          className="flex-1 transition-all duration-200 font-medium text-base" 
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

        <Button 
          type="button" 
          variant="outline" 
          onClick={handleClearAll}
          disabled={isLoading}
          size="lg"
        >
          <X className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>

      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-amber-900 dark:text-amber-100">
        <h3 className="font-medium mb-2">使用说明:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>输入微信公众号文章链接，例如 https://mp.weixin.qq.com/s/AopraZiWHH3Zs7aqlyXDvg</li>
          <li>点击"转换"按钮，工具将解析文章内容并转换为Markdown格式</li>
          <li>图片将会自动下载到本地，并在Markdown中使用相对路径引用</li>
          <li>完成后可以复制Markdown内容或下载为.md文件</li>
        </ol>
      </div>
    </form>
  );
} 