import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parses a WeChat article HTML and extracts relevant content
 *
 * @param {string} html - The HTML content of the WeChat article
 * @returns {Object} Parsed article data
 */
export function parseWeChatArticle(html) {
  const $ = cheerio.load(html);

  // Extract basic article information
  const title = $('#activity-name').text().trim() || 'Untitled WeChat Article';
  const author = $('#js_name').text().trim() || '';
  const publishTime = $('#publish_time').text().trim() || '';

  // Extract article content
  const content = $('#js_content');

  // Process and clean up content
  content.find('*').each((_, element) => {
    // Remove wx-specific attributes
    const el = $(element);

    // Remove inline styles that might interfere with markdown rendering
    el.removeAttr('style');
    el.removeAttr('data-tools');
    el.removeAttr('data-brushtype');
    el.removeAttr('data-ratio');
    el.removeAttr('data-w');
    el.removeAttr('data-default-width');

    // Convert WeChat specific elements to standard HTML
    if (el.hasClass('js_blockquote_digest')) {
      el.replaceWith(`<blockquote>${el.html()}</blockquote>`);
    }
  });

  // Process images
  const images = [];
  content.find('img').each((index, img) => {
    const el = $(img);

    // Get image source - WeChat often uses data-src for lazy loading
    const src = el.attr('data-src') || el.attr('src');

    if (src) {
      // Generate a filename for the image
      const extension = (src.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
      const validExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)
        ? extension
        : 'jpg';
      const imageId = uuidv4();
      const filename = `${imageId}`;

      // Update image source to point to local path
      el.attr('src', `./images/${filename}`);

      // Store image information
      images.push({
        url: src,
        filename,
        index: index + 1
      });
    }
  });

  // Special handling for code blocks
  content.find('pre').each((_, pre) => {
    const el = $(pre);
    const lang = el.attr('class')?.replace('prettyprint', '').trim() || '';
    const code = el.text().trim();

    // Replace with proper code block
    el.replaceWith(`<pre><code class="language-${lang}">${code}</code></pre>`);
  });

  return {
    title,
    author,
    publishTime,
    content: content.html(),
    images
  };
}