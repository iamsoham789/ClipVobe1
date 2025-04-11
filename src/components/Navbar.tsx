import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Lightbulb, DollarSign, FileText, LayoutDashboard, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import FeaturePopup from './FeaturePopup'; // Import the FeaturePopup component

interface NavItem {
  name: string;
  url?: string; // Made optional since "Features" won't use it
  icon: React.ElementType;
  onClick?: () => void; // Add onClick for custom actions
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

const NavBar = ({ items, className }: NavBarProps) => {
  const [activeTab, setActiveTab] = useState(items[0].name);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('clipvobe-user') !== null;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 z-50 pt-6',
        className,
      )}
    >
      <div className="flex items-center gap-3 bg-clipvobe-dark/80 border border-white/10 backdrop-blur-md py-1 px-1 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name || location.pathname === item.url;

          return (
            <Link
              key={item.name}
              to={item.url || '#'} // Use 'to' for react-router-dom, fallback to '#' for non-nav items
              onClick={(e) => {
                if (item.onClick) {
                  e.preventDefault();
                  item.onClick();
                } else {
                  setActiveTab(item.name);
                }
              }}
              className={cn(
                'relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors',
                'text-foreground/80 hover:text-clipvobe-cyan',
                isActive && 'bg-muted text-clipvobe-cyan',
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-clipvobe-cyan/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-clipvobe-cyan rounded-t-full">
                    <div className="absolute w-12 h-6 bg-clipvobe-cyan/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-clipvobe-cyan/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-clipvobe-cyan/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
        {!isLoggedIn && (
          <Link
            to="/auth"
            onClick={() => setActiveTab('Get Started')}
            className={cn(
              'relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors',
              'text-foreground/80 hover:text-red-500',
              activeTab === 'Get Started' && 'bg-muted text-red-500',
            )}
          >
            <span className="hidden md:inline">Get Started</span>
            <span className="md:hidden">
              <HelpCircle size={18} strokeWidth={2.5} />
            </span>
            {activeTab === 'Get Started' && (
              <motion.div
                layoutId="lamp"
                className="absolute inset-0 w-full bg-red-500/5 rounded-full -z-10"
                initial={false}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-red-500 rounded-t-full">
                  <div className="absolute w-12 h-6 bg-red-500/20 rounded-full blur-md -top-2 -left-2" />
                  <div className="absolute w-8 h-6 bg-red-500/20 rounded-full blur-md -top-1" />
                  <div className="absolute w-4 h-4 bg-red-500/20 rounded-full blur-sm top-0 left-2" />
                </div>
              </motion.div>
            )}
          </Link>
        )}
      </div>
    </div>
  );
};

const Navbar = () => {
  const [isFeaturePopupOpen, setIsFeaturePopupOpen] = useState(false);
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('clipvobe-user') !== null;

  const navItems: NavItem[] = [
    { name: 'Home', url: '/', icon: Home },
    {
      name: 'Features',
      icon: Lightbulb,
      onClick: () => setIsFeaturePopupOpen(true),
    },
    { name: 'Pricing', url: '/pricing', icon: DollarSign },
    { name: 'Blog', url: '/blog', icon: FileText },
  ];

  if (isLoggedIn) {
    navItems.push({ name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard });
  }

  return (
    <>
      <NavBar items={navItems} className="bg-clipvobe-dark/80 backdrop-blur-md border-b border-white/10" />
      <FeaturePopup
        isOpen={isFeaturePopupOpen}
        onClose={() => setIsFeaturePopupOpen(false)}
      />
    </>
  );
};

export default Navbar;