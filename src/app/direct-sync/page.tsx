'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Input, Label, Textarea } from '@/components/ui';
import { Github, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

// Define the config data type (matching the one in the main app)
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

export default function DirectSyncPage() {
  const router = useRouter();
  const [url, setUrl] = useState<string>('');
  const [githubRepo, setGithubRepo] = useState<string>('');
  const [githubToken, setGithubToken] = useState<string>('');
  const [branch, setBranch] = useState<string>('');
  const [markdownDir, setMarkdownDir] = useState<string>('articles');
  const [imagesDir, setImagesDir] = useState<string>('images');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [useStoredConfig, setUseStoredConfig] = useState<boolean>(true);
  const [storedConfig, setStoredConfig] = useState<ConfigData | null>(null);
  const { toast } = useToast();

  // Function to redirect to main converter with URL pre-filled
  const goToMainConverter = () => {
    // Store the URL in localStorage so the main converter can use it
    if (url) {
      localStorage.setItem('wechat-article-url', url);
      router.push('/');
    } else {
      router.push('/');
    }
  };

  // Load stored configuration from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('wechat-to-markdown-config');
      if (savedConfig) {
        try {
          const parsedConfig = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
          setStoredConfig(parsedConfig);
          
          // If using stored config, populate the form fields
          if (useStoredConfig) {
            setGithubRepo(parsedConfig.githubRepo);
            setGithubToken(parsedConfig.githubToken);
            setBranch(parsedConfig.githubBranch);
            setMarkdownDir(parsedConfig.markdownDir);
            setImagesDir(parsedConfig.imagesDir);
          }
        } catch (e) {
          console.error('Failed to parse saved config:', e);
        }
      }
    }
  }, [useStoredConfig]);

  // Toggle between stored config and manual input
  const toggleUseStoredConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUseStoredConfig(checked);
    
    if (checked && storedConfig) {
      // Use stored config values
      setGithubRepo(storedConfig.githubRepo);
      setGithubToken(storedConfig.githubToken);
      setBranch(storedConfig.githubBranch);
      setMarkdownDir(storedConfig.markdownDir);
      setImagesDir(storedConfig.imagesDir);
    } else {
      // Reset to default values for manual input
      setGithubRepo('');
      setGithubToken('');
      setBranch('');
      setMarkdownDir('articles');
      setImagesDir('images');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate URL
    if (!url.trim()) {
      setError('Please enter a WeChat article URL');
      return;
    }
    
    // Ensure URL is properly formatted
    if (!url.startsWith('http')) {
      setError('Invalid URL format. URL must start with http:// or https://');
      return;
    }
    
    // Validate that it's a WeChat URL
    if (!url.includes('mp.weixin.qq.com')) {
      setError('URL does not appear to be a WeChat article. Please provide a URL from mp.weixin.qq.com');
      return;
    }
    
    if (!githubRepo.trim()) {
      setError('Please enter a GitHub repository (username/repo)');
      return;
    }
    
    if (!githubToken.trim()) {
      setError('Please enter a GitHub token');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/direct-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          githubConfig: {
            repo: githubRepo,
            token: githubToken,
            branch: branch || undefined,
            markdownDir: markdownDir || 'articles',
            imagesDir: imagesDir || 'images',
          },
        }),
      });
      
      let data;
      try {
        const responseText = await response.text();
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON response:', responseText);
          throw new Error('Invalid response from server: ' + responseText.substring(0, 100));
        }
      } catch (e) {
        console.error('Error processing response:', e);
        throw new Error('Failed to process server response');
      }
      
      if (!response.ok) {
        const errorMessage = data?.message || 'Failed to sync article';
        const errorDetails = data?.details ? `\n\n${data.details}` : '';
        throw new Error(errorMessage + errorDetails);
      }
      
      toast({
        title: 'Success!',
        description: `Article "${data.title}" has been synced to GitHub.`,
      });
      
      // Optionally clear the form
      setUrl('');
    } catch (error) {
      console.error('Sync error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Direct Sync to GitHub</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Directly sync WeChat public account articles to your GitHub repository with a single click.
      </p>
      
      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">WeChat Article URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  placeholder="https://mp.weixin.qq.com/s/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goToMainConverter}
                  title="Open in main converter"
                  disabled={!url}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">Paste the full URL of the WeChat article you want to sync</p>
            </div>
            
            {storedConfig && (
              <div className="flex items-center space-x-2 py-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="use-stored-config" 
                    checked={useStoredConfig} 
                    onChange={toggleUseStoredConfig}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="use-stored-config" className="cursor-pointer">
                    Use saved GitHub configuration
                  </Label>
                </div>
                {useStoredConfig && storedConfig.githubRepo && (
                  <p className="text-xs text-slate-500 ml-2">
                    Using configuration from: {storedConfig.githubRepo}
                  </p>
                )}
              </div>
            )}
            
            <div className={`space-y-2 ${useStoredConfig && storedConfig ? 'opacity-50' : ''}`}>
              <Label htmlFor="githubRepo">GitHub Repository</Label>
              <Input
                id="githubRepo"
                placeholder="username/repository"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                required
                disabled={useStoredConfig && storedConfig !== null}
              />
              <p className="text-xs text-slate-500">Format: username/repository</p>
            </div>
            
            <div className={`space-y-2 ${useStoredConfig && storedConfig ? 'opacity-50' : ''}`}>
              <Label htmlFor="githubToken">GitHub Token</Label>
              <Input
                id="githubToken"
                type="password"
                placeholder="ghp_..."
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                required
                disabled={useStoredConfig && storedConfig !== null}
              />
              <p className="text-xs text-slate-500">
                <a 
                  href="https://github.com/settings/tokens" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create a token
                </a> with 'repo' scope
              </p>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${useStoredConfig && storedConfig ? 'opacity-50' : ''}`}>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch (Optional)</Label>
                <Input
                  id="branch"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={useStoredConfig && storedConfig !== null}
                />
                <p className="text-xs text-slate-500">Leave empty for default branch</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="markdownDir">Markdown Directory</Label>
                <Input
                  id="markdownDir"
                  placeholder="articles"
                  value={markdownDir}
                  onChange={(e) => setMarkdownDir(e.target.value)}
                  disabled={useStoredConfig && storedConfig !== null}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imagesDir">Images Directory</Label>
                <Input
                  id="imagesDir"
                  placeholder="images"
                  value={imagesDir}
                  onChange={(e) => setImagesDir(e.target.value)}
                  disabled={useStoredConfig && storedConfig !== null}
                />
              </div>
            </div>
            
            {error && (
              <div className="space-y-2">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm whitespace-pre-line">
                  {error}
                </div>
                
                {error.includes('parsing') && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 text-sm">
                    <p className="mb-2">Suggestion: Try using the main converter first to ensure the article can be parsed correctly.</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={goToMainConverter}
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Main Converter
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-4 w-4" />
                  Sync to GitHub
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
      
      <div className="mt-8">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-sm">
          <h3 className="font-medium mb-2">⚠️ Important Note</h3>
          <p>If you're experiencing issues with direct syncing, please try the following steps:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
            <li>Use the <strong>main converter</strong> first to convert the article</li>
            <li>Verify that the article content appears correctly in the preview</li>
            <li>Then use the GitHub sync option from the Download tab</li>
          </ol>
          <div className="mt-3">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={goToMainConverter}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Main Converter
            </Button>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400 text-sm">
          <h3 className="font-medium mb-2">ℹ️ Why am I seeing parsing errors?</h3>
          <p className="mb-2">The direct sync feature attempts to parse WeChat articles in a single step. However, some articles may require additional processing that's only available in the main converter.</p>
          <p>Common reasons for parsing errors:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li>The article contains complex formatting or special elements</li>
            <li>The article requires authentication or has access restrictions</li>
            <li>WeChat has updated their article structure</li>
            <li>Network issues when fetching the article content</li>
          </ul>
          <p className="mt-2">Using the main converter first allows you to verify the content before syncing to GitHub.</p>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-slate-500 dark:text-slate-400">
        <h3 className="font-medium mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>We fetch the WeChat article and convert it to Markdown</li>
          <li>All images are downloaded and processed</li>
          <li>A new branch is created in your GitHub repository</li>
          <li>The Markdown file and images are uploaded</li>
          <li>A pull request is created to merge the changes</li>
        </ol>
      </div>
    </div>
  );
} 