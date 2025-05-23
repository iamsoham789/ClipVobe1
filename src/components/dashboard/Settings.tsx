import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import {
  subscriptionLimits,
  FeatureType,
  getRemainingUses,
} from "../dashboard/usageLimits";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Mail,
  CreditCard,
  User,
  Settings as SettingsIcon,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { supabase } from "../../integrations/supabase/client";
import { useSubscription } from "../../hooks/use-subscription";

interface FeatureOption {
  id: string;
  label: string;
  key: FeatureType;
  supabaseFunction: string;
  navId: string;
}

interface SettingsProps {
  usageStats: { [key: string]: number };
  featureOptions: FeatureOption[];
  tier: string;
  handleNavigation: (itemId: string, subItemId?: string) => void;
}

const Settings: React.FC<SettingsProps> = ({
  usageStats: initialUsageStats,
  featureOptions,
  tier: initialTier,
  handleNavigation,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, loading: subscriptionLoading } = useSubscription(
    user?.id,
  );
  const [tier, setTier] = useState(initialTier);
  const [usageStats, setUsageStats] = useState(initialUsageStats);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("usage");
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    // Initialize with the passed stats
    setUsageStats(initialUsageStats);
  }, [initialUsageStats]);

  useEffect(() => {
    // Make sure subscription exists and has a tier property before accessing it
    if (subscription && typeof subscription === 'object' && 'tier' in subscription && subscription.tier && subscription.tier !== initialTier) {
      setTier(subscription.tier);
    }
  }, [subscription, initialTier]);

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!user) return;

      try {
        // Get subscription details from Supabase
        const { data, error } = await supabase
          .from("subscriptions")
          .select("tier, status, expires_at")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching subscription details:", error);
          return;
        }

        if (data) {
          setSubscriptionDetails(data);
          // Update tier if it's different from what we have
          if (data.tier && typeof data.tier === 'string' && data.tier !== tier) {
            setTier(data.tier);
          }
        }
      } catch (error) {
        console.error("Error in fetchSubscriptionDetails:", error);
      }
    };

    fetchSubscriptionDetails();
  }, [user, tier]);

  const refreshUsageStats = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      const usageMap: any = {};
      for (const feature of featureOptions) {
        try {
          const remainingUses = await getRemainingUses(
            user.id,
            feature.key,
            tier,
          );
          const totalLimit = subscriptionLimits?.[tier]?.[feature.key] ?? 0;
          usageMap[feature.key] = totalLimit - remainingUses;
        } catch (error) {
          console.error(`Error fetching usage for ${feature.key}:`, error);
          usageMap[feature.key] = initialUsageStats[feature.key] || 0;
        }
      }
      setUsageStats(usageMap);
      toast({
        title: "Usage data refreshed",
        description: "Your usage statistics have been updated.",
      });
    } catch (error) {
      console.error("Error refreshing usage stats:", error);
      toast({
        title: "Error",
        description: "Failed to refresh usage data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPlanDetails = () => {
    switch (tier) {
      case "free":
        return {
          name: "Free Plan",
          description:
            "Basic access to content generation tools with limited monthly usage.",
          price: "$0/month",
          features: [
            "Limited generations per month",
            "Basic content types",
            "Standard quality outputs",
          ],
        };
      case "basic":
        return {
          name: "Basic Plan",
          description:
            "Enhanced access with increased generation limits and more features.",
          price: "$5/month",
          features: [
            "40 titles (8 requests)",
            "10 descriptions (10 requests)",
            "10 hashtag sets (10 requests)",
            "10 ideas (2 requests)",
            "5 tweets (5 requests)",
            "5 LinkedIn posts (5 requests)",
            "5 Reddit posts (5 requests)",
            "5 YouTube community posts (5 requests)",
            "2 scripts (2 requests)",
          ],
        };
      case "pro":
        return {
          name: "Pro Plan",
          description:
            "Professional-grade content generation with premium features.",
          price: "$15/month",
          features: [
            "100 titles (20 requests)",
            "30 descriptions (30 requests)",
            "25 hashtag sets (25 requests)",
            "25 ideas (5 requests)",
            "12 tweets (12 requests)",
            "12 LinkedIn posts (12 requests)",
            "12 Reddit posts (12 requests)",
            "12 YouTube community posts (12 requests)",
            "5 scripts (5 requests)",
          ],
        };
      case "creator":
        return {
          name: "Creator Plan",
          description:
            "Our most comprehensive plan for serious content creators.",
          price: "$39.99/month",
          features: [
            "Maximum generation limits",
            "All content types",
            "Highest quality outputs",
            "Priority support",
            "Advanced customization",
            "API access",
          ],
        };
      default:
        return {
          name: tier
            ? `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`
            : "Unknown Plan",
          description: "Plan details not available.",
          price: subscriptionDetails?.price || "Price not available",
          features: [],
        };
    }
  };

  const planDetails = getPlanDetails();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="text-clipvobe-cyan border-clipvobe-cyan hover:bg-clipvobe-cyan/10"
            onClick={refreshUsageStats}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-clipvobe-gray-700 mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === "usage" ? "text-clipvobe-cyan border-b-2 border-clipvobe-cyan" : "text-clipvobe-gray-400 hover:text-white"}`}
          onClick={() => setActiveTab("usage")}
        >
          <div className="flex items-center">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Usage & Limits
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "plan" ? "text-clipvobe-cyan border-b-2 border-clipvobe-cyan" : "text-clipvobe-gray-400 hover:text-white"}`}
          onClick={() => setActiveTab("plan")}
        >
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Your Plan
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "account" ? "text-clipvobe-cyan border-b-2 border-clipvobe-cyan" : "text-clipvobe-gray-400 hover:text-white"}`}
          onClick={() => setActiveTab("account")}
        >
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            Account
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "help" ? "text-clipvobe-cyan border-b-2 border-clipvobe-cyan" : "text-clipvobe-gray-400 hover:text-white"}`}
          onClick={() => setActiveTab("help")}
        >
          <div className="flex items-center">
            <HelpCircle className="h-4 w-4 mr-2" />
            Help & Support
          </div>
        </button>
      </div>

      {/* Usage Overview Section */}
      {activeTab === "usage" && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">
              Feature Usage Overview
            </h2>
          </div>
          <p className="text-clipvobe-gray-300 mb-6">
            Monitor your usage for each feature based on your current plan (
            {tier}).
          </p>

          {/* Table View of Feature Usage */}
          <div className="bg-clipvobe-gray-800 rounded-xl overflow-hidden mb-8">
            <table className="w-full">
              <thead>
                <tr className="bg-clipvobe-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-clipvobe-gray-300 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-clipvobe-gray-300 uppercase tracking-wider">
                    Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-clipvobe-gray-300 uppercase tracking-wider">
                    Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-clipvobe-gray-300 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-clipvobe-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clipvobe-gray-700">
                {featureOptions.map((feature) => {
                  const used = usageStats[feature.key] || 0;
                  const limit = subscriptionLimits?.[tier]?.[feature.key] ?? 0;
                  const remaining = Math.max(0, limit - used);
                  const usagePercentage = limit > 0 ? (used / limit) * 100 : 0;

                  return (
                    <tr
                      key={feature.id}
                      className="hover:bg-clipvobe-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {feature.label}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-clipvobe-gray-300">
                          {used}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-clipvobe-gray-300">
                          {limit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-clipvobe-gray-300 mr-2">
                            {remaining}
                          </div>
                          <div className="w-24 bg-clipvobe-gray-700 rounded-full h-2">
                            <div
                              className={`h-full rounded-full ${usagePercentage > 80 ? "bg-red-500" : "bg-clipvobe-cyan"}`}
                              style={{
                                width: `${Math.min(100, usagePercentage)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-clipvobe-cyan hover:bg-clipvobe-cyan/10"
                          onClick={() => handleNavigation(feature.navId)}
                        >
                          Go to Generator
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Overview Section */}
      {activeTab === "plan" && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Your Plan</h2>

          <div className="bg-clipvobe-gray-800 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <p className="text-clipvobe-gray-400 text-sm">
                  Current Subscription
                </p>
                <h3 className="text-2xl font-bold text-white">
                  {planDetails.name}
                </h3>
                <p className="text-clipvobe-cyan font-medium">
                  {planDetails.price}
                </p>
                {subscriptionDetails && (
                  <p className="text-clipvobe-gray-400 text-sm mt-1">
                    {subscriptionDetails.status === "active"
                      ? "Active"
                      : "Inactive"}{" "}
                    • Renews{" "}
                    {subscriptionDetails.expires_at
                      ? new Date(
                          subscriptionDetails.expires_at,
                        ).toLocaleDateString()
                      : "soon"}
                  </p>
                )}
              </div>

              {tier !== "creator" && (
                <Button
                  className="mt-4 md:mt-0 bg-clipvobe-cyan text-black hover:bg-clipvobe-cyan/80"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  Upgrade Plan
                </Button>
              )}
            </div>

            <p className="text-clipvobe-gray-300 mb-4">
              {planDetails.description}
            </p>

            <h4 className="text-white font-medium mb-2">Plan Features:</h4>
            <ul className="space-y-2">
              {planDetails.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-clipvobe-cyan mr-2">✓</span>
                  <span className="text-clipvobe-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {tier !== "free" && (
            <div className="bg-clipvobe-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Billing Information
              </h3>
              <p className="text-clipvobe-gray-300 mb-6">
                Your subscription renews automatically on the 1st of each month.
              </p>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  className="border-clipvobe-cyan text-clipvobe-cyan hover:bg-clipvobe-cyan/10"
                  onClick={() => window.open("/contact", "_blank")}
                >
                  Request Refund
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Section */}
      {activeTab === "account" && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Account Settings
          </h2>

          <div className="bg-clipvobe-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              Profile Information
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-clipvobe-gray-400 text-sm">Email Address</p>
                <p className="text-white font-medium">{user?.email}</p>
              </div>

              <div>
                <p className="text-clipvobe-gray-400 text-sm">
                  Account Created
                </p>
                <p className="text-white font-medium">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="border-clipvobe-cyan text-clipvobe-cyan hover:bg-clipvobe-cyan/10"
              >
                
              </Button>
            </div>
          </div>

          <div className="bg-clipvobe-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Danger Zone
            </h3>
            <p className="text-clipvobe-gray-300 mb-6">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>

            <Button
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/10"
            >
              Delete Account
            </Button>
          </div>
        </div>
      )}

      {/* Help & Support Section */}
      {activeTab === "help" && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Help & Support
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-clipvobe-gray-800 rounded-xl p-6 hover:bg-clipvobe-gray-700 transition-colors">
              <HelpCircle className="h-10 w-10 text-clipvobe-cyan mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Help Center
              </h3>
              <p className="text-clipvobe-gray-300 mb-4">
                Browse our knowledge base for tutorials, guides, and answers to
                frequently asked questions.
              </p>
              <Button
                className="w-full bg-clipvobe-cyan text-black hover:bg-clipvobe-cyan/80"
                onClick={() => window.open("/help", "_blank")}
              >
                Visit Help Center
              </Button>
            </div>

            <div className="bg-clipvobe-gray-800 rounded-xl p-6 hover:bg-clipvobe-gray-700 transition-colors">
              <Mail className="h-10 w-10 text-clipvobe-cyan mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Contact Support
              </h3>
              <p className="text-clipvobe-gray-300 mb-4">
                Need personalized help? Our support team is ready to assist you
                with any questions or issues.
              </p>
              <Button
                className="w-full bg-clipvobe-cyan text-black hover:bg-clipvobe-cyan/80"
                onClick={() => window.open("/contact", "_blank")}
              >
                Contact Us
              </Button>
            </div>
          </div>

          <div className="bg-clipvobe-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Frequently Asked Questions
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-clipvobe-cyan mb-2">
                  How do I upgrade my plan?
                </h4>
                <p className="text-clipvobe-gray-300">
                  You can upgrade your plan by visiting the "Your Plan" tab in
                  Settings and clicking the "Upgrade Plan" button.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-medium text-clipvobe-cyan mb-2">
                  When do my usage limits reset?
                </h4>
                <p className="text-clipvobe-gray-300">
                  Usage limits reset on the first day of each month. Your
                  current usage is displayed in the "Usage & Limits" tab.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-medium text-clipvobe-cyan mb-2">
                  How can I request a refund?
                </h4>
                <p className="text-clipvobe-gray-300">
                  You can request a refund within 14 days of your subscription
                  purchase by contacting our support team through the Contact
                  page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
