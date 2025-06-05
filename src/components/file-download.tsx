'use client';

import { useState, useEffect } from 'react';
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
  markdownTemplate?: string;
}

interface FileDownloadProps {
  articleData: ArticleData | null;
  allArticles: ArticleData[];
  githubConfig?: GithubConfig;
}

export default function FileDownload({ articleData, allArticles, githubConfig }: FileDownloadProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string>('');
  const [syncErrorDetails, setSyncErrorDetails] = useState<string>('');
  const [syncErrorSolution, setSyncErrorSolution] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showRepoHelp, setShowRepoHelp] = useState<boolean>(false);
  const [sanitizedTitle, setSanitizedTitle] = useState<string>('');

  useEffect(() => {
    if (articleData?.title) {
      const hasChinese = /[\u4e00-\u9fa5]/.test(articleData.title);
      
      if (hasChinese && typeof pinyin === 'function') {
        try {
          const pinyinTitle = pinyin(articleData.title, {
            style: pinyin.STYLE_NORMAL,
            heteronym: false
          }).flat().join('-');
          
          setSanitizedTitle(pinyinTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'));
        } catch (e) {
          console.error('拼音转换错误:', e);
          setSanitizedTitle(articleData.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'));
        }
      } else {
        setSanitizedTitle(articleData.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'));
      }
    }
  }, [articleData?.title]);

  if (!articleData) {
    return <div>没有可用的文章数据</div>;
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      const zip = new JSZip();
      
      const titleToUse = sanitizedTitle || articleData.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      const markdownFilename = `${titleToUse}.md`;
      zip.file(markdownFilename, articleData.markdown);
      
      const imagesFolder = zip.folder('images');
      
      const totalImages = articleData.images.length;
      let completedImages = 0;
      
      for (const image of articleData.images) {
        try {
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(image.url)}`;
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`获取图片失败: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          imagesFolder?.file(image.filename, blob);
          
          completedImages++;
          setDownloadProgress(Math.round((completedImages / totalImages) * 100));
        } catch (error) {
          console.error(`下载图片失败: ${image.url}`, error);
        }
      }
      
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      saveAs(content, `${titleToUse}.zip`);
    } catch (error) {
      console.error('下载错误:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBatchDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      const zip = new JSZip();
      const totalArticles = allArticles.length;
      const totalImages = allArticles.reduce((sum, article) => sum + article.images.length, 0);
      let completedImages = 0;
      
      for (let i = 0; i < totalArticles; i++) {
        const article = allArticles[i];
        const titleToUse = article.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
        const articleFolder = zip.folder(titleToUse);
        
        // Add markdown file
        articleFolder?.file(`${titleToUse}.md`, article.markdown);
        
        // Create images folder for this article
        const imagesFolder = articleFolder?.folder('images');
        
        // Download images
        for (const image of article.images) {
          try {
            const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(image.url)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
              throw new Error(`获取图片失败: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            imagesFolder?.file(image.filename, blob);
            
            completedImages++;
            setDownloadProgress(Math.round((completedImages / totalImages) * 100));
          } catch (error) {
            console.error(`下载图片失败: ${image.url}`, error);
          }
        }
      }
      
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      saveAs(content, `wechat-articles-${new Date().toISOString().split('T')[0]}.zip`);
    } catch (error) {
      console.error('批量下载错误:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const validateGithubConfig = () => {
    if (!githubConfig) {
      return "缺少GitHub配置";
    }
    
    if (!githubConfig.repo) {
      return "未指定GitHub仓库";
    }
    
    if (!githubConfig.repo.includes('/')) {
      return "仓库格式无效。应为'用户名/仓库名'";
    }
    
    if (!githubConfig.token) {
      return "未指定GitHub令牌";
    }
    
    return null;
  };

  const getHumanReadableError = (error: string, status?: number) => {
    if (error.includes('Not Found') && status === 404) {
      return {
        message: "未找到仓库",
        details: `找不到仓库"${githubConfig?.repo}"。`,
        solution: `请检查：
1. GitHub上是否存在该仓库
2. 仓库名称格式是否正确，应为'用户名/仓库名'
3. 您的GitHub令牌是否有权访问此仓库
4. 如果是私有仓库，请确保您的令牌具有'repo'权限
5. 如果仓库不存在，您可能需要先创建它`
      };
    }
    
    if (error.includes('Bad credentials') || error.includes('Unauthorized')) {
      return {
        message: "GitHub令牌无效",
        details: `您的GitHub令牌被拒绝。`,
        solution: `请检查：
1. 令牌是否有效且未过期
2. 令牌是否具有'repo'权限
3. 您可以在GitHub设置中创建新令牌`
      };
    }
    
    if (error.includes('rate limit')) {
      return {
        message: "超出GitHub API速率限制",
        details: "您已达到GitHub的API速率限制。",
        solution: "请稍后再试或使用具有更高速率限制的令牌。"
      };
    }
    
    return {
      message: error,
      details: "",
      solution: "检查您的GitHub配置并重试。"
    };
  };

  const generateMarkdownWithFrontmatter = (article: ArticleData) => {
    const date = new Date().toISOString().split('T')[0];
    let content = githubConfig?.markdownTemplate || '';
    
    // 替换模板变量
    content = content
      .replace(/{{title}}/g, article.title)
      .replace(/{{date}}/g, date)
      .replace(/{{source}}/g, article.originalUrl)
      .replace(/{{description}}/g, '微信公众号文章转载');
    
    return content + article.markdown;
  };

  const handleGithubSync = async () => {
    if (!githubConfig) return;
    
    setSyncStatus('syncing');
    setSyncError('');
    setSyncErrorDetails('');
    setSyncErrorSolution('');
    setShowRepoHelp(false);
    
    const validationError = validateGithubConfig();
    if (validationError) {
      setSyncStatus('error');
      setSyncError(validationError);
      return;
    }
    
    try {
      const date = new Date().toISOString().split('T')[0];
      
      // Get repository information
      console.log('获取仓库信息...');
      const repoInfoResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}`, {
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!repoInfoResponse.ok) {
        const errorData = await repoInfoResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || repoInfoResponse.statusText || '未知错误';
        const { message, details, solution } = getHumanReadableError(errorMessage, repoInfoResponse.status);
        setSyncError(message);
        setSyncErrorDetails(details);
        setSyncErrorSolution(solution);
        
        if (repoInfoResponse.status === 404) {
          setShowRepoHelp(true);
        }
        
        setSyncStatus('error');
        return;
      }
      
      const repoInfo = await repoInfoResponse.json();
      const targetBranch = githubConfig.branch || repoInfo.default_branch;
      
      const titleToUse = sanitizedTitle || articleData.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      const markdownFilename = `${titleToUse}.md`;
      
      const markdownDir = githubConfig.markdownDir || 'articles';
      const imagesDir = githubConfig.imagesDir || 'images';
      
      const folderPath = `${markdownDir}`;
      const imagesPath = `${folderPath}/${imagesDir}`;
      
      // Generate markdown content with frontmatter
      const markdownContent = generateMarkdownWithFrontmatter(articleData);
      
      console.log(`上传Markdown文件到 ${folderPath}/${markdownFilename}...`);
      const markdownResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/${folderPath}/${markdownFilename}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `添加文章: ${articleData.title}`,
          content: btoa(unescape(encodeURIComponent(markdownContent))),
          branch: targetBranch
        })
      });
      
      if (!markdownResponse.ok) {
        const errorData = await markdownResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || markdownResponse.statusText || '未知错误';
        const { message, details, solution } = getHumanReadableError(errorMessage, markdownResponse.status);
        setSyncError(message);
        setSyncErrorDetails(details);
        setSyncErrorSolution(solution);
        setSyncStatus('error');
        return;
      }
      
      console.log(`上传图片到 ${imagesPath}...`);
      for (const image of articleData.images) {
        try {
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(image.url)}`;
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`获取图片失败: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const base64data = reader.result as string;
              resolve(base64data.split(',')[1]);
            };
          });
          reader.readAsDataURL(blob);
          const base64data = await base64Promise;
          
          const imageResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/${imagesPath}/${image.filename}`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${githubConfig.token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `为文章添加图片: ${articleData.title}`,
              content: base64data,
              branch: targetBranch
            })
          });
          
          if (!imageResponse.ok) {
            const errorData = await imageResponse.json().catch(() => ({}));
            const errorMessage = errorData.message || imageResponse.statusText || '未知错误';
            const { message, details, solution } = getHumanReadableError(errorMessage, imageResponse.status);
            setSyncError(message);
            setSyncErrorDetails(details);
            setSyncErrorSolution(solution);
            setSyncStatus('error');
            return;
          }
        } catch (error) {
          console.error(`上传图片失败: ${image.url}`, error);
          setSyncError("上传图片失败");
          setSyncErrorDetails(error instanceof Error ? error.message : "未知错误");
          setSyncStatus('error');
          return;
        }
      }
      
      setSyncStatus('success');
    } catch (error) {
      console.error('GitHub同步错误:', error);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : '发生未知错误');
    }
  };

  const handleBatchGithubSync = async () => {
    if (!githubConfig) return;
    
    setSyncStatus('syncing');
    setSyncError('');
    setSyncErrorDetails('');
    setSyncErrorSolution('');
    setShowRepoHelp(false);
    
    const validationError = validateGithubConfig();
    if (validationError) {
      setSyncStatus('error');
      setSyncError(validationError);
      return;
    }
    
    try {
      // Get repository information
      console.log('获取仓库信息...');
      const repoInfoResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}`, {
        headers: {
          'Authorization': `token ${githubConfig.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!repoInfoResponse.ok) {
        const errorData = await repoInfoResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || repoInfoResponse.statusText || '未知错误';
        const { message, details, solution } = getHumanReadableError(errorMessage, repoInfoResponse.status);
        setSyncError(message);
        setSyncErrorDetails(details);
        setSyncErrorSolution(solution);
        
        if (repoInfoResponse.status === 404) {
          setShowRepoHelp(true);
        }
        
        setSyncStatus('error');
        return;
      }
      
      const repoInfo = await repoInfoResponse.json();
      const targetBranch = githubConfig.branch || repoInfo.default_branch;
      
      // Upload each article
      for (const article of allArticles) {
        const titleToUse = article.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
        const markdownDir = githubConfig.markdownDir || 'articles';
        const imagesDir = githubConfig.imagesDir || 'images';
        
        // Create article folder path
        const articlePath = `${markdownDir}/${titleToUse}`;
        const imagesPath = `${articlePath}/${imagesDir}`;
        
        // Generate markdown content with frontmatter
        const markdownContent = generateMarkdownWithFrontmatter(article);
        
        // Upload markdown file
        await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/${articlePath}/${titleToUse}.md`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubConfig.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `添加文章: ${article.title}`,
            content: btoa(unescape(encodeURIComponent(markdownContent))),
            branch: targetBranch
          })
        });
        
        // Upload images
        for (const image of article.images) {
          try {
            const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(image.url)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
              throw new Error(`获取图片失败: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onloadend = () => {
                const base64data = reader.result as string;
                resolve(base64data.split(',')[1]);
              };
            });
            reader.readAsDataURL(blob);
            const base64data = await base64Promise;
            
            await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/${imagesPath}/${image.filename}`, {
              method: 'PUT',
              headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: `为文章添加图片: ${article.title}`,
                content: base64data,
                branch: targetBranch
              })
            });
          } catch (error) {
            console.error(`上传图片失败: ${image.url}`, error);
          }
        }
      }
      
      setSyncStatus('success');
    } catch (error) {
      console.error('GitHub批量同步错误:', error);
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : '发生未知错误');
    }
  };

  const createNewRepo = async () => {
    if (!githubConfig || !githubConfig.token) return;
    
    const repoName = githubConfig.repo.split('/')[1];
    const isPrivate = true;
    
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
          auto_init: true,
          description: '用于存储转换为Markdown的微信文章的仓库'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setSyncStatus('error');
        setSyncError("创建仓库失败");
        setSyncErrorDetails(errorData.message || response.statusText);
        return;
      }
      
      setSyncStatus('idle');
      setSyncError('');
      setSyncErrorDetails('');
      setSyncErrorSolution('');
      setShowRepoHelp(false);
      
      alert(`仓库"${repoName}"创建成功！您现在可以同步您的文章了。`);
    } catch (error) {
      setSyncStatus('error');
      setSyncError("创建仓库失败");
      setSyncErrorDetails(error instanceof Error ? error.message : "未知错误");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border border-slate-200 dark:border-slate-800">
          <CardContent className="p-0 space-y-4">
            <div>
              <h3 className="font-medium text-lg">下载为ZIP</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                将Markdown文件和所有图片下载为ZIP压缩包
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
            
            <div className="flex gap-2">
              <Button 
                onClick={handleDownload} 
                className="flex-1"
                disabled={isDownloading || !articleData}
              >
                {isDownloading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    下载中... {downloadProgress}%
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    下载当前文章
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleBatchDownload} 
                className="flex-1"
                disabled={isDownloading || allArticles.length <= 1}
              >
                <Download className="mr-2 h-4 w-4" />
                批量下载全部
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {githubConfig && (
          <Card className="p-4 border border-slate-200 dark:border-slate-800">
            <CardContent className="p-0 space-y-4">
              <div>
                <h3 className="font-medium text-lg">同步到GitHub</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  将文章推送到您的GitHub仓库
                </p>
                {githubConfig.branch && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    分支: {githubConfig.branch} | 目录: {githubConfig.markdownDir || 'articles'}/{githubConfig.imagesDir || 'images'}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleGithubSync} 
                  className="flex-1"
                  disabled={syncStatus === 'syncing' || !articleData}
                  variant={syncStatus === 'success' ? 'outline' : 'default'}
                >
                  {syncStatus === 'idle' && (
                    <>
                      <Github className="mr-2 h-4 w-4" />
                      同步当前文章
                    </>
                  )}
                  {syncStatus === 'syncing' && (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      同步中...
                    </>
                  )}
                  {syncStatus === 'success' && (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      同步成功
                    </>
                  )}
                  {syncStatus === 'error' && (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                      同步失败
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleBatchGithubSync}
                  className="flex-1"
                  disabled={syncStatus === 'syncing' || allArticles.length <= 1}
                >
                  <Github className="mr-2 h-4 w-4" />
                  批量同步全部
                </Button>
              </div>
              
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
                        您想创建这个仓库吗？
                      </p>
                      <Button 
                        onClick={createNewRepo} 
                        size="sm" 
                        className="w-full mt-1"
                      >
                        创建仓库
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
                      管理GitHub令牌
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
        <p>下载的ZIP包含：</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>包含文章内容的Markdown文件</li>
          <li>包含所有文章图片的images文件夹</li>
          {allArticles.length > 1 && (
            <li>每篇文章都会有独立的文件夹</li>
          )}
        </ul>
      </div>
    </div>
  );
} 