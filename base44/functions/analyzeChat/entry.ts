import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, messages = [], streamId, faqs = [] } = await req.json();

    if (action === 'moderate') {
      // Analyze messages for inappropriate content and spam
      const messagesToAnalyze = messages.slice(-50); // Last 50 messages
      
      const analysisPrompt = `You are a content moderator for a live sports streaming platform. Analyze these chat messages and identify:
1. Inappropriate/offensive content that violates community guidelines
2. Spam or repetitive messages
3. Harassment or bullying

Messages to analyze:
${messagesToAnalyze.map((m, i) => `${i + 1}. "${m.message}" - by ${m.sender_name}`).join('\n')}

Respond with a JSON object with this structure:
{
  "flagged_messages": [
    { "index": number, "severity": "low|medium|high", "reason": "brief reason", "message_id": "string" }
  ],
  "overall_safety_score": 0-100,
  "recommendations": ["suggestion1", "suggestion2"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            flagged_messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  index: { type: 'number' },
                  severity: { type: 'string' },
                  reason: { type: 'string' },
                  message_id: { type: 'string' }
                }
              }
            },
            overall_safety_score: { type: 'number' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      return Response.json(result);
    }

    if (action === 'faq_response') {
      // Generate AI response to a question based on FAQs and stream context
      const { question, streamTitle, streamDescription } = await req.json();

      const faqPrompt = `You are an AI assistant for a live sports stream.
Stream: ${streamTitle}
Description: ${streamDescription}

Frequently Asked Questions:
${faqs.map((faq, i) => `Q${i + 1}: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}

User Question: "${question}"

Provide a concise, helpful response (1-2 sentences max) based on the FAQs or stream context. If not related to the FAQs or stream, politely suggest the host will answer live.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: faqPrompt
      });

      return Response.json({ response: result });
    }

    if (action === 'sentiment_summary') {
      // Analyze overall chat sentiment and key topics
      const messagesToAnalyze = messages.slice(-100); // Last 100 messages

      const sentimentPrompt = `Analyze the sentiment and key discussion points in these live chat messages from a sports stream:

${messagesToAnalyze.map(m => m.message).join('\n')}

Respond with JSON:
{
  "overall_sentiment": "positive|neutral|negative",
  "sentiment_breakdown": { "positive": number, "neutral": number, "negative": number },
  "key_topics": ["topic1", "topic2", "topic3"],
  "engagement_level": "low|moderate|high",
  "summary": "brief summary of what viewers are discussing"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: sentimentPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            overall_sentiment: { type: 'string' },
            sentiment_breakdown: {
              type: 'object',
              properties: {
                positive: { type: 'number' },
                neutral: { type: 'number' },
                negative: { type: 'number' }
              }
            },
            key_topics: { type: 'array', items: { type: 'string' } },
            engagement_level: { type: 'string' },
            summary: { type: 'string' }
          }
        }
      });

      return Response.json(result);
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});