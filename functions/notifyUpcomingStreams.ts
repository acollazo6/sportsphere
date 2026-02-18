import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch upcoming streams in next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingStreams = await base44.entities.ScheduledStream.filter({
      status: 'upcoming',
    }, 'scheduled_at', 100);

    const streamsInNext24h = upcomingStreams.filter(s => {
      const streamTime = new Date(s.scheduled_at);
      return streamTime > now && streamTime < tomorrow;
    });

    if (streamsInNext24h.length === 0) {
      return Response.json({ notified: 0, message: 'No upcoming streams in next 24 hours' });
    }

    // Fetch user's sport interests
    const sportProfiles = await base44.entities.SportProfile.filter({
      user_email: user.email,
    });

    const userSports = sportProfiles.map(p => p.sport);

    // Filter streams matching user interests
    const relevantStreams = streamsInNext24h.filter(s => 
      !userSports.length || userSports.includes(s.sport)
    );

    // Send notifications for relevant streams
    const notificationPromises = relevantStreams.map(stream =>
      base44.entities.Notification.create({
        recipient_email: user.email,
        actor_email: stream.host_email,
        actor_name: stream.host_name,
        actor_avatar: stream.host_avatar,
        type: 'stream_upcoming',
        message: `${stream.host_name} is going live with "${stream.title}" in ${calculateTimeUntil(stream.scheduled_at)}`,
        related_item_id: stream.id,
        related_item_type: 'scheduled_stream',
      })
    );

    await Promise.all(notificationPromises);

    return Response.json({
      notified: relevantStreams.length,
      streams: relevantStreams.map(s => ({ id: s.id, title: s.title, host: s.host_name })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateTimeUntil(scheduledAt) {
  const now = new Date();
  const streamTime = new Date(scheduledAt);
  const diff = streamTime - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}