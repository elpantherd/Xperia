import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const crons = cronJobs();

// Run autonomous agent every 5 minutes for testing
crons.interval("autonomous agent", { minutes: 5 }, internal.crons.runAgentForAllUsers, {});

// Clean up expired matches daily
crons.interval("cleanup expired matches", { hours: 24 }, internal.crons.cleanupExpiredMatches, {});

export const runAgentForAllUsers = internalAction({
  args: {},
  handler: async (ctx) => {
    const activeUsers = await ctx.runQuery(internal.crons.getActiveUsers, {});
    
    for (const user of activeUsers) {
      if (user.agentPreferences?.autoMatch) {
        await ctx.runAction(internal.ai.runAutonomousAgent, { userId: user._id });
      }
    }
  },
});

export const getActiveUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return users;
  },
});

export const cleanupExpiredMatches = internalAction({
  args: {},
  handler: async (ctx) => {
    const expiredMatches = await ctx.runQuery(internal.crons.getExpiredMatches, {});
    
    for (const match of expiredMatches) {
      await ctx.runMutation(internal.crons.updateMatchStatus, {
        matchId: match._id,
        status: "expired",
      });
    }
  },
});

export const getExpiredMatches = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredMatches = await ctx.db.query("matches")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return expiredMatches;
  },
});

export const updateMatchStatus = internalMutation({
  args: {
    matchId: v.id("matches"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.matchId, { status: args.status });
  },
});

export default crons;
