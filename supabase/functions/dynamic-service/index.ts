
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import Stripe from "https://esm.sh/stripe@12.0.0?dts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get body from request
    const body = await req.json();
    console.log("Received request with body:", JSON.stringify(body));

    // Check for required fields more thoroughly
    if (!body.tier || !body.userId) {
      const missingFields = [];
      if (!body.tier) missingFields.push('tier');
      if (!body.userId) missingFields.push('userId');
      
      console.error(`Missing required fields: ${missingFields.join(', ')}`);
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Internal server error: Missing Stripe configuration" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Determine the price ID based on the requested tier
    let priceId;
    
    if (body.tier === "basic") {
      priceId = Deno.env.get("STRIPE_BASIC_PRICE_ID");
      if (!priceId) {
        console.error("STRIPE_BASIC_PRICE_ID environment variable is not set");
        return new Response(
          JSON.stringify({ error: "Missing STRIPE_BASIC_PRICE_ID environment variable" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (body.tier === "pro") {
      priceId = Deno.env.get("STRIPE_UNLIMITED_PRICE_ID");
      if (!priceId) {
        console.error("STRIPE_UNLIMITED_PRICE_ID environment variable is not set");
        return new Response(
          JSON.stringify({ error: "Missing STRIPE_UNLIMITED_PRICE_ID environment variable" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.error(`Unknown tier: ${body.tier}`);
      return new Response(
        JSON.stringify({ error: `Invalid tier: ${body.tier}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Using price ID for ${body.tier} tier:`, priceId);

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${body.returnUrl || "https://clipvobe.netlify.app/thankyou"}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${body.cancelUrl || "https://clipvobe.netlify.app/pricing"}`,
      client_reference_id: body.userId,
    });

    console.log("Checkout session created:", {
      id: session.id,
      url: session.url
    });

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in dynamic-service function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
