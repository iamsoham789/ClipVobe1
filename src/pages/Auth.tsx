
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/button';
import { cn } from '../lib/utils';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isSignIn) {
        // Sign in with email and password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // For backward compatibility with the existing demo
        localStorage.setItem('clipvobe-user', JSON.stringify({ 
          email, 
          name: data.user?.user_metadata?.name || email.split('@')[0] 
        }));
        
        navigate('/dashboard');
      } else {
        // Sign up with email and password
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
            },
          },
        });
        
        if (error) throw error;
        
        // For backward compatibility with the existing demo
        localStorage.setItem('clipvobe-user', JSON.stringify({ 
          email, 
          name: name || email.split('@')[0] 
        }));
        
        if (data.session) {
          // User is signed in immediately
          navigate('/dashboard');
        } else {
          // Email confirmation is required
          toast.success('Check your email for the confirmation link');
          setIsSignIn(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-clipvobe-dark flex flex-col justify-center items-center p-4">
      <Link to="/" className="absolute top-8 left-8 text-clipvobe-cyan font-display font-bold text-2xl tracking-tight">
        ClipVobe
      </Link>
      
      <div className="glass-card border border-white/10 p-8 rounded-xl w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignIn ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-clipvobe-gray-400">
            {isSignIn 
              ? 'Sign in to access your ClipVobe dashboard' 
              : 'Join thousands of creators using ClipVobe'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isSignIn && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-clipvobe-gray-300 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-clipvobe-gray-800 border border-white/10 focus:border-clipvobe-cyan focus:ring-1 focus:ring-clipvobe-cyan rounded-lg p-3 w-full text-white"
                placeholder="Your name"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-clipvobe-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-clipvobe-gray-800 border border-white/10 focus:border-clipvobe-cyan focus:ring-1 focus:ring-clipvobe-cyan rounded-lg p-3 w-full text-white"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-clipvobe-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-clipvobe-gray-800 border border-white/10 focus:border-clipvobe-cyan focus:ring-1 focus:ring-clipvobe-cyan rounded-lg p-3 w-full text-white"
              placeholder="••••••••"
            />
          </div>
          
          <Button 
            type="submit" 
            isLoading={isLoading}
            className="w-full py-3"
          >
            {isSignIn ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-clipvobe-gray-400">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button"
              onClick={() => setIsSignIn(!isSignIn)}
              className="text-clipvobe-cyan hover:underline ml-2 focus:outline-none"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
