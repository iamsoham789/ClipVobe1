import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Validate required environment variables
const requiredEnvVars = {
  STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY'),
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  STRIPE_WEBHOOK_SECRET: Deno.env.get('STRIPE_WEBHOOK_SECRET'),
} as const;

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const stripe = new Stripe(requiredEnvVars.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

const supabaseUrl = requiredEnvVars.SUPABASE_URL as string;
const supabaseServiceKey = requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY as string;
const webhookSecret = requiredEnvVars.STRIPE_WEBHOOK_SECRET as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature || !webhookSecret) {
      return new Response('Missing signature or webhook secret', { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown error');
      return new Response(
        JSON.stringify({ error: { message: 'Webhook signature verification failed' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;

        // Map price ID to plan name
        let planName = '';
        switch (priceId) {
          case 'price_1R4POQAUtKomR9D72qL66E1H':
            planName = 'basic';
            break;
          case 'price_1R4PPiAUtKomR9D79NRiIt11':
            planName = 'pro';
            break;
          default:
            planName = 'free';
        }

        // Update user's subscription in profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: subscription.status,
            subscription_plan: planName,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', session.client_reference_id);

        if (updateError) throw updateError;
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by stripe_customer_id
        const { data: profiles, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (fetchError) throw fetchError;

        // Update subscription status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', profiles.id);

        if (updateError) throw updateError;
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by stripe_customer_id
        const { data: profiles, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (fetchError) throw fetchError;

        // Reset subscription to free plan
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            subscription_plan: 'free',
            subscription_current_period_end: null,
          })
          .eq('id', profiles.id);

        if (updateError) throw updateError;
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
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
