import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { content_type, content_id, content_text, author_email, author_name } = await req.json();
    if (!content_text || !content_type || !content_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a strict content moderator for a sports community platform called SportHub. The platform is sports-only — no politics, religion, sexual content, hate speech, or harassment allowed.

Analyze this ${content_type} for violations:
"${content_text}"

Check for:
1. hate_speech — slurs, discrimination based on race, gender, religion, etc.
2. harassment — personal attacks, threats, cyberbullying
3. spam — repetitive content, self-promotion, off-topic links
4. nudity_or_sexual — sexual language, explicit content
5. violence — threats of violence, glorification of harm
6. politics_religion — political or religious debate
7. profanity — severe offensive language

Return JSON:
{
  "is_violation": boolean,
  "violations": ["category1", "category2"],
  "severity": "none" | "low" | "medium" | "high" | "critical",
  "confidence": 0.0 to 1.0,
  "explanation": "Brief explanation",
  "recommended_action": "allow" | "flag_for_review" | "auto_remove"
}

Be precise. Sports trash talk and competitive banter is OK. Only flag genuine violations.`,
      response_json_schema: {
        type: 'object',
        properties: {
          is_violation: { type: 'boolean' },
          violations: { type: 'array', items: { type: 'string' } },
          severity: { type: 'string' },
          confidence: { type: 'number' },
          explanation: { type: 'string' },
          recommended_action: { type: 'string' }
        }
      }
    });

    if (!analysis.is_violation || analysis.severity === 'none') {
      return Response.json({ action: 'allow', analysis });
    }

    // Create a moderation flag
    const flag = await base44.asServiceRole.entities.ModerationFlag.create({
      content_type,
      content_id,
      content_text: content_text.slice(0, 500),
      author_email,
      author_name: author_name || author_email,
      source: 'ai',
      violations: analysis.violations || [],
      severity: analysis.severity,
      ai_confidence: analysis.confidence,
      ai_explanation: analysis.explanation,
      status: analysis.recommended_action === 'auto_remove' ? 'removed' : 'pending'
    });

    // Auto-remove critical content immediately
    if (analysis.recommended_action === 'auto_remove' && analysis.severity === 'critical') {
      if (content_type === 'post') {
        await base44.asServiceRole.entities.Post.delete(content_id);
      } else if (content_type === 'comment') {
        await base44.asServiceRole.entities.Comment.delete(content_id);
      }
    }

    return Response.json({
      action: analysis.recommended_action,
      severity: analysis.severity,
      flagId: flag.id,
      analysis
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});