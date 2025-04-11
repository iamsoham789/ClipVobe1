import React, { useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import {
  X,
  Tag,
  FileText,
  Image,
  Hash,
  Video,
  RefreshCw,
  Search,
  Scissors,
  MessageSquarePlus,
  User,
} from "lucide-react";
import Button from "./ui/button";

interface FeaturePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => {
  return (
    <div className="glass-card rounded-xl p-5 hover-glow group hover-scale transition-all duration-300">
      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-clipvobe-gray-800 border border-clipvobe-cyan/20 text-clipvobe-cyan group-hover:bg-clipvobe-cyan/10 transition-colors animate-pulse-glow">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <div className="text-clipvobe-gray-300 text-sm">{description}</div>
    </div>
  );
};

const FeaturePopup = ({ isOpen, onClose }: FeaturePopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const features = [
    {
      icon: <Tag className="w-6 h-6" />,
      title: "AI-Powered Title Generator 🏷️",
      description: (
        <>
          <p className="mb-1">
            🔹 Generate 100+ engaging titles in seconds using AI.
          </p>
          <p>🔹 Get high-converting, click-worthy video and blog titles.</p>
        </>
      ),
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Smart Video Descriptions 📝",
      description: (
        <>
          <p className="mb-1">
            🔹 AI creates SEO-friendly and engaging descriptions.
          </p>
          <p>🔹 Improve your content's visibility & ranking.</p>
        </>
      ),
    },
    {
      icon: <Hash className="w-6 h-6" />,
      title: "AI-Generated Hashtags 🔥",
      description: (
        <>
          <p className="mb-1">
            🔹 Get the best AI-suggested trending hashtags.
          </p>
          <p>🔹 Increase video reach and maximize engagement.</p>
        </>
      ),
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Video Ideas Generator 🎥",
      description: (
        <>
          <p className="mb-1">🔹 Never run out of content ideas!</p>
          <p>🔹 AI suggests viral & trending video ideas instantly.</p>
        </>
      ),
    },
    {
      icon: <MessageSquarePlus className="w-6 h-6" />,
      title: "Tweet Generator 🐦",
      description: (
        <>
          <p className="mb-1">🔹 Create engaging tweets in seconds with AI.</p>
          <p>🔹 Supports multiple languages for global reach.</p>
        </>
      ),
    },
    {
      icon: <MessageSquarePlus className="w-6 h-6" />,
      title: "YouTube Community Post Generator 📢",
      description: (
        <>
          <p className="mb-1">🔹 Generate engaging YouTube community posts.</p>
          <p>🔹 Customize for announcements, festivals, and more.</p>
        </>
      ),
    },
    {
      icon: <MessageSquarePlus className="w-6 h-6" />,
      title: "Reddit Post Generator 🗣️",
      description: (
        <>
          <p className="mb-1">
            🔹 Craft authentic Reddit posts for any subreddit.
          </p>
          <p>🔹 Engage communities with AI-generated content.</p>
        </>
      ),
    },
    {
      icon: <User className="w-6 h-6" />,
      title: "LinkedIn Post Generator 💼",
      description: (
        <>
          <p className="mb-1">
            🔹 Create professional LinkedIn posts instantly.
          </p>
          <p>🔹 Perfect for thought leadership and networking.</p>
        </>
      ),
    },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        isOpen ? "opacity-100 visible" : "opacity-0 invisible",
      )}
      style={{ transition: "opacity 0.3s ease, visibility 0.3s ease" }}
    >
      {/* Overlay with blur effect */}
      <div
        className={cn(
          "absolute inset-0 bg-clipvobe-dark/70 backdrop-blur-sm",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        style={{ transition: "opacity 0.3s ease" }}
      />

      {/* Popup Content */}
      <div
        ref={popupRef}
        className={cn(
          "relative w-full max-w-4xl max-h-[90vh] overflow-auto glass-card rounded-xl p-6 shadow-[0_0_30px_rgba(0,255,255,0.2)]",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
        style={{ transition: "opacity 0.3s ease, transform 0.3s ease" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-clipvobe-gray-400 hover:text-white hover-scale transition-colors duration-200"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            🚀 ClipVobe Features – Power Up Your Creativity
          </h2>
          <p className="text-clipvobe-gray-300">
            Explore our powerful AI tools designed to enhance your content
            creation workflow
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-auto">
          {features.map((feature, index) => (
            <FeatureItem
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        {/* CTA Button */}
        <div className="mt-8 text-center">
          <Button
            variant="primary"
            size="lg"
            className="button-hover ripple animate-pulse-strong"
            onClick={() => {
              onClose();
              window.location.href = "/auth";
            }}
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturePopup;
