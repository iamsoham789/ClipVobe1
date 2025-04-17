
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { subscriptionLimits } from "./usageLimits";
import type { FeatureType } from "./usageLimits";

interface RestrictedFeatureRedirectProps {
  children: React.ReactNode;
  featureName: string;
}

const featureNameToType: Record<string, FeatureType> = {
  "Tweet Generator": "tweets",
  "tweets": "tweets",
  "LinkedIn Post Generator": "linkedinPosts",
  "Reddit Post Generator": "redditPosts",
  "YouTube Community Post Generator": "youtubePosts",
  "Video Script Generator": "scripts",
};

const RestrictedFeatureRedirect = ({ children, featureName }: RestrictedFeatureRedirectProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const { tier } = useSubscription(user?.id);

  useEffect(() => {
    // If no user is logged in, redirect to auth
    if (!user) {
      toast.error("Please log in to access this feature");
      navigate("/auth");
      return;
    }

    // Check if the feature is available in the user's subscription tier
    const featureType = featureNameToType[featureName];
    if (!featureType) {
      // If we don't have a mapping, default to allowing access
      setHasAccess(true);
      return;
    }

    // Get the limit for this feature in the user's subscription tier
    const limit = subscriptionLimits[tier]?.[featureType] || 0;
    
    // If limit is 0, the feature is not available
    if (limit === 0) {
      toast.error(`Upgrade to Basic or Pro to access ${featureName}`);
      navigate("/pricing");
      return;
    }

    // User has access to this feature
    setHasAccess(true);
  }, [user, featureName, navigate, tier]);

  // Show loading state while checking access
  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If user has access, render the children
  return <>{children}</>;
};

export default RestrictedFeatureRedirect;
