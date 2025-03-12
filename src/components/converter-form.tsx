'use client';

import { useState, useRef, useEffect } from 'react';
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
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      setError('请输入微信文章URL');
      toast({
        title: "错误",
        description: "请输入有效的微信文章URL",
        variant: "destructive",
      });
      return;
    }
    
    if (!isValidUrl(url)) {
      setError('请输入有效的微信文章URL (mp.weixin.qq.com)');
      toast({
        title: "错误",
        description: "URL必须来自微信 (mp.weixin.qq.com)",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      setProgress(10);
      
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const increment = 2 + (Date.now() % 2);
          const newProgress = prev + increment;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '文章转换失败');
      }
      
      const data = await response.json();
      onConversionComplete(data);
      
      toast({
        title: "成功",
        description: "文章转换成功！",
      });
    } catch (error) {
      console.error('Conversion error:', error);
      setError(error instanceof Error ? error.message : "发生未知错误");
      toast({
        title: "转换失败",
        description: error instanceof Error ? error.message : "发生未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      title: "已清除",
      description: "所有内容已被清除。",
    });
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-3">
        
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
              <span className="sr-only">清除URL</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 pl-1">
          输入微信文章的URL（例如：https://mp.weixin.qq.com/s/...）
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
              正在转换文章...
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
              正在转换...
            </>
          ) : (
            '转换为Markdown'
          )}
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