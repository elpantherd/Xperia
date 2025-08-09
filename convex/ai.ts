import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const generateMatchReason = action({
  args: {
    user1: v.any(),
    user2: v.any(),
    compatibilityScore: v.number(),
  },
  handler: async (ctx, args) => {
    const prompt = `You are Xperia's AI travel companion. Generate a friendly, engaging explanation for why these two solo travelers are compatible:

User 1: ${args.user1.name}, age ${args.user1.age}
- Interests: ${args.user1.interests.join(", ")}
- Travel style: ${args.user1.travelStyle}
- Languages: ${args.user1.languages.join(", ")}
- Location: ${args.user1.location.city}, ${args.user1.location.country}

User 2: ${args.user2.name}, age ${args.user2.age}
- Interests: ${args.user2.interests.join(", ")}
- Travel style: ${args.user2.travelStyle}
- Languages: ${args.user2.languages.join(", ")}
- Location: ${args.user2.location.city}, ${args.user2.location.country}

Compatibility Score: ${args.compatibilityScore}%

Write a warm, encouraging 2-3 sentence explanation focusing on shared interests and complementary travel styles. Make it sound like a friendly AI assistant who genuinely wants to help them connect.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.7,
          }
        })
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "You both share a passion for authentic travel experiences!";
    } catch (error) {
      console.error("Gemini API error:", error);
      return "You both share a passion for authentic travel experiences!";
    }
  },
});

export const generateItinerarySuggestions = action({
  args: {
    destination: v.string(),
    interests: v.array(v.string()),
    travelStyle: v.string(),
    duration: v.number(), // days
    budget: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = `You are Xperia's AI travel companion. Create a personalized ${args.duration}-day itinerary for ${args.destination}.

Traveler Profile:
- Interests: ${args.interests.join(", ")}
- Travel style: ${args.travelStyle}
- Budget: ${args.budget}

Generate 5-7 specific, actionable suggestions that match their interests and style. Focus on unique experiences, local culture, and opportunities to meet other travelers. Keep each suggestion to 1-2 sentences. Format as a numbered list.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.8,
          }
        })
      });

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const suggestions = content.split('\n').filter((s: string) => s.trim() && (s.match(/^\d+\./) || s.match(/^-/)));
      return suggestions.slice(0, 7);
    } catch (error) {
      console.error("Gemini API error:", error);
      return ["Explore local markets and try authentic cuisine", "Visit cultural landmarks and museums", "Join walking tours to meet fellow travelers"];
    }
  },
});

export const generateMeetupSuggestion = action({
  args: {
    user1: v.any(),
    user2: v.any(),
    commonInterests: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `You are Xperia's AI travel companion. Suggest a perfect first meetup for these two compatible solo travelers:

${args.user1.name} (${args.user1.travelStyle} traveler) and ${args.user2.name} (${args.user2.travelStyle} traveler)

Common interests: ${args.commonInterests.join(", ")}
Location: ${args.user1.location.city}, ${args.user1.location.country}

Suggest a specific, safe, public activity that would be perfect for them to meet. Include the type of place, what they could do together, and why it matches their interests. Keep it to 2-3 sentences and make it sound exciting!`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: 120,
            temperature: 0.8,
          }
        })
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Meet at a local café to share travel stories and plan your next adventure together!";
    } catch (error) {
      console.error("Gemini API error:", error);
      return "Meet at a local café to share travel stories and plan your next adventure together!";
    }
  },
});

export const runAutonomousAgent = internalAction({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get user data
    const user = await ctx.runQuery(internal.users.getUser, { userId: args.userId });
    if (!user || !user.agentPreferences?.autoMatch) return;

    // Find potential matches
    const nearbyUsers = await ctx.runQuery(internal.users.getNearbyUsersForAgent, { 
      userId: args.userId,
      radius: user.agentPreferences?.notificationRadius || 50 
    });

    // Generate matches for compatible users
    for (const potentialMatch of nearbyUsers) {
      const compatibilityScore = calculateCompatibility(user, potentialMatch);
      
      if (compatibilityScore >= (user.agentPreferences?.compatibilityThreshold || 50)) {
        // Check if match already exists
        const existingMatch = await ctx.runQuery(internal.matches.getExistingMatch, {
          user1Id: args.userId,
          user2Id: potentialMatch._id,
        });

        if (!existingMatch) {
          // Generate AI explanation
          const matchReason = `You both share ${findCommonInterests(user.interests || [], potentialMatch.interests || []).length} common interests and have compatible travel styles!`;

          // Create match
          await ctx.runMutation(internal.matches.createMatch, {
            user1Id: args.userId,
            user2Id: potentialMatch._id,
            compatibilityScore,
            matchReason,
            commonInterests: findCommonInterests(user.interests || [], potentialMatch.interests || []),
            createdByAgent: true,
          });

          // Create notification
          await ctx.runMutation(internal.notifications.create, {
            userId: args.userId,
            title: "New Travel Companion Found! ✈️",
            message: `Your AI agent found ${potentialMatch.name} nearby - ${compatibilityScore}% compatible!`,
            type: "match",
          });
        }
      }
    }
  },
});

function calculateCompatibility(user1: any, user2: any): number {
  let score = 0;
  
  // Age compatibility (less important)
  if (user1.age && user2.age) {
    const ageDiff = Math.abs(user1.age - user2.age);
    if (ageDiff <= 5) score += 20;
    else if (ageDiff <= 10) score += 10;
    else if (ageDiff <= 15) score += 5;
  }
  
  // Travel style compatibility (most important)
  if (user1.travelStyle && user2.travelStyle) {
    if (user1.travelStyle === user2.travelStyle) {
      score += 40; // High score for same travel style
    } else if (isCompatibleTravelStyle(user1.travelStyle, user2.travelStyle)) {
      score += 20; // Medium score for compatible styles
    }
  }
  
  // Common interests (very important)
  const commonInterests = findCommonInterests(user1.interests || [], user2.interests || []);
  score += commonInterests.length * 15; // 15 points per common interest
  
  // Language compatibility
  if (user1.languages && user2.languages) {
    const commonLanguages = user1.languages.filter((lang: string) => user2.languages.includes(lang));
    score += commonLanguages.length * 5; // 5 points per common language
  }
  
  return Math.min(100, score);
}

function findCommonInterests(interests1: string[], interests2: string[]): string[] {
  return interests1.filter(interest => interests2.includes(interest));
}

function isCompatibleTravelStyle(style1: string, style2: string): boolean {
  const compatiblePairs = [
    ["adventure", "nature"],
    ["cultural", "relaxed"],
    ["party", "adventure"],
  ];
  
  return compatiblePairs.some(pair => 
    (pair[0] === style1 && pair[1] === style2) || 
    (pair[1] === style1 && pair[0] === style2)
  );
}
