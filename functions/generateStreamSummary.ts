import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stream_id, transcript, title, description } = await req.json();

    if (!stream_id || !transcript) {
      return Response.json({ error: 'Missing stream_id or transcript' }, { status: 400 });
    }

    // Generate concise summary and highlight moments
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sports content expert. Analyze this live stream and provide:
1. A concise 2-3 sentence summary
2. 3-5 key highlight moments with timestamps (if available) and why they're important
3. Peak engagement segments

Stream Title: ${title || 'Untitled Stream'}
Description: ${description || 'No description'}

Transcript/Chat Content:
${transcript}

Provide your response as JSON with: { summary: string, highlights: [{timestamp: string, description: string, importance: 'high'|'medium'}], peakMoments: string[] }`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Concise 2-3 sentence summary' },
          highlights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                description: { type: 'string' },
                importance: { type: 'string', enum: ['high', 'medium'] }
              }
            }
          },
          peakMoments: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    // Update the stream with AI summary
    await base44.asServiceRole.entities.LiveStream.update(stream_id, {
      ai_summary: result.summary,
      ai_tags: result.peakMoments || []
    });

    return Response.json({
      summary: result.summary,
      highlights: result.highlights,
      peakMoments: result.peakMoments
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});