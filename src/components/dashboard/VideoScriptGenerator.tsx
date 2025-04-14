import React, { useState } from 'react';
import { Home, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { canGenerate, updateUsage } from './usageLimits';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/use-subscription';
import { useNavigate } from 'react-router-dom';
import RestrictedFeatureRedirect from './RestrictedFeatureRedirect';

const VideoScriptGenerator: React.FC<{
  handleNavigation: (itemId: string, subItemId?: string) => void;
}> = ({ handleNavigation }) => {
  const [scriptTopic, setScriptTopic] = useState('');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const { toast } = useToast();
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

  const generateScript = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to generate video scripts.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsLoading(true);
    const userTier = tier || "free";
    const allowed = await canGenerate(user.id, "scripts", userTier);
    if (!allowed) {
      toast({
        title: "Limit Reached",
        description: "You've reached your video script generation limit. Upgrade your plan!",
        variant: "destructive",
      });
      navigate('/pricing');
      setIsLoading(false);
      return;
    }

    try {
      if (!scriptTopic.trim()) {
        throw new Error('Please enter a topic for the video script');
      }

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing. Check your .env file.');
      }

      const prompt = `Generate a detailed video script about "${scriptTopic}" in ${selectedLanguage} language, including an engaging introduction, well-structured main content, and a compelling conclusion. The script should be suitable for a YouTube video, max 10000 characters.`;
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
        throw new Error('No script data returned from the API');
      }

      const script = data.candidates[0].content.parts[0].text.trim();
      if (script.length > 10000) {
        throw new Error('Generated script exceeds 10000 characters. Please try again.');
      }

      setGeneratedScript(script);
      await updateUsage(user.id, "scripts");
      toast({
        title: 'Script Generated',
        description: `A video script has been successfully generated in ${selectedLanguage}`,
      });
    } catch (error: any) {
      console.error('Error in script generation:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate script.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript);
      toast({
        title: 'Copied to clipboard',
        description: 'Script copied to your clipboard',
      });
    }
  };

  return (
    <RestrictedFeatureRedirect featureName="Script Generator">
      <div className="space-y-6">
        <div className="flex items-center mb-2">
          <button onClick={() => handleNavigation('dashboard')} className="text-gray-400 hover:text-white mr-2">
            <Home size={16} />
          </button>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-gray-500 mr-2">Generate Content</span>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-white">Video Script Generator</span>
        </div>
        <h2 className="text-2xl font-bold text-white">AI-Generated Video Scripts</h2>
        <p className="text-gray-300">Enter a topic and get engaging video script suggestions (max 10000 characters).</p>
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="space-y-2">
            <label htmlFor="script-topic" className="text-white font-medium">
              Video Topic:
            </label>
            <input
              id="script-topic"
              type="text"
              value={scriptTopic}
              onChange={(e) => setScriptTopic(e.target.value)}
              placeholder="E.g., How to start a YouTube channel, Best practices for content creation..."
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
            onClick={generateScript}
            disabled={!scriptTopic.trim() || isLoading}
            isLoading={isLoading}
            className="w-full"
          >
            Generate Script
          </Button>
        </div>
        {generatedScript && (
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-white font-semibold mb-4">Generated Video Script:</h3>
            <div className="flex items-start justify-between p-3 bg-gray-800 rounded-lg group hover:bg-gray-700 transition-colors">
              <span className="text-white">{generatedScript}</span>
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

export default VideoScriptGenerator;
