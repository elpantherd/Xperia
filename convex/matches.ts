import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMyMatches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const matches = await ctx.db.query("matches")
      .filter((q) => 
        q.or(
          q.eq(q.field("user1Id"), userId),
          q.eq(q.field("user2Id"), userId)
        )
      )
      .filter((q) => q.neq(q.field("status"), "declined"))
      .order("desc")
      .collect();

    // Get user details for each match
    const matchesWithUsers = await Promise.all(
      matches.map(async (match) => {
        const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        const otherUser = await ctx.db.get(otherUserId);
        
        return {
          ...match,
          otherUser: otherUser ? {
            _id: otherUser._id,
            name: otherUser.name,
            age: otherUser.age,
            interests: otherUser.interests,
            travelStyle: otherUser.travelStyle,
            bio: otherUser.bio,
            location: otherUser.location,
            profileImage: otherUser.profileImage,
          } : null,
        };
      })
    );

    return matchesWithUsers.filter(match => match.otherUser !== null);
  },
});

export const respondToMatch = mutation({
  args: {
    matchId: v.id("matches"),
    response: v.string(), // "accept" or "decline"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    // Verify user is part of this match
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new Error("Not authorized");
    }

    if (args.response === "accept") {
      // Update match status to mutual
      await ctx.db.patch(args.matchId, { status: "mutual" });
      
      // Check if conversation already exists
      const existingConversation = await ctx.db.query("conversations")
        .withIndex("by_match", (q) => q.eq("matchId", args.matchId))
        .first();

      let conversationId;
      
      if (!existingConversation) {
        // Create conversation
        conversationId = await ctx.db.insert("conversations", {
          matchId: args.matchId,
          participants: [match.user1Id, match.user2Id],
          isActive: true,
        });
      } else {
        conversationId = existingConversation._id;
      }

      // Notify other user
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const currentUser = await ctx.db.get(userId);
      
      await ctx.db.insert("notifications", {
        userId: otherUserId,
        title: "It's a Match! 🎉",
        message: `${currentUser?.name} accepted your match! Start chatting now.`,
        type: "match",
        isRead: false,
      });

      return { conversationId };
    } else {
      await ctx.db.patch(args.matchId, { status: "declined" });
      return { conversationId: null };
    }
  },
});

export const createMatch = internalMutation({
  args: {
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    compatibilityScore: v.number(),
    matchReason: v.string(),
    commonInterests: v.array(v.string()),
    createdByAgent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const suggestedActivities = args.commonInterests.slice(0, 3); // Use common interests as activities
    
    const matchId = await ctx.db.insert("matches", {
      user1Id: args.user1Id,
      user2Id: args.user2Id,
      compatibilityScore: args.compatibilityScore,
      status: "pending",
      matchReason: args.matchReason,
      commonInterests: args.commonInterests,
      suggestedActivities,
      createdByAgent: args.createdByAgent,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return matchId;
  },
});

export const getExistingMatch = internalQuery({
  args: {
    user1Id: v.id("users"),
    user2Id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.query("matches")
      .filter((q) => 
        q.or(
          q.and(
            q.eq(q.field("user1Id"), args.user1Id),
            q.eq(q.field("user2Id"), args.user2Id)
          ),
          q.and(
            q.eq(q.field("user1Id"), args.user2Id),
            q.eq(q.field("user2Id"), args.user1Id)
          )
        )
      )
      .first();

    return match;
  },
});
