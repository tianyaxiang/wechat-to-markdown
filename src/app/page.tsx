'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ConverterForm from '@/components/converter-form';
import MarkdownPreview from '@/components/markdown-preview';
import FileDownload from '@/components/file-download';
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const [markdown, setMarkdown] = useState('');
  const [articleData, setArticleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-green-600">WeChat Article to Markdown Converter</CardTitle>
          <CardDescription className="text-center">
            Convert WeChat public account articles to Markdown format with local image storage
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="convert" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="convert">Convert</TabsTrigger>
          <TabsTrigger value="preview" disabled={!markdown}>Preview</TabsTrigger>
          <TabsTrigger value="download" disabled={!articleData}>Download</TabsTrigger>
        </TabsList>
        
        <TabsContent value="convert">
          <Card>
            <CardHeader>
              <CardTitle>Convert WeChat Article</CardTitle>
              <CardDescription>
                Enter the URL of a WeChat article to convert it to Markdown format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConverterForm 
                onConversionComplete={(data) => {
                  setMarkdown(data.markdown);
                  setArticleData(data);
                }}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Markdown Preview</CardTitle>
              <CardDescription>
                Preview the converted Markdown content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarkdownPreview markdown={markdown} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="download">
          <Card>
            <CardHeader>
              <CardTitle>Download Files</CardTitle>
              <CardDescription>
                Download the Markdown file and images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileDownload articleData={articleData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Toaster />
    </main>
  );
}