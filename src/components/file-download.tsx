'use client';

import { useState } from 'react';
import { Button, Card, CardContent } from '@/components/ui';
import { Download, Github, Check, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ArticleData {
  markdown: string;
  title: string;
  images: Array<{ url: string; filename: string }>;
  originalUrl: string;
  id: string;
}

interface GithubConfig {
  repo: string;
  token: string;
}

interface FileDownloadProps {
  articleData: ArticleData | null;
  githubConfig?: GithubConfig;
}

export default function FileDownload({ articleData, githubConfig }: FileDownloadProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  if (!articleData) {
    return <div>No article data available</div>;
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      const zip = new JSZip();
      
      // Add markdown file
      const sanitizedTitle = articleData.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      const markdownFilename = `${sanitizedTitle}.md`;
      zip.file(markdownFilename, articleData.markdown);
      
      // Create images folder
      const imagesFolder = zip.folder('images');
      
      // Add images
      const totalImages = articleData.images.length;
      let completedImages = 0;
      
      for (const image of articleData.images) {
        try {
          // Use our proxy API to fetch the image
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(image.url)}`;
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          imagesFolder?.file(image.filename, blob);
          
          // Update progress
          completedImages++;
          setDownloadProgress(Math.round((completedImages / totalImages) * 100));
        } catch (error) {
          console.error(`Failed to download image: ${image.url}`, error);
        }
      }
      
      // Generate and save zip
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      saveAs(content, `${sanitizedTitle}.zip`);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGithubSync = async () => {
    if (!githubConfig) return;
    
    setSyncStatus('syncing');
    setSyncError('');
    
    try {
      const sanitizedTitle = articleData.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      const markdownFilename = `${sanitizedTitle}.md`;
      const date = new Date().toISOString().split('T')[0];
      const folderPath = `articles/${date}-${sanitizedTitle}`;
      
      // Create a new branch
      const branchName = `article-${date}-${Math.floor(Math.random() * 1000)}`;
      
      // Get the default branch
      const repoInfoResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}`, {
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!repoInfoResponse.ok) {
        throw new Error(`Failed to get repository info: ${repoInfoResponse.statusText}`);
      }
      
      const repoInfo = await repoInfoResponse.json();
      const defaultBranch = repoInfo.default_branch;
      
      // Get the reference to the default branch
      const refResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/git/refs/heads/${defaultBranch}`, {
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!refResponse.ok) {
        throw new Error(`Failed to get reference: ${refResponse.statusText}`);
      }
      
      const refData = await refResponse.json();
      
      // Create a new branch
      const createBranchResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/git/refs`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: refData.object.sha
        })
      });
      
      if (!createBranchResponse.ok) {
        throw new Error(`Failed to create branch: ${createBranchResponse.statusText}`);
      }
      
      // Upload markdown file
      const markdownResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/${folderPath}/${markdownFilename}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Add article: ${articleData.title}`,
          content: btoa(unescape(encodeURIComponent(articleData.markdown))),
          branch: branchName
        })
      });
      
      if (!markdownResponse.ok) {
        throw new Error(`Failed to upload markdown: ${markdownResponse.statusText}`);
      }
      
      // Upload images
      for (const image of articleData.images) {
        try {
          // Use our proxy API to fetch the image
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(image.url)}`;
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          // Convert blob to base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const base64data = reader.result as string;
              resolve(base64data.split(',')[1]);
            };
          });
          reader.readAsDataURL(blob);
          const base64data = await base64Promise;
          
          // Upload image to GitHub
          const imageResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/${folderPath}/images/${image.filename}`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${githubConfig.token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `Add image for article: ${articleData.title}`,
              content: base64data,
              branch: branchName
            })
          });
          
          if (!imageResponse.ok) {
            throw new Error(`Failed to upload image: ${imageResponse.statusText}`);
          }
        } catch (error) {
          console.error(`Failed to upload image: ${image.url}`, error);
          throw error;
        }
      }
      
      // Create a pull request
      const prResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/pulls`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Add article: ${articleData.title}`,
          head: branchName,
          base: defaultBranch,
          body: `This PR adds a new article: ${articleData.title}\n\nSource: ${articleData.originalUrl}`
        })
      });
      
      if (!prResponse.ok) {
        throw new Error(`Failed to create pull request: ${prResponse.statusText}`);
      }
      
      setSyncStatus('success');
    } catch (error) {
      console.error('GitHub sync error:', error);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border border-slate-200 dark:border-slate-800">
          <CardContent className="p-0 space-y-4">
            <div>
              <h3 className="font-medium text-lg">Download as ZIP</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Download the Markdown file and all images as a ZIP archive
              </p>
            </div>
            
            {isDownloading && downloadProgress > 0 && (
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            )}
            
            <Button 
              onClick={handleDownload} 
              className="w-full"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Downloading... {downloadProgress}%
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download ZIP
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        {githubConfig && (
          <Card className="p-4 border border-slate-200 dark:border-slate-800">
            <CardContent className="p-0 space-y-4">
              <div>
                <h3 className="font-medium text-lg">Sync to GitHub</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Push the article to your GitHub repository
                </p>
              </div>
              <Button 
                onClick={handleGithubSync} 
                className="w-full"
                disabled={syncStatus === 'syncing'}
                variant={syncStatus === 'success' ? 'outline' : 'default'}
              >
                {syncStatus === 'idle' && (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Sync to GitHub
                  </>
                )}
                {syncStatus === 'syncing' && (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Syncing...
                  </>
                )}
                {syncStatus === 'success' && (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Synced Successfully
                  </>
                )}
                {syncStatus === 'error' && (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                    Sync Failed
                  </>
                )}
              </Button>
              
              {syncStatus === 'error' && (
                <div className="text-sm text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  {syncError || 'An error occurred during GitHub synchronization.'}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="text-sm text-slate-500 dark:text-slate-400">
        <p>The downloaded ZIP contains:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Markdown file with the article content</li>
          <li>Images folder with all article images</li>
        </ul>
      </div>
    </div>
  );
} 