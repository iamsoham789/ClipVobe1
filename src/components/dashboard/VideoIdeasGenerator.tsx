
import React, { useState } from 'react';
import { Home, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { canGenerate, updateUsage } from './usageLimits';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/use-subscription';
import { useNavigate } from 'react-router-dom';

const IdeaGenerator: React.FC<{
  handleNavigation: (itemId: string, subItemId?: string) => void;
}> = ({ handleNavigation }) => {
  const [contentType, setContentType] = useState('YouTube Video');
  const [topic, setTopic] = useState('');
  const [ideas, setIdeas] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { tier } = useSubscription(user?.id);
  const navigate = useNavigate();

  const generateIdeas = async () => {
    if (!user) {
      toast({ title: "Login Required", variant: "destructive" });
      navigate('/login');
      return;
    }
    setIsLoading(true);
    const userTier = tier || "free";
    const allowed = await canGenerate(user.id, "ideas", userTier);
    if (!allowed) {
      toast({ title: "Limit Reached", variant: "destructive" });
      navigate('/pricing');
      setIsLoading(false);
      return;
    }
    try {
      if (!topic.trim()) throw new Error('Please enter a topic');
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: { category: topic }, // Map topic to category
      });
      if (error) throw new Error(error.message || 'Edge Function failed');
      if (data?.ideas) {
        setIdeas(data.ideas);
        await updateUsage(user.id, "ideas");
        toast({ title: 'Ideas Generated' });
      } else {
        throw new Error('No ideas returned');
      }
    } catch (error: any) {
      console.error('Ideas generation error:', error);
      toast({ title: 'Generation Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Content ideas have been copied to your clipboard',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-2">
        <button onClick={() => handleNavigation('dashboard')} className="text-gray-400 hover:text-white mr-2">
          <Home size={16} />
        </button>
        <span className="text-gray-500 mx-2">/</span>
        <span className="text-gray-500 mr-2">Generate Content</span>
        <span className="text-gray-500 mx-2">/</span>
        <span className="text-white">Idea Generator</span>
      </div>
      <h2 className="text-2xl font-bold text-white">
        AI-Generated {contentType} Ideas
      </h2>
      <p className="text-gray-300">
        Enter a topic to generate creative and engaging ideas for your {contentType.toLowerCase()}.
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
            <option value="Instagram Video">Instagram Video</option>
            <option value="Blog Post">Blog Post</option>
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
            placeholder={`E.g., Fitness tips, AI tools, Travel destinations...`}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-clipvobe-cyan"
          />
        </div>
        <Button
          onClick={generateIdeas}
          disabled={!topic.trim() || isLoading}
          isLoading={isLoading}
          className="w-full"
        >
          Generate Ideas
        </Button>
      </div>
      {ideas && (
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-white font-semibold mb-4">Generated Ideas:</h3>
          <ul className="space-y-2">
            {ideas.map((idea, index) => (
              <li key={index} className="flex items-start justify-between p-3 bg-gray-800 rounded-lg group hover:bg-gray-700 transition-colors">
                <span className="text-white">{idea}</span>
                <button
                  onClick={() => copyToClipboard(idea)}
                  className="text-gray-400 hover:text-clipvobe-cyan opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default IdeaGenerator;
