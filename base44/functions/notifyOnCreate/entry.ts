import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

const EMAIL_TEMPLATES = {
  like: (actor) => ({
    subject: `${actor} liked your post`,
    body: `<p><strong>${actor}</strong> liked your post on SportSphere. Keep sharing great content!</p>`
  }),
  comment: (actor, ctx) => ({
    subject: `${actor} commented on your post`,
    body: `<p><strong>${actor}</strong> commented: <em>"${ctx.comment || ''}"</em></p>`
  }),
  mention: (actor) => ({
    subject: `${actor} mentioned you`,
    body: `<p><strong>${actor}</strong> mentioned you in a post on SportSphere.</p>`
  }),
  follow: (actor) => ({
    subject: `${actor} is now following you`,
    body: `<p><strong>${actor}</strong> started following you on SportSphere!</p>`
  }),
  follow_request: (actor) => ({
    subject: `${actor} sent you a follow request`,
    body: `<p><strong>${actor}</strong> wants to follow you. Log in to accept or decline.</p>`
  }),
  message: (actor) => ({
    subject: `New message from ${actor}`,
    body: `<p><strong>${actor}</strong> sent you a message on SportSphere.</p>`
  }),
  advice_request: (actor, ctx) => ({
    subject: `${actor} is asking for your advice`,
    body: `<p><strong>${actor}</strong> sent you an advice request about <strong>${ctx.topic || 'a topic'}</strong>.</p>`
  }),
  tip: (actor, ctx) => ({
    subject: `You received a tip from ${actor}!`,
    body: `<p><strong>${actor}</strong> sent you a tip! 🎉 ${ctx.amount ? `Amount: $${ctx.amount}` : ''}</p>`
  }),
  subscription: (actor) => ({
    subject: `${actor} subscribed to your content!`,
    body: `<p><strong>${actor}</strong> just subscribed to your content on SportSphere! 🎉</p>`
  }),
  challenge_update: (actor, ctx) => ({
    subject: `Challenge update: ${ctx.challenge || ''}`,
    body: `<p>There's a new update in a challenge you're participating in.</p>`
  }),
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { data, event } = payload;
    if (event?.type !== "create" || !data) {
      return Response.json({ skipped: true });
    }

    const { recipient_email, type, actor_name, message } = data;
    if (!recipient_email || !type || !actor_name) {
      return Response.json({ skipped: true, reason: "Missing fields" });
    }

    const prefKey = TYPE_TO_PREF_KEY[type];

    // Check user's email preferences
    let emailEnabled = true;
    if (prefKey) {
      const prefs = await base44.asServiceRole.entities.NotificationPreferences.filter({ user_email: recipient_email });
      const userPrefs = prefs[0];
      if (userPrefs && userPrefs[`${prefKey}_email`] === false) {
        emailEnabled = false;
      }
    }

    if (!emailEnabled) {
      return Response.json({ sent: false, reason: "Email disabled by user" });
    }

    const templateFn = EMAIL_TEMPLATES[type];
    if (!templateFn) {
      return Response.json({ sent: false, reason: "Unknown type" });
    }

    const { subject, body: emailBody } = templateFn(actor_name, {});

    const styledBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698f6f4f4e61dd2806b88ed2/15137601c_392DC896-FFC0-4491-BCB6-20C0C160BF03.png" alt="SportSphere" style="width: 48px; height: 48px; object-fit: contain;" />
          <h1 style="color: #1e3a5f; font-size: 20px; margin: 8px 0 0;">SportSphere</h1>
        </div>
        <div style="background: white; border-radius: 12px; padding: 24px; color: #334155; font-size: 15px; line-height: 1.6;">
          ${emailBody}
          <p style="margin-top: 16px; color: #64748b; font-size: 13px;">${message || ''}</p>
        </div>
        <p style="text-align: center; margin-top: 16px; font-size: 12px; color: #94a3b8;">
          You're receiving this because you have email notifications enabled for this event type.<br/>
          <a href="https://sporthub.base44.app" style="color: #3b82f6;">Manage preferences in SportSphere →</a>
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