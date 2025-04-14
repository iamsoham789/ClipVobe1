
import React, { useState, useEffect } from 'react';
import { Home, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { canGenerate, updateUsage } from './usageLimits';
import { useNavigate } from 'react-router-dom';
import RestrictedFeatureRedirect from './RestrictedFeatureRedirect';
import { useSubscription } from '@/hooks/use-subscription';

interface TweetGeneratorProps {
  handleNavigation: (itemId: string, subItemId?: string) => void;
}

const TweetGenerator: React.FC<TweetGeneratorProps> = ({ handleNavigation }) => {
  const [tweet, setTweet] = useState('');
  const [generatedTweets, setGeneratedTweets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const { user } = useAuth();
  const { tier } = useSubscription(user?.id);
  const navigate = useNavigate();

  // Fetch remaining requests on component mount
  useEffect(() => {
    if (user) {
      const fetchRemainingRequests = async () => {
        try {
          const remaining = await canGenerate(user.id, "tweets", tier);
          setRemainingRequests(remaining);
        } catch (error) {
          console.error("Error fetching remaining requests:", error);
        }
      };
      
      fetchRemainingRequests();
    }
  }, [user, tier]);

  const generateTweet = async () => {
    if (!user) {
      toast.error("Please login to generate tweets");
      navigate("/auth");
      return;
    }

    setIsLoading(true);

    try {
      // Check if user can use this feature based on their subscription
      const canUseFeature = await canGenerate(user.id, "tweets", tier);
      
      if (!canUseFeature) {
        toast.error("You've reached your tweet generation limit or don't have access to this feature");
        navigate('/pricing');
        return;
      }

      if (!tweet.trim()) {
        toast.error("Please enter a topic for your tweet");
        return;
      }

      // Generate tweets using Google's Gemini API
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
      await updateUsage(user.id, "tweets", tier);
      
      // Update remaining requests
      const remaining = await canGenerate(user.id, "tweets", tier);
      setRemainingRequests(remaining);
      
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
    <RestrictedFeatureRedirect featureName="tweets">
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
          {remainingRequests !== null && (
            <span className="ml-2 text-cyan-400">
              {remainingRequests} {tier === 'pro' ? 'unlimited' : 'requests'} remaining
            </span>
          )}
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
            disabled={!tweet.trim() || isLoading || remainingRequests === 0}
            className="w-full"
          >
            {isLoading ? "Generating..." : "Generate Tweets"}
          </Button>
          {remainingRequests === 0 && (
            <p className="text-red-400 text-sm">
              You've reached your tweet generation limit. 
              <button 
                onClick={() => navigate('/pricing')} 
                className="text-cyan-400 ml-1 underline"
              >
                Upgrade your plan
              </button>
            </p>
          )}
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
