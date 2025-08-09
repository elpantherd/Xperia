import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface OnboardingFormProps {
  onComplete: () => void;
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    languages: [] as string[],
    interests: [] as string[],
    travelStyle: "",
    bio: "",
    location: {
      latitude: 0,
      longitude: 0,
      city: "",
      country: "",
    },
  });

  const updateProfile = useMutation(api.users.updateProfile);

  const interestOptions = [
    "Adventure Sports", "Photography", "Local Cuisine", "Museums", "Nightlife",
    "Nature & Hiking", "Beach & Water", "Cultural Sites", "Shopping", "Music & Festivals",
    "Art & Architecture", "History", "Wildlife", "Wellness & Spa", "Street Food"
  ];

  const languageOptions = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese", "Chinese",
    "Japanese", "Korean", "Arabic", "Russian", "Hindi", "Dutch", "Swedish"
  ];

  const travelStyleOptions = [
    { id: "adventure", label: "Adventure", desc: "Thrills and excitement" },
    { id: "cultural", label: "Cultural", desc: "Museums and local experiences" },
    { id: "relaxed", label: "Relaxed", desc: "Slow travel and leisure" },
    { id: "party", label: "Social", desc: "Nightlife and social scenes" },
    { id: "nature", label: "Nature", desc: "Outdoors and natural beauty" },
  ];

  const handleLocationAccess = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Simulate reverse geocoding (in real app, use a geocoding service)
          const city = "Current City";
          const country = "Current Country";
          
          setFormData(prev => ({
            ...prev,
            location: { latitude, longitude, city, country }
          }));
          
          toast.success("Location detected successfully!");
          setStep(2);
        },
        (error) => {
          console.error("Location error:", error);
          // Use default location for demo
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: 40.7128,
              longitude: -74.0060,
              city: "New York",
              country: "USA"
            }
          }));
          toast.info("Using default location for demo");
          setStep(2);
        }
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  const handleSubmit = async () => {
    try {
      await updateProfile({
        name: formData.name,
        age: parseInt(formData.age),
        languages: formData.languages,
        interests: formData.interests,
        travelStyle: formData.travelStyle,
        bio: formData.bio,
        location: formData.location,
      });
      
      toast.success("Profile created! Your AI agent is now active 🤖");
      onComplete();
    } catch (error) {
      toast.error("Failed to create profile");
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-black/20 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to Xperia</h2>
          <p className="text-gray-300">Let's set up your AI travel companion</p>
          
          <div className="flex justify-center mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full mx-1 ${
                  i <= step ? "bg-cyan-400" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">📍 Location Access</h3>
            <p className="text-gray-300 mb-6">
              Xperia needs your location to find compatible travelers nearby. 
              Your location is only used for matching and is never shared publicly.
            </p>
            <button
              onClick={handleLocationAccess}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              Enable Location Access
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">👋 Basic Info</h3>
            
            <div>
              <label className="block text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                placeholder="Your travel name"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                placeholder="25"
                min="18"
                max="100"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Languages</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {languageOptions.map((lang) => (
                  <label key={lang} className="flex items-center space-x-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(lang)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            languages: [...prev.languages, lang]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            languages: prev.languages.filter(l => l !== lang)
                          }));
                        }
                      }}
                      className="rounded border-gray-600 bg-white/10"
                    />
                    <span className="text-sm">{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!formData.name || !formData.age || formData.languages.length === 0}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">🎯 Travel Preferences</h3>
            
            <div>
              <label className="block text-gray-300 mb-3">Travel Style</label>
              <div className="grid grid-cols-1 gap-3">
                {travelStyleOptions.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setFormData(prev => ({ ...prev, travelStyle: style.id }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.travelStyle === style.id
                        ? "border-cyan-400 bg-cyan-400/10"
                        : "border-white/20 bg-white/5 hover:border-white/40"
                    }`}
                  >
                    <div className="text-white font-semibold">{style.label}</div>
                    <div className="text-gray-400 text-sm">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Interests</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {interestOptions.map((interest) => (
                  <label key={interest} className="flex items-center space-x-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(interest)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            interests: [...prev.interests, interest]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            interests: prev.interests.filter(i => i !== interest)
                          }));
                        }
                      }}
                      className="rounded border-gray-600 bg-white/10"
                    />
                    <span className="text-sm">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!formData.travelStyle || formData.interests.length === 0}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">✨ Final Touch</h3>
            
            <div>
              <label className="block text-gray-300 mb-2">Bio (Optional)</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none h-24 resize-none"
                placeholder="Tell other travelers about yourself..."
              />
            </div>

            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 rounded-xl p-4 border border-cyan-400/20">
              <h4 className="text-white font-semibold mb-2">🤖 Your AI Agent</h4>
              <p className="text-gray-300 text-sm">
                Your personal AI travel companion will autonomously find compatible travelers, 
                suggest meetups, and help plan amazing experiences. It works 24/7 so you don't have to!
              </p>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              Activate My AI Agent 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
