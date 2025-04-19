
import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";

interface PricingTier {
  name: string;
  price: { usd: string; inr?: string };
  features: { feature: string; value: string }[];
  popular?: boolean;
  plan?: "free" | "basic" | "pro";
  priceId?: string;
}

// Stripe publishable key (used for frontend only)
const STRIPE_PUBLISHABLE_KEY = "pk_test_51R4PJrAUtKomR9D7QiJhikXWdXZixuTveAfVSZgkEkPEv7Yrx7mReXUg8zmVWL7ndERZVO7Quvsh4pboh0hmb5Cs00B9Sdc47A";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
// NOTE: Stripe price IDs are not used on the frontend; backend determines them securely.

const Pricing = () => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [isIndianUser, setIsIndianUser] = useState(false);
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setIsIndianUser(timezone.includes("Asia/Kolkata") || timezone.includes("India"));
  }, []);

  const pricingTiers: PricingTier[] = [
    {
      name: "Free",
      price: { usd: "0" },
      plan: "free",
      features: [
        { feature: "AI Video Titles", value: "10 titles (2 requests)" },
        { feature: "AI Video Descriptions", value: "2 descriptions (2 requests)" },
        { feature: "AI Hashtag and Tag Generator", value: "2 sets (2 requests)" },
        { feature: "AI Idea Finder", value: "2 ideas (2 requests)" },
        { feature: "AI Tweet Generator", value: "No access" },
        { feature: "AI LinkedIn Post Generator", value: "No access" },
        { feature: "AI Reddit Post Generator", value: "No access" },
        { feature: "AI YouTube Community Post Generator", value: "No access" },
        { feature: "AI Script Generator", value: "No access" }
      ],
    },
    {
      name: "Basic",
      price: { usd: "9", inr: "750" },
      plan: "basic",
      // priceId removed; backend determines this
      features: [
        { feature: "AI Video Titles", value: "150 titles (30 requests)" },
        { feature: "AI Video Descriptions", value: "25 descriptions (25 requests)" },
        { feature: "AI Hashtag and Tag Generator", value: "25 sets (25 requests)" },
        { feature: "AI Idea Finder", value: "25 ideas (6 requests)" },
        { feature: "AI Tweet Generator", value: "20 tweets (20 requests)" },
        { feature: "AI LinkedIn Post Generator", value: "20 posts (20 requests)" },
        { feature: "AI Reddit Post Generator", value: "20 posts (20 requests)" },
        { feature: "AI YouTube Community Post Generator", value: "20 posts (20 requests)" },
        { feature: "AI Script Generator", value: "5 scripts (5 requests)" },
      ],
    },
    {
      name: "Pro",
      price: { usd: "39", inr: "3200" },
      plan: "pro",
      // priceId removed; backend determines this
      features: [
        { feature: "AI Video Titles", value: "Unlimited titles" },
        { feature: "AI Video Descriptions", value: "Unlimited descriptions" },
        { feature: "AI Hashtag and Tag Generator", value: "Unlimited sets" },
        { feature: "AI Idea Finder", value: "Unlimited ideas" },
        { feature: "AI Tweet Generator", value: "Unlimited tweets" },
        { feature: "AI LinkedIn Post Generator", value: "Unlimited posts" },
        { feature: "AI Reddit Post Generator", value: "Unlimited posts" },
        { feature: "AI YouTube Community Post Generator", value: "Unlimited posts" },
        { feature: "AI Script Generator", value: "Unlimited scripts" },
      ],
      popular: true,
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.1 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleStripeCheckout = async (tier: PricingTier) => {
    if (!user) {
      toast.error("Please sign in to purchase a subscription");
      navigate("/auth");
      return;
    }

    setLoading(tier.plan || null);
    toast.info(`Preparing ${tier.name} plan checkout...`);

    try {
      // Build and log the actual payload sent to the backend
      const payload = {
        tier: tier.plan,
        userId: user.id,
        returnUrl: window.location.origin + "/thankyou",
        cancelUrl: window.location.origin + "/pricing"
      };
      console.log("Payload being sent to backend:", payload);
      if (!payload.tier || !payload.userId) {
        toast.error("Checkout error: Missing tier or userId. Please reload and try again.");
        setLoading(null);
        return;
      }
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      const response = await fetch("https://ijplrwyidnrqjlgyhdhs.supabase.co/functions/v1/dynamic-service", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(payload),
      });

      const session = await response.json();
      
      console.log("Checkout session response:", session);
      
      if (!session || !session.id) {
        console.error("Checkout session response:", session);
        throw new Error(session.error || "Failed to create checkout session");
      }

      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment processing failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" ref={sectionRef} className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-white text-center mb-8">
          Pricing Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, idx) => (
            <div
              key={tier.name}
              className={cn(
                "bg-gray-800 rounded-lg p-6 border",
                tier.popular ? "border-cyan-500" : "border-gray-700",
                "transition-all opacity-0",
                inView ? "animate-fade-in-up" : "",
              )}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {tier.popular && (
                <span className="bg-cyan-500 text-black text-sm font-semibold px-3 py-1 rounded-full absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold text-white mb-4">
                {tier.name}
              </h3>
              <div className="text-3xl text-white mb-6">
                ${tier.price.usd}
                {tier.name !== "Free" && (
                  <span className="text-gray-400 text-base">/month</span>
                )}
                {isIndianUser && tier.price.inr && (
                  <div className="text-lg text-cyan-400 mt-1">
                    ≈ ₹{tier.price.inr}
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    {feature.value.toLowerCase() !== "no access" ? (
                      <Check className="w-5 h-5 text-cyan-500 mt-0.5" />
                    ) : (
                      <span className="w-5 h-5 text-gray-500 flex items-center justify-center">✕</span>
                    )}
                    <span className={feature.value.toLowerCase() === "no access" ? "text-gray-500" : ""}>
                      {feature.value} - {feature.feature}
                    </span>
                  </li>
                ))}
              </ul>
              {tier.name === "Free" ? (
                <Link to={user ? "/dashboard" : "/auth"}>
                  <Button 
                    className="w-full py-2 rounded-md bg-gray-700 text-white font-medium"
                  >
                    {user ? "Current Plan" : "Sign Up Free"}
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => handleStripeCheckout(tier)}
                  disabled={loading === tier.plan}
                  variant={tier.popular ? "secondary" : "default"}
                  className="w-full"
                >
                  {loading === tier.plan ? "Processing..." : "Get Started"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-16">
        <h3 className="text-3xl font-bold text-white text-center mb-8">
          Feature Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-white border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-4 border border-gray-700">Feature</th>
                <th className="p-4 border border-gray-700">Free</th>
                <th className="p-4 border border-gray-700">Basic</th>
                <th className="p-4 border border-gray-700">Pro</th>
              </tr>
            </thead>
            <tbody>
              {pricingTiers[0].features.map((feature, idx) => (
                <tr key={idx} className="border-b border-gray-700">
                  <td className="p-4 border border-gray-700">
                    {feature.feature}
                  </td>
                  <td className="p-4 border border-gray-700 text-center">
                    {pricingTiers[0].features[idx].value}
                  </td>
                  <td className="p-4 border border-gray-700 text-center">
                    {pricingTiers[1].features[idx].value}
                  </td>
                  <td className="p-4 border border-gray-700 text-center">
                    {pricingTiers[2].features[idx].value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-16">
        <h3 className="text-3xl font-bold text-white text-center mb-8">
          Frequently Asked Questions
        </h3>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <h4 className="text-xl font-semibold text-white">
              What is a request?
            </h4>
            <p className="text-gray-300">
              A request is one generation of content using our AI tools. For example, one title generation request can produce multiple title options.
            </p>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-white">
              What does "Unlimited" mean?
            </h4>
            <p className="text-gray-300">
              Pro plan users can generate as much content as they need without worrying about limits for normal usage. We do have very high internal caps to prevent abuse.
            </p>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-white">
              Can I upgrade my plan?
            </h4>
            <p className="text-gray-300">
              Yes, you can upgrade anytime by purchasing a higher plan from the pricing page.
            </p>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-white">
              Is this a subscription?
            </h4>
            <p className="text-gray-300">
              Yes, plans are monthly subscriptions that automatically renew. You can cancel anytime from your account dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
