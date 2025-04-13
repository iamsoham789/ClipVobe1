
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";

const PaymentSuccessHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      // Parse URL parameters
      const params = new URLSearchParams(location.search);
      const paymentId = params.get("payment_id") || params.get("id"); // Support both payment_id and id parameters
      const plan = params.get("plan");

      if (!paymentId || !plan || !user) {
        console.error("Missing payment information:", {
          paymentId,
          plan,
          userId: user?.id,
        });
        toast({
          title: "Payment Error",
          description: "Missing payment information. Please contact support.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      try {
        console.log("Recording subscription:", {
          userId: user.id,
          plan,
          paymentId,
        });

        // Map plan name to tier in the database
        let tier = plan.toLowerCase();
        if (!["free", "basic", "pro", "creator"].includes(tier)) {
          // Default to basic if plan name is not recognized
          console.warn(`Unrecognized plan name: ${plan}, defaulting to basic`);
          tier = "basic";
        }

        // Record the subscription in the database
        const { error } = await supabase.from("subscriptions").upsert(
          {
            user_id: user.id,
            tier: tier, // Store as tier in the database
            status: "active",
            payment_provider: "dodo",
            payment_id: paymentId,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 30 days from now
          },
          { onConflict: "user_id" },
        );

        if (error) {
          console.error("Error recording subscription:", error);
          toast({
            title: "Subscription Error",
            description:
              "There was an error recording your subscription. Please contact support.",
            variant: "destructive",
          });
        } else {
          // Also update the profile table for backward compatibility
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ subscription_plan: tier })
            .eq("id", user.id);

          if (profileError) {
            console.error("Error updating profile:", profileError);
          }

          // Reset usage counts for the user
          try {
            // First, check if usage records exist for this user
            const { data: existingUsage } = await supabase
              .from("usage")
              .select("feature")
              .eq("user_id", user.id);

            if (!existingUsage || existingUsage.length === 0) {
              // Create usage records for all features if they don't exist
              const features = [
                "titles", "descriptions", "hashtags", "ideas", "scripts",
                "tweets", "youtubePosts", "redditPosts", "linkedinPosts"
              ];
              
              const resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              
              // Create usage records for each feature
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
                  reset_at: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000,
                  ).toISOString(),
                })
                .eq("user_id", user.id);

              if (usageError) {
                console.error("Error resetting usage counts:", usageError);
              }
            }
          } catch (usageResetError) {
            console.error("Error during usage reset:", usageResetError);
          }

          toast({
            title: "Subscription Activated",
            description: `Your ${tier} plan has been activated successfully!`,
          });
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "Subscription Error",
          description: "An unexpected error occurred. Please contact support.",
          variant: "destructive",
        });
      }

      // Redirect to dashboard
      navigate("/dashboard");
    };

    if (location.pathname === "/payment-success") {
      handlePaymentSuccess();
    }
  }, [location, navigate, user, toast]);

  return null; // This component doesn't render anything
};

export default PaymentSuccessHandler;
