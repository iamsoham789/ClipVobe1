
import React, { useState } from 'react';
import { Home, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { canGenerate, updateUsage } from './usageLimits';
import { useNavigate } from 'react-router-dom';
import RestrictedFeatureRedirect from './RestrictedFeatureRedirect';

interface TweetGeneratorProps {
  handleNavigation: (itemId: string, subItemId?: string) => void;
}

const TweetGenerator: React.FC<TweetGeneratorProps> = ({ handleNavigation }) => {
  const [tweet, setTweet] = useState('');
  const [generatedTweets, setGeneratedTweets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const generateTweet = async () => {
    if (!user) {
      toast.error("Please login to generate tweets");
      navigate("/auth");
      return;
    }

    setIsLoading(true);

    try {
      // Check usage limits
      const canUseFeature = await canGenerate(user.id, "tweets");
      if (!canUseFeature) {
        toast.error("You've reached your tweet generation limit. Upgrade your plan!");
        navigate('/pricing');
        return;
      }

      if (!tweet.trim()) {
        toast.error("Please enter a topic for your tweet");
        return;
      }

      // Generate tweets using Google's Gemini API (directly or via edge function)
      const apiKey = "AIzaSyC2WcxsrgdSqzfDoFH4wh1WvPo1pXTIYKc"; // Replace with environment variable in production
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
                    text: `Generate 3 different tweet options about "${tweet}". Each tweet should be engaging, include relevant hashtags, and be under 280 characters. Format them as numbered list like: 1. [tweet text]`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to generate tweets");
      }

      // Process the response to extract the tweets
      const tweetsText = data.candidates[0].content.parts[0].text;
      const tweetList = tweetsText
        .split(/\d+\.\s/)
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);

      setGeneratedTweets(tweetList);
      
      // Update usage count
      await updateUsage(user.id, "tweets");
      
      toast.success("Tweets generated successfully!");
    } catch (error: any) {
      console.error("Error generating tweets:", error);
      toast.error(error.message || "Failed to generate tweets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Tweet copied to clipboard");
  };

  return (
    <RestrictedFeatureRedirect featureName="Tweet Generator">
      <div className="space-y-6">
        <div className="flex items-center mb-2">
          <button
            onClick={() => handleNavigation("dashboard")}
            className="text-gray-400 hover:text-white mr-2"
          >
            <Home size={16} />
          </button>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-gray-500 mr-2">Platform Post Generator</span>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-white">Tweet Generator</span>
        </div>

        <h2 className="text-2xl font-bold text-white">AI Tweet Generator</h2>
        <p className="text-gray-300">
          Enter a topic or theme, and our AI will generate engaging tweet options for you.
        </p>

        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="space-y-2">
            <label htmlFor="tweet-topic" className="text-white font-medium">
              Tweet Topic:
            </label>
            <input
              id="tweet-topic"
              type="text"
              value={tweet}
              onChange={(e) => setTweet(e.target.value)}
              placeholder="E.g., New product launch, Industry news, or Tips for beginners"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clipvobe-cyan"
            />
          </div>
          <Button
            onClick={generateTweet}
            disabled={!tweet.trim() || isLoading}
            isLoading={isLoading}
            className="w-full"
          >
            Generate Tweets
          </Button>
        </div>

        {generatedTweets.length > 0 && (
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-4">Generated Tweets:</h3>
            <div className="space-y-3">
              {generatedTweets.map((tweetText, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-gray-800 rounded-lg group hover:bg-gray-700 transition-colors"
                >
                  <span className="text-white">{tweetText}</span>
                  <button
                    onClick={() => copyToClipboard(tweetText)}
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
