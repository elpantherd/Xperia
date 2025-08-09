import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface ChatWindowProps {
  chatId: Id<"conversations"> | null;
  onBack: () => void;
}

export function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUser = useQuery(api.users.getCurrentUser);
  const conversation = useQuery(api.chat.getConversations)?.find(c => c._id === chatId);
  const messages = useQuery(api.chat.getMessages, chatId ? { conversationId: chatId } : "skip");
  const sendMessage = useMutation(api.chat.sendMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chatId) return;

    try {
      await sendMessage({
        conversationId: chatId,
        content: message.trim(),
      });
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    }
  };

  if (!chatId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-white mb-2">No chat selected</h3>
          <p className="text-gray-400">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  if (!conversation || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="bg-black/20 backdrop-blur-lg rounded-t-3xl p-4 border border-white/10 border-b-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <span className="text-white text-xl">←</span>
            </button>
            
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {conversation.otherUser?.name?.charAt(0) || "?"}
              </span>
            </div>
            
            <div>
              <h3 className="text-white font-semibold">{conversation.otherUser?.name}</h3>
              <p className="text-gray-400 text-sm">
                {conversation.match?.compatibilityScore}% compatible • Plan your meetup!
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="bg-black/20 backdrop-blur-lg border border-white/10 border-t-0 border-b-0 h-96 overflow-y-auto p-4 space-y-4">
        {/* Welcome Message */}
        <div className="text-center py-4">
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 rounded-xl p-4 border border-cyan-400/20 max-w-md mx-auto">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-white font-medium mb-1">You're connected!</p>
            <p className="text-gray-300 text-sm">
              Start planning your meetup and travel adventures together
            </p>
          </div>
        </div>

        {/* Match Info Card */}
        {conversation.match && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-w-md mx-auto">
            <h4 className="text-white font-medium mb-2">Why you matched:</h4>
            <p className="text-gray-300 text-sm mb-3">{conversation.match.matchReason}</p>
            {conversation.match.commonInterests?.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs mb-1">Common interests:</p>
                <div className="flex flex-wrap gap-1">
                  {conversation.match.commonInterests.slice(0, 4).map((interest) => (
                    <span
                      key={interest}
                      className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full text-xs"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages - Ordered chronologically (oldest first) */}
        {messages?.map((msg) => (
          <MessageBubble 
            key={msg._id} 
            message={msg} 
            isCurrentUser={msg.senderId === currentUser._id}
          />
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-black/20 backdrop-blur-lg rounded-b-3xl p-4 border border-white/10 border-t-0">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Plan your meetup, share travel ideas..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send 📤
          </button>
        </form>
        
        {/* Quick Suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            "Where should we meet? 📍",
            "What activities interest you? 🎯",
            "When are you free to meet? 📅",
            "Any local recommendations? 🌟"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setMessage(suggestion)}
              className="bg-white/5 text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-white/10 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  isCurrentUser 
}: { 
  message: any; 
  isCurrentUser: boolean; 
}) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
        isCurrentUser 
          ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white' 
          : 'bg-white/10 text-white border border-white/20'
      }`}>
        {!isCurrentUser && (
          <p className="text-xs text-gray-300 mb-1">{message.sender?.name}</p>
        )}
        <p className="text-sm">{message.content}</p>
        <p className={`text-xs mt-1 ${
          isCurrentUser ? 'text-white/70' : 'text-gray-400'
        }`}>
          {new Date(message._creationTime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
}
