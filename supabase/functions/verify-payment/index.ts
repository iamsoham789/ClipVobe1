
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "std/http/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "npm:stripe@latest";

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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { sessionId, userId } = await req.json();
    
    if (!sessionId || !userId) {
      throw new Error('Missing sessionId or userId');
    }
    
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
      
      let tier;
      if (priceId === Deno.env.get('STRIPE_BASIC_PRICE_ID')) {
        tier = 'basic';
      } else if (priceId === Deno.env.get('STRIPE_UNLIMITED_PRICE_ID')) {
        tier = 'pro';
      } else {
        tier = 'unknown';
      }
      
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
