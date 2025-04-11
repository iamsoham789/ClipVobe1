
import React, { useState } from "react";
import { Home, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import { supabase } from "../../integrations/supabase/client";
import { canGenerate, updateUsage } from "./usageLimits";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/use-subscription";
import { useNavigate } from "react-router-dom";

const DescriptionGenerator: React.FC<{
  handleNavigation: (itemId: string, subItemId?: string) => void;
}> = ({ handleNavigation }) => {
  const [contentType, setContentType] = useState("YouTube Video");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { tier } = useSubscription(user?.id);
  const navigate = useNavigate();

  const generateContent = async () => {
    if (!user) {
      toast({ title: "Login Required", variant: "destructive" });
      navigate("/login");
      return;
    }

    setIsLoading(true);
    const userTier = tier || "free";
    const allowed = await canGenerate(user.id, "descriptions", userTier);
    if (!allowed) {
      toast({
        title: "Limit Reached",
        description:
          "You've reached your limit for descriptions. Upgrade your plan to continue.",
        variant: "destructive",
      });
      navigate("/pricing");
      setIsLoading(false);
      return;
    }

    try {
      if (!topic.trim()) throw new Error("Please enter a topic");

      // Use direct Gemini API call instead of Supabase Edge Function
      try {
        const apiKey = "AIzaSyC2WcxsrgdSqzfDoFH4wh1WvPo1pXTIYKc";
        const geminiPrompt = `Create a medium-length YouTube video description for a video titled: "${topic}". Include sections, bullet points, timestamps, call to action, and relevant hashtags.`;

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
        // Clean up the description formatting
        let description =
          responseData.candidates[0].content.parts[0].text.trim();
        // Replace asterisks with proper HTML formatting
        description = description
          .replace(/\*\*([^*]+)\*\*/g, "$1")
          .replace(/\*([^*]+)\*/g, "$1");

        setDescription(description);
        await updateUsage(user.id, "descriptions", tier);
        toast({ title: "Description Generated" });
      } catch (directApiError) {
        console.error("Direct API error:", directApiError);
        throw directApiError;
      }
    } catch (error: any) {
      console.error("Description generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-2">
        <button
          onClick={() => handleNavigation("dashboard")}
          className="text-gray-400 hover:text-white mr-2"
        >
          <Home size={16} />
        </button>
        <span className="text-gray-500 mx-2">/</span>
        <span className="text-gray-500 mr-2">Generate Content</span>
        <span className="text-gray-500 mx-2">/</span>
        <span className="text-white">Description Generator</span>
      </div>
      <h2 className="text-2xl font-bold text-white">
        AI-Generated {contentType} Description
      </h2>
      <p className="text-gray-300">
        Enter a topic for an SEO-friendly {contentType.toLowerCase()}{" "}
        description.
      </p>
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="space-y-2">
          <label htmlFor="content-type" className="text-white font-medium">
            Content Type:
          </label>
          <select
            id="content-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-clipvobe-cyan"
          >
            <option value="YouTube Video">YouTube Video</option>
            <option value="Blog Post">Blog Post</option>
            <option value="Instagram Post">Instagram Post</option>
            <option value="LinkedIn Post">LinkedIn Post</option>
            <option value="Reddit Post">Reddit Post</option>
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="topic" className="text-white font-medium">
            Topic:
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="E.g., AI tools, Fitness goals..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clipvobe-cyan"
          />
        </div>
        <Button
          onClick={generateContent}
          disabled={!topic.trim() || isLoading}
          isLoading={isLoading}
          className="w-full"
        >
          Generate Description
        </Button>
      </div>
      {description && (
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-white font-semibold mb-4">
            Generated Description:
          </h3>
          <div className="flex items-start justify-between p-3 bg-gray-800 rounded-lg group hover:bg-gray-700 transition-colors">
            <span className="text-white">{description}</span>
            <button
              onClick={() => copyToClipboard(description)}
              className="text-gray-400 hover:text-clipvobe-cyan opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DescriptionGenerator;
