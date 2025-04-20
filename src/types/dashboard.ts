
import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  title: string;
  icon?: LucideIcon;
  description?: string;
  isSpacer?: boolean;
  showPopup?: boolean;
}

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid';

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

export interface FeatureOption {
  id: string;
  key: FeatureType;
  label: string;
  supabaseFunction: string;
  navId: string;
}
