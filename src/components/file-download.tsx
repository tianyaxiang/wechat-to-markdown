'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { Download, Github, Check, AlertCircle, ExternalLink, Info } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import pinyin from 'pinyin';

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
  branch?: string;
  markdownDir?: string;
  imagesDir?: string;
}

interface FileDownloadProps {
  articleData: ArticleData | null;
  githubConfig?: GithubConfig;
}

export default function FileDownload({ articleData, githubConfig }: FileDownloadProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string>('');
  const [syncErrorDetails, setSyncErrorDetails] = useState<string>('');
  const [syncErrorSolution, setSyncErrorSolution] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showRepoHelp, setShowRepoHelp] = useState<boolean>(false);

  if (!articleData) {
    return <div>No article data available</div>;
  }

  // Function to convert Chinese characters to Pinyin
  const convertToPinyin = (text: string): string => {
    try {
      // Check if pinyin module is available
      if (typeof pinyin === 'function') {
        return pinyin(text, {
          style: pinyin.STYLE_NORMAL, // Normal style without tone marks
          heteronym: false // Don't show multiple pronunciations
        }).flat().join('-');
      } else {
        // Fallback if pinyin module is not available
        return text;
      }
    } catch (error) {
      console.error('Error converting to pinyin:', error);
      return text;
    }
  };

  // Function to sanitize title for filenames
  const sanitizeTitle = (title: string): string => {
    // Check if title contains Chinese characters
    const hasChinese = /[\u4e00-\u9fa5]/.test(title);
    
    if (hasChinese) {
      // Convert Chinese to Pinyin
      const pinyinTitle = convertToPinyin(title);
      return pinyinTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    } else {
      // For non-Chinese titles, just sanitize normally
      return title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      const zip = new JSZip();
      
      // Add markdown file
      const sanitizedTitle = sanitizeTitle(articleData.title);
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

  const validateGithubConfig = () => {
    if (!githubConfig) {
      return "GitHub configuration is missing";
    }
    
    if (!githubConfig.repo) {
      return "GitHub repository is not specified";
    }
    
    if (!githubConfig.repo.includes('/')) {
      return "Invalid repository format. Should be 'username/repository'";
    }
    
    if (!githubConfig.token) {
      return "GitHub token is not specified";
    }
    
    return null;
  };

  const getHumanReadableError = (error: string, status?: number) => {
    if (error.includes('Not Found') && status === 404) {
      return {
        message: "Repository not found",
        details: `The repository "${githubConfig?.repo}" could not be found.`,
        solution: `Please check that:
1. The repository exists on GitHub
2. The repository name is correctly formatted as 'username/repository'
3. Your GitHub token has access to this repository
4. If it's a private repository, make sure your token has the 'repo' scope
5. You may need to create the repository first if it doesn't exist`
      };
    }
    
    if (error.includes('Bad credentials') || error.includes('Unauthorized')) {
      return {
        message: "Invalid GitHub token",
        details: `Your GitHub token was rejected.`,
        solution: `Please check that:
1. The token is valid and not expired
2. The token has the 'repo' scope
3. You can create a new token at GitHub Settings`
      };
    }
    
    if (error.includes('rate limit')) {
      return {
        message: "GitHub API rate limit exceeded",
        details: "You've hit GitHub's API rate limit.",
        solution: "Please try again later or use a token with higher rate limits."
      };
    }
    
    return {
      message: error,
      details: "",
      solution: "Check your GitHub configuration and try again."
    };
  };

  const handleGithubSync = async () => {
    if (!githubConfig) return;
    
    setSyncStatus('syncing');
    setSyncError('');
    setSyncErrorDetails('');
    setSyncErrorSolution('');
    setShowRepoHelp(false);
    
    // Validate GitHub configuration
    const validationError = validateGithubConfig();
    if (validationError) {
      setSyncStatus('error');
      setSyncError(validationError);
      return;
    }
    
    try {
      const sanitizedTitle = sanitizeTitle(articleData.title);
      const markdownFilename = `${sanitizedTitle}.md`;
      const date = new Date().toISOString().split('T')[0];
      
      // Use configured directories or defaults
      const markdownDir = githubConfig.markdownDir || 'articles';
      const imagesDir = githubConfig.imagesDir || 'images';
      
      // Create path for markdown file and images
      const folderPath = `${markdownDir}/${date}-${sanitizedTitle}`;
      const imagesPath = `${folderPath}/${imagesDir}`;
      
      console.log('Fetching repository info...');
      // Get the default branch
      const repoInfoResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}`, {
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!repoInfoResponse.ok) {
        const errorData = await repoInfoResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || repoInfoResponse.statusText || 'Unknown error';
        const { message, details, solution } = getHumanReadableError(errorMessage, repoInfoResponse.status);
        setSyncError(message);
        setSyncErrorDetails(details);
        setSyncErrorSolution(solution);
        
        // Show repository help if it's a 404 error
        if (repoInfoResponse.status === 404) {
          setShowRepoHelp(true);
        }
        
        setSyncStatus('error');
        return; // Stop execution instead of throwing
      }
      
      const repoInfo = await repoInfoResponse.json();
      
      // Use configured branch or repository default branch
      const defaultBranch = githubConfig.branch || repoInfo.default_branch;
      
      console.log(`Using branch: ${defaultBranch}`);
      console.log('Fetching reference...');
      
      // Get the reference to the default branch
      const refResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/git/refs/heads/${defaultBranch}`, {
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!refResponse.ok) {
        const errorData = await refResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || refResponse.statusText || 'Unknown error';
        const { message, details, solution } = getHumanReadableError(errorMessage, refResponse.status);
        setSyncError(message);
        setSyncErrorDetails(details);
        setSyncErrorSolution(solution);
        setSyncStatus('error');
        return; // Stop execution instead of throwing
      }
      
      const refData = await refResponse.json();
      
      // Create a new branch for this article
      const branchName = `article-${date}-${Math.floor(Math.random() * 1000)}`;
      
      console.log(`Creating branch: ${branchName}...`);
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
        const errorData = await createBranchResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || createBranchResponse.statusText || 'Unknown error';
        const { message, details, solution } = getHumanReadableError(errorMessage, createBranchResponse.status);
        setSyncError(message);
        setSyncErrorDetails(details);
        setSyncErrorSolution(solution);
        setSyncStatus('error');
        return; // Stop execution instead of throwing
      }
      
      console.log(`Uploading markdown file to ${folderPath}/${markdownFilename}...`);
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
        const errorData = await markdownResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || markdownResponse.statusText || 'Unknown error';
        const { message, details, solution } = getHumanReadableError(errorMessage, markdownResponse.status);
        setSyncError(message);
        setSyncErrorDetails(details);
        setSyncErrorSolution(solution);
        setSyncStatus('error');
        return; // Stop execution instead of throwing
      }
      
      console.log(`Uploading images to ${imagesPath}...`);
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
          const imageResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/${imagesPath}/${image.filename}`, {
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
            const errorData = await imageResponse.json().catch(() => ({}));
            const errorMessage = errorData.message || imageResponse.statusText || 'Unknown error';
            const { message, details, solution } = getHumanReadableError(errorMessage, imageResponse.status);
            setSyncError(message);
            setSyncErrorDetails(details);
            setSyncErrorSolution(solution);
            setSyncStatus('error');
            return; // Stop execution instead of throwing
          }
        } catch (error) {
          console.error(`Failed to upload image: ${image.url}`, error);
          setSyncError("Failed to upload image");
          setSyncErrorDetails(error instanceof Error ? error.message : "Unknown error");
          setSyncStatus('error');
          return; // Stop execution instead of throwing
        }
      }
      
      console.log('Creating pull request...');
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
        const errorData = await prResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || prResponse.statusText || 'Unknown error';
        const { message, details, solution } = getHumanReadableError(errorMessage, prResponse.status);
        setSyncError(message);
        setSyncErrorDetails(details);
        setSyncErrorSolution(solution);
        setSyncStatus('error');
        return; // Stop execution instead of throwing
      }
      
      setSyncStatus('success');
    } catch (error) {
      console.error('GitHub sync error:', error);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  // Helper function to create a new GitHub repository
  const createNewRepo = async () => {
    if (!githubConfig || !githubConfig.token) return;
    
    const repoName = githubConfig.repo.split('/')[1];
    const isPrivate = true; // Default to private repository
    
    try {
      setSyncStatus('syncing');
      setSyncError('');
      setSyncErrorDetails('');
      setSyncErrorSolution('');
      
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          private: isPrivate,
          auto_init: true, // Initialize with README
          description: 'Repository for WeChat articles converted to Markdown'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setSyncStatus('error');
        setSyncError("Failed to create repository");
        setSyncErrorDetails(errorData.message || response.statusText);
        return;
      }
      
      // Repository created successfully
      setSyncStatus('idle'); // Reset to idle to allow sync
      setSyncError('');
      setSyncErrorDetails('');
      setSyncErrorSolution('');
      setShowRepoHelp(false);
      
      // Show success message
      alert(`Repository "${repoName}" created successfully! You can now sync your article.`);
    } catch (error) {
      setSyncStatus('error');
      setSyncError("Failed to create repository");
      setSyncErrorDetails(error instanceof Error ? error.message : "Unknown error");
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
                {githubConfig.branch && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Branch: {githubConfig.branch} | Directory: {githubConfig.markdownDir || 'articles'}/{githubConfig.imagesDir || 'images'}
                  </p>
                )}
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
                <div className="text-sm mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800/30">
                  <div className="font-medium text-red-600 dark:text-red-400 mb-1">{syncError}</div>
                  
                  {syncErrorDetails && (
                    <div className="text-red-600/90 dark:text-red-400/90 mb-2">
                      {syncErrorDetails}
                    </div>
                  )}
                  
                  {syncErrorSolution && (
                    <div className="text-red-600/90 dark:text-red-400/90 whitespace-pre-line text-sm">
                      {syncErrorSolution}
                    </div>
                  )}
                  
                  {showRepoHelp && (
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800/30">
                      <p className="mb-2 font-medium flex items-center">
                        <Info className="h-4 w-4 mr-1" />
                        Would you like to create this repository?
                      </p>
                      <Button 
                        onClick={createNewRepo} 
                        size="sm" 
                        className="w-full mt-1"
                      >
                        Create Repository
                      </Button>
                    </div>
                  )}
                  
                  <div className="mt-2 flex items-center">
                    <a 
                      href="https://github.com/settings/tokens" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                    >
                      Manage GitHub Tokens
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
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