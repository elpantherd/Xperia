import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface MatchesFeedProps {
  onStartChat: (chatId: Id<"conversations">) => void;
}

export function MatchesFeed({ onStartChat }: MatchesFeedProps) {
  const matches = useQuery(api.matches.getMyMatches);
  const respondToMatch = useMutation(api.matches.respondToMatch);

  const handleConnect = async (matchId: Id<"matches">) => {
    try {
      const result = await respondToMatch({ matchId, response: "accept" });
      if (result.conversationId) {
        toast.success("Connected! Starting chat...");
        onStartChat(result.conversationId);
      } else {
        toast.success("Match accepted! Waiting for their response.");
      }
    } catch (error) {
      toast.error("Failed to connect");
      console.error(error);
    }
  };

  const handleDecline = async (matchId: Id<"matches">) => {
    try {
      await respondToMatch({ matchId, response: "decline" });
      toast.success("Match declined");
    } catch (error) {
      toast.error("Failed to decline match");
    }
  };

  if (!matches) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  const pendingMatches = matches.filter(m => m.status === "pending");
  const mutualMatches = matches.filter(m => m.status === "mutual");

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-2">Your Matches ✨</h2>
        <p className="text-gray-300 text-lg">
          Connect with compatible travelers and start planning amazing adventures
        </p>
      </div>

      {/* Mutual Matches - Connected */}
      {mutualMatches.length > 0 && (
        <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            💬 Connected Matches
            <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              {mutualMatches.length}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mutualMatches.map((match) => (
              <ConnectedMatchCard 
                key={match._id} 
                match={match} 
                onStartChat={onStartChat}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Matches */}
      {pendingMatches.length > 0 && (
        <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            ⏳ New Matches
            <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {pendingMatches.length}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingMatches.map((match) => (
              <MatchCard
                key={match._id}
                match={match}
                onConnect={() => handleConnect(match._id)}
                onDecline={() => handleDecline(match._id)}
              />
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No matches yet</h3>
          <p className="text-gray-400">
            Your AI agent is working to find compatible travelers. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}

function MatchCard({ 
  match, 
  onConnect, 
  onDecline 
}: { 
  match: any; 
  onConnect: () => void; 
  onDecline: () => void; 
}) {
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-cyan-400/50 transition-all">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xl">
            {match.otherUser?.name?.charAt(0) || "?"}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-semibold text-lg">{match.otherUser?.name}</h4>
            <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
              {match.compatibilityScore}% match
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="text-gray-300 text-sm">
              📍 {match.otherUser?.location?.city}, {match.otherUser?.location?.country}
            </p>
            <p className="text-gray-300 text-sm">
              🎯 {match.otherUser?.travelStyle} traveler
            </p>
            {match.commonInterests?.length > 0 && (
              <p className="text-gray-300 text-sm">
                💫 {match.commonInterests.slice(0, 3).join(", ")}
              </p>
            )}
          </div>
          
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {match.matchReason}
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={onConnect}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Connect 💬
            </button>
            <button
              onClick={onDecline}
              className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-all"
            >
              Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectedMatchCard({ 
  match, 
  onStartChat 
}: { 
  match: any; 
  onStartChat: (chatId: Id<"conversations">) => void; 
}) {
  const conversations = useQuery(api.chat.getConversations);
  const createConversation = useMutation(api.matches.respondToMatch);
  
  // Find conversation for this match
  const conversation = conversations?.find(conv => conv.matchId === match._id);

  const handleStartChat = async () => {
    console.log("ConnectedMatchCard - handleStartChat called");
    console.log("Match ID:", match._id);
    console.log("Available conversations:", conversations);
    console.log("Found conversation:", conversation);
    
    if (conversation) {
      console.log("Starting chat with conversation ID:", conversation._id);
      onStartChat(conversation._id);
    } else {
      console.log("No conversation found, trying to create one...");
      try {
        // Try to create/get conversation by accepting the match again
        const result = await createConversation({ matchId: match._id, response: "accept" });
        if (result.conversationId) {
          console.log("Created conversation:", result.conversationId);
          onStartChat(result.conversationId);
        } else {
          toast.error("Failed to create conversation. Please try refreshing the page.");
        }
      } catch (error) {
        console.error("Error creating conversation:", error);
        toast.error("Failed to start chat. Please try again.");
      }
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-green-400/30 hover:border-green-400/50 transition-all">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xl">
            {match.otherUser?.name?.charAt(0) || "?"}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-semibold text-lg">{match.otherUser?.name}</h4>
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Connected ✓
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="text-gray-300 text-sm">
              📍 {match.otherUser?.location?.city}, {match.otherUser?.location?.country}
            </p>
            <p className="text-gray-300 text-sm">
              🎯 {match.otherUser?.travelStyle} traveler
            </p>
          </div>
          
          {conversation?.lastMessage && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-1">
              💬 {conversation.lastMessage}
            </p>
          )}
          
          <button
            onClick={handleStartChat}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Start Chatting 💬
          </button>
          
          {/* Debug info - remove in production */}
          <div className="mt-2 text-xs text-gray-500">
            <div>Match ID: {match._id}</div>
            <div>Conversation: {conversation ? conversation._id : "Not found"}</div>
            <div>Conversations loaded: {conversations ? conversations.length : "Loading..."}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
