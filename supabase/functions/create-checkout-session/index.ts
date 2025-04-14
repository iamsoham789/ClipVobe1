
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Stripe instance with the API key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-02-24.acacia',
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }
    
    // Parse request body
    const { priceId, plan, userId } = await req.json();
    
    if (!priceId || !userId || !plan) {
      throw new Error('Missing required fields: priceId, userId, or plan');
    }
    
    // Check if user is the same as the authenticated user
    if (userId !== user.id) {
      throw new Error('User ID mismatch');
    }
    
    // Verify the price ID is valid and corresponds to the right plan
    let validPriceId;
    if (plan === 'basic') {
      validPriceId = Deno.env.get('STRIPE_BASIC_PRICE_ID');
    } else if (plan === 'pro') {
      validPriceId = Deno.env.get('STRIPE_UNLIMITED_PRICE_ID');
    } else {
      throw new Error('Invalid plan');
    }
    
    if (priceId !== validPriceId) {
      throw new Error('Price ID does not match the selected plan');
    }
    
    // Check if the user already has a Stripe customer ID
    const { data: existingCustomer } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();
    
    let customerId = existingCustomer?.stripe_customer_id;
    
    // If no customer ID exists, search by email in Stripe
    if (!customerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        
        // Update the customer ID in Supabase
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }
    }
    
    // Create a new Stripe customer if one doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId,
        },
      });
      
      customerId = customer.id;
      
      // Store the customer ID in the Supabase profiles table
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      customer: customerId,
      client_reference_id: userId,
    });
    
    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return new Response(
      JSON.stringify({
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
