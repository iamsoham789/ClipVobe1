
import React, { useState } from 'react';
import { Copy, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { canGenerate, updateUsage } from './usageLimits';
import RestrictedFeatureRedirect from './RestrictedFeatureRedirect';
import { useNavigate } from 'react-router-dom';

interface TweetGeneratorProps {
  handleNavigation: (itemId: string, subItemId?: string) => void;
}

const TweetGenerator: React.FC<TweetGeneratorProps> = ({ handleNavigation }) => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const generateTweets = async () => {
    if (!user) {
      toast.error('Please login to use this feature');
      navigate('/auth');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a topic for your tweets');
      return;
    }

    setLoading(true);

    try {
      const canUseFeature = await canGenerate(user.id, "tweets");
      if (!canUseFeature) {
        toast.error("You've reached your tweet generation limit. Upgrade your plan!");
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
                    text: `Generate 3 different tweet options about "${prompt}". Each tweet should be engaging, include relevant hashtags, and be under 280 characters. Format them as numbered list like: 1. [tweet text]`,
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
        throw new Error(data.error?.message || "Failed to generate tweets");
      }

      const tweetsText = data.candidates[0].content.parts[0].text;
      const tweetsList = tweetsText
        .split(/\d+\.\s/)
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);

      setResults(tweetsList);
      
      await updateUsage(user.id, "tweets");
      
      toast.success("Tweets generated successfully!");
    } catch (error: any) {
      console.error("Error generating tweets:", error);
      toast.error(error.message || "Failed to generate tweets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Tweet copied to clipboard');
  };

  return (
    <RestrictedFeatureRedirect featureName="Tweet Generator">
      <div className="space-y-6">
        <div className="flex items-center mb-2">
          <button onClick={() => handleNavigation('dashboard')} className="text-gray-400 hover:text-white mr-2">
            <Home size={16} />
          </button>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-gray-500 mr-2">Platform Post Generator</span>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-white">Tweet Generator</span>
        </div>

        <h2 className="text-2xl font-bold text-white">AI Tweet Generator</h2>
        <p className="text-gray-300">
          Enter a topic or theme, and we'll generate engaging tweets to boost your Twitter presence.
        </p>

        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="space-y-2">
            <label htmlFor="tweet-topic" className="text-white font-medium">
              Tweet Topic:
            </label>
            <input
              id="tweet-topic"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Product launch, Industry news, Interesting fact"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clipvobe-cyan"
            />
          </div>
          <Button
            onClick={generateTweets}
            disabled={!prompt.trim() || loading}
            isLoading={loading}
            className="w-full"
          >
            Generate Tweets
          </Button>
        </div>

        {results.length > 0 && (
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-4">Generated Tweets:</h3>
            <div className="space-y-3">
              {results.map((tweet, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-gray-800 rounded-lg group hover:bg-gray-700 transition-colors"
                >
                  <span className="text-white">{tweet}</span>
                  <button
                    onClick={() => copyToClipboard(tweet)}
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

export default TweetGenerator;
