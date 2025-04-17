import React, { useState } from "react";
import FeaturePopup from "./FeaturePopup";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [featurePopupOpen, setFeaturePopupOpen] = useState(false);

  const handleFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setFeaturePopupOpen(true);
  };

  return (
    <>
      <footer className="bg-clipvobe-gray-900 border-t border-white/10 pt-16 pb-8">
        <div className="container mx-auto px-15">
          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-8 mb-12 animate-fade-in">
            <div className="glass-card px-6 py-4 rounded-xl flex items-center shadow-lg border border-white/20 transition-transform hover:scale-105">
              <svg
                className="w-8 h-8 text-cyan-500 mr-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10zm0 16.25A1.25 1.25 0 1 1 13.25 17 1.25 1.25 0 0 1 12 18.25zm1.41-5.46a1 1 0 0 1-.57.9 1.23 1.23 0 0 0-.53 1.31h-1.62a2.47 2.47 0 0 1 1.54-2.82 1.45 1.45 0 0 0 .93-1.35c0-.77-.56-1.3-1.37-1.3a1.4 1.4 0 0 0-1.41 1.12l-1.58-.36A2.92 2.92 0 0 1 12 6.78c1.71 0 3 1.06 3 2.58a2.42 2.42 0 0 1-1.59 2.18z" />
              </svg>
              <span className="text-white font-semibold text-lg">
                AI Powered
              </span>
            </div>
            <div className="glass-card px-6 py-4 rounded-xl flex items-center shadow-lg border border-white/20 transition-transform hover:scale-105">
              <svg
                className="w-8 h-8 text-blue-500 mr-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                <line x1="16" y1="8" x2="2" y2="22" />
                <line x1="17.5" y1="15" x2="9" y2="15" />
              </svg>
              <span className="text-white font-semibold text-lg">
                Creator Friendly
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-sm">
            <a
              href="#"
              className="text-clipvobe-gray-300 hover:text-white transition-colors"
              onClick={handleFeatureClick}
            >
              Features
            </a>
            <a
              href="/pricing"
              className="text-clipvobe-gray-300 hover:text-white transition-colors"
            >
              Pricing
            </a>
            <a
              href="/blog"
              className="text-clipvobe-gray-300 hover:text-white transition-colors"
            >
              Blog
            </a>
            <a
              href="/privacy"
              className="text-clipvobe-gray-300 hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-clipvobe-gray-300 hover:text-white transition-colors"
            >
              Terms
            </a>
          </div>

          {/* Social Media Links */}
          <div className="flex justify-center gap-6 mb-6">
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition-transform hover:scale-110"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition-transform hover:scale-110"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.195.054 2.013.24 2.675.512a5.434 5.434 0 0 1 1.964 1.225c.548.548.972 1.217 1.225 1.964.272.662.458 1.48.512 2.675.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.054 1.195-.24 2.013-.512 2.675a5.434 5.434 0 0 1-1.225 1.964c-.548.548-1.217.972-1.964 1.225-.662.272-1.48.458-2.675.512-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.195-.054-2.013-.24-2.675-.512a5.434 5.434 0 0 1-1.964-1.225c-.548-.548-.972-1.217-1.225-1.964-.272-.662-.458-1.48-.512-2.675C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.054-1.195.24-2.013.512-2.675A5.434 5.434 0 0 1 4.007 3.22c.548-.548 1.217-.972 1.964-1.225C7.128 1.724 7.946 1.538 9.14 1.484 10.406 1.426 10.79 1.414 12 1.414z" />
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center text-clipvobe-gray-500 text-sm">
            © {currentYear} ClipVobe. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Feature Popup */}
      <FeaturePopup
        isOpen={featurePopupOpen}
        onClose={() => setFeaturePopupOpen(false)}
      />
    </>
  );
};

export default Footer;
