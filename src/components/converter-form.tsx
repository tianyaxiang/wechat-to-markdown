'use client';

import { useState, useRef, useEffect } from 'react';
import { Input, Button, Label, Progress, Alert, AlertDescription, useToast } from '@/components/ui';
import { Loader2, Link as LinkIcon, AlertCircle, Globe, X, Plus, Trash2 } from 'lucide-react';
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
  const [urls, setUrls] = useState<string[]>(['']);
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

  const addUrlInput = () => {
    setUrls([...urls, '']);
  };

  const removeUrlInput = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls.length ? newUrls : ['']);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Filter out empty URLs
    const validUrls = urls.filter(url => url.trim());
    
    if (validUrls.length === 0) {
      setError('请输入至少一个微信文章URL');
      toast({
        title: "错误",
        description: "请输入至少一个有效的微信文章URL",
        variant: "destructive",
      });
      return;
    }
    
    // Validate all URLs
    const invalidUrls = validUrls.filter(url => !isValidUrl(url));
    if (invalidUrls.length > 0) {
      setError('存在无效的微信文章URL (必须来自mp.weixin.qq.com)');
      toast({
        title: "错误",
        description: "请确保所有URL都来自微信公众号",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);

    // Start progress simulation
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      // Process each URL sequentially
      for (let i = 0; i < validUrls.length; i++) {
        const url = validUrls[i];
        const response = await fetch('/api/convert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error(`转换失败: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Call onConversionComplete for each successful conversion
        onConversionComplete(data);
        
        // Update progress
        setProgress(((i + 1) / validUrls.length) * 100);
        
        // Show success toast for each article
        toast({
          title: "转换成功",
          description: `文章 ${i + 1}/${validUrls.length} 已转换`,
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '转换过程中发生错误');
      toast({
        title: "转换失败",
        description: error instanceof Error ? error.message : '转换过程中发生错误',
        variant: "destructive",
      });
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setIsLoading(false);
      setProgress(100);
    }
  };

  const handleClearUrl = () => {
    setUrls(['']);
    setError('');
  };

  const handleClearAll = () => {
    setUrls(['']);
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
        {urls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id={`article-url-${index}`}
                placeholder="https://mp.weixin.qq.com/s/..."
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
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
                  onClick={() => handleUrlChange(index, '')}
                  disabled={isLoading}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">清除URL</span>
                </Button>
              )}
            </div>
            {urls.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeUrlInput(index)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addUrlInput}
          disabled={isLoading}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加更多文章
        </Button>
        
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
          <li>输入一个或多个微信公众号文章链接</li>
          <li>点击"转换"按钮，工具将依次处理所有文章</li>
          <li>图片将会自动下载到本地，并在Markdown中使用相对路径引用</li>
          <li>完成后可以复制Markdown内容或下载为.md文件</li>
        </ol>
      </div>
    </form>
  );
} 