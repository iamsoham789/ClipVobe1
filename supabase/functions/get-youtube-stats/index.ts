import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { google } from 'https://deno.land/x/google_auth_oauth2@v0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Not authenticated');
    }

    // Get the user's YouTube credentials from the identity
    const { data: identities, error: identityError } = await supabaseClient.auth.getUserIdentities();
    
    if (identityError || !identities) {
      throw new Error('Failed to get user identities');
    }

    const googleIdentity = identities.identities?.find(
      (identity) => identity.provider === 'google'
    );

    if (!googleIdentity || !googleIdentity.access_token) {
      throw new Error('No Google identity found');
    }

    // Initialize the YouTube API client
    const youtube = google.youtube('v3');
    
    // Get the channel statistics
    const response = await youtube.channels.list({
      part: ['statistics'],
      mine: true,
      access_token: googleIdentity.access_token,
    });

    if (!response.items || response.items.length === 0) {
      throw new Error('No channel found');
    }

    return new Response(
      JSON.stringify({
        statistics: response.items[0].statistics,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 