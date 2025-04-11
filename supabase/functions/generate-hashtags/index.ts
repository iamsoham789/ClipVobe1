import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();

    if (!topic) {
      throw new Error("Topic is required");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured");
    }

    // Generate hashtags with Gemini API
    const systemMessage =
      "You are an AI YouTube Hashtag and Tag Generator. Suggest trending, high-ranking hashtags and tags that improve discoverability and reach.";
    const userInput = `Generate 10 trending and relevant hashtags for a YouTube video about: ${topic}. Make them without spaces and with # prefix.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        GEMINI_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemMessage + "\n\n" + userInput }],
            },
          ],
          generationConfig: {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 300,
            responseMimeType: "text/plain",
          },
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Error calling Gemini API");
    }

    // Extract and format hashtags
    const content = data.candidates[0].content.parts[0].text;
    const hashtags = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("#") || line.match(/^\d+\.\s*#/))
      .map((line) => {
        // Remove numbering
        let cleanLine = line.replace(/^\d+\.\s*/, "");
        // Remove any asterisks around hashtags
        cleanLine = cleanLine
          .replace(/\*\*(#[^*]+)\*\*/g, "$1")
          .replace(/\*(#[^*]+)\*/g, "$1");
        return cleanLine;
      });

    return new Response(JSON.stringify({ hashtags }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating hashtags:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
