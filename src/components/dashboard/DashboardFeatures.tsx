// @ts-nocheck
import React from "react";
import { useEffect, useState } from "react";
import TitleGenerator from "./TitleGenerator";
import DescriptionGenerator from "./DescriptionGenerator";
import HashtagGenerator from "./HashtagGenerator";
import VideoIdeasGenerator from "./VideoIdeasGenerator";
import VideoScriptGenerator from "./VideoScriptGenerator";
import TweetGenerator from "./TweetGenerator";
import LinkedInPostGenerator from "./LinkedInPostGenerator";
import RedditPostGenerator from "./RedditPostGenerator";
import YouTubeCommunityPostGenerator from "./YouTubeCommunityPostGenerator";
import Settings from "./Settings";
import { FeatureOption, FeatureType } from "../../types/dashboard";

interface DashboardFeaturesProps {
  activeItem: string;
  activeSubItem: string | null;
  handleNavigation: (itemId: string, subItemId?: string) => void;
}

const DashboardFeatures: React.FC<DashboardFeaturesProps> = ({
  activeItem,
  activeSubItem,
  handleNavigation,
}) => {
  const [renderKey, setRenderKey] = useState(Date.now());

  // Reset component when active item changes (helps with state reset)
  useEffect(() => {
    setRenderKey(Date.now());
  }, [activeItem, activeSubItem]);

  // Mock data for Settings component
  const mockUsageStats = {
    titles: 0,
    descriptions: 0,
    hashtags: 0,
    ideas: 0,
    scripts: 0,
    tweets: 0,
    linkedin: 0,
    reddit: 0,
    youtube: 0
  };

  const mockFeatureOptions: FeatureOption[] = [
    { id: 'titles', key: "titles", label: 'Video Titles', supabaseFunction: 'generate-titles', navId: 'title-generator' },
    { id: 'descriptions', key: "descriptions", label: 'Video Descriptions', supabaseFunction: 'generate-description', navId: 'description-generator' },
    { id: 'hashtags', key: "hashtags", label: 'Hashtags & Tags', supabaseFunction: 'generate-hashtags', navId: 'hashtag-generator' },
    { id: 'ideas', key: "ideas", label: 'Video Ideas', supabaseFunction: 'generate-ideas', navId: 'ideas-generator' },
    { id: 'scripts', key: "scripts", label: 'Video Scripts', supabaseFunction: 'generate-script', navId: 'script-generator' },
    { id: 'tweets', key: "tweets", label: 'Tweets', supabaseFunction: 'generate-tweets', navId: 'platform-post-generator' },
    { id: 'linkedin', key: "linkedinPosts", label: 'LinkedIn Posts', supabaseFunction: 'generate-linkedin-posts', navId: 'platform-post-generator' },
    { id: 'reddit', key: "redditPosts", label: 'Reddit Posts', supabaseFunction: 'generate-reddit-posts', navId: 'platform-post-generator' },
    { id: 'youtube', key: "youtubePosts", label: 'YouTube Posts', supabaseFunction: 'generate-youtube-posts', navId: 'platform-post-generator' }
  ];

  // Mock tier data
  const mockTier = "basic";

  return (
    <div key={renderKey} className="flex-1 p-6 overflow-y-auto">
      {activeItem === "dashboard" && !activeSubItem && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleNavigation("title-generator")}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Generate Video Titles
                </button>
                <button
                  onClick={() => handleNavigation("description-generator")}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Generate Video Descriptions
                </button>
                <button
                  onClick={() => handleNavigation("hashtag-generator")}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Generate Hashtags & Tags
                </button>
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-white mb-4">Content Planning</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleNavigation("ideas-generator")}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Find Video Ideas
                </button>
                <button
                  onClick={() => handleNavigation("script-generator")}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Generate Video Scripts
                </button>
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-white mb-4">Platform Posts</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleNavigation("platform-post-generator", "tweet")}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Generate Tweets
                </button>
                <button
                  onClick={() => handleNavigation("platform-post-generator", "linkedin")}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Generate LinkedIn Posts
                </button>
                <button
                  onClick={() => handleNavigation("platform-post-generator", "reddit")}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Generate Reddit Posts
                </button>
                <button
                  onClick={() => handleNavigation("platform-post-generator", "youtube")}
                  className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                  Generate YouTube Community Posts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeItem === "title-generator" && (
        <TitleGenerator handleNavigation={handleNavigation} />
      )}

      {activeItem === "description-generator" && (
        <DescriptionGenerator handleNavigation={handleNavigation} />
      )}

      {activeItem === "hashtag-generator" && (
        <HashtagGenerator handleNavigation={handleNavigation} />
      )}

      {activeItem === "ideas-generator" && (
        <VideoIdeasGenerator handleNavigation={handleNavigation} />
      )}

      {activeItem === "script-generator" && (
        <VideoScriptGenerator handleNavigation={handleNavigation} />
      )}

      {activeItem === "platform-post-generator" && activeSubItem === "tweet" && (
        <TweetGenerator handleNavigation={handleNavigation} />
      )}

      {activeItem === "platform-post-generator" &&
        activeSubItem === "linkedin" && (
          <LinkedInPostGenerator handleNavigation={handleNavigation} />
        )}

      {activeItem === "platform-post-generator" &&
        activeSubItem === "reddit" && (
          <RedditPostGenerator handleNavigation={handleNavigation} />
        )}

      {activeItem === "platform-post-generator" &&
        activeSubItem === "youtube" && (
          <YouTubeCommunityPostGenerator handleNavigation={handleNavigation} />
        )}

      {activeItem === "settings" && 
        <Settings 
          usageStats={mockUsageStats} 
          featureOptions={mockFeatureOptions} 
          tier={mockTier} 
          handleNavigation={handleNavigation} 
        />
      }
    </div>
  );
};

export default DashboardFeatures;
