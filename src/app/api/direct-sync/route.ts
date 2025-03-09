import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import pinyin from 'pinyin';

interface GithubConfig {
  repo: string;
  token: string;
  branch?: string;
  markdownDir?: string;
  imagesDir?: string;
  markdownTemplate?: string;
}

interface RequestBody {
  url: string;
  githubConfig: GithubConfig;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { url, githubConfig } = body;
    
    // Validate URL
    if (!url || !url.trim()) {
      return NextResponse.json({ message: 'WeChat article URL is required' }, { status: 400 });
    }
    
    // Ensure URL is properly formatted
    if (!url.startsWith('http')) {
      return NextResponse.json({ 
        message: 'Invalid URL format. URL must start with http:// or https://' 
      }, { status: 400 });
    }
    
    // Validate that it's a WeChat URL
    if (!url.includes('mp.weixin.qq.com')) {
      return NextResponse.json({ 
        message: 'URL does not appear to be a WeChat article. Please provide a URL from mp.weixin.qq.com' 
      }, { status: 400 });
    }
    
    if (!githubConfig || !githubConfig.repo || !githubConfig.token) {
      return NextResponse.json({ message: 'GitHub configuration is required' }, { status: 400 });
    }
    
    // 1. Fetch and parse the WeChat article
    try {
      const articleData = await fetchAndParseArticle(url);
      
      if (!articleData) {
        return NextResponse.json({ message: 'Failed to fetch or parse the article' }, { status: 500 });
      }
      
      // 2. Sync to GitHub
      const result = await syncToGithub(articleData, githubConfig);
      
      return NextResponse.json({
        message: 'Article synced successfully',
        title: articleData.title,
        ...result
      });
    } catch (parseError) {
      console.error('Error parsing article:', parseError);
      return NextResponse.json({ 
        message: `Error parsing article: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        details: 'There was an issue with the article parsing service. Please try using the main converter first.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Direct sync error:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
}

async function fetchAndParseArticle(url: string) {
  try {
    console.log(`Fetching article from URL: ${url}`);
    
    // Ensure URL is properly encoded
    const encodedUrl = encodeURIComponent(url.trim());
    
    // Get the base URL for the API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const apiUrl = `${baseUrl}/api/parse?url=${encodedUrl}`;
    
    console.log(`Making request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from parse API: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText || '{}');
        throw new Error(errorData.message || `Failed to parse article: ${response.statusText}`);
      } catch (jsonError) {
        // If JSON parsing fails, use the raw error text
        throw new Error(`Failed to parse article: ${errorText || response.statusText}`);
      }
    }
    
    const data = await response.json();
    
    if (!data || !data.title || !data.markdown) {
      throw new Error('Invalid response from parse API: Missing required fields');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching and parsing article:', error);
    throw error;
  }
}

// Function to convert Chinese characters to Pinyin
function convertToPinyin(text: string): string {
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
}

// Function to sanitize title for filenames
function sanitizeTitle(title: string): string {
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
}

async function syncToGithub(articleData: any, githubConfig: GithubConfig) {
  try {
    // Apply markdown template if needed
    if (githubConfig.markdownTemplate && articleData.markdown) {
      const now = new Date();
      const formattedDate = now.toISOString().split('T')[0];
      
      // Extract the first paragraph as description (limited to 150 characters)
      let description = '';
      const firstParagraphMatch = articleData.markdown.match(/^(.+?)(\n\n|$)/);
      if (firstParagraphMatch && firstParagraphMatch[1]) {
        // Remove any markdown formatting from the description
        description = firstParagraphMatch[1]
          .replace(/[#*_~`]/g, '') // Remove markdown formatting characters
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with just their text
          .trim();
        
        // Limit description length
        if (description.length > 150) {
          description = description.substring(0, 147) + '...';
        }
      }
      
      let templatedMarkdown = githubConfig.markdownTemplate
        .replace('{{title}}', articleData.title)
        .replace('{{date}}', formattedDate)
        .replace('{{source}}', articleData.originalUrl)
        .replace('{{description}}', description);
      
      articleData.markdown = templatedMarkdown + articleData.markdown;
    }
    
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
      throw new Error(errorData.message || repoInfoResponse.statusText || 'Unknown error');
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
      throw new Error(errorData.message || refResponse.statusText || 'Unknown error');
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
      throw new Error(errorData.message || createBranchResponse.statusText || 'Unknown error');
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
      throw new Error(errorData.message || markdownResponse.statusText || 'Unknown error');
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
        const base64data = await blobToBase64(blob);
        
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
          throw new Error(errorData.message || imageResponse.statusText || 'Unknown error');
        }
      } catch (error) {
        console.error(`Failed to upload image: ${image.url}`, error);
        throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(errorData.message || prResponse.statusText || 'Unknown error');
    }
    
    const prData = await prResponse.json();
    
    return {
      success: true,
      pullRequest: prData.html_url,
      branch: branchName
    };
  } catch (error) {
    console.error('GitHub sync error:', error);
    throw error;
  }
}

// Helper function to convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 