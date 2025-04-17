import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

// Function to initialize the particle effect
const initParticles = () => {
  if (typeof document !== 'undefined') {
    const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; radius: number; color: string; speedX: number; speedY: number }[] = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        color: `rgba(0, ${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 100 + 155)}, ${Math.random() * 0.2 + 0.1})`,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
      });
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Move particles
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Reset position if out of bounds
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX = -particle.speedX;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY = -particle.speedY;

        // Draw particles
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });
    };

    animate();

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }
};

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [subtitle, setSubtitle] = useState('tweet'); // Initial subtitle

  useEffect(() => {
    setIsVisible(true);

    // Initialize particle effect
    const cleanup = initParticles();

    // Simulate typewriter effect completion
    const timer = setTimeout(() => {
      setIsTypingComplete(true);
    }, 3000);

    // Subtitle rotation effect
    const subtitleInterval = setInterval(() => {
      setSubtitle((prev) => {
        switch (prev) {
          case 'tweet':
            return 'reddit post';
          case 'reddit post':
            return 'YouTube Community post';
          case 'YouTube Community post':
            return 'LinkedIn Post';
          case 'LinkedIn Post':
            return 'Title and more';
          case 'Title and more':
            return 'tweet';
          default:
            return 'tweet';
        }
      });
    }, 3000); // Change every 2 seconds

    return () => {
      if (cleanup) cleanup();
      clearTimeout(timer);
      clearInterval(subtitleInterval);
    };
  }, []);

  return (
    <section className="relative min-h-screen pt-32 pb-20 flex flex-col items-center justify-center overflow-hidden">
      {/* Particle canvas background */}
      <canvas id="particle-canvas" className="absolute inset-0 z-0" />

      {/* Background effect with parallax */}
      <div className="absolute inset-0 bg-gradient-to-b from-clipvobe-dark via-clipvobe-dark to-clipvobe-gray-900 z-0"></div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        {/* Removed the sphere (play button with float animation) */}

        {/* Main heading with typewriter effect */}
        <h1
          className={cn(
            'font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-6 tracking-tight leading-tight',
            isVisible ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            transition: 'opacity 0.8s ease-out',
            WebkitBackgroundClip: 'text',
          }}
        >
          <span className="inline-block overflow-hidden whitespace-nowrap">
            Smarter Socials, Powered by AI 
          </span>
          <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-clipvobe-cyan animate-shine">
            with ClipVobe
          </span>
        </h1>

        {/* Unique subtitle with rotating text */}
        <p className="text-xl md:text-2xl text-clipvobe-gray-300 mb-10">
          Generate a{' '}
          <span className="text-clipvobe-cyan font-semibold animate-pulse">
            {subtitle}
          </span>
        </p>

        {/* CTA Button positioned lower */}
        <div className="flex justify-center mt-16 opacity-100">
          <Link to="/auth">
            <Button size="lg" className="min-w-55 button-hover ripple">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;