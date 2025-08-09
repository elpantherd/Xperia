import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    console.log("getConversations - userId:", userId);

    const allConversations = await ctx.db.query("conversations").collect();
    console.log("getConversations - all conversations:", allConversations);

    const conversations = allConversations.filter(conv => 
      conv.participants.includes(userId)
    );
    console.log("getConversations - user conversations:", conversations);

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = conversation.participants.find(id => id !== userId);
        const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;
        
        const match = await ctx.db.get(conversation.matchId);
        console.log("getConversations - match for conversation:", conversation._id, "match:", match);
        
        return {
          ...conversation,
          otherUser: otherUser ? {
            _id: otherUser._id,
            name: otherUser.name,
            profileImage: otherUser.profileImage,
          } : null,
          match: match ? {
            _id: match._id,
            compatibilityScore: match.compatibilityScore,
            matchReason: match.matchReason,
            commonInterests: match.commonInterests,
          } : null,
        };
      })
    );

    const result = conversationsWithDetails.filter(conv => conv.otherUser !== null);
    console.log("getConversations - final result:", result);
    return result;
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error("Not authorized");
    }

    const messages = await ctx.db.query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc") // Chronological order - oldest first
      .collect();

    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: sender ? {
            _id: sender._id,
            name: sender.name,
            profileImage: sender.profileImage,
          } : null,
        };
      })
    );

    return messagesWithSender;
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error("Not authorized");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      content: args.content,
      type: args.type || "text",
      isFromAgent: false,
      readBy: [userId],
    });

    // Update conversation with last message info
    await ctx.db.patch(args.conversationId, {
      lastMessage: args.content,
      lastMessageTime: Date.now(),
    });

    // Notify other participants
    const otherParticipants = conversation.participants.filter(id => id !== userId);
    for (const participantId of otherParticipants) {
      const sender = await ctx.db.get(userId);
      await ctx.db.insert("notifications", {
        userId: participantId,
        title: `New message from ${sender?.name}`,
        message: args.content.substring(0, 50) + (args.content.length > 50 ? "..." : ""),
        type: "message",
        isRead: false,
        actionUrl: `/chat/${args.conversationId}`,
      });
    }

    return messageId;
  },
});
