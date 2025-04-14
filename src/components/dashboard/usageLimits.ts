
import { supabase } from "../../integrations/supabase/client";

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

// Update subscription limits to match new pricing tiers
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

export const getRemainingUses = async (
  userId: string,
  feature: FeatureType,
  tier: string = "free",
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("usage")
      .select("count")
      .eq("user_id", userId)
      .eq("feature", feature)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No record found, return the full limit
        return subscriptionLimits[tier][feature] || 0;
      }
      console.error("Error fetching usage:", error);
      return subscriptionLimits[tier][feature] || 0;
    }

    // Use optional chaining and null check
    const currentCount = data && typeof data === 'object' && 'count' in data ? (data as {count: number}).count : 0;
    const maxLimit = subscriptionLimits[tier][feature] || 0;
    return Math.max(0, maxLimit - currentCount);
  } catch (error) {
    console.error("Error in getRemainingUses:", error);
    return subscriptionLimits[tier][feature] || 0;
  }
};

export const canGenerate = async (
  userId: string,
  feature: FeatureType,
  tier: string = "free",
): Promise<boolean> => {
  // Check if the feature is available in this tier
  if (subscriptionLimits[tier]?.[feature] === 0) {
    return false;
  }

  // For all tiers, check remaining uses
  const remainingUses = await getRemainingUses(userId, feature, tier);
  return remainingUses > 0;
};

export const updateUsage = async (
  userId: string,
  feature: FeatureType,
  tier: string = "free",
): Promise<void> => {
  // Only track usage for all tiers now
  try {
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
    const resetAt = new Date();
    resetAt.setMonth(resetAt.getMonth() + 1);

    const { error: upsertError } = await supabase
      .from("usage")
      .upsert(
        { user_id: userId, feature, count: newCount, reset_at: resetAt },
        { onConflict: "user_id,feature" }
      );

    if (upsertError) {
      console.error("Error updating usage:", upsertError);
    }
  } catch (error) {
    console.error("Error in updateUsage:", error);
  }
};
