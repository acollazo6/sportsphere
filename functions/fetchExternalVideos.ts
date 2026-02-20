import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sport, query, source = 'youtube', limit = 12, pageToken = null } = await req.json();
    
    if (!sport && !query) {
      return Response.json({ error: 'Sport or query required' }, { status: 400 });
    }

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      return Response.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    let videos = [];

    if (source === 'youtube' || source === 'all') {
      const searchQuery = query || `${sport} highlights`;
      const params = new URLSearchParams({
        key: youtubeApiKey,
        part: 'snippet',
        type: 'video',
        q: searchQuery,
        maxResults: limit,
        order: 'relevance',
        relevanceLanguage: 'en',
        videoCategoryId: '17', // Sports category
        pageToken: pageToken || ''
      });

      const ytResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      const ytData = await ytResponse.json();

      if (ytData.items) {
        videos = ytData.items.map(item => ({
          source: 'youtube',
          platform_id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url,
          published_at: item.snippet.publishedAt,
          channel: item.snippet.channelTitle,
          sport: sport,
          embed_url: `https://www.youtube.com/embed/${item.id.videoId}`,
          video_url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        }));
      }

      return Response.json({
        videos,
        nextPageToken: ytData.nextPageToken || null,
        source: 'youtube'
      });
    }

    return Response.json({ videos: [], error: 'Source not supported' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});