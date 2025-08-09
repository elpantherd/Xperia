import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const user = await ctx.db.get(userId);
    return user;
  },
});


export const updateProfile = mutation({
  args: {
    name: v.string(),
    age: v.number(),
    languages: v.array(v.string()),
    interests: v.array(v.string()),
    travelStyle: v.string(),
    bio: v.optional(v.string()),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      city: v.string(),
      country: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingUser = await ctx.db.get(userId);
    
    if (!existingUser) {
      // Create new user if doesn't exist
      await ctx.db.insert("users", {
        email: "",
        name: args.name,
        age: args.age,
        languages: args.languages,
        interests: args.interests,
        travelStyle: args.travelStyle,
        bio: args.bio,
        location: args.location,
        isActive: true,
        lastSeen: Date.now(),
        agentPreferences: {
          autoMatch: true,
          notificationRadius: 50,
          compatibilityThreshold: 50,
        },
      });
    } else {
      // Update existing user
      await ctx.db.patch(userId, {
      name: args.name,
      age: args.age,
      languages: args.languages,
      interests: args.interests,
      travelStyle: args.travelStyle,
      bio: args.bio,
      location: args.location,
      isActive: true,
      lastSeen: Date.now(),
        agentPreferences: {
          autoMatch: true,
          notificationRadius: 50,
          compatibilityThreshold: 50,
        },
      });
    }

    return userId;
  },
});

export const updateLocation = mutation({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    city: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      location: {
        latitude: args.latitude,
        longitude: args.longitude,
        city: args.city,
        country: args.country,
      },
      lastSeen: Date.now(),
    });

    return true;
  },
});

export const getNearbyUsers = query({
  args: {
    radius: v.optional(v.number()), // km
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) return [];

    const radius = args.radius || 50; // 50km default
    const users = await ctx.db.query("users")
      .filter((q) => q.neq(q.field("_id"), userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Simple distance calculation (Haversine formula approximation)
    const nearbyUsers = users.filter(user => {
      if (!currentUser.location || !user.location) return false;
      const distance = calculateDistance(
        currentUser.location.latitude,
        currentUser.location.longitude,
        user.location.latitude,
        user.location.longitude
      );
      return distance <= radius;
    });

    return nearbyUsers.map(user => ({
      _id: user._id,
      name: user.name,
      age: user.age,
      interests: user.interests,
      travelStyle: user.travelStyle,
      bio: user.bio,
      location: user.location,
      profileImage: user.profileImage,
    }));
  },
});

export const getUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const getNearbyUsersForAgent = internalQuery({
  args: {
    userId: v.id("users"),
    radius: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(args.userId);
    if (!currentUser) return [];

    const users = await ctx.db.query("users")
      .filter((q) => q.neq(q.field("_id"), args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const nearbyUsers = users.filter(user => {
      if (!currentUser.location || !user.location) return false;
      const distance = calculateDistance(
        currentUser.location.latitude,
        currentUser.location.longitude,
        user.location.latitude,
        user.location.longitude
      );
      return distance <= args.radius;
    });

    return nearbyUsers;
  },
});
