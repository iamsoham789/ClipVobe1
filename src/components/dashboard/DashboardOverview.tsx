
import React, { useState } from "react";
import {
  Area,
  AreaChart as RechartsArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../ui/button";
import {
  Video,
  AreaChart,
  Gauge,
  Grid3X3,
  Plus,
  Lightbulb,
  FileText,
  FileImage,
  BarChart,
  ChevronDown,
  Check,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/use-subscription";
import { canGenerate, updateUsage, FeatureType } from "./usageLimits";
import { supabase } from "../../integrations/supabase/client";

// Mock data for charts
const performanceData = [
  { name: "Mon", views: 1000, engagement: 800 },
  { name: "Tue", views: 1500, engagement: 1300 },
  { name: "Wed", views: 2000, engagement: 1700 },
  { name: "Thu", views: 1800, engagement: 1600 },
  { name: "Fri", views: 2500, engagement: 2300 },
  { name: "Sat", views: 3000, engagement: 2800 },
  { name: "Sun", views: 3500, engagement: 3200 },
];

const recentVideos = [
  {
    id: 1,
    title: "How to Master React Hooks in 10 Minutes",
    views: 12500,
    engagement: "85%",
    date: "2 days ago",
  },
  {
    id: 2,
    title: "Ultimate Guide to TypeScript Interfaces",
    views: 8750,
    engagement: "78%",
    date: "4 days ago",
  },
  {
    id: 3,
    title: "Building a Personal Portfolio with Next.js",
    views: 6320,
    engagement: "72%",
    date: "1 week ago",
  },
];

interface DashboardOverviewProps {
  handleNavigation: (itemId: string, subItemId?: string) => void;
}

// New Content Generator Component
const ContentGenerator: React.FC<{
  handleNavigation: (itemId: string, subItemId?: string) => void;
}> = ({ handleNavigation }) => {
  const [prompt, setPrompt] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ feature: string; content: any }[]>(
    [],
  );
  const { toast } = useToast();
  const { user } = useAuth();
  const { tier } = useSubscription(user?.id);

  const features = [
    {
      name: "Video Ideas",
      key: "ideas" as FeatureType,
      action: "generate",
      subAction: "video-ideas",
    },
    {
      name: "Video Title",
      key: "titles" as FeatureType,
      action: "generate",
      subAction: "video-titles",
    },
    {
      name: "Video Description",
      key: "descriptions" as FeatureType,
      action: "generate",
      subAction: "video-descriptions",
    },
    {
      name: "Hashtags",
      key: "hashtags" as FeatureType,
      action: "generate",
      subAction: "hashtags",
    },
    {
      name: "Tweet",
      key: "tweets" as FeatureType,
      action: "generate",
      subAction: "tweet-generator",
    },
    {
      name: "Reddit Post",
      key: "redditPosts" as FeatureType,
      action: "generate",
      subAction: "reddit-post-generator",
    },
    {
      name: "LinkedIn Post",
      key: "linkedinPosts" as FeatureType,
      action: "generate",
      subAction: "linkedin-post-generator",
    },
    {
      name: "YouTube Community Post",
      key: "youtubePosts" as FeatureType,
      action: "generate",
      subAction: "youtube-community-post-generator",
    },
    {
      name: "Video Script",
      key: "scripts" as FeatureType,
      action: "generate",
      subAction: "video-scripts",
    },
  ];

  const toggleFeature = (featureKey: string) => {
    if (selectedFeatures.includes(featureKey)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== featureKey));
    } else {
      setSelectedFeatures([...selectedFeatures, featureKey]);
    }
  };

  const generateContent = async () => {
    if (!user) {
      toast({ title: "Login Required", variant: "destructive" });
      handleNavigation("login");
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a topic or prompt.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFeatures.length === 0) {
      toast({
        title: "Select Features",
        description: "Please select at least one feature to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const userTier = tier || "free";
    const newResults: { feature: string; content: any }[] = [];

    for (const featureKey of selectedFeatures) {
      const feature = features.find((f) => f.key === featureKey as FeatureType);
      if (!feature) continue;

      // Check usage limit
      const allowed = await canGenerate(user.id, feature.key, userTier);
      if (!allowed) {
        toast({
          title: "Limit Reached",
          description: `You've reached your limit for ${feature.name}. Upgrade your plan!`,
          variant: "destructive",
        });
        handleNavigation("pricing");
        setIsLoading(false);
        return;
      }

      try {
        let result;
        if (feature.key === "ideas") {
          const { data, error } = await supabase.functions.invoke(
            "generate-ideas",
            {
              body: { category: prompt },
            },
          );
          if (error) throw new Error(error.message);
          result = data?.ideas || [];
        } else if (feature.key === "titles") {
          const { data, error } = await supabase.functions.invoke(
            "generate-titles",
            {
              body: { topic: prompt, type: "YouTube Video" },
            },
          );
          if (error) throw new Error(error.message);
          result = data?.titles || [];
        } else if (feature.key === "descriptions") {
          const { data, error } = await supabase.functions.invoke(
            "generate-descriptions",
            {
              body: { title: prompt, keywords: "", length: "medium" },
            },
          );
          if (error) throw new Error(error.message);
          result = data?.description || "";
        } else if (feature.key === "hashtags") {
          const { data, error } = await supabase.functions.invoke(
            "generate-hashtags",
            {
              body: { topic: prompt, type: "YouTube Video" },
            },
          );
          if (error) throw new Error(error.message);
          result = data?.hashtags || [];
        } else if (feature.key === "tweets") {
          // For tweets, use Gemini API
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (!apiKey) throw new Error("Gemini API key is missing");

          const geminiPrompt = `Generate a tweet about "${prompt}" in English language, max 280 characters.`;
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: geminiPrompt }] }],
                generationConfig: { maxOutputTokens: 280, temperature: 0.7 },
              }),
            },
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${errorText}`);
          }

          const data = await response.json();
          if (
            !data.candidates ||
            !data.candidates[0]?.content?.parts?.[0]?.text
          ) {
            throw new Error("No tweet data returned from the API");
          }

          result = data.candidates[0].content.parts[0].text.trim();
        } else if (feature.key === "redditPosts") {
          // For Reddit posts, use Gemini API
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (!apiKey) throw new Error("Gemini API key is missing");

          const geminiPrompt = `Generate a Reddit post about "${prompt}" in English language, keeping it authentic and engaging for a subreddit community, max 10000 characters.`;
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

          const data = await response.json();
          if (
            !data.candidates ||
            !data.candidates[0]?.content?.parts?.[0]?.text
          ) {
            throw new Error("No post data returned from the API");
          }

          result = data.candidates[0].content.parts[0].text.trim();
        } else if (feature.key === "linkedinPosts") {
          // For LinkedIn posts, use Gemini API
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (!apiKey) throw new Error("Gemini API key is missing");

          const geminiPrompt = `Generate a professional LinkedIn post about "${prompt}" in English language, focusing on thought leadership or industry insights, max 3000 characters.`;
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

          const data = await response.json();
          if (
            !data.candidates ||
            !data.candidates[0]?.content?.parts?.[0]?.text
          ) {
            throw new Error("No post data returned from the API");
          }

          result = data.candidates[0].content.parts[0].text.trim();
        } else if (feature.key === "youtubePosts") {
          // For YouTube Community posts, use Gemini API
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (!apiKey) throw new Error("Gemini API key is missing");

          const geminiPrompt = `Generate a YouTube Community post about "${prompt}" in English language, with a motive of "New Video Announcement". Keep it engaging, max 1000 characters.`;
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

          const data = await response.json();
          if (
            !data.candidates ||
            !data.candidates[0]?.content?.parts?.[0]?.text
          ) {
            throw new Error("No post data returned from the API");
          }

          result = data.candidates[0].content.parts[0].text.trim();
        } else if (feature.key === "scripts") {
          // For Video Scripts, use Gemini API
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (!apiKey) throw new Error("Gemini API key is missing");

          const geminiPrompt = `Create a YouTube video script about "${prompt}" for 3 minutes.

