import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

// Helper function to extract images from HTML content
const extractImages = (html: string, baseUrl: string): Array<{ url: string; filename: string }> => {
  const $ = cheerio.load(html);
  const images: Array<{ url: string; filename: string }> = [];
  
  $('img').each((_, element) => {
    const src = $(element).attr('data-src') || $(element).attr('src');
    if (src) {
      // Handle relative URLs
      const imageUrl = src.startsWith('http') ? src : new URL(src, baseUrl).toString();
      const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `image-${images.length + 1}.${extension}`;
      
      images.push({
        url: imageUrl,
        filename
      });
      
      // Replace image src with local path
      $(element).attr('src', `./images/${filename}`);
    }
  });
  
  return images;
};

// Helper function to convert HTML to Markdown
const htmlToMarkdown = (html: string): string => {
  const $ = cheerio.load(html);
  
  // Remove unnecessary elements
  $('.rich_media_meta_list, script, style, .weui-dialog, .weui-mask').remove();
  
  let markdown = '';
  
  // Extract title
  const title = $('.rich_media_title').text().trim();
  if (title) {
    markdown += `# ${title}\n\n`;
  }
  
  // Process content
  $('.rich_media_content').find('*').each((_, element) => {
    const tagName = element.tagName.toLowerCase();
    const $element = $(element);
    const text = $element.text().trim();
    
    if (!text && tagName !== 'img') return;
    
    switch (tagName) {
      case 'h1':
        markdown += `# ${text}\n\n`;
        break;
      case 'h2':
        markdown += `## ${text}\n\n`;
        break;
      case 'h3':
        markdown += `### ${text}\n\n`;
        break;
      case 'h4':
        markdown += `#### ${text}\n\n`;
        break;
      case 'h5':
        markdown += `##### ${text}\n\n`;
        break;
      case 'h6':
        markdown += `###### ${text}\n\n`;
        break;
      case 'p':
        if ($element.find('img').length === 0) {
          markdown += `${text}\n\n`;
        }
        break;
      case 'ul':
        $element.find('li').each((_, li) => {
          markdown += `* ${$(li).text().trim()}\n`;
        });
        markdown += '\n';
        break;
      case 'ol':
        $element.find('li').each((i, li) => {
          markdown += `${i + 1}. ${$(li).text().trim()}\n`;
        });
        markdown += '\n';
        break;
      case 'blockquote':
        markdown += `> ${text}\n\n`;
        break;
      case 'img':
        const src = $element.attr('src');
        if (src) {
          markdown += `![Image](${src})\n\n`;
        }
        break;
      case 'a':
        const href = $element.attr('href');
        if (href) {
          markdown += `[${text}](${href})\n\n`;
        }
        break;
      case 'pre':
      case 'code':
        markdown += `\`\`\`\n${text}\n\`\`\`\n\n`;
        break;
    }
  });
  
  return markdown;
};

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url || !url.includes('weixin.qq.com')) {
      return NextResponse.json(
        { message: 'Invalid WeChat article URL' },
        { status: 400 }
      );
    }
    
    // Fetch the article content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract title
    const title = $('.rich_media_title').text().trim();
    
    // Extract images
    const images = extractImages(html, url);
    
    // Convert to Markdown
    const markdown = htmlToMarkdown(html);
    
    return NextResponse.json({
      markdown,
      title,
      images,
      originalUrl: url,
      id: uuidv4()
    });
    
  } catch (error) {
    console.error('Conversion error:', error);
    
    return NextResponse.json(
      { 
        message: error instanceof Error 
          ? `Failed to convert article: ${error.message}` 
          : 'Failed to convert article' 
      },
      { status: 500 }
    );
  }
} 