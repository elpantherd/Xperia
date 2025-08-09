import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTestMatch = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Create a test user to match with
    const testUserId = await ctx.db.insert("users", {
      name: "Test Traveler",
      age: 28,
      languages: ["English", "Spanish"],
      interests: ["Photography", "Local Cuisine", "Adventure Sports"],
      travelStyle: "adventure",
      bio: "Love exploring new places and meeting fellow travelers!",
      location: {
        latitude: 40.7589,
        longitude: -73.9851,
        city: "New York",
        country: "USA"
      },
      isActive: true,
      lastSeen: Date.now(),
      agentPreferences: {
        autoMatch: true,
        notificationRadius: 50,
        compatibilityThreshold: 50,
      },
    });

    // Create a mutual match
    const matchId = await ctx.db.insert("matches", {
      user1Id: userId,
      user2Id: testUserId,
      compatibilityScore: 85,
      status: "mutual",
      matchReason: "You both love adventure travel and share common interests in photography and local cuisine!",
      commonInterests: ["Photography", "Local Cuisine", "Adventure Sports"],
      suggestedActivities: ["Photography", "Local Cuisine", "Adventure Sports"],
      createdByAgent: false,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Create a conversation for this match
    const conversationId = await ctx.db.insert("conversations", {
      matchId: matchId,
      participants: [userId, testUserId],
      isActive: true,
    });

    return { matchId, conversationId, testUserId };
  },
});
