
import React from 'react';
import TitleGenerator from './TitleGenerator';
import DescriptionGenerator from './DescriptionGenerator';
import HashtagGenerator from './HashtagGenerator';
import VideoIdeasGenerator from './VideoIdeasGenerator';
import VideoScriptGenerator from './VideoScriptGenerator';
import TweetGenerator from './Tweet Generator';
import YouTubeCommunityPostGenerator from './YouTubeCommunityPostGenerator';
import RedditPostGenerator from './RedditPostGenerator';
import LinkedInPostGenerator from './linkedin Post Generator';

interface DashboardFeaturesProps {
  activeItem: string;
  activeSubItem: string;
  handleNavigation: (itemId: string, subItemId?: string) => void;
}

const DashboardFeatures: React.FC<DashboardFeaturesProps> = ({
  activeItem,
  activeSubItem,
  handleNavigation,
}) => {
  console.log('DashboardFeatures rendering with:', {
    activeItem,
    activeSubItem,
    handleNavigation: !!handleNavigation,
  });

  try {
    switch (activeItem) {
      case 'dashboard':
        return <div>Dashboard Overview (Placeholder)</div>;

      case 'video-titles':
        return <TitleGenerator handleNavigation={handleNavigation} />;

      case 'video-descriptions':
        return <DescriptionGenerator handleNavigation={handleNavigation} />;

      case 'hashtags':
        return <HashtagGenerator handleNavigation={handleNavigation} />;

      case 'video-ideas':
        return <VideoIdeasGenerator handleNavigation={handleNavigation} />;

      case 'video-scripts':
        console.log('About to render VideoScriptGenerator');
        return <VideoScriptGenerator handleNavigation={handleNavigation} />;

      case 'tweet-generator':
        // @ts-ignore - TweetGenerator has been updated to accept handleNavigation
        return <TweetGenerator handleNavigation={handleNavigation} />;

      case 'youtube-community-post-generator':
        return <YouTubeCommunityPostGenerator handleNavigation={handleNavigation} />;

      case 'reddit-post-generator':
        return <RedditPostGenerator handleNavigation={handleNavigation} />;

      case 'linkedin-post-generator':
        // @ts-ignore - LinkedInPostGenerator has been updated to accept handleNavigation
        return <LinkedInPostGenerator handleNavigation={handleNavigation} />;

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <div className="glass-card rounded-xl p-6">
              <p className="text-gray-400">Nothing Here...</p>
            </div>
          </div>
        );

      default:
        console.log('No matching case for activeItem:', activeItem);
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a feature from the sidebar
          </div>
        );
    }
  } catch (error) {
    console.error('Error in DashboardFeatures:', error);
    return (
      <div className="text-red-500 p-4">
        An error occurred while rendering this component. Please check the console for details.
      </div>
    );
  }
};

export default DashboardFeatures;
