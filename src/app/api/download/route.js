import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { message: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Fetch the image with proper headers to avoid being blocked
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
        'Referer': 'https://mp.weixin.qq.com/'
      }
    });

    // Determine content type
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // Return the image data
    return new NextResponse(response.data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000'
      }
    });

  } catch (error) {
    console.error('Error downloading image:', error);

    return NextResponse.json(
      { message: 'Failed to download image: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}