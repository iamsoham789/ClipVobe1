
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user from the auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Error getting user or user not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's identities to find Google identity with YouTube scope
    const { data: identities, error: identitiesError } = await supabaseClient.auth.getUserIdentities();
    if (identitiesError || !identities) {
      return new Response(
        JSON.stringify({ error: 'Error getting user identities' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find Google provider with YouTube scopes
    const googleIdentity = identities.find(
      identity => identity.provider === 'google' && 
                 identity.identity_data?.scopes?.includes('https://www.googleapis.com/auth/youtube')
    );

    if (!googleIdentity || !googleIdentity.identity_data?.access_token) {
      return new Response(
        JSON.stringify({ error: 'User has no Google identity with YouTube scope' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the access token to call the YouTube API
    const accessToken = googleIdentity.identity_data.access_token;
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Error fetching YouTube channel data', details: errorData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-youtube-channel function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to create a Supabase client
const createClient = (supabaseUrl: string, supabaseKey: string, options?: any) => {
  return {
    auth: {
      getUser: async () => {
        // Extract JWT token from Authorization header
        const token = options?.global?.headers?.Authorization?.replace('Bearer ', '');
        if (!token) {
          return { data: { user: null }, error: new Error('No token provided') };
        }

        try {
          // Basic validation of token format (this is not a full JWT validation)
          const parts = token.split('.');
          if (parts.length !== 3) {
            return { data: { user: null }, error: new Error('Invalid token format') };
          }

          // Decode the payload
          const payload = JSON.parse(atob(parts[1]));
          return { 
            data: { 
              user: {
                id: payload.sub,
                email: payload.email,
                app_metadata: payload.app_metadata,
                user_metadata: payload.user_metadata,
              } 
            }, 
            error: null 
          };
        } catch (error) {
          return { data: { user: null }, error };
        }
      },
      getUserIdentities: async () => {
        // This is a simplified mock implementation
        // In a real implementation, you would need to make a request to Supabase API
        // to get the user's identities
        const token = options?.global?.headers?.Authorization?.replace('Bearer ', '');
        
        // Make request to Supabase to get user's identities
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
          },
        });

        if (!response.ok) {
          return { data: null, error: new Error('Failed to get user identities') };
        }

        const userData = await response.json();
        return { data: userData.identities || [], error: null };
      },
    },
  };
};
