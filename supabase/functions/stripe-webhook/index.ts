
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'jsr:stripe@14.21.0';
import { createClient } from 'jsr:@supabase/supabase-js@2.45.0';

// Validate required environment variables
const requiredEnvVars = {
  STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY'),
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  STRIPE_WEBHOOK_SECRET: Deno.env.get('STRIPE_WEBHOOK_SECRET'),
} as const;

// Create Stripe instance
const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    
    if (!signature || !requiredEnvVars.STRIPE_WEBHOOK_SECRET) {
      return new Response('Missing signature or webhook secret', { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        requiredEnvVars.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown error');
      return new Response(
        JSON.stringify({ error: { message: 'Webhook signature verification failed' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      requiredEnvVars.SUPABASE_URL as string,
      requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY as string
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Find user by stripe_customer_id
        const { data: customers, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (fetchError) throw fetchError;
        
        if (customers && customers.length > 0) {
          const userId = customers[0].id;
          const priceId = subscription.items.data[0].price.id;
          
          let tier;
          if (priceId === Deno.env.get('STRIPE_BASIC_PRICE_ID')) {
            tier = 'basic';
          } else if (priceId === Deno.env.get('STRIPE_UNLIMITED_PRICE_ID')) {
            tier = 'pro';
          } else {
            tier = 'free';
          }

          // Update subscription status
          const { error: updateError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              tier,
              status: subscription.status,
              payment_id: subscription.id,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            });

          if (updateError) throw updateError;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: customers, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);

        if (fetchError) throw fetchError;
        
        if (customers && customers.length > 0) {
          const userId = customers[0].id;

          // Reset to free plan
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              tier: 'free',
              status: 'cancelled',
            })
            .eq('user_id', userId);

          if (updateError) throw updateError;
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
