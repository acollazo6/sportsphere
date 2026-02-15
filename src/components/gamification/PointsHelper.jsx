import { base44 } from "@/api/base44Client";

const POINTS_CONFIG = {
  POST_CREATED: 10,
  COMMENT_POSTED: 5,
  LIKE_GIVEN: 1,
  WORKOUT_LOGGED: 15,
  CHALLENGE_JOINED: 20,
  CHALLENGE_COMPLETED: 50,
  SESSION_ATTENDED: 30,
  FORUM_TOPIC_CREATED: 15,
  FORUM_REPLY: 5,
  DAILY_LOGIN: 5,
};

const BADGES = [
  { id: "first_post", name: "First Steps", icon: "👣", description: "Create your first post", condition: (points) => points.posts_created >= 1 },
  { id: "social_butterfly", name: "Social Butterfly", icon: "🦋", description: "Create 50 posts", condition: (points) => points.posts_created >= 50 },
  { id: "workout_warrior", name: "Workout Warrior", icon: "💪", description: "Complete 10 workouts", condition: (points) => points.workouts_completed >= 10 },
  { id: "iron_will", name: "Iron Will", icon: "⚡", description: "Complete 50 workouts", condition: (points) => points.workouts_completed >= 50 },
  { id: "challenge_seeker", name: "Challenge Seeker", icon: "🎯", description: "Complete 5 challenges", condition: (points) => points.challenges_completed >= 5 },
  { id: "champion", name: "Champion", icon: "🏆", description: "Complete 20 challenges", condition: (points) => points.challenges_completed >= 20 },
  { id: "coach_student", name: "Eager Learner", icon: "📚", description: "Attend 5 coaching sessions", condition: (points) => points.sessions_attended >= 5 },
  { id: "dedicated_athlete", name: "Dedicated Athlete", icon: "🔥", description: "Attend 20 coaching sessions", condition: (points) => points.sessions_attended >= 20 },
  { id: "community_helper", name: "Community Helper", icon: "🤝", description: "Make 25 forum contributions", condition: (points) => points.forum_contributions >= 25 },
  { id: "point_master", name: "Point Master", icon: "⭐", description: "Earn 1,000 points", condition: (points) => points.total_points >= 1000 },
  { id: "legend", name: "Legend", icon: "👑", description: "Earn 5,000 points", condition: (points) => points.total_points >= 5000 },
];

export async function awardPoints(userEmail, action, amount = null) {
  try {
    const points = amount || POINTS_CONFIG[action] || 0;
    if (points === 0) return;

    const userPointsList = await base44.entities.UserPoints.filter({ user_email: userEmail });
    let userPoints = userPointsList[0];

    if (!userPoints) {
      userPoints = await base44.entities.UserPoints.create({
        user_email: userEmail,
        total_points: 0,
        level: 1,
        workouts_completed: 0,
        sessions_attended: 0,
        posts_created: 0,
        challenges_completed: 0,
        forum_contributions: 0,
      });
    }

    const updates = {
      total_points: userPoints.total_points + points,
      level: Math.floor((userPoints.total_points + points) / 100) + 1,
    };

    // Update activity counters
    if (action === "POST_CREATED") updates.posts_created = (userPoints.posts_created || 0) + 1;
    if (action === "WORKOUT_LOGGED") updates.workouts_completed = (userPoints.workouts_completed || 0) + 1;
    if (action === "CHALLENGE_COMPLETED") updates.challenges_completed = (userPoints.challenges_completed || 0) + 1;
    if (action === "SESSION_ATTENDED") updates.sessions_attended = (userPoints.sessions_attended || 0) + 1;
    if (action === "FORUM_TOPIC_CREATED" || action === "FORUM_REPLY") {
      updates.forum_contributions = (userPoints.forum_contributions || 0) + 1;
    }

    await base44.entities.UserPoints.update(userPoints.id, updates);

    // Check for new badges
    const updatedPoints = { ...userPoints, ...updates };
    await checkAndAwardBadges(userEmail, updatedPoints);

    return updatedPoints;
  } catch (error) {
    console.error("Failed to award points:", error);
  }
}

async function checkAndAwardBadges(userEmail, userPoints) {
  try {
    const earnedBadges = await base44.entities.UserBadge.filter({ user_email: userEmail });
    const earnedBadgeIds = earnedBadges.map(b => b.badge_id);

    for (const badge of BADGES) {
      if (!earnedBadgeIds.includes(badge.id) && badge.condition(userPoints)) {
        await base44.entities.UserBadge.create({
          user_email: userEmail,
          badge_id: badge.id,
          badge_name: badge.name,
          badge_icon: badge.icon,
          badge_description: badge.description,
          earned_date: new Date().toISOString(),
        });

        // Notify user
        await base44.entities.Notification.create({
          recipient_email: userEmail,
          actor_email: "system",
          actor_name: "SportHub",
          type: "subscription",
          message: `🎉 You earned the "${badge.name}" badge! ${badge.description}`,
        });
      }
    }
  } catch (error) {
    console.error("Failed to check badges:", error);
  }
}

export { POINTS_CONFIG, BADGES };