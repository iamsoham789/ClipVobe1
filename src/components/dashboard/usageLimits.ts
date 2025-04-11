
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

// Add 'export' here
export const subscriptionLimits: Record<string, Record<FeatureType, number>> = {
  free: {
    titles: 1,
    descriptions: 1,
    hashtags: 1,
    ideas: 1,
    scripts: 0,
    tweets: 1,
    youtubePosts: 1,
    redditPosts: 1,
    linkedinPosts: 1,
  },
  basic: {
    titles: 8,
    descriptions: 10,
    hashtags: 10,
    ideas: 2,
    scripts: 2,
    tweets: 5,
    youtubePosts: 5,
    redditPosts: 5,
    linkedinPosts: 5,
  },
  pro: {
    titles: 20,
    descriptions: 30,
    hashtags: 25,
    ideas: 5,
    scripts: 5,
    tweets: 12,
    youtubePosts: 12,
    redditPosts: 12,
    linkedinPosts: 12,
  },
  creator: {
    titles: 50,
    descriptions: 80,
    hashtags: 60,
    ideas: 12,
    scripts: 15,
    tweets: 30,
    youtubePosts: 30,
    redditPosts: 30,
    linkedinPosts: 30,
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
  // For free tier, strictly enforce limits
  if (tier === "free") {
    const remainingUses = await getRemainingUses(userId, feature, tier);
    return remainingUses > 0;
  }

  // For paid tiers, check if they have a valid subscription
  if (tier && tier !== "free") {
    // Check if the feature is available in this tier
    return subscriptionLimits[tier]?.[feature] > 0;
  }

  return false;
};

export const updateUsage = async (
  userId: string,
  feature: FeatureType,
  tier: string = "free",
): Promise<void> => {
  // Only track usage for free tier
  if (tier !== "free") return;
  
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
