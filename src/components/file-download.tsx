'use client';

import { useState } from 'react';
import { Button, Card, useToast } from '@/components/ui';
import { Download, FileDown, Image as ImageIcon, FileArchive, Loader2, FileText, Download as DownloadIcon } from 'lucide-react';
import axios from 'axios';
import JSZip from 'jszip';

interface ArticleImage {
  url: string;
  filename: string;
}

interface ArticleData {
  markdown: string;
  title: string;
  images: ArticleImage[];
  originalUrl: string;
  id: string;
}

interface FileDownloadProps {
  articleData: ArticleData | null;
}

export default function FileDownload({ articleData }: FileDownloadProps) {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const { toast } = useToast();

  if (!articleData) {
    return <div className="text-center py-12 text-muted-foreground text-lg">No article data available. Please convert an article first.</div>;
  }

  const { title, images = [] } = articleData;
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const downloadMarkdownFile = () => {
    const blob = new Blob([articleData.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Markdown downloaded",
      description: "The Markdown file has been downloaded.",
    });
  };

  const downloadAllAsZip = async () => {
    setIsDownloading(true);

    try {
      const zip = new JSZip();

      // Add markdown file
      zip.file(`${sanitizedTitle}.md`, articleData.markdown);

      // Create images folder
      const imgFolder = zip.folder('images');

      // Add images
      const imagePromises = images.map(async (image) => {
        try {
          const response = await axios.get(`/api/download?url=${encodeURIComponent(image.url)}`, {
            responseType: 'arraybuffer'
          });

          imgFolder?.file(image.filename, response.data);
          return true;
        } catch (error) {
          console.error(`Failed to download image: ${image.url}`, error);
          return false;
        }
      });

      await Promise.all(imagePromises);

      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' });

      // Trigger download
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizedTitle}_with_images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download complete",
        description: "The ZIP file with Markdown and images has been downloaded.",
      });
    } catch (error) {
      console.error('Failed to create ZIP file', error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was a problem creating the ZIP file. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8 flex flex-col items-center justify-between space-y-6 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full inline-flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-bold text-xl mb-2">Markdown File</h3>
            <p className="text-base text-muted-foreground">{sanitizedTitle}.md</p>
          </div>
          <Button onClick={downloadMarkdownFile} className="w-full text-base" size="lg">
            <DownloadIcon className="mr-2 h-5 w-5" />
            Download Markdown
          </Button>
        </Card>

        <Card className="p-8 flex flex-col items-center justify-between space-y-6 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full inline-flex items-center justify-center mb-4">
              <FileArchive className="h-10 w-10 text-primary" />
            </div>
            <h3 className="font-bold text-xl mb-2">Complete Package</h3>
            <p className="text-base text-muted-foreground">Markdown + {images.length} images</p>
          </div>
          <Button
            onClick={downloadAllAsZip}
            className="w-full text-base"
            disabled={isDownloading}
            size="lg"
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating ZIP...
              </>
            ) : (
              <>
                <DownloadIcon className="mr-2 h-5 w-5" />
                Download ZIP
              </>
            )}
          </Button>
        </Card>
      </div>

      {images.length > 0 && (
        <div className="mt-12">
          <h3 className="font-bold text-xl mb-6 pb-2 border-b">Images ({images.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {images.map((image, index) => (
              <div key={index} className="border rounded-md p-4 flex flex-col items-center shadow-md hover:shadow-lg transition-all duration-200">
                <div className="bg-gray-100 dark:bg-gray-800 w-full h-32 flex items-center justify-center rounded-md mb-3">
                  <ImageIcon className="h-10 w-10 text-primary/60" />
                </div>
                <p className="text-sm text-muted-foreground truncate w-full text-center" title={image.filename}>
                  {image.filename}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 