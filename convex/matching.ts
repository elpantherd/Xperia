import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const findMatches = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) throw new Error("User not found");

    const allUsers = await ctx.db.query("users")
      .filter((q) => q.neq(q.field("_id"), userId))
      .collect();

    let matchesCreated = 0;

    for (const user of allUsers) {
      // Check if match already exists
      const existingMatch = await ctx.db.query("matches")
        .filter((q) => 
          q.or(
            q.and(q.eq(q.field("user1Id"), userId), q.eq(q.field("user2Id"), user._id)),
            q.and(q.eq(q.field("user1Id"), user._id), q.eq(q.field("user2Id"), userId))
          )
        )
        .first();

      if (existingMatch) continue;

      // Simple compatibility scoring
      let score = 0;
      
      // Same travel style = high compatibility
      if (currentUser.travelStyle === user.travelStyle) {
        score += 60;
      }
      
      // Common interests
      const commonInterests = (currentUser.interests || []).filter(interest => 
        (user.interests || []).includes(interest)
      );
      score += commonInterests.length * 20;
      
      // Create match if score is high enough
      if (score >= 40) {
        const matchReason = currentUser.travelStyle === user.travelStyle 
          ? `You both love ${currentUser.travelStyle} travel - perfect match!`
          : `You share ${commonInterests.length} common interests!`;

        await ctx.db.insert("matches", {
          user1Id: userId,
          user2Id: user._id,
          compatibilityScore: score,
          status: "pending",
          matchReason,
          commonInterests,
          suggestedActivities: commonInterests.slice(0, 3),
          createdByAgent: false,
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        });

        matchesCreated++;
      }
    }

    return { matchesCreated };
  },
});
