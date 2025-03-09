'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Toaster } from "@/components/ui";
import ConverterForm from '@/components/converter-form';
import MarkdownPreview from '@/components/markdown-preview';
import FileDownload from '@/components/file-download';

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
      <div className="container mx-auto px-6 py-20 max-w-6xl">
        <Card className="mb-16 border-none shadow-2xl bg-white/95 backdrop-blur-sm dark:bg-slate-900/95 animate-in fade-in-50 duration-700">
          <CardHeader className="pb-6">
            <CardTitle className="text-5xl font-bold text-center bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-transparent bg-clip-text">
              WeChat Article to Markdown Converter
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400 text-xl mt-4 max-w-3xl mx-auto">
              Convert WeChat public account articles to Markdown format with local image storage
            </CardDescription>
          </CardHeader>
        </Card>
        
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