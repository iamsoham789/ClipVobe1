import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import { PaymentButton } from "./PaymentButton";

interface PricingTier {
  name: string;
  price: string;
  paymentLink: string; // Changed from priceId to paymentLink for Dodo
  features: { feature: string; value: string }[];
  popular?: boolean;
}

const CyberpunkPricing = () => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const pricingTiers: PricingTier[] = [
    {
      name: "Basic",
      price: "5",
      paymentLink:
        "https://test.checkout.dodopayments.com/buy/pdt_37OmHU8uiE15P3QpAD3QJ?quantity=1&redirect_url=https://localhost%3A5174%2Fdashboard",
      features: [
        { feature: "AI Video Titles", value: "40 titles (8 requests)" },
        {
          feature: "AI Video Descriptions",
          value: "10 descriptions (10 requests)",
        },
        {
          feature: "AI Hashtag and Tag Generator",
          value: "10 sets (10 requests)",
        },
        { feature: "AI Idea Finder", value: "10 ideas (2 requests)" },
        { feature: "AI Tweet Generator", value: "5 tweets (5 requests)" },
        {
          feature: "AI LinkedIn Post Generator",
          value: "5 posts (5 requests)",
        },
        { feature: "AI Reddit Post Generator", value: "5 posts (5 requests)" },
        {
          feature: "AI YouTube Community Post Generator",
          value: "5 posts (5 requests)",
        },
        { feature: "AI Script Generator", value: "2 scripts (2 requests)" },
      ],
    },
    {
      name: "Pro",
      price: "15",
      paymentLink:
        "https://test.checkout.dodopayments.com/buy/pdt_CxiYxjkXQYeomry5Qy7p2?quantity=1&redirect_url=https://localhost%3A5174%2Fdashboard",
      features: [
        { feature: "AI Video Titles", value: "100 titles (20 requests)" },
        {
          feature: "AI Video Descriptions",
          value: "30 descriptions (30 requests)",
        },
        {
          feature: "AI Hashtag and Tag Generator",
          value: "25 sets (25 requests)",
        },
        { feature: "AI Idea Finder", value: "25 ideas (5 requests)" },
        { feature: "AI Tweet Generator", value: "12 tweets (12 requests)" },
        {
          feature: "AI LinkedIn Post Generator",
          value: "12 posts (12 requests)",
        },
        {
          feature: "AI Reddit Post Generator",
          value: "12 posts (12 requests)",
        },
        {
          feature: "AI YouTube Community Post Generator",
          value: "12 posts (12 requests)",
        },
        { feature: "AI Script Generator", value: "5 scripts (5 requests)" },
      ],
      popular: true,
    },
  ];

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      });
    }, options);

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="relative py-20 overflow-hidden bg-clipvobe-dark"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-clipvobe-cyan/5 blur-[100px] rounded-full animate-float"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-red-600/5 blur-[100px] rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05)_0,transparent_60%)]"></div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="container relative z-10 mx-auto px-4">
        <div
          className={cn(
            "text-center space-y-4 mb-16 opacity-0",
            inView ? "animate-fade-in-up" : "",
          )}
          style={{ animationDuration: "0.8s" }}
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white relative inline-block">
            <span className="relative z-10">Pick Your Perfect Plan</span>
            <span className="absolute -inset-1 bg-gradient-to-r from-clipvobe-cyan/0 via-clipvobe-cyan/20 to-clipvobe-cyan/0 blur-lg z-0 animate-pulse-strong"></span>
          </h2>
          <p className="text-clipvobe-gray-300 max-w-2xl mx-auto text-lg">
            Choose the plan that fits your content creation needs. Each request
            represents one generation of content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier, idx) => (
            <div
              key={tier.name}
              className={cn(
                "pricing-card bg-black/40 backdrop-blur-sm rounded-xl border border-clipvobe-gray-700 overflow-hidden relative group transition-all duration-500 opacity-0",
                inView ? "animate-fade-in-up" : "",
              )}
              style={{
                animationDelay: `${idx * 0.1}s`,
                animationDuration: "0.8s",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-clipvobe-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 border border-clipvobe-cyan/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-[1.02] group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.15)]"></div>

              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-clipvobe-cyan text-clipvobe-dark px-4 py-1 rounded-full text-sm font-semibold z-10 shadow-[0_0_15px_rgba(0,255,255,0.5)] animate-pulse-strong">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8 relative">
                <h3 className="text-xl font-bold text-white mb-2">
                  {tier.name}
                </h3>
                <div className="flex items-end mb-6">
                  <span className="text-4xl font-bold text-white">
                    ${tier.price}
                  </span>
                  <span className="text-clipvobe-gray-400 ml-2">/month</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-clipvobe-gray-200 group-hover:translate-x-1 transition-transform duration-300"
                      style={{ transitionDelay: `${idx * 0.05}s` }}
                    >
                      <Check className="w-5 h-5 text-clipvobe-cyan shrink-0 mt-0.5" />
                      <span>
                        <span className="text-white font-medium">
                          {feature.value}
                        </span>
                        <br />
                        <span className="text-sm text-clipvobe-gray-400">
                          {feature.feature}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                <PaymentButton
                  paymentLink={tier.paymentLink}
                  variant={tier.popular ? "secondary" : "default"}
                  plan={tier.name.toLowerCase() === "basic" ? "basic" : "pro"}
                >
                  Get Started with {tier.name}
                </PaymentButton>
              </div>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "mt-16 text-center text-clipvobe-gray-400 opacity-0",
            inView ? "animate-fade-in-up" : "",
          )}
          style={{ animationDelay: "0.4s" }}
        >
          <p className="mb-2">
            All plans include access to our core AI features
          </p>
          <p>Need more requests? You can always upgrade your plan</p>
        </div>
      </div>
    </section>
  );
};

export default CyberpunkPricing;
