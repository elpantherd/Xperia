import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function Dashboard() {
  const user = useQuery(api.users.getCurrentUser);
  const matches = useQuery(api.matches.getMyMatches);
  const notifications = useQuery(api.notifications.getNotifications);
  const findMatches = useMutation(api.matching.findMatches);
  const createTestMatch = useMutation(api.testData.createTestMatch);

  const activeMatches = matches?.filter(m => m.status === "mutual") || [];
  const pendingMatches = matches?.filter(m => m.status === "pending") || [];
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];

  const handleCreateTestMatch = async () => {
    try {
      const result = await createTestMatch({});
      toast.success("Test match created! Check your matches tab.");
      console.log("Test match created:", result);
    } catch (error) {
      toast.error("Failed to create test match");
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-2">
          Welcome back, {user?.name}! 👋
        </h2>
        <p className="text-gray-300 text-lg">
          Your AI agent is working to find your perfect travel companions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Matches"
          value={activeMatches.length}
          icon="💫"
          gradient="from-green-400 to-blue-500"
        />
        <StatCard
          title="Pending Matches"
          value={pendingMatches.length}
          icon="⏳"
          gradient="from-yellow-400 to-orange-500"
        />
        <StatCard
          title="New Notifications"
          value={unreadNotifications.length}
          icon="🔔"
          gradient="from-purple-400 to-pink-500"
        />
      </div>

      {/* AI Agent Status */}
      <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center">
            🤖 Your AI Agent Status
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Active</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Current Settings</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div>Search Radius: {user?.agentPreferences?.notificationRadius || 50}km</div>
              <div>Compatibility Threshold: {user?.agentPreferences?.compatibilityThreshold || 70}%</div>
              <div>Auto-Match: {user?.agentPreferences?.autoMatch ? "Enabled" : "Disabled"}</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Recent Activity</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div>✅ Scanned for new travelers</div>
              <div>🔍 Analyzed {pendingMatches.length} potential matches</div>
              <div>💌 Generated {activeMatches.length} introductions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      {activeMatches.length > 0 && (
        <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">🌟 Recent Matches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMatches.slice(0, 4).map((match) => (
              <div
                key={match._id}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-400/50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {match.otherUser?.name?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{match.otherUser?.name}</h4>
                    <p className="text-gray-400 text-sm">{match.compatibilityScore}% compatible</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-3 line-clamp-2">
                  {match.matchReason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">🚀 Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ActionButton
            title="Find Matches Now"
            description="Search for compatible travelers"
            icon="🔍"
            onClick={async () => {
              try {
                const result = await findMatches({});
                toast.success(`Found ${result.matchesCreated} new matches!`);
              } catch (error) {
                toast.error("Failed to find matches");
              }
            }}
          />
          <ActionButton
            title="Create Test Match"
            description="Add a demo match for testing"
            icon="🧪"
            onClick={handleCreateTestMatch}
          />
          <ActionButton
            title="Update Location"
            description="Refresh your current location"
            icon="📍"
            onClick={() => {
              toast.info("Location update coming soon!");
            }}
          />
          <ActionButton
            title="Adjust Preferences"
            description="Fine-tune your AI agent"
            icon="⚙️"
            onClick={() => {
              toast.info("Preferences panel coming soon!");
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  gradient 
}: { 
  title: string; 
  value: number; 
  icon: string; 
  gradient: string; 
}) {
  return (
    <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ 
  title, 
  description, 
  icon, 
  onClick 
}: { 
  title: string; 
  description: string; 
  icon: string; 
  onClick: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 transition-all text-left"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="text-white font-medium">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </button>
  );
}
