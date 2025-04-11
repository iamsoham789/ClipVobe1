
"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function TubelightNavbar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Set initial active tab based on current path
    const pathname = location.pathname;
    const hash = location.hash;
    const fullPath = hash ? `${pathname}${hash}` : pathname;
    
    const currentItem = items.find(item => {
      // Handle exact matches
      if (item.url === fullPath) return true;
      
      // Handle home page
      if (pathname === '/' && item.url === '/') return true;
      
      // Handle hash navigation
      if (item.url.includes('#') && fullPath.includes(item.url)) return true;
      
      return false;
    });
    
    if (currentItem) {
      setActiveTab(currentItem.name);
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [items, location])

  return (
    <div
      className={cn(
        "fixed top-0 left-1/2 -translate-x-1/2 z-50 pt-24 transition-all duration-300",
        className,
      )}
    >
      <div className="flex items-center gap-3 bg-background/5 border border-white/10 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              to={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-white/80 hover:text-clipvobe-cyan",
                isActive && "bg-white/5 text-clipvobe-cyan",
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
                    type: "spring",
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
          )
        })}
      </div>
    </div>
  )
}
