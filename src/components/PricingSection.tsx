import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button'; // Adjust path
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils'; // Adjust path
import { PaymentButton } from '@/components/PaymentButton'; // Adjust path

interface PricingTier {
  name: string;
  price: string;
  paymentLink: string;
  features: { feature: string; value: string }[];
  popular?: boolean;
}

const Pricing = () => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const pricingTiers: PricingTier[] = [
    {
      name: "Basic",
      price: "5",
      paymentLink: "https://test.checkout.dodopayments.com/buy/pdt_37OmHU8uiE15P3QpAD3QJ?quantity=1",
      features: [
        { feature: "AI Video Titles", value: "40 titles (8 requests)" },
        { feature: "AI Video Descriptions", value: "10 descriptions (10 requests)" },
        { feature: "AI Hashtag and Tag Generator", value: "10 sets (10 requests)" },
        { feature: "AI Idea Finder", value: "10 ideas (2 requests)" },
        { feature: "AI Tweet Generator", value: "5 tweets (5 requests)" },
        { feature: "AI LinkedIn Post Generator", value: "5 posts (5 requests)" },
        { feature: "AI Reddit Post Generator", value: "5 posts (5 requests)" },
        { feature: "AI YouTube Community Post Generator", value: "5 posts (5 requests)" },
        { feature: "AI Script Generator", value: "2 scripts (2 requests)" }
      ]
    },
    {
      name: "Pro",
      price: "15",
      paymentLink: "", // Replace with your Pro Dodo link
      features: [
        { feature: "AI Video Titles", value: "100 titles (20 requests)" },
        { feature: "AI Video Descriptions", value: "30 descriptions (30 requests)" },
        { feature: "AI Hashtag and Tag Generator", value: "25 sets (25 requests)" },
        { feature: "AI Idea Finder", value: "25 ideas (5 requests)" },
        { feature: "AI Tweet Generator", value: "12 tweets (12 requests)" },
        { feature: "AI LinkedIn Post Generator", value: "12 posts (12 requests)" },
        { feature: "AI Reddit Post Generator", value: "12 posts (12 requests)" },
        { feature: "AI YouTube Community Post Generator", value: "12 posts (12 requests)" },
        { feature: "AI Script Generator", value: "5 scripts (5 requests)" }
      ],
      popular: true
    }
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
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" ref={sectionRef} className="py-20 bg-gray-900">
      {/* Pricing Cards */}
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-white text-center mb-8">Pricing Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingTiers.map((tier, idx) => (
            <div
              key={tier.name}
              className={cn(
                "bg-gray-800 rounded-lg p-6 border",
                tier.popular ? "border-cyan-500" : "border-gray-700",
                "transition-all opacity-0",
                inView ? "animate-fade-in-up" : ""
              )}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {tier.popular && (
                <span className="bg-cyan-500 text-black text-sm font-semibold px-3 py-1 rounded-full absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold text-white mb-4">{tier.name}</h3>
              <p className="text-3xl text-white mb-6">${tier.price}<span className="text-gray-400 text-base">/month</span></p>
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <Check className="w-5 h-5 text-cyan-500" />
                    <span>{feature.value} - {feature.feature}</span>
                  </li>
                ))}
              </ul>
              <PaymentButton
                paymentLink={tier.paymentLink}
                variant={tier.popular ? "secondary" : "default"}
                className="w-full"
              >
                Get Started
              </PaymentButton>
            </div>
          ))}
        </div>
      </div>

      {/* Features Matrix Table */}
      <div className="container mx-auto px-4 mt-16">
        <h3 className="text-3xl font-bold text-white text-center mb-8">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-white border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-4 border border-gray-700">Feature</th>
                <th className="p-4 border border-gray-700">Basic</th>
                <th className="p-4 border border-gray-700">Pro</th>
              </tr>
            </thead>
            <tbody>
              {pricingTiers[0].features.map((feature, idx) => (
                <tr key={idx} className="border-b border-gray-700">
                  <td className="p-4 border border-gray-700">{feature.feature}</td>
                  <td className="p-4 border border-gray-700 text-center">{pricingTiers[0].features[idx].value}</td>
                  <td className="p-4 border border-gray-700 text-center">{pricingTiers[1].features[idx].value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQs */}
      <div className="container mx-auto px-4 mt-16">
        <h3 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h3>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <h4 className="text-xl font-semibold text-white">What is a request?</h4>
            <p className="text-gray-300">A request is one generation of content using our AI tools.</p>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-white">Can I upgrade my plan?</h4>
            <p className="text-gray-300">Yes, you can upgrade anytime by purchasing a higher plan.</p>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-white">Is this a subscription?</h4>
            <p className="text-gray-300">Currently, plans are one-time purchases. You’ll need to repurchase monthly.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;