import { supabase } from "@/integrations/supabase/client";

export type FeatureType =
  | "titles"
  | "descriptions"
  | "hashtags"
  | "ideas"
  | "scripts"
  | "tweets"
  | "youtubePosts"
  | "redditPosts"
  | "linkedinPosts";

// Subscription limits match the pricing tiers
export const subscriptionLimits: Record<string, Record<FeatureType, number>> = {
  free: {
    titles: 2,
    descriptions: 2,
    hashtags: 2,
    ideas: 2,
    scripts: 0,
    tweets: 0,
    youtubePosts: 0,
    redditPosts: 0,
    linkedinPosts: 0,
  },
  basic: {
    titles: 30,
    descriptions: 25,
    hashtags: 25,
    ideas: 6,
    scripts: 5,
    tweets: 20,
    youtubePosts: 20,
    redditPosts: 20,
    linkedinPosts: 20,
  },
  pro: {
    titles: 2000, // Internal cap for "unlimited"
    descriptions: 1000, // Internal cap for "unlimited"
    hashtags: 1000, // Internal cap for "unlimited"
    ideas: 400, // Internal cap for "unlimited"
    scripts: 100, // Internal cap for "unlimited"
    tweets: 1000, // Internal cap for "unlimited"
    youtubePosts: 1000, // Internal cap for "unlimited"
    redditPosts: 1000, // Internal cap for "unlimited"
    linkedinPosts: 1000, // Internal cap for "unlimited"
  },
};

/**
 * Get remaining uses for a feature based on the user's subscription tier
 */
export const getRemainingUses = async (
  userId: string,
  feature: FeatureType,
  tier: string = "free",
): Promise<number> => {
  try {
    // Check if the feature is available in this tier
    const maxLimit = subscriptionLimits[tier]?.[feature] || 0;
    if (maxLimit === 0) {
      return 0; // Feature not available in this tier
    }

    // Get current usage count
    const { data, error } = await supabase
      .from("usage")
      .select("count")
      .eq("user_id", userId)
      .eq("feature", feature)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No record found, return the full limit
        return maxLimit;
      }
      console.error("Error fetching usage:", error);
      return maxLimit;
    }

    // Calculate remaining uses
    const currentCount = data && typeof data === 'object' && 'count' in data ? (data as {count: number}).count : 0;
    return Math.max(0, maxLimit - currentCount);
  } catch (error) {
    console.error("Error in getRemainingUses:", error);
    return subscriptionLimits[tier][feature] || 0;
  }
};

/**
 * Check if the user can use a feature based on their subscription and usage
 */
export const canGenerate = async (
  userId: string,
  feature: FeatureType,
  tier: string = "free",
): Promise<number> => {
  // Check if the feature is available in this tier
  if (subscriptionLimits[tier]?.[feature] === 0) {
    return 0;
  }

  // Get remaining uses
  return await getRemainingUses(userId, feature, tier);
};

/**
 * Update usage count for a feature
 */
export const updateUsage = async (
  userId: string,
  feature: FeatureType,
  tier?: SubscriptionTier,
): Promise<boolean> => {
  try {
    // Check if the feature is available in this tier
    if (subscriptionLimits[tier]?.[feature] === 0) {
      return false;
    }

    // Get current usage
    const { data, error: fetchError } = await supabase
      .from("usage")
      .select("count")
      .eq("user_id", userId)
      .eq("feature", feature)
      .single();

    let currentCount = 0;
    if (fetchError) {
      if (fetchError.code !== "PGRST116") {
        console.error("Error fetching usage for update:", fetchError);
      }
      // If no record exists, we'll create a new one with count = 1
    } else {
      // Safely access count with proper null check
      currentCount = data && typeof data === 'object' && 'count' in data ? (data as {count: number}).count : 0;
    }

    const newCount = currentCount + 1;
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    const resetAtStr = resetDate.toISOString();

    // Update or insert usage record
    const { error: upsertError } = await supabase
      .from("usage")
      .upsert(
        { user_id: userId, feature, count: newCount, reset_at: resetAtStr },
        { onConflict: "user_id,feature" }
      );

    if (upsertError) {
      console.error("Error updating usage:", upsertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateUsage:", error);
    return false;
  }
};
