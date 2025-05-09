
import React, { useState } from 'react';
import { Home, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { canGenerate, updateUsage } from './usageLimits';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/use-subscription';
import { useNavigate } from 'react-router-dom';
import RestrictedFeatureRedirect from './RestrictedFeatureRedirect';

interface RedditPostGeneratorProps {
  handleNavigation: (itemId: string, subItemId?: string) => void;
}

const RedditPostGenerator: React.FC<RedditPostGeneratorProps> = ({ handleNavigation }) => {
  const [postTopic, setPostTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const { user } = useAuth();
  const { tier } = useSubscription(user?.id);
  const navigate = useNavigate();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
  ];

  const generatePost = async () => {
    if (!user) {
      toast.error("Login Required");
      navigate('/login');
      return;
    }

    setIsLoading(true);
    const userTier = tier || "free";
    const allowed = await canGenerate(user.id, "redditPosts", userTier);
    if (!allowed) {
      toast.error("You've reached your Reddit post generation limit. Upgrade your plan!");
      navigate('/pricing');
      setIsLoading(false);
      return;
    }

    try {
      if (!postTopic.trim()) {
        throw new Error('Please enter a topic or message');
      }

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing. Check your .env file.');
      }

      const prompt = `Generate a Reddit post about "${postTopic}" in ${selectedLanguage} language, keeping it authentic and engaging for a subreddit community, max 10000 characters (Reddit post limit).`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 10000, temperature: 0.7 },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('No post data returned from the API');
      }

      const post = data.candidates[0].content.parts[0].text.trim();
      if (post.length > 10000) {
        throw new Error('Generated post exceeds 10000 characters. Please try again.');
      }

      setGeneratedPost(post);
      await updateUsage(user.id, "redditPosts");
      toast.success(`A Reddit post has been successfully generated in ${selectedLanguage}`);
    } catch (error: any) {
      console.error('Error in post generation:', error);
      toast.error(error.message || 'Failed to generate post.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedPost) {
      navigator.clipboard.writeText(generatedPost);
      toast.success('Post copied to your clipboard');
    }
  };

  return (
    <RestrictedFeatureRedirect featureName="Reddit Post Generator">
      <div className="space-y-6">
        <div className="flex items-center mb-2">
          <button onClick={() => handleNavigation('dashboard')} className="text-gray-400 hover:text-white mr-2">
            <Home size={16} />
          </button>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-gray-500 mr-2">Multi-Platform Post Generator</span>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-white">Reddit Post Generator</span>
        </div>
        <h2 className="text-2xl font-bold text-white">AI-Generated Reddit Posts</h2>
        <p className="text-gray-300">Enter a topic and get engaging Reddit post suggestions (max 10000 characters).</p>
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="space-y-2">
            <label htmlFor="post-topic" className="text-white font-medium">
              Post Topic or Message:
            </label>
            <input
              id="post-topic"
              type="text"
              value={postTopic}
              onChange={(e) => setPostTopic(e.target.value)}
              placeholder="E.g., Latest tech trends, Gaming tips, Community discussion..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clipvobe-cyan"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="language" className="text-white font-medium">
              Language:
            </label>
            <select
              id="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clipvobe-cyan"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={generatePost}
            disabled={!postTopic.trim() || isLoading}
            isLoading={isLoading}
            className="w-full"
          >
            Generate Post
          </Button>
        </div>
        {generatedPost && (
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-4">Generated Reddit Post:</h3>
            <div className="flex items-start justify-between p-3 bg-gray-800 rounded-lg group hover:bg-gray-700 transition-colors">
              <span className="text-white">{generatedPost}</span>
              <button
                onClick={copyToClipboard}
                className="text-gray-400 hover:text-clipvobe-cyan opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </RestrictedFeatureRedirect>
  );
};

export default RedditPostGenerator;
