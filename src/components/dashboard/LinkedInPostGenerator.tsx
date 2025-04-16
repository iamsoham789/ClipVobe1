
import React, { useState } from 'react';
import { Copy, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { canGenerate, updateUsage } from './usageLimits';
import RestrictedFeatureRedirect from './RestrictedFeatureRedirect';
import { useNavigate } from 'react-router-dom';

interface LinkedInPostGeneratorProps {
  handleNavigation: (itemId: string, subItemId?: string) => void;
}

const LinkedInPostGenerator: React.FC<LinkedInPostGeneratorProps> = ({ handleNavigation }) => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const generatePost = async () => {
    if (!user) {
      toast.error('Please login to use this feature');
      navigate('/auth');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a topic for your LinkedIn post');
      return;
    }

    setLoading(true);

    try {
      const canUseFeature = await canGenerate(user.id, "linkedinPosts");
      if (!canUseFeature) {
        toast.error("You've reached your LinkedIn post generation limit. Upgrade your plan!");
        navigate('/pricing');
        setLoading(false);
        return;
      }

      const apiKey = "AIzaSyC2WcxsrgdSqzfDoFH4wh1WvPo1pXTIYKc";
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate 3 different LinkedIn post options about "${prompt}". Each post should be professional, engaging, include relevant hashtags, and follow LinkedIn best practices. Format them as numbered list like: 1. [post text]`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to generate LinkedIn posts");
      }

      const postsText = data.candidates[0].content.parts[0].text;
      const postsList = postsText
        .split(/\d+\.\s/)
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);

      setResults(postsList);
      
      await updateUsage(user.id, "linkedinPosts");
      
      toast.success("LinkedIn posts generated successfully!");
    } catch (error: any) {
      console.error("Error generating LinkedIn posts:", error);
      toast.error(error.message || "Failed to generate posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Post copied to clipboard');
  };

  return (
    <RestrictedFeatureRedirect featureName="LinkedIn Post Generator">
      <div className="space-y-6">
        <div className="flex items-center mb-2">
          <button onClick={() => handleNavigation('dashboard')} className="text-gray-400 hover:text-white mr-2">
            <Home size={16} />
          </button>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-gray-500 mr-2">Platform Post Generator</span>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-white">LinkedIn Post Generator</span>
        </div>

        <h2 className="text-2xl font-bold text-white">AI LinkedIn Post Generator</h2>
        <p className="text-gray-300">
          Enter a topic or theme, and we'll generate professional LinkedIn posts to boost your engagement.
        </p>

        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="space-y-2">
            <label htmlFor="post-topic" className="text-white font-medium">
              Post Topic:
            </label>
            <input
              id="post-topic"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., New job announcement, Industry insights, Personal achievement"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clipvobe-cyan"
            />
          </div>
          <Button
            onClick={generatePost}
            disabled={!prompt.trim() || loading}
            isLoading={loading}
            className="w-full"
          >
            Generate LinkedIn Posts
          </Button>
        </div>

        {results.length > 0 && (
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-4">Generated LinkedIn Posts:</h3>
            <div className="space-y-3">
              {results.map((post, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-gray-800 rounded-lg group hover:bg-gray-700 transition-colors"
                >
                  <span className="text-white">{post}</span>
                  <button
                    onClick={() => copyToClipboard(post)}
                    className="text-gray-400 hover:text-clipvobe-cyan opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RestrictedFeatureRedirect>
  );
};

export default LinkedInPostGenerator;
