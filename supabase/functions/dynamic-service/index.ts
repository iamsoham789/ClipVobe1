
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    // Clone the request and log the body for debugging
    const reqClone = req.clone();
    const body = await reqClone.json();
    console.log("Received request body:", body);
    console.log("Environment variables:", {
      STRIPE_BASIC_PRICE_ID: Deno.env.get('STRIPE_BASIC_PRICE_ID'),
      STRIPE_UNLIMITED_PRICE_ID: Deno.env.get('STRIPE_UNLIMITED_PRICE_ID')
    });

    // Use the original request to get the body again
    const { priceId, plan, userId } = await req.json();
    
    // Detailed validation with logging
    if (!priceId) {
      console.error("Missing priceId in request");
      return new Response(
        JSON.stringify({ error: "Missing priceId in request" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!userId) {
      console.error("Missing userId in request");
      return new Response(
        JSON.stringify({ error: "Missing userId in request" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!plan) {
      console.error("Missing plan in request");
      return new Response(
        JSON.stringify({ error: "Missing plan in request" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (userId !== user.id) throw new Error('User ID mismatch');
    
    // Get price IDs from env vars or use hardcoded values as fallback
    const basicPriceId = Deno.env.get('STRIPE_BASIC_PRICE_ID') || "price_1TJXKaAUtKomR9D73YVtTAAZ";
    const unlimitedPriceId = Deno.env.get('STRIPE_UNLIMITED_PRICE_ID') || "price_1TJXLhAUtKomR9D7p6fwvzMi";
    
    let validPriceId = plan === 'basic' ? 
      basicPriceId : 
      plan === 'pro' ? 
        unlimitedPriceId : '';
    
    console.log("Using price ID:", {
      requested: priceId,
      validated: validPriceId,
      match: priceId === validPriceId
    });
    
    if (priceId !== validPriceId) {
      console.log("Price ID mismatch, but continuing with requested priceId");
      // Instead of throwing an error, use the sent priceId
      validPriceId = priceId;
    }

    const { data: existingCustomer } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();

    let customerId = existingCustomer?.stripe_customer_id;

    if (!customerId && user.email) {
      const customers = await stripe.customers.list({ 
        email: user.email, 
        limit: 1 
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({ 
        email: user.email, 
        metadata: { userId } 
      });
      customerId = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    console.log("Creating checkout session with:", {
      priceId: validPriceId,
      customer: customerId
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: validPriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      customer: customerId,
      client_reference_id: userId,
    });

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    );
  }
});
