
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "jsr:@stripe/stripe@14.21.0";
import { createClient } from "jsr:@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2025-02-24.acacia' });
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }, 
        status: 204 
      });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature || !webhookSecret) return new Response('Missing signature or webhook secret', { status: 400 });
    const body = await req.text();
    let event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log(`Processing webhook event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session completed: ${session.id}`);
        
        if (!session.subscription) {
          console.log("No subscription in session");
          break;
        }
        
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;
        let planName = priceId === Deno.env.get('STRIPE_BASIC_PRICE_ID') ? 'basic' : 
                      priceId === Deno.env.get('STRIPE_UNLIMITED_PRICE_ID') ? 'pro' : 'free';
        
        console.log(`User ${session.client_reference_id} subscribed to ${planName} plan`);
        
        const { error } = await supabase.from('subscriptions').upsert({ 
          user_id: session.client_reference_id, 
          tier: planName, 
          status: 'active', 
          payment_id: session.subscription, 
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(), 
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString() 
        });
        
        if (error) {
          console.error("Error updating subscription in database:", error);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription updated: ${subscription.id}`);
        
        const { data: customers } = await supabase.from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .limit(1);
        
        if (customers && customers.length) {
          console.log(`Updating subscription status to ${subscription.status} for user ${customers[0].id}`);
          
          const { error } = await supabase.from('subscriptions').update({ 
            status: subscription.status, 
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString() 
          }).eq('user_id', customers[0].id);
          
          if (error) {
            console.error("Error updating subscription status:", error);
          }
        } else {
          console.log("No matching customer found in database");
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription deleted: ${subscription.id}`);
        
        const { data: customers } = await supabase.from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .limit(1);
        
        if (customers && customers.length) {
          console.log(`Downgrading subscription to free tier for user ${customers[0].id}`);
          
          const { error } = await supabase.from('subscriptions').update({ 
            tier: 'free', 
            status: 'cancelled' 
          }).eq('user_id', customers[0].id);
          
          if (error) {
            console.error("Error downgrading subscription:", error);
          }
        } else {
          console.log("No matching customer found in database");
        }
        break;
      }
    }
    
    return new Response(JSON.stringify({ received: true }), { 
      headers: { 'Content-Type': 'application/json' }, 
      status: 200 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Webhook error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), { 
      headers: { 'Content-Type': 'application/json' }, 
      status: 400 
    });
  }
});
