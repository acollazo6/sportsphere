import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, streamId } = await req.json();
    if (!message) return Response.json({ error: 'Missing message' }, { status: 400 });

    // Detect external links
    const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\.com\/[^\s]*)/gi;
    const links = message.match(linkRegex) || [];
    const hasExternalLinks = links.length > 0;

    // Use AI to analyze for harmful content and get moderation suggestions
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a strict content moderation AI for a sports streaming platform. Analyze this chat message and provide moderation recommendations.

Message: "${message}"
Has external links: ${hasExternalLinks}
Links found: ${links.join(', ') || 'None'}

Analyze for:
1. Spam or promotional content
2. Harassment, bullying, or toxic behavior
3. Hate speech or discrimination
4. Misinformation or false claims
5. Adult or sexual content
6. Suspicious links or phishing attempts

Return a JSON with:
{
  "severity": "none" | "low" | "medium" | "high",
  "reasons": ["reason1", "reason2"],
  "suggestedAction": "none" | "warning" | "mute" | "tempban" | "ban",
  "actionReason": "brief explanation",
  "hasHarmfulLinks": boolean,
  "shouldFilterLinks": boolean,
  "cleanMessage": "message with harmful links removed if needed"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          severity: { type: 'string' },
          reasons: { type: 'array', items: { type: 'string' } },
          suggestedAction: { type: 'string' },
          actionReason: { type: 'string' },
          hasHarmfulLinks: { type: 'boolean' },
          shouldFilterLinks: { type: 'boolean' },
          cleanMessage: { type: 'string' },
        },
      },
    });

    // Save moderation analysis
    if (streamId && analysis.severity !== 'none') {
      await base44.entities.Notification.create({
        recipient_email: user.email,
        type: 'moderation_alert',
        message: `Flagged message (${analysis.severity}): ${analysis.actionReason}`,
        related_item_id: streamId,
        related_item_type: 'stream',
      });
    }

    return Response.json({
      analysis,
      filtered: analysis.shouldFilterLinks ? analysis.cleanMessage : message,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});