import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's viewing history (streams they've watched)
    const viewerStreams = await base44.entities.LiveStream.filter({
      viewers: user.email,
    });

    // Fetch user's chat history
    const chatMessages = await base44.entities.LiveChat.filter({
      sender_email: user.email,
    }, '-created_date', 100);

    // Fetch user's interests (from sport profiles)
    const sportProfiles = await base44.entities.SportProfile.filter({
      user_email: user.email,
    });

    // Fetch users they follow (to understand preferences)
    const followingRelations = await base44.entities.Follow.filter({
      follower_email: user.email,
      status: 'accepted',
    });

    // Fetch all available live streams
    const allStreams = await base44.entities.LiveStream.filter({
      status: 'live',
    }, '-started_at', 50);

    // Fetch scheduled upcoming streams
    const upcomingStreams = await base44.entities.ScheduledStream.filter({
      status: 'upcoming',
    }, 'scheduled_at', 50);

    // Build user profile summary
    const userBehavior = {
      watchedStreamCount: viewerStreams.length,
      watchedSports: viewerStreams.map(s => s.sport).filter(Boolean),
      chatActivity: chatMessages.length,
      interests: sportProfiles.map(p => ({ sport: p.sport, role: p.role, level: p.level })),
      followingCount: followingRelations.length,
      recentChats: chatMessages.slice(0, 10).map(m => m.message).join(' '),
    };

    // Use LLM to analyze behavior and generate recommendations
    const recommendation = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sports streaming recommendation AI. Analyze this user's behavior and recommend the best live streams and upcoming streams for them.

User Profile:
- Watched ${userBehavior.watchedStreamCount} streams
- Sports interests: ${userBehavior.watchedSports.join(', ') || 'Not specified'}
- Chat activity: ${userBehavior.chatActivity} messages
- Sports profiles: ${JSON.stringify(userBehavior.interests)}
- Following: ${userBehavior.followingCount} users
- Recent chat: "${userBehavior.recentChats}"

Available Live Streams:
${allStreams.slice(0, 20).map(s => `- ${s.title} (${s.sport}, hosted by ${s.host_name}, ${s.viewers?.length || 0} viewers)`).join('\n')}

Upcoming Streams:
${upcomingStreams.slice(0, 20).map(s => `- ${s.title} (${s.sport}, hosted by ${s.host_name})`).join('\n')}

Return a JSON with:
{
  "recommendedLiveStreams": [{"id": "stream_id", "reason": "why recommended", "score": 0-100}],
  "recommendedUpcomingStreams": [{"id": "stream_id", "reason": "why recommended", "score": 0-100}],
  "topInterests": ["sport1", "sport2"],
  "summary": "brief summary of recommendations"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendedLiveStreams: {
            type: 'array',
            items: { type: 'object' },
          },
          recommendedUpcomingStreams: {
            type: 'array',
            items: { type: 'object' },
          },
          topInterests: {
            type: 'array',
            items: { type: 'string' },
          },
          summary: { type: 'string' },
        },
      },
    });

    // Save recommendation data for the user
    await base44.auth.updateMe({
      ai_recommendations: recommendation,
      recommendation_timestamp: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      recommendations: recommendation,
      userBehavior,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});