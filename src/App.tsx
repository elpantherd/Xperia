import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { OnboardingForm } from "./components/OnboardingForm";
import { Dashboard } from "./components/Dashboard";
import { MatchesFeed } from "./components/MatchesFeed";
import { ChatWindow } from "./components/ChatWindow";
import { NotificationBell } from "./components/NotificationBell";


export default function App() {
  const [currentView, setCurrentView] = useState<"dashboard" | "matches" | "chat">("dashboard");
  const [selectedChatId, setSelectedChatId] = useState<Id<"conversations"> | null>(null);

  const handleStartChat = (chatId: Id<"conversations">) => {
    console.log("handleStartChat called with:", chatId);
    setSelectedChatId(chatId);
    setCurrentView("chat");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">X</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Xperia
            </h1>
          </div>
          
          <Authenticated>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <SignOutButton />
            </div>
          </Authenticated>
        </div>
      </header>

      <main className="flex-1">
        <Content 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          selectedChatId={selectedChatId}
          onStartChat={handleStartChat}
        />
      </main>
      
      <Toaster theme="dark" />
    </div>
  );
}

function Content({ 
  currentView, 
  setCurrentView, 
  selectedChatId, 
  onStartChat 
}: {
  currentView: "dashboard" | "matches" | "chat";
  setCurrentView: (view: "dashboard" | "matches" | "chat") => void;
  selectedChatId: Id<"conversations"> | null;
  onStartChat: (chatId: Id<"conversations">) => void;
}) {
  const user = useQuery(api.users.getCurrentUser);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && (!user.name || !user.location)) {
      setShowOnboarding(true);
    }
  }, [user]);

  if (user === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
            <h2 className="text-5xl font-bold text-white mb-4">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Travel Companion
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl">
              Let our AI agent autonomously match you with compatible solo travelers nearby. 
              Experience the future of travel connections.
            </p>
          </div>
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        {showOnboarding ? (
          <OnboardingForm onComplete={() => setShowOnboarding(false)} />
        ) : (
          <>
            {currentView !== "chat" && (
              <Navigation currentView={currentView} setCurrentView={setCurrentView} />
            )}
            
            {currentView === "dashboard" && <Dashboard />}
            {currentView === "matches" && <MatchesFeed onStartChat={onStartChat} />}
            {currentView === "chat" && (
              <ChatWindow 
                chatId={selectedChatId} 
                onBack={() => setCurrentView("matches")} 
              />
            )}
          </>
        )}
      </Authenticated>
    </div>
  );
}

function Navigation({ 
  currentView, 
  setCurrentView 
}: {
  currentView: string;
  setCurrentView: (view: "dashboard" | "matches" | "chat") => void;
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "matches", label: "Matches", icon: "💫" },
  ];

  return (
    <nav className="flex justify-center mb-8">
      <div className="bg-black/20 backdrop-blur-lg rounded-full p-1 border border-white/10">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as "dashboard" | "matches" | "chat")}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
              currentView === item.id
                ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-lg"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
