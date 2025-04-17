// src/pages/ThankYou.tsx
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Adjust path
import { Button } from '@/components/ui/button'; // Adjust path

const ThankYou = () => {
  const plan = new URLSearchParams(window.location.search).get('plan');

  useEffect(() => {
    const recordSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser(); // Get logged-in user
      if (user?.id && plan) {
        const tier = plan.toLowerCase();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1-month validity

        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          tier,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          dodo_payment_id: new URLSearchParams(window.location.search).get('payment_id') || 'test', // Optional: from Dodo
        });
      }
    };
    recordSubscription();
  }, [plan]);

  return (
    <div className="container mx-auto px-4 py-20 text-center text-white bg-gray-900">
      <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
      <p className="text-lg mb-6">Your payment was successful. Enjoy your {plan || 'plan'}!</p>
      <Button>
        <a href="/dashboard" className="text-white">Continue to Dashboard</a>
      </Button>
      <p className="mt-4">
        <a href="/" className="text-cyan-500 underline">Back to Home</a>
      </p>
    </div>
  );
};

export default ThankYou;