
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../integrations/supabase/client";
import {
  Menu,
  LogOut,
  X,
  Bell,
  Home,
  Settings,
  MessageSquarePlus,
  Type,
  FileText,
  Hash,
  Lightbulb,
  User,
  ScrollText,
  ChevronDown,
  Check,
  Copy,
  Loader2,
} from "lucide-react";
import SidebarNav from "../components/dashboard/SidebarNav";
import DashboardFeatures from "../components/dashboard/DashboardFeatures";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/use-subscription";
import {
  getRemainingUses,
  canGenerate,
  updateUsage,
  FeatureType,
  subscriptionLimits,
} from "../components/dashboard/usageLimits";
import { NavItem } from "../types/dashboard";
import { BackgroundGradientAnimation } from "../components/ui/background-gradient-animation";
import ContentGeneratorResultCard from "../components/dashboard/ContentGeneratorResultCard";

const featureOptions: {
  id: string;
  label: string;
  key: FeatureType;
  supabaseFunction: string;
  navId: string;
}[] = [
  {
    id: "titles",
    label: "Title",
    key: "titles",
    supabaseFunction: "generate_titles",
    navId: "video-titles",
  },
  {
    id: "descriptions",
    label: "Description",
    key: "descriptions",
    supabaseFunction: "generate_descriptions",
    navId: "video-descriptions",
  },
  {
    id: "hashtags",
    label: "Hashtag",
    key: "hashtags",
    supabaseFunction: "generate_hashtags",
    navId: "hashtags",
  },
  {
    id: "ideas",
    label: "Video Idea",
    key: "ideas",
    supabaseFunction: "generate_ideas",
    navId: "video-ideas",
  },
  {
    id: "scripts",
    label: "Script",
    key: "scripts",
    supabaseFunction: "generate_scripts",
    navId: "video-scripts",
  },
  {
    id: "tweets",
    label: "Tweet",
    key: "tweets",
    supabaseFunction: "generate_tweets",
    navId: "tweet-generator",
  },
  {
    id: "youtubePosts",
    label: "YouTube Post",
    key: "youtubePosts",
    supabaseFunction: "generate_youtube_posts",
    navId: "youtube-community-post-generator",
  },
  {
    id: "redditPosts",
    label: "Reddit Post",
    key: "redditPosts",
    supabaseFunction: "generate_reddit_posts",
    navId: "reddit-post-generator",
  },
  {
    id: "linkedinPosts",
    label: "LinkedIn Post",
    key: "linkedinPosts",
    supabaseFunction: "generate_linkedin_posts",
    navId: "linkedin-post-generator",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeItem, setActiveItem] = useState("dashboard");
  const [activeSubItem, setActiveSubItem] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const { tier } = useSubscription(user?.id);

  const [usageStats, setUsageStats] = useState({
    titles: 0,
    descriptions: 0,
    hashtags: 0,
    ideas: 0,
    scripts: 0,
    tweets: 0,
    youtubePosts: 0,
    redditPosts: 0,
    linkedinPosts: 0,
  });

  const [prompt, setPrompt] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchUsage = async () => {
      const usageMap: any = {};
      for (const feature of featureOptions) {
        try {
          const remainingUses = await getRemainingUses(
            user.id,
            feature.key,
            tier,
          );
          const totalLimit = subscriptionLimits?.[tier]?.[feature.key] ?? 0;
          usageMap[feature.key] = totalLimit - remainingUses;
        } catch (error) {
          console.error(`Error fetching usage for ${feature.key}:`, error);
          usageMap[feature.key] = 0;
        }
      }
      setUsageStats(usageMap);
    };
    fetchUsage();
  }, [user, navigate, tier]);

  const handleNavigation = (itemId: string, subItemId?: string) => {
    console.log("Navigation triggered:", { itemId, subItemId });
    if (itemId === "profile") {
      handleProfileClick();
      return;
    }
    if (itemId === "settings") {
      navigate("/settings");
      return;
    }
    setActiveItem(itemId);
    setActiveSubItem(subItemId || "");
    setShowProfilePopup(false);
    console.log("New active item:", itemId);
  };

  const handleProfileClick = () => {
    setShowProfilePopup(!showProfilePopup);
  };

  const handleLogout = () => {
    supabase.auth.signOut().then(() => {
      localStorage.removeItem("clipvobe-user");
      navigate("/auth");
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleExpandItem = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleFeature = (featureId: string) => {
    if (selectedFeatures.includes(featureId)) {
      setSelectedFeatures(selectedFeatures.filter((id) => id !== featureId));
    } else {
      setSelectedFeatures([...selectedFeatures, featureId]);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt!",
        variant: "destructive",
      });
      return;
    }

    if (selectedFeatures.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one feature to generate!",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated!",
        variant: "destructive",
      });
      return;
    }

    const canGenerateAll = await Promise.all(
      selectedFeatures.map(async (featureId) => {
        const feature = featureOptions.find((opt) => opt.id === featureId);
        if (!feature) return false;
        return await canGenerate(user.id, feature.key, tier);
      }),
    );

    if (!canGenerateAll.every(Boolean)) {
      toast({
        title: "Limit Reached",
        description:
          "You have reached your usage limit for one or more features. Upgrade your plan to continue.",
        variant: "destructive",
      });
      navigate("/pricing");
      return;
    }

    setIsLoading(true);
    const results: any = {};

    for (const featureId of selectedFeatures) {
      const feature = featureOptions.find((opt) => opt.id === featureId);
      if (!feature) continue;

      try {
        let data;
        let error;

        if (feature.key === "ideas") {
          try {
            const response = await supabase.functions.invoke("generate-ideas", {
              body: { category: prompt },
              headers: { "Content-Type": "application/json" },
            });
            console.log("Ideas response:", response);
            data = response.data;
            error = response.error;
          } catch (e) {
            console.log("Error invoking generate-ideas:", e);
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("Gemini API key is missing");

            const geminiPrompt = `Generate 5 creative and trending video ideas for YouTube about ${prompt}. Make them specific and compelling. Format each idea as a simple, clean sentence without any markdown formatting or special characters.`;
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: geminiPrompt }] }],
                  generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
                }),
              },
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API request failed: ${errorText}`);
            }

            const responseData = await response.json();
            const text = responseData.candidates[0].content.parts[0].text;
            const ideas = text
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
              .map((line) => {
                let cleanLine = line.replace(/^\d+\.\s*/, "").trim();
                cleanLine = cleanLine
                  .replace(/\*\*([^*]+)\*\*/g, "$1")
                  .replace(/\*([^*]+)\*/g, "$1");
                return cleanLine;
              })
              .slice(0, 5);

            data = { ideas };
          }
        } else if (feature.key === "titles") {
          try {
            const response = await supabase.functions.invoke(
              "generate-titles",
              {
                body: { topic: prompt },
              },
            );
            console.log("Titles response:", response);
            data = response.data;
            error = response.error;
          } catch (e) {
            console.log("Error invoking generate-titles:", e);
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("Gemini API key is missing");

            const geminiPrompt = `Generate 5 compelling YouTube titles for a video about: ${prompt}`;
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: geminiPrompt }] }],
                  generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
                }),
              },
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API request failed: ${errorText}`);
            }

            const responseData = await response.json();
            const text = responseData.candidates[0].content.parts[0].text;
            const titles = text
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
              .map((line) => {
                let cleanLine = line.replace(/^\d+\.\s*/, "").trim();
                cleanLine = cleanLine
                  .replace(/\*\*([^*]+)\*\*/g, "$1")
                  .replace(/\*([^*]+)\*/g, "$1");
                return cleanLine;
              })
              .slice(0, 5);

            data = { titles };
          }
        } else if (feature.key === "descriptions") {
          try {
            const response = await supabase.functions.invoke(
              "generate-description",
              {
                body: { title: prompt, keywords: "", length: "medium" },
                headers: { "Content-Type": "application/json" },
              },
            );
            console.log("Description response:", response);
            data = response.data;
            error = response.error;
          } catch (e) {
            console.log("Error invoking generate-description:", e);
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("Gemini API key is missing");

            const geminiPrompt = `Create a medium-length YouTube video description for a video titled: "${prompt}". Include sections, bullet points, timestamps, call to action, and relevant hashtags.`;
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: geminiPrompt }] }],
                  generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
                }),
              },
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API request failed: ${errorText}`);
            }

            const responseData = await response.json();
            let description =
              responseData.candidates[0].content.parts[0].text.trim();
            description = description
              .replace(/\*\*([^*]+)\*\*/g, "$1")
              .replace(/\*([^*]+)\*/g, "$1");

            data = { description };
          }
        } else if (feature.key === "hashtags") {
          try {
            const response = await supabase.functions.invoke(
              "generate-hashtags",
              {
                body: { topic: prompt },
              },
            );
            console.log("Hashtags response:", response);
            data = response.data;
            error = response.error;
          } catch (e) {
            console.log("Error invoking generate-hashtags:", e);
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("Gemini API key is missing");

            const geminiPrompt = `Generate 10 trending and relevant hashtags for a YouTube video about: ${prompt}. Make them without spaces and with # prefix.`;
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: geminiPrompt }] }],
                  generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
                }),
              },
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API request failed: ${errorText}`);
            }

            const responseData = await response.json();
            const text = responseData.candidates[0].content.parts[0].text;
            const hashtags = text
              .split("\n")
              .map((line) => line.trim())
              .filter(
                (line) => line.startsWith("#") || line.match(/^\d+\.\s*#/),
              )
              .map((line) => {
                let cleanLine = line.replace(/^\d+\.\s*/, "").trim();
                cleanLine = cleanLine
                  .replace(/\*\*(#[^*]+)\*\*/g, "$1")
                  .replace(/\*(#[^*]+)\*/g, "$1");
                return cleanLine;
              })
              .slice(0, 10);

            data = { hashtags };
          }
        } else if (feature.key === "scripts") {
          try {
            const response = await supabase.functions.invoke(
              "generate-script",
              {
                body: {
                  contentType: "standard",
                  duration: "3",
                  topic: prompt,
                  targetAudience: "general",
                  tone: "energetic",
                  language: "English",
                  includeCTA: true,
                },
              },
            );
            console.log("Script response:", response);
            data = response.data;
            error = response.error;
          } catch (e) {
            console.log("Error invoking generate-script:", e);
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("Gemini API key is missing");

            const geminiPrompt = `Create a YouTube video script about "${prompt}" for 3 minutes with an engaging hook, clear main points, and a call-to-action.`;
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: geminiPrompt }] }],
                  generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
                }),
              },
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API request failed: ${errorText}`);
            }

            const responseData = await response.json();
            let script =
              responseData.candidates[0].content.parts[0].text.trim();
            script = script
              .replace(/\*\*([^*]+)\*\*/g, "$1")
              .replace(/\*([^*]+)\*/g, "$1");

            data = { script };
          }
        } else {
          try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
              throw new Error("Gemini API key is missing");
            }

            let geminiPrompt = "";
            if (feature.key === "tweets") {
              geminiPrompt = `Generate a tweet about "${prompt}" in English language, max 280 characters.`;
            } else if (feature.key === "youtubePosts") {
              geminiPrompt = `Generate a YouTube Community post about "${prompt}" in English language, with a motive of "New Video Announcement". Keep it engaging, max 1000 characters.`;
            } else if (feature.key === "redditPosts") {
              geminiPrompt = `Generate a Reddit post about "${prompt}" in English language, keeping it authentic and engaging for a subreddit community, max 10000 characters.`;
            } else if (feature.key === "linkedinPosts") {
              geminiPrompt = `Generate a professional LinkedIn post about "${prompt}" in English language, focusing on thought leadership or industry insights, max 3000 characters.`;
            }

            console.log(`Generating ${feature.key} with prompt:`, geminiPrompt);

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: geminiPrompt }] }],
                  generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
                }),
              },
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API request failed: ${errorText}`);
            }

            const responseData = await response.json();
            console.log(`${feature.key} response:`, responseData);

            if (
              !responseData.candidates ||
              !responseData.candidates[0]?.content?.parts?.[0]?.text
            ) {
              throw new Error(`No ${feature.label} data returned from the API`);
            }

            let cleanText =
              responseData.candidates[0].content.parts[0].text.trim();
            cleanText = cleanText
              .replace(/\*\*([^*]+)\*\*/g, "$1")
              .replace(/\*([^*]+)\*/g, "$1");
            data = cleanText;
          } catch (e) {
            console.error(`Error generating ${feature.key}:`, e);
            throw e;
          }
        }

        if (error) throw error;

        results[featureId] = data;

        await updateUsage(user.id, feature.key, tier);

        setUsageStats((prev: any) => ({
          ...prev,
          [feature.key]: prev[feature.key] + 1,
        }));
      } catch (err) {
        console.error(`Error generating ${feature.label}:`, err);
        results[featureId] = `Error generating ${feature.label}`;
        toast({
          title: "Error",
          description: `Failed to generate ${feature.label}.`,
          variant: "destructive",
        });
      }
    }

    setGeneratedContent(results);
    setIsLoading(false);
  };

  const NAV_ITEMS: NavItem[] = [
    {
      id: "dashboard",
      title: "Overview",
      icon: Home,
      description: "Dashboard overview",
    },
    {
      id: "video-titles",
      title: "Title Generator",
      icon: Type,
      description: "Generate video titles",
    },
    {
      id: "video-descriptions",
      title: "Description Generator",
      icon: FileText,
      description: "Generate video descriptions",
    },
    {
      id: "hashtags",
      title: "Hashtag Generator",
      icon: Hash,
      description: "Generate hashtags",
    },
    {
      id: "video-ideas",
      title: "Video Ideas",
      icon: Lightbulb,
      description: "Generate video ideas",
    },
    {
      id: "video-scripts",
      title: "Script Generator",
      icon: ScrollText,
      description: "Generate video scripts",
    },
    {
      id: "tweet-generator",
      title: "Tweet Generator",
      icon: MessageSquarePlus,
      description: "Generate tweets",
    },
    {
      id: "youtube-community-post-generator",
      title: "YouTube Community Post Generator",
      icon: MessageSquarePlus,
      description: "Generate YouTube community posts",
    },
    {
      id: "reddit-post-generator",
      title: "Reddit Post Generator",
      icon: MessageSquarePlus,
      description: "Generate Reddit posts",
    },
    {
      id: "linkedin-post-generator",
      title: "LinkedIn Post Generator",
      icon: MessageSquarePlus,
      description: "Generate LinkedIn posts",
    },
    { 
      id: "spacer", 
      title: "",
      isSpacer: true 
    },
    {
      id: "settings",
      title: "Settings",
      icon: Settings,
      description: "Manage settings",
    },
    {
      id: "profile",
      title: user?.email || "User Profile",
      icon: User,
      description: "User profile and subscription",
      showPopup: true,
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-clipvobe-dark">
      {(() => {
        console.log("Current active item:", activeItem);
        return null;
      })()}
      <div className="relative">
        <SidebarNav
          items={NAV_ITEMS}
          activeItem={activeItem}
          activeSubItem={activeSubItem}
          expandedItems={expandedItems}
          sidebarOpen={sidebarOpen}
          handleNavigation={handleNavigation}
          toggleExpandItem={toggleExpandItem}
          onProfileClick={handleProfileClick}
        />

        {showProfilePopup && (
          <div className="absolute bottom-4 left-4 right-4 z-50 rounded-lg bg-clipvobe-gray-800 shadow-lg p-4">
            <div className="space-y-4">
              <div className="border-b border-clipvobe-gray-700 pb-2">
                <p className="text-sm text-clipvobe-gray-400">Signed in as</p>
                <p className="text-white font-medium">{user?.email}</p>
              </div>
              <div className="border-b border-clipvobe-gray-700 pb-2">
                <p className="text-sm text-clipvobe-gray-400">Current Plan</p>
                <p className="text-clipvobe-cyan font-medium">
                  {tier === "free"
                    ? "Free Plan"
                    : tier === "basic"
                      ? "Basic Plan"
                      : "Pro Plan"}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-white hover:text-clipvobe-cyan"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-clipvobe-dark/80 backdrop-blur">
          <div className="flex h-16 items-center px-4 sm:px-6">
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-white hover:text-clipvobe-cyan"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <div className="ml-auto flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:text-clipvobe-cyan"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-clipvobe-cyan" />
              </Button>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-white hover:text-clipvobe-cyan"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6 h-[calc(100vh-4rem)]">
          {(() => {
            console.log("Dashboard main rendering, activeItem:", activeItem);
            return null;
          })()}
          {(() => {
            try {
              if (activeItem === "dashboard") {
                return (
                  <BackgroundGradientAnimation 
                    containerClassName="h-[calc(100vh-4rem)] rounded-xl overflow-hidden"
                    interactive={true}
                    gradientBackgroundStart="rgb(10, 10, 30)"
                    gradientBackgroundEnd="rgb(8, 8, 25)"
                    firstColor="18, 113, 255"
                    secondColor="80, 200, 255"
                    thirdColor="100, 220, 255"
                    fourthColor="30, 200, 180"
                    fifthColor="0, 200, 220"
                    className="p-8"
                  >
                    <div className="flex flex-col max-w-4xl mx-auto">
                      <h1 className="text-5xl font-bold text-white text-center mb-10">
                        Generate it All with a Single  <span className="text-clipvobe-cyan">Prompt</span>
                      </h1>
                      
                      <div className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-1.5 shadow-xl">
                        <input
                          type="text"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Enter a topic or idea (e.g., Minecraft new update)"
                          className="w-full bg-transparent text-white placeholder-white/50 text-lg border-none focus:outline-none focus:ring-0 px-6 py-4 rounded-lg"
                        />
                        
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                          <div className="relative">
                            <button
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center"
                              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                              <span className="mr-2">Features</span>
                              <ChevronDown className="h-4 w-4" />
                              {selectedFeatures.length > 0 && (
                                <span className="ml-2 bg-clipvobe-cyan text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                  {selectedFeatures.length}
                                </span>
                              )}
                            </button>
                            {isDropdownOpen && (
                              <div className="absolute right-0 top-full mt-2 w-64 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl z-10 max-h-96 overflow-y-auto">
                                <div className="p-3 border-b border-white/10">
                                  <h3 className="text-white font-medium">Select Features</h3>
                                </div>
                                <div className="p-2">
                                  {featureOptions.map((option) => (
                                    <div
                                      key={option.id}
                                      className="flex items-center p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                                      onClick={() => toggleFeature(option.id)}
                                    >
                                      <div className="w-5 h-5 rounded border border-white/30 mr-3 flex items-center justify-center">
                                        {selectedFeatures.includes(option.id) && (
                                          <Check
                                            className="text-clipvobe-cyan"
                                            size={14}
                                          />
                                        )}
                                      </div>
                                      <span className="text-white">{option.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <Button
                            className="bg-clipvobe-cyan hover:bg-clipvobe-cyan/80 text-black font-medium"
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim() || selectedFeatures.length === 0}
                          >
                            {isLoading ? (
                              <span className="flex items-center">
                                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                Generating...
                              </span>
                            ) : (
                              <span>Generate</span>
                            )}
                          </Button>
                        </div>
                      </div>

                      {selectedFeatures.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                          {selectedFeatures.map((feature) => {
                            const featureOption = featureOptions.find((opt) => opt.id === feature);
                            return (
                              <span
                                key={feature}
                                className="bg-white/10 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full flex items-center"
                              >
                                {featureOption?.label}
                                <button
                                  className="ml-2 text-white/70 hover:text-white"
                                  onClick={() => toggleFeature(feature)}
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {Object.keys(generatedContent).length > 0 && (
                        <div className="mt-10">
                          <h2 className="text-2xl font-bold text-white mb-6">Generated Content</h2>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {selectedFeatures.map((feature) => {
                              const featureOption = featureOptions.find((opt) => opt.id === feature);
                              if (!featureOption) return null;
                              
                              const content = generatedContent[feature];
                              let displayContent;
                              const featureId = feature;

                              if (featureId === "titles" && content?.titles) {
                                displayContent = content.titles;
                              } else if (featureId === "descriptions" && content?.description) {
                                displayContent = content.description;
                              } else if (featureId === "hashtags" && content?.hashtags) {
                                displayContent = content.hashtags;
                              } else if (featureId === "ideas" && content?.ideas) {
                                displayContent = content.ideas;
                              } else if (featureId === "scripts" && content?.script) {
                                displayContent = content.script;
                              } else {
                                displayContent = content;
                              }

                              return (
                                <ContentGeneratorResultCard
                                  key={feature}
                                  title={featureOption.label}
                                  content={displayContent}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </BackgroundGradientAnimation>
                );
              }
              
              return <DashboardFeatures 
                activeItem={activeItem} 
                activeSubItem={activeSubItem}
                handleNavigation={handleNavigation} 
              />;
            } catch (error) {
              console.error("Error rendering dashboard content:", error);
              return <div className="text-white">Error loading content</div>;
            }
          })()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
