
import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { canGenerate, updateUsage } from './usageLimits';
import RestrictedFeatureRedirect from './RestrictedFeatureRedirect';

const LinkedinPostGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  
  const generatePosts = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      setLoading(true);
      
      // Check if user can generate
      const canGenerateResult = await canGenerate(user.id, 'linkedinPosts');
      if (!canGenerateResult) {
        toast.error('You have reached your limit for LinkedIn posts generation');
        return;
      }
      
      // Make call to OpenAI API or your backend
      const { data, error } = await supabase.functions.invoke('generate-linkedin-posts', {
        body: { topic: prompt }
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.posts) {
        setResults(data.posts);
        await updateUsage(user.id, 'linkedinPosts');
      } else {
        throw new Error('No posts were generated');
      }
    } catch (error) {
      console.error('Error generating posts:', error);
      toast.error('Failed to generate posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Post copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <RestrictedFeatureRedirect featureName="LinkedIn Post Generator">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">LinkedIn Post Generator</h1>
        <p className="text-gray-300 mb-8">Generate professional LinkedIn posts about any topic.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Create a Professional Post</h2>
              
              <div className="mb-4">
                <label htmlFor="prompt" className="block text-gray-300 mb-2">What would you like to post about?</label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={4}
                  placeholder="E.g., The future of AI in content creation"
                />
              </div>
              
              <button
                onClick={generatePosts}
                disabled={loading || !prompt.trim()}
                className={`w-full py-3 px-4 rounded-lg ${
                  loading || !prompt.trim() ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-medium transition`}
              >
                {loading ? 'Generating...' : 'Generate LinkedIn Posts'}
              </button>
            </div>
            
            {results.length > 0 && (
              <div className="mt-8 bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Generated Posts</h2>
                <div className="space-y-4">
                  {results.map((post, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg cursor-pointer transition ${
                        selectedPost === post ? 'bg-gray-700 border border-blue-500' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => setSelectedPost(post)}
                    >
                      <p className="text-gray-300 line-clamp-3">{post}</p>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(post);
                          }}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          {copied && selectedPost === post ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
            
            {selectedPost ? (
              <div className="bg-gray-700 rounded-lg p-6 max-h-[500px] overflow-y-auto">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-600 mr-4"></div>
                  <div>
                    <p className="text-white font-semibold">Your Name</p>
                    <p className="text-gray-400 text-sm">Your Title • Now</p>
                  </div>
                </div>
                
                <div className="whitespace-pre-line text-gray-300">
                  {selectedPost}
                </div>
                
                <div className="mt-6 border-t border-gray-600 pt-4">
                  <div className="flex space-x-4">
                    <button className="text-gray-400 hover:text-gray-300">Like</button>
                    <button className="text-gray-400 hover:text-gray-300">Comment</button>
                    <button className="text-gray-400 hover:text-gray-300">Share</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] bg-gray-700 rounded-lg text-center p-6">
                <p className="text-gray-400 mb-2">Select a generated post to preview</p>
                <p className="text-gray-500 text-sm">Your LinkedIn post will appear here</p>
              </div>
            )}
            
            {selectedPost && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => handleCopy(selectedPost)}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </RestrictedFeatureRedirect>
  );
};

export default LinkedinPostGenerator;
