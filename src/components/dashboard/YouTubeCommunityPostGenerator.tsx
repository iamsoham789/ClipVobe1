import React, { useState } from 'react';
import { Home, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { canGenerate, updateUsage } from './usageLimits';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/use-subscription';
import { useNavigate } from 'react-router-dom';

const VideoCommunityPostGenerator: React.FC<{
  handleNavigation: (itemId: string, subItemId?: string) => void;
}> = ({ handleNavigation }) => {
  const [postTopic, setPostTopic] = useState('');
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedMotive, setSelectedMotive] = useState('New Video Announcement');
  const { toast } = useToast();
  const { user } = useAuth();
  const { tier } = useSubscription();
  const navigate = useNavigate();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ru', name: 'Russian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
  ];

  const motives = [
    'New Video Announcement',
    'Congrats for Festival',
    'Other',
  ];

  const getPlaceholder = () => {
    switch (selectedMotive) {
      case 'New Video Announcement':
        return 'E.g., Title of the new video, brief description...';
      case 'Congrats for Festival':
        return 'E.g., Festival name, message to fans...';
      case 'Other':
        return 'E.g., Any custom topic or message...';
      default:
        return 'Enter your topic or message...';
    }
  };

  const generatePost = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to generate posts.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsLoading(true);
    const userTier = tier || "free";
    const allowed = await canGenerate(user.id, "youtubePosts", userTier);
    if (!allowed) {
      toast({
        title: "Limit Reached",
        description: "You've reached your YouTube community post generation limit. Upgrade your plan!",
        variant: "destructive",
      });
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

      const prompt = `Generate a YouTube Community post about "${postTopic}" in ${selectedLanguage} language, with a motive of "${selectedMotive}". Keep it engaging, max 1000 characters.`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
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
      if (post.length > 1000) {
        throw new Error('Generated post exceeds 1000 characters. Please try again.');
      }

      setGeneratedPost(post);
      await updateUsage(user.id, "youtubePosts");
      toast({
        title: 'Post Generated',
        description: `A community post has been successfully generated in ${selectedLanguage}`,
      });
    } catch (error: any) {
      console.error('Error in post generation:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate post.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedPost) {
      navigator.clipboard.writeText(generatedPost);
      toast({
        title: 'Copied to clipboard',
        description: 'Post copied to your clipboard',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-2">
        <button onClick={() => handleNavigation('dashboard')} className="text-gray-400 hover:text-white mr-2">
          <Home size={16} />
        </button>
        <span className="text-gray-500 mx-2">/</span>
        <span className="text-gray-500 mr-2">Multi-Platform Post Generator</span>
        <span className="text-gray-500 mx-2">/</span>
        <span className="text-white">Community Post Generator</span>
      </div>
      <h2 className="text-2xl font-bold text-white">AI-Generated YouTube Community Posts</h2>
      <p className="text-gray-300">Enter a topic and get engaging community post suggestions (max 1000 characters).</p>
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="space-y-2">
          <label htmlFor="post-motive" className="text-white font-medium">
            Motive of the Post:
          </label>
          <select
            id="post-motive"
            value={selectedMotive}
            onChange={(e) => setSelectedMotive(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clipvobe-cyan"
          >
            {motives.map((motive) => (
              <option key={motive} value={motive}>
                {motive}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="post-topic" className="text-white font-medium">
            Post Topic or Message:
          </label>
          <input
            id="post-topic"
            type="text"
            value={postTopic}
            onChange={(e) => setPostTopic(e.target.value)}
            placeholder={getPlaceholder()}
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
          <h3 className="text-white font-semibold mb-4">Generated Community Post:</h3>
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
  );
};

export default VideoCommunityPostGenerator;