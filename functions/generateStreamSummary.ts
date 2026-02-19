import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stream_id, transcript, title, description, sport } = await req.json();

    if (!stream_id) {
      return Response.json({ error: 'Missing stream_id' }, { status: 400 });
    }

    const contentInput = transcript || `Title: ${title}. Description: ${description}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sports content expert. Analyze this live stream and provide a comprehensive AI summary.

Stream Title: ${title || 'Untitled Stream'}
Sport: ${sport || 'Unknown'}
Description: ${description || 'No description'}

Transcript/Chat Content:
${contentInput}

Provide:
1. A concise 2-3 sentence overview of what the stream was about.
2. 3-5 key highlight moments with approximate timestamps (if inferable) and why each is important (high or medium importance).
3. 5-8 relevant tags or categories that best describe the stream content (e.g. technique, training tips, match recap, Q&A, motivation, drill, beginner, advanced, etc.)`,
      response_json_schema: {
        type: 'object',
        properties: {
          overview: {
            type: 'string',
            description: 'Concise 2-3 sentence summary of the stream content'
          },
          highlights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', description: 'Approximate timestamp or label like "Early", "Mid", "Late"' },
                description: { type: 'string', description: 'What happened and why it matters' },
                importance: { type: 'string', enum: ['high', 'medium'] }
              }
            }
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Relevant tags and categories for the stream'
          }
        }
      }
    });

    // Save to the stream entity
    await base44.asServiceRole.entities.LiveStream.update(stream_id, {
      ai_summary: result.overview,
      ai_tags: result.tags || [],
      ai_transcript: contentInput.slice(0, 5000)
    });

    return Response.json({
      overview: result.overview,
      highlights: result.highlights || [],
      tags: result.tags || []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});