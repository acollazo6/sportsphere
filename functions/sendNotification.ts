import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EMAIL_TEMPLATES = {
  like: (actor, ctx) => ({
    subject: `${actor} liked your post`,
    body: `<p>Hi there!</p><p><strong>${actor}</strong> liked your post on SportSphere.</p>${ctx.postLink ? `<p><a href="${ctx.postLink}">View your post →</a></p>` : ''}<p>Keep sharing great content!</p>`
  }),
  comment: (actor, ctx) => ({
    subject: `${actor} commented on your post`,
    body: `<p>Hi there!</p><p><strong>${actor}</strong> commented on your post: <em>"${ctx.comment || ''}"</em></p>${ctx.postLink ? `<p><a href="${ctx.postLink}">See the comment →</a></p>` : ''}`
  }),
  mention: (actor, ctx) => ({
    subject: `${actor} mentioned you in a post`,
    body: `<p>Hi there!</p><p><strong>${actor}</strong> mentioned you in a post on SportSphere.</p><p><a href="${ctx.appUrl || 'https://sporthub.base44.app'}">View it →</a></p>`
  }),
  follow: (actor) => ({
    subject: `${actor} started following you`,
    body: `<p>Hi there!</p><p><strong>${actor}</strong> is now following you on SportSphere. Check out their profile!</p>`
  }),
  follow_request: (actor) => ({
    subject: `${actor} wants to follow you`,
    body: `<p>Hi there!</p><p><strong>${actor}</strong> sent you a follow request on SportSphere.</p><p>Log in to accept or decline.</p>`
  }),
  message: (actor, ctx) => ({
    subject: `New message from ${actor}`,
    body: `<p>Hi there!</p><p><strong>${actor}</strong> sent you a message on SportSphere.</p><p><a href="${ctx.appUrl || 'https://sporthub.base44.app'}">Read it →</a></p>`
  }),
  advice_request: (actor, ctx) => ({
    subject: `${actor} is asking for your advice`,
    body: `<p>Hi there!</p><p><strong>${actor}</strong> sent you an advice request about <strong>${ctx.topic || 'a topic'}</strong>.</p><p>Share your expertise!</p>`
  }),
  tip: (actor, ctx) => ({
    subject: `You received a tip from ${actor}!`,
    body: `<p>Hi there!</p><p><strong>${actor}</strong> sent you a tip of <strong>$${ctx.amount || ''}</strong> on SportSphere. 🎉</p>`
  }),
  subscription: (actor) => ({
    subject: `${actor} subscribed to your content!`,
    body: `<p>Hi there!</p><p><strong>${actor}</strong> just subscribed to your content on SportSphere. 🎉</p><p>Keep creating amazing content!</p>`
  }),
  challenge_update: (actor, ctx) => ({
    subject: `New update in challenge: ${ctx.challenge || ''}`,
    body: `<p>Hi there!</p><p>There's a new update in a challenge you're participating in.</p><p><a href="${ctx.appUrl || 'https://sporthub.base44.app'}">View challenge →</a></p>`
  }),
};

// Map notification type → preference key
const TYPE_TO_PREF_KEY = {
  like: "likes",
  comment: "comments",
  mention: "mentions",
  follow: "follows",
  follow_request: "follow_requests",
  message: "messages",
  advice_request: "advice_requests",
  tip: "tips",
  subscription: "subscriptions",
  challenge_update: "challenge_updates",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { recipient_email, type, actor_name, context = {} } = body;

    if (!recipient_email || !type || !actor_name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prefKey = TYPE_TO_PREF_KEY[type];

    // Check user preferences
    if (prefKey) {
      const prefs = await base44.asServiceRole.entities.NotificationPreferences.filter({ user_email: recipient_email });
      const userPrefs = prefs[0];

      // If preferences exist and email is explicitly disabled, skip
      if (userPrefs && userPrefs[`${prefKey}_email`] === false) {
        return Response.json({ sent: false, reason: "Email notifications disabled by user" });
      }
    }

    // Build email
    const templateFn = EMAIL_TEMPLATES[type];
    if (!templateFn) {
      return Response.json({ sent: false, reason: "Unknown notification type" });
    }

    const { subject, body: emailBody } = templateFn(actor_name, context);

    const styledBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698f6f4f4e61dd2806b88ed2/15137601c_392DC896-FFC0-4491-BCB6-20C0C160BF03.png" alt="SportSphere" style="width: 48px; height: 48px; object-fit: contain;" />
          <h1 style="color: #1e3a5f; font-size: 20px; margin: 8px 0 0;">SportSphere</h1>
        </div>
        <div style="background: white; border-radius: 12px; padding: 24px; color: #334155; font-size: 15px; line-height: 1.6;">
          ${emailBody}
        </div>
        <p style="text-align: center; margin-top: 16px; font-size: 12px; color: #94a3b8;">
          You're receiving this because you have email notifications enabled.<br/>
          <a href="${context.appUrl || 'https://sporthub.base44.app'}" style="color: #3b82f6;">Manage preferences</a>
        </p>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient_email,
      subject,
      body: styledBody,
      from_name: "SportSphere",
    });

    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});