
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { sessionId, userId } = await req.json();
    
    if (!sessionId || !userId) {
      throw new Error('Missing sessionId or userId');
    }
    
    console.log(`Processing payment verification for user ${userId} with session ${sessionId}`);
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.client_reference_id !== userId) {
      throw new Error('Session does not belong to this user');
    }
    
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
    
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0].price.id;
      
      // Get price IDs from environment variables
      const basicPriceId = Deno.env.get('STRIPE_BASIC_PRICE_ID');
      if (!basicPriceId) {
        throw new Error('STRIPE_BASIC_PRICE_ID environment variable is not set');
      }
      
      const unlimitedPriceId = Deno.env.get('STRIPE_UNLIMITED_PRICE_ID');
      if (!unlimitedPriceId) {
        throw new Error('STRIPE_UNLIMITED_PRICE_ID environment variable is not set');
      }
      
      let tier;
      if (priceId === basicPriceId) {
        tier = 'basic';
      } else if (priceId === unlimitedPriceId) {
        tier = 'pro';
      } else {
        tier = 'unknown';
      }
      
      console.log(`User ${userId} subscribed to ${tier} plan with subscription ${session.subscription}`);
      
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          tier,
          status: 'active',
          payment_id: session.subscription as string,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });
      
      if (subscriptionError) {
        throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          tier,
          subscription_id: session.subscription,
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
