import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils'; // Adjust path based on your project structure

const MultiPlatformPostGenerator = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);

  const features = [
    {
      step: 'Step 1',
      title: 'YouTube Post Generator',
      content: 'Craft engaging YouTube community posts in seconds.',
      image: 'https://images.unsplash.com/photo-1541877944-ac82a091518a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

    },
    {
      step: 'Step 2',
      title: 'Reddit Post Generator',
      content: 'Create compelling Reddit posts to boost your community engagement.',
      image: 'https://images.unsplash.com/photo-1616509091215-57bbece93654?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      step: 'Step 3',
      title: 'LinkedIn Post Generator',
      content: 'Generate professional LinkedIn posts to enhance your network presence.',
      image: 'https://images.unsplash.com/photo-1647964187221-3f46a4fa5ea8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      step: 'Step 4',
      title: 'Tweet Generator',
      content: 'Craft concise and impactful tweets to engage your Twitter audience.',
      image: 'https://images.unsplash.com/photo-1688730640164-3e610d4b3c48?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (3000 / 100)); // 3000ms autoPlayInterval
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [progress, features.length]);

  return (
    <div className={cn('p-8 md:p-12 bg-clipvobe-dark')}>
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-10 text-center text-white">
          Multi-Platform Post Generator
        </h2>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10">
          <div className="order-2 md:order-1 space-y-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-6 md:gap-8"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={cn(
                    'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2',
                    index === currentFeature
                      ? 'bg-clipvobe-cyan border-clipvobe-cyan text-white scale-110'
                      : 'bg-clipvobe-gray-800 border-clipvobe-gray-600'
                  )}
                >
                  {index <= currentFeature ? (
                    <span className="text-lg font-bold">✓</span>
                  ) : (
                    <span className="text-lg font-semibold">{index + 1}</span>
                  )}
                </motion.div>

                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-semibold text-white">
                    {feature.title || feature.step}
                  </h3>
                  <p className="text-sm md:text-lg text-clipvobe-gray-300">
                    {feature.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="order-1 md:order-2 relative h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden rounded-lg">
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0 rounded-lg overflow-hidden"
                      initial={{ y: 100, opacity: 0, rotateX: -20 }}
                      animate={{ y: 0, opacity: 1, rotateX: 0 }}
                      exit={{ y: -100, opacity: 0, rotateX: 20 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.step}
                        className="w-full h-full object-cover transition-transform transform"
                        style={{ height: '400px', objectFit: 'cover' }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-clipvobe-dark via-clipvobe-dark/50 to-transparent" />
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiPlatformPostGenerator;