'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Toaster } from "@/components/ui";
import ConverterForm from '@/components/converter-form';
import MarkdownPreview from '@/components/markdown-preview';
import FileDownload from '@/components/file-download';
import { Github } from 'lucide-react';

// Define the article data type
interface ArticleData {
  markdown: string;
  title: string;
  images: Array<{ url: string; filename: string }>;
  originalUrl: string;
  id: string;
}

export default function Home() {
  const [markdown, setMarkdown] = useState<string>('');
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
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
            <a href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">Docs</a>
            <a href="#" className="transition-colors hover:text-foreground/80 text-foreground">Convert</a>
            <a href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">About</a>
          </nav>
          
          <div className="flex flex-1 items-center justify-end space-x-4">
            <a href="https://github.com/yourusername/wechat-to-markdown" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-9 py-2 px-3">
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
              Convert
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!markdown}>
              Preview
            </TabsTrigger>
            <TabsTrigger value="download" disabled={!articleData}>
              Download
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="convert" className="mt-0">
            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 overflow-hidden">
              <div className="absolute h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 top-0 left-0 right-0"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-slate-800 dark:text-slate-200">Convert WeChat Article</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Enter the URL of a WeChat article to convert it to Markdown format
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ConverterForm 
                  onConversionComplete={(data: ArticleData) => {
                    setMarkdown(data.markdown);
                    setArticleData(data);
                  }}
                  setIsLoading={setIsLoading}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0">
            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 overflow-hidden">
              <div className="absolute h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 top-0 left-0 right-0"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-slate-800 dark:text-slate-200">Markdown Preview</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Preview the converted Markdown content
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <MarkdownPreview markdown={markdown} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="download" className="mt-0">
            <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 overflow-hidden">
              <div className="absolute h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 top-0 left-0 right-0"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-slate-800 dark:text-slate-200">Download Files</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Download the Markdown file and images
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <FileDownload articleData={articleData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <footer className="mt-20 text-center text-base text-slate-500 dark:text-slate-400 animate-in fade-in-50 duration-700 delay-500">
          <p>© {new Date().getFullYear()} WeChat to Markdown Converter. All rights reserved.</p>
        </footer>
        
        <Toaster />
      </div>
    </main>
  );
}