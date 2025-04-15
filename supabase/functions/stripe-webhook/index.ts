
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "jsr:https://esm.sh/stripe@14.21.0";
import { createClient } from "jsr:https://esm.sh/@supabase/supabase-js@2.45.0";

// Validate required environment variables
const requiredEnvVars = {
  STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: Deno.env.get('STRIPE_WEBHOOK_SECRET'),
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
};

for (const [name, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.error(`Missing environment variable: ${name}`);
  }
}

Deno.serve(async (req) => {
  try {
    // Handle options request
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
        },
        status: 204,
      });
    }

    // Verify this is a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the raw request body
    const body = await req.text();
    
    // Initialize Stripe
    const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-02-24.acacia',
    });

    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        requiredEnvVars.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Webhook signature verification failed: ${errorMessage}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${errorMessage}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      requiredEnvVars.SUPABASE_URL as string,
      requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY as string
    );

    // Handle different event types
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      // Get the customer to find user email
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
      
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', customer.email)
        .single();
      
      if (userError || !userData) {
        console.error('Cannot find user with email:', customer.email);
        return new Response(JSON.stringify({ error: 'User not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Get price ID from subscription
      const priceId = subscription.items.data[0].price.id;
      
      // Determine the subscription tier based on price ID
      let tier;
      if (priceId === Deno.env.get('STRIPE_BASIC_PRICE_ID')) {
        tier = 'basic';
      } else if (priceId === Deno.env.get('STRIPE_UNLIMITED_PRICE_ID')) {
        tier = 'pro';
      } else {
        tier = 'unknown';
      }
      
      // Update subscription in database
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userData.id,
          tier,
          status: subscription.status,
          payment_id: subscription.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });
      
      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      // Get the customer to find user email
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
      
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', customer.email)
        .single();
      
      if (userError || !userData) {
        console.error('Cannot find user with email:', customer.email);
        return new Response(JSON.stringify({ error: 'User not found' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Update subscription in database to inactive
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
        })
        .eq('user_id', userData.id)
        .eq('payment_id', subscription.id);
      
      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Return a success response
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Webhook error: ${errorMessage}`);
    return new Response(JSON.stringify({ error: `Webhook error: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
