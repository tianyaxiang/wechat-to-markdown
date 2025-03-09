# WeChat to Markdown Converter

A modern web application that converts WeChat public account articles to clean Markdown format with image support.

[中文文档](README_CN.md) | English

![WeChat to Markdown Converter](public/screenshot.png)

## Features

- 🔄 Convert WeChat articles to clean Markdown with a single click
- 🖼️ Automatically downloads and processes images from the article
- 👁️ Live preview of the converted Markdown content
- 💾 Download options for Markdown file only or complete package with images
- 🌓 Light and dark mode support
- 📱 Responsive design for all devices

## Usage Guide

### Converting an Article

1. **Enter the WeChat Article URL**
   - Paste the URL of a WeChat public account article (e.g., `https://mp.weixin.qq.com/s/...`)
   - The URL must be from the WeChat public platform (`mp.weixin.qq.com` or `weixin.qq.com`)

2. **Click "Convert to Markdown"**
   - The application will fetch and process the article content
   - A progress indicator will show the conversion status

3. **View the Converted Content**
   - After successful conversion, you'll be automatically taken to the Preview tab
   - You can switch between rendered preview and raw Markdown source

### Downloading Files

1. **Download Options**
   - **Markdown File**: Download just the Markdown file (.md)
   - **Complete Package**: Download a ZIP file containing both the Markdown file and all images

2. **Image Management**
   - All images from the article are automatically processed
   - Images are saved with unique filenames in an "images" folder
   - In the Markdown file, images are referenced using relative paths (`./images/filename`)

### Tips for Best Results

- Ensure the WeChat article URL is publicly accessible
- For articles with many images, the conversion may take a little longer
- If you encounter any issues with specific articles, try clearing your browser cache and retrying

## Getting Started for Developers

First, clone the repository:

```bash
git clone https://github.com/yourusername/wechat-to-markdown.git
cd wechat-to-markdown
```

Install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
wechat-to-markdown/
├── public/
│   └── placeholder.png
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── convert/
│   │   │   │   └── route.js
│   │   │   └── download/
│   │   │       └── route.js
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── converter-form.tsx
│   │   ├── markdown-preview.tsx
│   │   └── file-download.tsx
│   ├── lib/
│   │   ├── wechat-parser.js
│   │   └── markdown-converter.js
│   └── styles/
│       └── globals.css
├── .env
├── next.config.js
├── package.json
└── tailwind.config.js
```

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown converter
- [Cheerio](https://cheerio.js.org/) - Fast, flexible HTML parser
- [JSZip](https://stuk.github.io/jszip/) - JavaScript library for creating ZIP files

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Thanks to the WeChat platform for providing rich content
- All the open-source libraries that made this project possible
