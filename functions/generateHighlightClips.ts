import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stream_id, stream_title, stream_sport, stream_description, ai_summary, highlights, duration_hint } = await req.json();

    if (!stream_id) {
      return Response.json({ error: 'Missing stream_id' }, { status: 400 });
    }

    const highlightsText = highlights?.length
      ? highlights.map((h, i) => `${i + 1}. [${h.timestamp || 'unknown'}] ${h.description} (${h.importance || 'medium'} importance)`).join('\n')
      : 'No highlights provided';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional sports video editor AI. Given a live stream's AI summary and highlight moments, generate short shareable video clip metadata for each key moment.

Stream: "${stream_title}"
Sport: ${stream_sport || 'Sports'}
Description: ${stream_description || ''}
AI Summary: ${ai_summary || 'Not available'}

Key Highlights:
${highlightsText}

For EACH highlight, generate:
1. A catchy clip title (max 8 words)
2. Start time in MM:SS format (estimate based on stream progression - assume ${duration_hint || 60} minute stream)
3. End time in MM:SS format (clips should be 15-60 seconds)
4. A viral social media caption (max 280 chars, punchy and engaging)
5. 4-6 relevant hashtags (no # prefix)
6. Best platform for this clip: "instagram_reels", "tiktok", or "twitter"
7. Clip energy level: "explosive", "technical", "inspirational", or "informative"

Return only clips for high or medium importance moments. Maximum 5 clips.`,
      response_json_schema: {
        type: 'object',
        properties: {
          clips: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                start_time: { type: 'string' },
                end_time: { type: 'string' },
                caption: { type: 'string' },
                hashtags: { type: 'array', items: { type: 'string' } },
                best_platform: { type: 'string' },
                energy: { type: 'string' },
                highlight_description: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json({ clips: result.clips || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});