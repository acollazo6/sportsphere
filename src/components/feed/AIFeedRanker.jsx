import { base44 } from "@/api/base44Client";

/**
 * Uses AI to re-rank posts based on deep user profile analysis.
 * Returns array of { post, reason } sorted by AI relevance.
 */
export async function getAIRankedPosts({ user, posts, userSports, follows, likedPosts, myProfiles }) {
  if (!posts?.length || !user) return posts?.map(p => ({ post: p, reason: null })) || [];

  const followedEmails = new Set(follows?.map(f => f.following_email) || []);
  const likedSports = [...new Set(likedPosts?.map(p => p.sport).filter(Boolean) || [])];
  const likedCategories = [...new Set(likedPosts?.map(p => p.category).filter(Boolean) || [])];
  const likedAuthors = [...new Set(likedPosts?.map(p => p.author_email).filter(Boolean) || [])];
  const userLevel = myProfiles?.[0]?.level || "intermediate";
  const userRole = myProfiles?.[0]?.role || "athlete";
  const userLocation = myProfiles?.find(p => p.location)?.location || "";

  // Pre-filter to top 40 by basic signals before sending to AI
  const candidates = posts
    .filter(p => p.author_email !== user.email)
    .map(p => {
      let score = 0;
      if (followedEmails.has(p.author_email)) score += 120;
      if (userSports.includes(p.sport)) score += 60;
      if (likedSports.includes(p.sport)) score += 40;
      if (likedCategories.includes(p.category)) score += 30;
      if (likedAuthors.includes(p.author_email)) score += 50;
      score += (p.likes?.length || 0) * 2;
      score += (p.comments_count || 0) * 5;
      const hours = (Date.now() - new Date(p.created_date).getTime()) / 3600000;
      if (hours < 24) score += 40;
      else if (hours < 72) score += 20;
      return { ...p, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 30);

  const postContext = candidates.map(p => ({
    id: p.id,
    sport: p.sport,
    category: p.category,
    likes: p.likes?.length || 0,
    comments: p.comments_count || 0,
    from_followed: followedEmails.has(p.author_email),
    content_preview: p.content?.slice(0, 80),
  }));

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a sports social feed recommendation engine. Rank posts for a user based on their profile and interests.

USER:
- Sports: ${userSports.join(", ") || "General"}
- Level: ${userLevel}
- Role: ${userRole}
- Location: ${userLocation || "Not specified"}
- Liked sports patterns: ${likedSports.join(", ") || "None"}
- Liked categories: ${likedCategories.join(", ") || "None"}
- Frequently liked authors: ${likedAuthors.slice(0, 5).join(", ") || "None"}

POSTS TO RANK (JSON):
${JSON.stringify(postContext, null, 2)}

Return a JSON object with a "ranked" array of up to 20 objects:
- "id": the post id
- "reason": a short 5-8 word label for WHY this is shown (e.g. "Matches your soccer interest", "From someone you follow", "Trending in basketball")

Prioritize: followed authors > matching sport > matching category > engagement > recency.`,
    response_json_schema: {
      type: "object",
      properties: {
        ranked: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              reason: { type: "string" },
            }
          }
        }
      }
    }
  });

  const ranked = result?.ranked || [];
  const reasonMap = Object.fromEntries(ranked.map(r => [r.id, r.reason]));
  const orderedIds = ranked.map(r => r.id);
  const postMap = Object.fromEntries(candidates.map(p => [p.id, p]));

  // Build final list: AI-ordered first, then any remaining candidates
  const seen = new Set();
  const final = [];
  for (const id of orderedIds) {
    if (postMap[id]) { final.push({ post: postMap[id], reason: reasonMap[id] }); seen.add(id); }
  }
  for (const p of candidates) {
    if (!seen.has(p.id)) final.push({ post: p, reason: null });
  }
  return final;
}