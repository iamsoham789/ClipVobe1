
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Create Stripe instance
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-02-24.acacia',
    });
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const { sessionId, userId } = await req.json();
    
    if (!sessionId || !userId) {
      throw new Error('Missing sessionId or userId');
    }
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Verify this session belongs to the user
    if (session.client_reference_id !== userId) {
      throw new Error('Session does not belong to this user');
    }
    
    // Check if the payment was successful
    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment has not been completed',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }
    
    // If there's a subscription, get its details
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      
      // Get the price ID from the subscription
      const priceId = subscription.items.data[0].price.id;
      
      // Determine the subscription tier based on the price ID
      let tier;
      if (priceId === Deno.env.get('STRIPE_BASIC_PRICE_ID')) {
        tier = 'basic';
      } else if (priceId === Deno.env.get('STRIPE_UNLIMITED_PRICE_ID')) {
        tier = 'pro';
      } else {
        tier = 'unknown';
      }
      
      // Get feature limits based on the tier
      const featureLimits = tier === 'basic'
        ? {
            titles: 30,
            descriptions: 25,
            hashtags: 25,
            ideas: 6,
            tweets: 20,
            linkedinPosts: 20,
            redditPosts: 20,
            youtubePosts: 20,
            scripts: 5
          }
        : tier === 'pro'
          ? {
              titles: 2000,
              descriptions: 1000,
              hashtags: 1000,
              ideas: 400,
              tweets: 1000,
              linkedinPosts: 1000,
              redditPosts: 1000,
              youtubePosts: 1000,
              scripts: 100
            }
          : {
              titles: 2,
              descriptions: 2,
              hashtags: 2,
              ideas: 2,
              tweets: 0,
              linkedinPosts: 0,
              redditPosts: 0,
              youtubePosts: 0,
              scripts: 0
            };
      
      // Update subscription record in Supabase
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          tier,
          status: 'active',
          payment_provider: 'stripe',
          payment_id: session.subscription as string,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (subscriptionError) {
        throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
      }
      
      // Reset usage counts
      try {
        // Check if usage records exist for this user
        const { data: existingUsage } = await supabase
          .from('usage')
          .select('feature')
          .eq('user_id', userId);
        
        const resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const features = [
          'titles', 'descriptions', 'hashtags', 'ideas', 'scripts',
          'tweets', 'youtubePosts', 'redditPosts', 'linkedinPosts'
        ];
        
        if (!existingUsage || existingUsage.length === 0) {
          // Create usage records for each feature
          for (const feature of features) {
            await supabase
              .from('usage')
              .insert({
                user_id: userId,
                feature,
                count: 0,
                reset_at: resetDate.toISOString(),
              });
          }
        } else {
          // Reset existing usage records
          const { error: usageError } = await supabase
            .from('usage')
            .update({
              count: 0,
              reset_at: resetDate.toISOString(),
            })
            .eq('user_id', userId);
          
          if (usageError) {
            console.error('Error resetting usage counts:', usageError);
          }
        }
      } catch (usageError) {
        console.error('Error updating usage:', usageError);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          tier,
          subscription_id: session.subscription,
          customer_id: session.customer,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'No subscription found for this session',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});
