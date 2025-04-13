
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { LucideIcon, HelpCircle, Mail, Twitter, Youtube, LogIn, Settings } from "lucide-react";

interface NavItem {
  id: string;
  title: string;
  icon?: LucideIcon;
  description?: string;
  subItems?: NavItem[];
  isSpacer?: boolean;
  showPopup?: boolean;
}

interface SidebarNavProps {
  items: NavItem[];
  activeItem: string;
  activeSubItem: string;
  expandedItems: string[];
  sidebarOpen: boolean;
  handleNavigation: (itemId: string, subItemId?: string) => void;
  toggleExpandItem: (itemId: string) => void;
  onProfileClick?: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  items,
  activeItem,
  activeSubItem,
  expandedItems,
  sidebarOpen,
  handleNavigation,
  toggleExpandItem,
  onProfileClick,
}) => {
  const navigate = useNavigate();
  const [showMultiPlatform, setShowMultiPlatform] = useState(false);

  return (
    <nav
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-clipvobe-gray-900 p-4 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Clipvobe</h2>
          <p className="text-sm text-clipvobe-gray-400">Creator Hub</p>
        </div>

        <div className="space-y-1 flex-1 overflow-y-auto">
          {items.map((item) => {
            if (item.isSpacer) {
              return <div key="spacer" className="h-8" />;
            }

            const isActive = activeItem === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.showPopup && onProfileClick) {
                    onProfileClick();
                  } else if (item.id === "settings") {
                    navigate("/settings");
                  } else {
                    handleNavigation(item.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-clipvobe-cyan/10 text-clipvobe-cyan"
                    : "text-clipvobe-gray-400 hover:bg-clipvobe-gray-800 hover:text-white",
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}

          {/* Multi-Platform Post Generator Button placed after Script Generator */}
          {items.find(item => item.id === "script-generator") && (
            <>
              <button
                onClick={() => setShowMultiPlatform(!showMultiPlatform)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-clipvobe-gray-400 hover:bg-clipvobe-gray-800 hover:text-white",
                  activeItem === "multi-platform-post-generator" ? "bg-clipvobe-cyan/10 text-clipvobe-cyan" : ""
                )}
              >
                <span className="h-4 w-4">🌐</span>
                <span className="truncate">Multi-Platform Post Generator</span>
              </button>

              {/* Show sub-items when button is clicked */}
              {showMultiPlatform && (
                <>
                  <button
                    onClick={() => handleNavigation("tweet-generator")}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-clipvobe-gray-800 hover:text-white ml-4",
                      activeItem === "tweet-generator" 
                        ? "bg-clipvobe-cyan/10 text-clipvobe-cyan" 
                        : "text-clipvobe-gray-400"
                    )}
                  >
                    <Twitter className="h-4 w-4" />
                    <span className="truncate">Tweet Generator</span>
                  </button>
                  <button
                    onClick={() => handleNavigation("youtube-community-post-generator")}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-clipvobe-gray-800 hover:text-white ml-4",
                      activeItem === "youtube-community-post-generator" 
                        ? "bg-clipvobe-cyan/10 text-clipvobe-cyan" 
                        : "text-clipvobe-gray-400"
                    )}
                  >
                    <Youtube className="h-4 w-4" />
                    <span className="truncate">YouTube Community Post Generator</span>
                  </button>
                  <button
                    onClick={() => handleNavigation("reddit-post-generator")}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-clipvobe-gray-800 hover:text-white ml-4",
                      activeItem === "reddit-post-generator" 
                        ? "bg-clipvobe-cyan/10 text-clipvobe-cyan" 
                        : "text-clipvobe-gray-400"
                    )}
                  >
                    <span className="h-4 w-4">🔴</span>
                    <span className="truncate">Reddit Post Generator</span>
                  </button>
                  <button
                    onClick={() => handleNavigation("linkedin-post-generator")}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-clipvobe-gray-800 hover:text-white ml-4",
                      activeItem === "linkedin-post-generator" 
                        ? "bg-clipvobe-cyan/10 text-clipvobe-cyan" 
                        : "text-clipvobe-gray-400"
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="truncate">LinkedIn Post Generator</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Support Links */}
        <div className="mt-4 pt-4 border-t border-clipvobe-gray-800">
          <button
            onClick={() => navigate("/help")}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-clipvobe-gray-400 hover:bg-clipvobe-gray-800 hover:text-white"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="truncate">Help Center</span>
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-clipvobe-gray-400 hover:bg-clipvobe-gray-800 hover:text-white"
          >
            <Mail className="h-4 w-4" />
            <span className="truncate">Contact Support</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default SidebarNav;
