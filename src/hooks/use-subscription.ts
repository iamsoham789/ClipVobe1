
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'creator';

interface SubscriptionDetails {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
}

// Define the expected shape of the subscription row from Supabase
interface SubscriptionRow {
  tier: string;
  status: string;
  current_period_end: string | null;
}

export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<SubscriptionDetails>({
    tier: 'free',
    isActive: true,
    expiresAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchSubscription() {
      try {
        // Explicitly type the query result
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscriptions')
          .select('tier, status, current_period_end')
          .eq('user_id', userId)
          .maybeSingle() as { data: SubscriptionRow | null; error: any };

        if (subError) throw subError;

        console.log('Subscription data:', subscriptionData); // Debug output

        if (!subscriptionData) {
          // If no subscription exists, create a free tier subscription for the user
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              tier: 'free',
              status: 'active',
              current_period_end: null
            });
            
          if (insertError) {
            console.error('Error creating free subscription:', insertError);
          }
          
          setSubscription({
            tier: 'free',
            isActive: true,
            expiresAt: null,
          });
          return;
        }

        // Use the typed data directly
        setSubscription({
          tier: subscriptionData.tier as SubscriptionTier, // Cast to SubscriptionTier
          isActive: subscriptionData.status === 'active',
          expiresAt: subscriptionData.current_period_end,
        });
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
        setSubscription({
          tier: 'free',
          isActive: true,
          expiresAt: null,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();

    // Real-time subscription updates
    const subscriptionChannel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      subscriptionChannel.unsubscribe();
    };
  }, [userId]);

  // Export tier directly for easier access
  const tier = subscription?.tier || 'free';

  return { subscription, loading, error, tier };
}
