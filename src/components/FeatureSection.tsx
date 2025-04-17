import React, { useEffect, useRef, useState } from 'react';
import { Camera, FileText, Hash, Pen } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import FeaturePopup from './FeaturePopup';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
  inView: boolean;
}

const FeatureCard = ({ title, description, icon, index, inView }: FeatureCardProps) => {
  return (
    <div 
      className={cn(
        "glass-card rounded-xl p-6 hover-scale hover-glow group opacity-0",
        inView ? "animate-fade-in-left" : ""
      )}
      style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'forwards' }}
    >
      <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-clipvobe-gray-800 border border-clipvobe-cyan/20 text-clipvobe-cyan group-hover:bg-clipvobe-cyan/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-clipvobe-gray-300">{description}</p>
    </div>
  );
};

const FeatureSection = () => {
  const [inView, setInView] = useState(false);
  const [featurePopupOpen, setFeaturePopupOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      });
    }, options);

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const features = [
    {
      title: "AI-Generated Descriptions",
      description: "Create descriptions for your videos that are optimized for search engines",
      icon: <Camera className="w-6 h-6" />,
    },
    {
      title: "Smart Titles",
      description: "Generate clickable, SEO-optimized video titles that attract viewers.",
      icon: <Pen className="w-6 h-6" />,
    },
    {
      title: "Script Writing",
      description: "Produce engaging video scripts with ease, tailored to your audience.",
      icon: <FileText className="w-6 h-6" />,
    },
    {
      title: "Hashtags",
      description: "Optimize discoverability with AI-crafted hashtags",
      icon: <Hash className="w-6 h-6" />,
    }
  ];

  return (
    <>
      <section 
        id="features" 
        ref={sectionRef}
        className="py-20 bg-clipvobe-dark relative"
      >
        {/* Background effect with parallax */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-clipvobe-cyan/10 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className={cn(
            "text-center max-w-3xl mx-auto mb-16 opacity-0",
            inView ? "animate-fade-in-up" : ""
          )}>
            <div className="text-clipvobe-cyan font-medium text-sm uppercase tracking-wider mb-3">Features</div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Supercharge your YouTube videos with ClipVobe Tools
            </h2>
            <p className="text-clipvobe-gray-300 mb-6">
              Our cutting-edge tools powered by AI help you create better content faster, increasing views, engagement, and subscribers.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setFeaturePopupOpen(true)}
              className="hover-glow"
            >
              View All Features
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                index={index}
                inView={inView}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Popup */}
      <FeaturePopup 
        isOpen={featurePopupOpen} 
        onClose={() => setFeaturePopupOpen(false)} 
      />
    </>
  );
};

export default FeatureSection;
