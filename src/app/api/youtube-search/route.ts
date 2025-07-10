// app/api/youtube-search/route.ts
import { NextResponse } from 'next/server';
import { GetListByKeyword } from 'youtube-search-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is missing' }, { status: 400 });
  }

  try {
    const result = await GetListByKeyword(query, false, 10);

    const videos = result.items
      .filter((item: any) => item.type === 'video')
      .map((video: any) => ({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail.thumbnails[0]?.url || '',
        author: video.channelTitle,
      }));

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
