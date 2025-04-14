
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
          case Deno.env.get('STRIPE_BASIC_PRICE_ID'):
            planName = 'basic';
            break;
          case Deno.env.get('STRIPE_UNLIMITED_PRICE_ID'):
            planName = 'pro';
            break;
          default:
            planName = 'free';
        }

        // Get feature limits based on plan
        const featureLimits = planName === "basic" 
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
          : planName === "pro" ? {
              titles: 2000,
              descriptions: 1000,
              hashtags: 1000,
              ideas: 400,
              tweets: 1000,
              linkedinPosts: 1000,
              redditPosts: 1000,
              youtubePosts: 1000,
              scripts: 100
            } : {
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

        // Update user's subscription
        const { error: updateError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: session.client_reference_id,
            tier: planName,
            status: 'active',
            payment_provider: 'stripe',
            payment_id: subscriptionId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

        if (updateError) throw updateError;

        // Reset usage counts for the user
        try {
          // First, check if usage records exist for this user
          const { data: existingUsage } = await supabase
            .from("usage")
            .select("feature")
            .eq("user_id", session.client_reference_id);

          const resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const features = [
            "titles", "descriptions", "hashtags", "ideas", "scripts",
            "tweets", "youtubePosts", "redditPosts", "linkedinPosts"
          ];
          
          if (!existingUsage || existingUsage.length === 0) {
            // Create usage records for all features if they don't exist
            for (const feature of features) {
              await supabase.from("usage").insert({
                user_id: session.client_reference_id,
                feature,
                count: 0,
                reset_at: resetDate.toISOString(),
              });
            }
          } else {
            // Reset existing usage records
            const { error: usageError } = await supabase
              .from("usage")
              .update({
                count: 0,
                reset_at: resetDate.toISOString(),
              })
              .eq("user_id", session.client_reference_id);

            if (usageError) {
              console.error("Error resetting usage counts:", usageError);
            }
          }
        } catch (usageResetError) {
          console.error("Error during usage reset:", usageResetError);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: customers, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (fetchError) throw fetchError;
        if (!customers || customers.length === 0) {
          console.log("No customer found for Stripe customer ID:", customerId);
          break;
        }

        const userId = customers[0].id;

        // Update subscription status
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) throw updateError;
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: customers, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .limit(1);

        if (fetchError) throw fetchError;
        if (!customers || customers.length === 0) {
          console.log("No customer found for Stripe customer ID:", customerId);
          break;
        }

        const userId = customers[0].id;

        // Reset to free plan
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            tier: "free",
            status: "cancelled",
          })
          .eq("user_id", userId);

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
