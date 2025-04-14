
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface PaymentButtonProps {
  plan: "basic" | "pro";
  price: number;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function PaymentButton({
  plan,
  price,
  children,
  variant = "default",
  className,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (!user) {
      toast.error("Please sign in to purchase a subscription");
      navigate("/auth");
      return;
    }

    try {
      setLoading(true);
      toast.info(`Processing ${plan} plan purchase...`);

      // Get feature limits based on plan
      const featureLimits = plan === "basic" 
        ? {
            titles: 30,
            descriptions: 25,
            hashtags: 25,
            ideas: 6,
            tweets: 20,
            linkedinPosts: 20,
            redditPosts: 20,
            youtubePosts: 20,
            scripts: 5
          }
        : {
            titles: 2000,
            descriptions: 1000,
            hashtags: 1000,
            ideas: 400,
            tweets: 1000,
            linkedinPosts: 1000,
            redditPosts: 1000,
            youtubePosts: 1000,
            scripts: 100
          };

      // Simulate payment processing
      // In a real app, you would integrate with a payment provider here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update subscription in Supabase
      const { error } = await supabase.from("subscriptions").upsert({
        user_id: user.id,
        tier: plan,
        status: "active",
        payment_provider: "lovable",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      });

      if (error) {
        console.error("Error updating subscription:", error);
        toast.error("Failed to update subscription. Please try again.");
        return;
      }

      // Reset usage counts for the user
      try {
        // First, check if usage records exist for this user
        const { data: existingUsage } = await supabase
          .from("usage")
          .select("feature")
          .eq("user_id", user.id);

        const resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const features = [
          "titles", "descriptions", "hashtags", "ideas", "scripts",
          "tweets", "youtubePosts", "redditPosts", "linkedinPosts"
        ];
        
        if (!existingUsage || existingUsage.length === 0) {
          // Create usage records for all features if they don't exist
          for (const feature of features) {
            await supabase.from("usage").insert({
              user_id: user.id,
              feature,
              count: 0,
              reset_at: resetDate.toISOString(),
            });
          }
        } else {
          // Reset existing usage records
          const { error: usageError } = await supabase
            .from("usage")
            .update({
              count: 0,
              reset_at: resetDate.toISOString(),
            })
            .eq("user_id", user.id);

          if (usageError) {
            console.error("Error resetting usage counts:", usageError);
          }
        }
      } catch (usageResetError) {
        console.error("Error during usage reset:", usageResetError);
      }

      toast.success(`Your ${plan} plan has been activated!`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Payment processing error:", error);
      toast.error("Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      variant={variant}
      className={className}
      disabled={loading}
    >
      {loading ? "Processing..." : children}
    </Button>
  );
}
