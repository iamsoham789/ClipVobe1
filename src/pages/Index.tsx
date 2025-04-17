
import React from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeatureSection from '@/components/FeatureSection';
import IdeaGeneration from '@/components/IdeaGeneration';
import DashboardMockup from '@/components/DashboardMockup';
import Footer from '@/components/Footer';
import CyberpunkPricing from '@/components/CyberpunkPricing';

const Index = () => {
  return (
    <div className="bg-clipvobe-dark min-h-screen">
      <Navbar />
      <HeroSection />
      <div id="features">
        <FeatureSection />
      </div>
      <IdeaGeneration />
      <div id="dashboard">
        <DashboardMockup />
      </div>
      <CyberpunkPricing />
      <Footer />
    </div>
  );
};

export default Index;
