
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const ThankYou = () => {
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionId = new URLSearchParams(window.location.search).get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !user) {
        toast.error("Missing payment information. Please contact support.");
        navigate("/dashboard");
        return;
      }

      try {
        setLoading(true);
        console.log("Verifying payment session:", { sessionId });
        
        // Call the verify-payment edge function to verify and record the subscription
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { 
            sessionId,
            userId: user.id
          }
        });

        if (error) {
          console.error("Error verifying payment:", error);
          toast.error("Payment verification failed. Please contact support.");
          navigate("/dashboard");
          return;
        }

        if (data?.success) {
          setTier(data.tier);
          // Show success message with subscription details
          toast.success(`Your ${data.tier} subscription has been activated!`);
          
          // Wait a moment before redirecting to make sure the toast is seen
          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
        } else {
          toast.error("Payment verification failed. Please contact support.");
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred. Please contact support.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, user, navigate]);

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-20">
      <div className="glass-card p-8 rounded-xl max-w-md w-full text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
        
        {loading ? (
          <div className="py-4">
            <div className="spinner mb-4"></div>
            <p className="text-lg mb-6">Verifying your subscription...</p>
          </div>
        ) : (
          <>
            <p className="text-lg mb-6">
              {tier ? (
                <>Your <span className="text-cyan-400 font-semibold">{tier}</span> subscription has been activated.</>
              ) : (
                "Your payment has been processed successfully."
              )}
            </p>
            
            {tier === 'basic' && (
              <div className="bg-gray-800 p-4 rounded-lg mb-6 text-left">
                <h3 className="text-xl font-semibold mb-2 text-cyan-400">Basic Plan Features:</h3>
                <ul className="space-y-2 ml-4 list-disc">
                  <li>150 AI Video Titles</li>
                  <li>25 AI Video Descriptions</li>
                  <li>25 AI Hashtag Sets</li>
                  <li>25 AI Video Ideas</li>
                  <li>Access to All Social Media Post Generators</li>
                  <li>5 AI Script Generations</li>
                </ul>
              </div>
            )}
            
            {tier === 'pro' && (
              <div className="bg-gray-800 p-4 rounded-lg mb-6 text-left">
                <h3 className="text-xl font-semibold mb-2 text-cyan-400">Pro Plan Features:</h3>
                <ul className="space-y-2 ml-4 list-disc">
                  <li>Unlimited AI Video Titles</li>
                  <li>Unlimited AI Video Descriptions</li>
                  <li>Unlimited AI Hashtag Sets</li>
                  <li>Unlimited AI Video Ideas</li>
                  <li>Unlimited Access to All Social Media Post Generators</li>
                  <li>Unlimited AI Script Generations</li>
                </ul>
              </div>
            )}
          </>
        )}
        
        <Button 
          onClick={goToDashboard} 
          className="mt-4 w-full"
          variant="secondary"
        >
          Continue to Dashboard
        </Button>
        
        <style jsx>{`
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #09f;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ThankYou;
