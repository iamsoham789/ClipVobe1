
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  contentType: string;
  duration: string;
  topic: string;
  targetAudience: string;
  tone: string;
  language: string;
  includeCTA: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const body: RequestBody = await req.json();
    const { contentType, duration, topic, targetAudience, tone, language, includeCTA } = body;

    // Construct the prompt for Gemini
    const prompt = `Create a ${contentType} video script about "${topic}" for ${duration} ${
      contentType === 'shorts' ? 'seconds' : 'minutes'
    }.

Target Audience: ${targetAudience}
Tone: ${tone}
Language: ${language}

Please structure the script with:
1. An engaging hook that immediately grabs attention
2. Clear and concise main points
3. Smooth transitions between sections
${includeCTA ? '4. A compelling call-to-action at the end' : ''}

The script should be optimized for ${
      contentType === 'shorts' 
        ? 'vertical video format and quick engagement. Keep sentences short and impactful.' 
        : 'detailed explanation and viewer retention. Include proper pacing and engagement points.'
    }

Format the output with:
- Clear section headers
- Timestamps for each section
- [Hook] section at the start
- [Main Content] in the middle
- ${includeCTA ? '[Call to Action] at the end' : '[Conclusion] to wrap up'}
- Estimated delivery time for each section

Remember to:
- Keep the language ${tone} and suitable for ${targetAudience}
- Use short, punchy sentences for better delivery
- Include natural transition phrases
- ${language !== 'English' ? `Write the entire script in ${language}` : ''}`;

    // Make request to Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || 'Failed to generate script');
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;

    // Format the response
    const formattedScript = `Video Script: ${topic}
Type: ${contentType}
Duration: ${duration} ${contentType === 'shorts' ? 'seconds' : 'minutes'}
Target Audience: ${targetAudience}
Tone: ${tone}
Language: ${language}

${generatedText}`;

    return new Response(
      JSON.stringify({
        script: formattedScript,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while generating the script',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}); 
