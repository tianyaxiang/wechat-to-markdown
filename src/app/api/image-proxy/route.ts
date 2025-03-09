import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    // Get the image URL from the query parameter
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json(
        { message: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    // Fetch the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://mp.weixin.qq.com/'
      }
    });
    
    // Determine the content type
    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    // Return the image with appropriate headers
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      }
    });
    
  } catch (error) {
    console.error('Image proxy error:', error);
    
    return NextResponse.json(
      { 
        message: error instanceof Error 
          ? `Failed to fetch image: ${error.message}` 
          : 'Failed to fetch image' 
      },
      { status: 500 }
    );
  }
} 