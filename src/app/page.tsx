'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Toaster, Button } from "@/components/ui";
import ConverterForm from '@/components/converter-form';
import MarkdownPreview from '@/components/markdown-preview';
import FileDownload from '@/components/file-download';
import { Github, Settings } from 'lucide-react';
import ConfigModal from '@/components/config-modal';
import Link from 'next/link';

// Define the article data type
interface ArticleData {
  markdown: string;
  title: string;
  images: Array<{ url: string; filename: string }>;
  originalUrl: string;
  id: string;
}

// Define the config data type
interface ConfigData {
  githubRepo: string;
  githubToken: string;
  githubBranch: string;
  markdownDir: string;
  imagesDir: string;
  markdownTemplate: string;
}

// Default configuration
const DEFAULT_CONFIG: ConfigData = {
  githubRepo: '',
  githubToken: '',
  githubBranch: '',
  markdownDir: 'articles',
  imagesDir: 'images',
  markdownTemplate: '---\ntitle: {{title}}\ndate: {{date}}\nsource: {{source}}\n---\n\n'
};

export default function Home() {
  const [markdowns, setMarkdowns] = useState<ArticleData[]>([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [configData, setConfigData] = useState<ConfigData>(DEFAULT_CONFIG);
  
  // 使用useEffect来处理localStorage，避免hydration错误
  useEffect(() => {
    // 在客户端加载时从localStorage初始化
    const savedConfig = localStorage.getItem('wechat-to-markdown-config');
    if (savedConfig) {
      try {
        // 合并默认配置以确保所有字段存在
        setConfigData({ ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) });
      } catch (e) {
        console.error('解析保存的配置失败:', e);
      }
    }
  }, []);
  
  const saveConfig = (newConfig: ConfigData) => {
    // Ensure all fields have values (not undefined)
    const configToSave = {
      githubRepo: newConfig.githubRepo || '',
      githubToken: newConfig.githubToken || '',
      githubBranch: newConfig.githubBranch || '',
      markdownDir: newConfig.markdownDir || 'articles',
      imagesDir: newConfig.imagesDir || 'images',
      markdownTemplate: newConfig.markdownTemplate || DEFAULT_CONFIG.markdownTemplate
    };
    
    setConfigData(configToSave);
    localStorage.setItem('wechat-to-markdown-config', JSON.stringify(configToSave));
    setIsConfigOpen(false);
  };
  
  const onConversionComplete = (data: ArticleData) => {
    setMarkdowns(prev => [...prev, data]);
    setCurrentArticleIndex(prev => Math.min(prev + 1, markdowns.length));
  };
  
  const handleArticleSelect = (index: number) => {
    setCurrentArticleIndex(index);
  };

  const clearAllArticles = () => {
    setMarkdowns([]);
    setCurrentArticleIndex(0);
  };

  const currentArticle = markdowns[currentArticleIndex];
  
  // 确保currentArticleIndex不会超出数组范围
  useEffect(() => {
    if (markdowns.length === 0) {
      setCurrentArticleIndex(0);
    } else if (currentArticleIndex >= markdowns.length) {
      setCurrentArticleIndex(markdowns.length - 1);
    }
  }, [markdowns.length, currentArticleIndex]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Navbar */}
      <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-50">
        <div className="container flex h-14 items-center">
          <div className="flex items-center mr-4 space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <path d="M9 10c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"></path>
              <path d="M6.13 4.92C6.7 3.8 8.28 3 10 3c2.8 0 5 1.34 5 3 0 .66-.36 1.25-.95 1.7"></path>
              <path d="M6.13 4.92C3.8 5.85 3 7.27 3 8.5c0 2.7 4.4 3.5 7 3.5 1.03 0 2.04-.1 2.97-.26"></path>
              <path d="M20.5 14.5c0-2.76-4.48-5-10-5"></path>
              <path d="M5.51 18.5a4 4 0 0 0 3.47-6"></path>
              <path d="M20.5 18.5a4 4 0 0 0-7.5-2"></path>
            </svg>
            <span className="font-bold">WeChat to Markdown</span>
          </div>
          
          <nav className="flex items-center space-x-6 text-sm font-medium mx-6">
            <a href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">文档</a>
            <a href="#" className="transition-colors hover:text-foreground/80 text-foreground">转换</a>
            <a href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">关于</a>
          </nav>
          
          <div className="flex flex-1 items-center justify-end space-x-4">
            <button 
              onClick={() => setIsConfigOpen(true)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 py-2 px-3"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">设置</span>
            </button>
            <a href="https://github.com/tianyaxiang/wechat-to-markdown" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 py-2 px-3">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <Tabs defaultValue="convert" className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-200">
          <TabsList className="grid w-full grid-cols-3 mb-10">
            <TabsTrigger value="convert">
              转换
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!markdowns.length}>
              预览
            </TabsTrigger>
            <TabsTrigger value="download" disabled={!markdowns.length}>
              下载
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="convert" className="mt-0">
            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 overflow-hidden">
              <div className="absolute h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 top-0 left-0 right-0"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-slate-800 dark:text-slate-200">转换微信公众号文章</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  输入一个或多个微信公众号文章的URL，将其转换为Markdown格式
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ConverterForm 
                  onConversionComplete={onConversionComplete}
                  setIsLoading={setIsLoading}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0">
            {markdowns.length > 0 && currentArticle && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 flex-wrap flex-1">
                    {markdowns.map((article, index) => (
                      <Button
                        key={index}
                        variant={currentArticleIndex === index ? "default" : "outline"}
                        onClick={() => handleArticleSelect(index)}
                        className="text-sm"
                      >
                        {article.title || `文章 ${index + 1}`}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllArticles}
                    className="ml-4"
                  >
                    清除全部
                  </Button>
                </div>
                <MarkdownPreview markdown={currentArticle.markdown} />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="download" className="mt-0">
            {markdowns.length > 0 && currentArticle && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 flex-wrap flex-1">
                    {markdowns.map((article, index) => (
                      <Button
                        key={index}
                        variant={currentArticleIndex === index ? "default" : "outline"}
                        onClick={() => handleArticleSelect(index)}
                        className="text-sm"
                      >
                        {article.title || `文章 ${index + 1}`}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllArticles}
                    className="ml-4"
                  >
                    清除全部
                  </Button>
                </div>
                <FileDownload 
                  articleData={currentArticle}
                  allArticles={markdowns}
                  githubConfig={configData.githubRepo && configData.githubToken ? {
                    repo: configData.githubRepo,
                    token: configData.githubToken,
                    branch: configData.githubBranch,
                    markdownDir: configData.markdownDir,
                    imagesDir: configData.imagesDir
                  } : undefined}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <footer className="mt-20 text-center text-base text-slate-500 dark:text-slate-400 animate-in fade-in-50 duration-700 delay-500">
          <p>© {new Date().getFullYear()} 微信转Markdown转换器。保留所有权利。</p>
        </footer>
        
        <Toaster />
      </div>
      
      {/* Configuration Modal */}
      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)}
        config={configData}
        onSave={saveConfig}
      />
    </main>
  );
}