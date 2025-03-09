import TurndownService from 'turndown';

/**
 * Converts HTML content to Markdown format
 *
 * @param {string} html - The HTML content to convert
 * @param {Object} options - Configuration options
 * @returns {string} Converted Markdown content
 */
export function convertHtmlToMarkdown(html, options = {}) {
  // Initialize turndown service with default or custom options
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    ...options
  });

  // Add custom rules for WeChat specific elements
  turndownService.addRule('wechatStyles', {
    filter: ['span', 'section', 'p'],
    replacement: function(content) {
      return content + '\n\n';
    }
  });

  // Improve code block handling
  turndownService.addRule('codeBlocks', {
    filter: function(node) {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function(content, node) {
      const code = node.firstChild.textContent;
      const lang = node.firstChild.className.replace('language-', '').trim() || '';
      return `\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }
  });

  // Improve image handling
  turndownService.addRule('images', {
    filter: 'img',
    replacement: function(content, node) {
      const alt = node.alt || '';
      const src = node.getAttribute('src') || '';
      const title = node.title || '';
      
      return title
        ? `![${alt}](${src} "${title}")`
        : `![${alt}](${src})`;
    }
  });

  // Convert HTML to Markdown
  return turndownService.turndown(html);
}

/**
 * Creates a complete article markdown with metadata
 * 
 * @param {Object} articleData - Article data including title, author, etc.
 * @param {string} articleData.title - Article title
 * @param {string} articleData.author - Article author
 * @param {string} articleData.publishTime - Article publish time
 * @param {string} articleData.content - Article HTML content
 * @param {string} articleData.url - Original article URL
 * @returns {string} Complete markdown with metadata and content
 */
export function createArticleMarkdown(articleData) {
  const { title, author, publishTime, content, url } = articleData;
  
  // Convert content to markdown
  const contentMarkdown = convertHtmlToMarkdown(content);
  
  // Create metadata header
  let markdown = `# ${title}\n\n`;
  
  if (author) {
    markdown += `> 作者：${author}\n>\n`;
  }
  
  if (publishTime) {
    markdown += `> 发布时间：${publishTime}\n>\n`;
  }
  
  if (url) {
    markdown += `> 原文链接：${url}\n\n`;
  }
  
  // Combine metadata and content
  return markdown + contentMarkdown;
}