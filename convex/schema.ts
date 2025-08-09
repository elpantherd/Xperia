import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    languages: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    travelStyle: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      city: v.string(),
      country: v.string(),
    })),
    profileImage: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    lastSeen: v.optional(v.number()),
    agentPreferences: v.optional(v.object({
      autoMatch: v.boolean(),
      notificationRadius: v.number(),
      compatibilityThreshold: v.number(),
    })),
  })
    .index("by_active", ["isActive"])
    .index("by_email", ["email"]),

  matches: defineTable({
    user1Id: v.id("users"),
    user2Id: v.id("users"),
    compatibilityScore: v.number(),
    status: v.string(), // "pending", "mutual", "declined", "expired"
    matchReason: v.string(),
    commonInterests: v.array(v.string()),
    suggestedActivities: v.optional(v.array(v.string())),
    createdByAgent: v.boolean(),
    expiresAt: v.number(),
  })
    .index("by_user1", ["user1Id"])
    .index("by_user2", ["user2Id"])
    .index("by_status", ["status"])
    .index("by_expiry", ["expiresAt"]),

  conversations: defineTable({
    matchId: v.id("matches"),
    participants: v.array(v.id("users")),
    isActive: v.boolean(),
    lastMessage: v.optional(v.string()),
    lastMessageTime: v.optional(v.number()),
  })
    .index("by_match", ["matchId"])
    .index("by_participants", ["participants"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.string(), // "text", "image", "system"
    isFromAgent: v.boolean(),
    readBy: v.array(v.id("users")),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(), // "match", "message", "system"
    isRead: v.boolean(),
    actionUrl: v.optional(v.string()),
    data: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_read", ["isRead"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
