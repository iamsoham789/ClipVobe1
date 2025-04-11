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
    const { filename, metadata } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('No authorization header');
    }

    if (!filename || !metadata) {
      throw new Error('Missing required parameters');
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

    // Get the user's YouTube credentials
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
    
    // Create a resumable upload session
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      access_token: googleIdentity.access_token,
      requestBody: {
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags.split(',').map((tag: string) => tag.trim()),
        },
        status: {
          privacyStatus: metadata.visibility,
        },
      },
    }, {
      // Set up for resumable upload
      uploadType: 'resumable',
    });

    if (!response.headers.get('location')) {
      throw new Error('Failed to get upload URL');
    }

    return new Response(
      JSON.stringify({
        uploadUrl: response.headers.get('location'),
        uploadId: response.headers.get('x-guploader-uploadid'),
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