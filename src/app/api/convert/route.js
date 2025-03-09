import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { message: 'URL is required' },
        { status: 400 }
      );
    }

    // Fetch the WeChat article with a user-agent to avoid being blocked
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract article title
    const title = $('#activity-name').text().trim() || 'Untitled WeChat Article';

    // Extract author if available
    const author = $('#js_name').text().trim() || '';

    // Extract publish time if available
    const publishTime = $('#publish_time').text().trim() || '';

    // Extract the article content
    const content = $('#js_content').html() || '';

    // Prepare image storage information
    const images = [];

    // Process all images in the content
    $('#js_content img').each((index, element) => {
      const originalSrc = $(element).attr('data-src') || $(element).attr('src');

      if (originalSrc) {
        const extension = originalSrc.split('?')[0].split('.').pop() || 'jpg';
        const imageId = uuidv4();
        const filename = `${imageId}`;

        // Update image source to relative path for markdown
        $(element).attr('src', `./images/${filename}`);

        // Add image to collection
        images.push({
          url: originalSrc,
          filename,
          index: index + 1
        });
      }
    });

    // Initialize turndown service for HTML to Markdown conversion
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });

    // Customize turndown to handle WeChat specific elements better
    turndownService.addRule('wechatStyles', {
      filter: ['span', 'section', 'p'],
      replacement: function(content) {
        return content + '\n\n';
      }
    });

    // Fix strong tag conversion to prevent line breaks before closing **
    turndownService.addRule('strongFix', {
      filter: 'strong',
      replacement: function(content) {
        // Trim any trailing whitespace or line breaks to ensure closing ** is on the same line
        return `**${content.trim()}**`;
      }
    });

    // Convert HTML to Markdown
    const contentHtml = $('#js_content').html();
    let markdown = turndownService.turndown(contentHtml);

    // Add article metadata at the top
    let articleInfo = `# ${title}\n\n`;

    if (author) {
      articleInfo += `> 作者：${author}\n>\n`;
    }

    if (publishTime) {
      articleInfo += `> 发布时间：${publishTime}\n>\n`;
    }

    articleInfo += `> 原文链接：${url}\n\n`;

    markdown = articleInfo + markdown;

    // Generate an ID for this conversion
    const conversionId = uuidv4();

    // Return the markdown, title, and images
    return NextResponse.json({
      id: conversionId,
      title,
      author,
      publishTime,
      markdown,
      images,
      originalUrl: url
    });

  } catch (error) {
    console.error('Error converting article:', error);

    return NextResponse.json(
      { message: 'Failed to convert article: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}