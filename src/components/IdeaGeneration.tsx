
import React, { useState } from 'react';
import { Lightbulb, ChevronRight, Loader2 } from 'lucide-react';
import Button from './ui/button';
import { cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';

const IdeaGeneration = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [category, setCategory] = useState('Technology');
  const [ideas, setIdeas] = useState<string[]>([
    "Top 10 Tech Gadgets for 2025",
    "Beginner's Guide to YouTube Growth",
    "How to Double Your Engagement with AI",
    "5 Secrets to Creating Viral Thumbnails",
    "Ultimate Guide to YouTube SEO in 2025",
    "Behind the Scenes: My Content Creation Process"
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateIdeas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: { category },
      });
      
      if (error) throw error;
      
      if (data?.ideas && data.ideas.length > 0) {
        setIdeas(data.ideas);
        setSelected(null); // Reset selection
      } else {
        throw new Error('No ideas generated');
      }
    } catch (err) {
      console.error('Error generating ideas:', err);
      setError('Failed to generate ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const categories = [
    'Technology', 'Gaming', 'Finance', 'Cooking', 'Health & Fitness', 
    'Travel', 'Education', 'Entertainment', 'Science', 'Art & Music'
  ];

  return (
    <section id="ideas" className="py-20 bg-clipvobe-gray-900 relative">
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-clipvobe-dark to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Text Content */}
          <div className="lg:w-1/2">
            <div className="max-w-xl animate-fade-in">
              <div className="flex items-center gap-2 text-clipvobe-cyan font-medium text-sm uppercase tracking-wider mb-3">
                <Lightbulb className="w-4 h-4" />
                <span>Never Run Out of Ideas</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Idea Generation
              </h2>
              <p className="text-clipvobe-gray-300 mb-8">
                Unlock endless video ideas for your channel. Our AI analyzes trending topics, your channel's performance, and audience preferences to suggest content that resonates with your viewers and boosts engagement.
              </p>
              <div className="space-y-3">
                {['Content tailored to your audience', 'Trending topic analysis', 'Keyword-optimized suggestions'].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-1 text-clipvobe-cyan">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <p className="text-clipvobe-gray-200">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button onClick={generateIdeas} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Ideas'
                  )}
                </Button>
              </div>
              {error && (
                <p className="mt-4 text-red-400 text-sm">{error}</p>
              )}
            </div>
          </div>
          
          {/* Idea UI Mockup */}
          <div className="lg:w-1/2 animate-fade-in-right">
            <div className="glass-card rounded-2xl border border-white/10 backdrop-blur-lg overflow-hidden max-w-lg mx-auto">
              {/* Mockup header */}
              <div className="bg-clipvobe-gray-800/50 border-b border-white/10 p-4">
                <div className="text-white font-medium">Idea Generator</div>
              </div>
              
              {/* Mockup content */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="text-sm text-clipvobe-gray-400 mb-2">Category</div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm cursor-pointer transition-colors",
                          cat === category 
                            ? "bg-clipvobe-cyan/10 text-clipvobe-cyan border border-clipvobe-cyan/20" 
                            : "bg-clipvobe-gray-800 text-clipvobe-gray-300 border border-clipvobe-gray-700 hover:bg-clipvobe-gray-700"
                        )}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-clipvobe-gray-400 mb-2">Generated Ideas</div>
                  <div className={cn("opacity-100 transition-opacity duration-200", loading ? "opacity-50" : "")}>
                    {ideas.map((idea, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-all mb-2",
                          selected === index 
                            ? "bg-clipvobe-cyan/10 border border-clipvobe-cyan/20" 
                            : "hover:bg-clipvobe-gray-800/80 border border-white/5"
                        )}
                        onClick={() => setSelected(index)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white">{idea}</span>
                          <ChevronRight 
                            className={cn(
                              "w-5 h-5 transition-transform",
                              selected === index ? "text-clipvobe-cyan rotate-90" : "text-clipvobe-gray-500"
                            )} 
                          />
                        </div>
                        {selected === index && (
                          <div className="mt-3 pt-3 border-t border-clipvobe-cyan/20 text-clipvobe-gray-300 text-sm animate-fade-in">
                            This video could cover key points related to "{idea}", providing valuable insights, 
                            practical demonstrations, and engaging content. Click Generate to create more ideas.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IdeaGeneration;
