'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ConverterForm from '@/components/converter-form';
import MarkdownPreview from '@/components/markdown-preview';
import FileDownload from '@/components/file-download';
import { Toaster } from "@/components/ui/toaster";

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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Card className="mb-10 border-none shadow-lg bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-500 text-transparent bg-clip-text">
              WeChat Article to Markdown Converter
            </CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400 text-lg mt-2">
              Convert WeChat public account articles to Markdown format with local image storage
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Tabs defaultValue="convert" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
            <TabsTrigger 
              value="convert" 
              className="rounded-md data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
            >
              Convert
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              disabled={!markdown}
              className="rounded-md data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
            >
              Preview
            </TabsTrigger>
            <TabsTrigger 
              value="download" 
              disabled={!articleData}
              className="rounded-md data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
            >
              Download
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="convert" className="mt-0">
            <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm dark:bg-slate-950/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-slate-800 dark:text-slate-200">Convert WeChat Article</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
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
            <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm dark:bg-slate-950/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-slate-800 dark:text-slate-200">Markdown Preview</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Preview the converted Markdown content
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <MarkdownPreview markdown={markdown} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="download" className="mt-0">
            <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm dark:bg-slate-950/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-slate-800 dark:text-slate-200">Download Files</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Download the Markdown file and images
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <FileDownload articleData={articleData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Toaster />
      </div>
    </main>
  );
}