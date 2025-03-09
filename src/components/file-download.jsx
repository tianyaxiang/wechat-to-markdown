'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileDown, ImageIcon, FileZip, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import JSZip from 'jszip';

export default function FileDownload({ articleData }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  if (!articleData) {
    return <div>No article data available. Please convert an article first.</div>;
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

          imgFolder.file(image.filename, response.data);
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 flex flex-col items-center justify-between space-y-4">
          <div className="text-center">
            <FileDown className="h-12 w-12 mx-auto text-gray-500 mb-2" />
            <h3 className="font-medium text-lg">Markdown File</h3>
            <p className="text-sm text-gray-500">{sanitizedTitle}.md</p>
          </div>
          <Button onClick={downloadMarkdownFile} className="w-full">
            Download Markdown
          </Button>
        </Card>

        <Card className="p-4 flex flex-col items-center justify-between space-y-4">
          <div className="text-center">
            <FileZip className="h-12 w-12 mx-auto text-gray-500 mb-2" />
            <h3 className="font-medium text-lg">Complete Package</h3>
            <p className="text-sm text-gray-500">Markdown + {images.length} images</p>
          </div>
          <Button
            onClick={downloadAllAsZip}
            className="w-full"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating ZIP...
              </>
            ) : (
              'Download ZIP'
            )}
          </Button>
        </Card>
      </div>

      {images.length > 0 && (
        <div className="mt-8">
          <h3 className="font-medium text-lg mb-4">Images ({images.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="border rounded-md p-2 flex flex-col items-center">
                <div className="bg-gray-100 w-full h-24 flex items-center justify-center rounded-md mb-2">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 truncate w-full text-center" title={image.filename}>
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