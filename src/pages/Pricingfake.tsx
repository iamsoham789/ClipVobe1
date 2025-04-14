
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CyberpunkPricing from '@/components/CyberpunkPricing';
import PricingSection from '@/components/PricingSection';

const PricingFake = () => {
  return (
    <div className="bg-clipvobe-dark min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white text-center mb-12">Choose Your Plan</h1>
          <PricingSection />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PricingFake;