Target Audience: general
Tone: energetic
Language: English

Please structure the script with:
1. An engaging hook that immediately grabs attention
2. Clear and concise main points
3. Smooth transitions between sections
4. A compelling call-to-action at the end

The script should be optimized for detailed explanation and viewer retention. Include proper pacing and engagement points.

Format the output with:
- Clear section headers
- Timestamps for each section
- [Hook] section at the start
- [Main Content] in the middle
- [Call to Action] at the end
- Estimated delivery time for each section`;

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

          const data = await response.json();
          if (
            !data.candidates ||
            !data.candidates[0]?.content?.parts?.[0]?.text
          ) {
            throw new Error("No script data returned from the API");
          }

          result = data.candidates[0].content.parts[0].text.trim();
        } else {
          // Fallback for any other features
          result = `Generated ${feature.name} for "${prompt}" (placeholder)`;
        }

        newResults.push({ feature: feature.name, content: result });
        await updateUsage(user.id, feature.key);
      } catch (error: any) {
        toast({
          title: `Failed to Generate ${feature.name}`,
          description: error.message,
          variant: "destructive",
        });
      }
    }

    setResults(newResults);
    setIsLoading(false);
    toast({
      title: "Content Generated",
      description: "Your content has been generated successfully!",
    });
  };

  return (
    <div className="glass-card p-6 rounded-xl space-y-4">
      <h3 className="text-white font-semibold">Generate Content</h3>
      <div className="space-y-2">
        <label htmlFor="prompt" className="text-white font-medium">
          Topic or Prompt:
        </label>
        <input
          id="prompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., Minecraft new update, AI tools, Travel destinations..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clipvobe-cyan"
        />
      </div>
      <div className="space-y-2">
        <label className="text-white font-medium">Select Features:</label>
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <button
              key={feature.key}
              onClick={() => toggleFeature(feature.key)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedFeatures.includes(feature.key)
                  ? "bg-clipvobe-cyan/20 text-clipvobe-cyan border border-clipvobe-cyan/40"
                  : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
              }`}
            >
              {feature.name}
            </button>
          ))}
        </div>
      </div>
      <Button
        onClick={generateContent}
        disabled={!prompt.trim() || selectedFeatures.length === 0 || isLoading}
        isLoading={isLoading}
        className="w-full"
      >
        Generate Content
      </Button>
      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-white font-semibold">Generated Content:</h4>
          {results.map((result, index) => (
            <div key={index} className="p-3 bg-gray-800 rounded-lg">
              <p className="text-white font-medium">{result.feature}</p>
              <div className="text-gray-300 mt-1">
                {Array.isArray(result.content) ? (
                  <ul className="list-disc pl-5">
                    {result.content.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="whitespace-pre-wrap">{result.content}</p>
                )}
              </div>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const content = Array.isArray(result.content)
                      ? result.content.join("\n")
                      : result.content;
                    navigator.clipboard.writeText(content);
                    toast({ title: "Copied to clipboard" });
                  }}
                  className="text-xs"
                >
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const feature = features.find(
                      (f) => f.name === result.feature,
                    );
                    if (feature) {
                      handleNavigation(feature.subAction);
                    }
                  }}
                  className="text-xs"
                >
                  Open in Editor
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  handleNavigation,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <Button className="mt-2 sm:mt-0" size="sm">
          <Plus className="mr-1" size={16} />
          New Video
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-400 text-sm">Total Videos</p>
              <h3 className="text-2xl font-bold text-white">24</h3>
            </div>
            <Video className="text-clipvobe-cyan" size={22} />
          </div>
          <div className="flex items-center text-green-400 text-xs">
            <span>↑ 12% from last month</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-400 text-sm">Total Views</p>
              <h3 className="text-2xl font-bold text-white">142.5K</h3>
            </div>
            <AreaChart className="text-clipvobe-cyan" size={22} />
          </div>
          <div className="flex items-center text-green-400 text-xs">
            <span>↑ 8.3% from last month</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-400 text-sm">Average SEO Score</p>
              <h3 className="text-2xl font-bold text-white">86/100</h3>
            </div>
            <Gauge className="text-clipvobe-cyan" size={22} />
          </div>
          <div className="flex items-center text-green-400 text-xs">
            <span>↑ 6% from last month</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-400 text-sm">Top Hashtags</p>
              <h3 className="text-2xl font-bold text-white">58 Used</h3>
            </div>
            <Grid3X3 className="text-clipvobe-cyan" size={22} />
          </div>
          <div className="flex items-center text-green-400 text-xs">
            <span>↑ 15% from last month</span>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="glass-card p-5 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Performance Overview</h3>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="text-xs">
              7 Days
            </Button>
            <Button variant="ghost" size="sm" className="text-xs bg-gray-800">
              30 Days
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              90 Days
            </Button>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsArea
              data={performanceData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00FFFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="colorEngagement"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                stroke="#737373"
                tick={{ fill: "#A3A3A3" }}
              />
              <YAxis stroke="#737373" tick={{ fill: "#A3A3A3" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#262626",
                  borderColor: "#404040",
                  color: "#FFFFFF",
                }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#00FFFF"
                fillOpacity={1}
                fill="url(#colorViews)"
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke="#A855F7"
                fillOpacity={1}
                fill="url(#colorEngagement)"
              />
            </RechartsArea>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New Content Generator */}
      <ContentGenerator handleNavigation={handleNavigation} />

      {/* Recent Videos */}
      <div className="glass-card p-5 rounded-xl">
        <h3 className="font-semibold text-white mb-4">Recent Videos</h3>
        <div className="space-y-3">
          {recentVideos.map((video) => (
            <div
              key={video.id}
              className="p-3 bg-gray-800/50 rounded-lg flex justify-between items-center hover:bg-gray-800 transition-colors"
            >
              <div className="overflow-hidden">
                <p className="text-white font-medium truncate">{video.title}</p>
                <div className="flex space-x-4 text-xs text-gray-400 mt-1">
                  <span>{video.views.toLocaleString()} views</span>
                  <span>{video.engagement} engagement</span>
                  <span>{video.date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm">
            View All Videos
          </Button>
        </div>
      </div>

      {/* Quick Actions (Moved Down) */}
      <div className="glass-card p-5 rounded-xl">
        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <Button
            className="w-full justify-start py-6 bg-gradient-to-r from-clipvobe-cyan to-purple-600 hover:opacity-90"
            onClick={() => handleNavigation("upload")}
          >
            <Plus className="mr-2" size={18} />
            New Video
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start py-6"
            onClick={() => handleNavigation("generate", "video-titles")}
          >
            <FileText className="mr-2" size={18} />
            Generate Video Title
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start py-6"
            onClick={() => handleNavigation("thumbnails")}
          >
            <FileImage className="mr-2" size={18} />
            Create Thumbnail
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start py-6"
            onClick={() => handleNavigation("seo-insights")}
          >
            <BarChart className="mr-2" size={18} />
            SEO Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
